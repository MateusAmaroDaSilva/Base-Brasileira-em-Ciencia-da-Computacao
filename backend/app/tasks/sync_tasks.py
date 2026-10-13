from celery import shared_task
from datetime import datetime
from app.core.database import SessionLocal, Article, Magazine, SyncLog
from app.extractors.oai_pmh import OAIPMHExtractor
from app.core.elasticsearch_client import get_elasticsearch_client, article_to_index_dict
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def sync_magazine(self, magazine_id: int):
    db = SessionLocal()
    start_time = datetime.utcnow()
    sync_log = None

    try:
        magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()
        if not magazine:
            logger.error(f"Revista {magazine_id} não encontrada")
            return {"status": "FAILED", "error": "Magazine not found"}

        if not magazine.is_active:
            logger.info(f"Revista {magazine.name} está inativa")
            return {"status": "SKIPPED"}

        # Criar log de sincronização
        sync_log = SyncLog(magazine_id=magazine_id, status="RUNNING", started_at=start_time)
        db.add(sync_log)
        db.commit()

        logger.info(f"Iniciando sincronização de {magazine.name}")

        # Executar extrator
        extractor = OAIPMHExtractor(magazine.url_oai_pmh)
        new_articles, updated_articles, errors = extractor.fetch_articles()

        # Armazenar no banco com upsert
        articles_new_count = 0
        articles_updated_count = 0
        # artigos gravados nesta sincronizacao, por oai_identifier; tambem evita inserir
        # duas vezes um registro repetido na coleta (autoflush desligado)
        touched = {}

        for article_data in list(new_articles) + list(updated_articles):
            oai_id = article_data.get("oai_identifier", "?")
            try:
                article_data["magazine_id"] = magazine_id

                existing = touched.get(oai_id) or db.query(Article).filter(Article.oai_identifier == oai_id).first()

                if existing:
                    for key, value in article_data.items():
                        setattr(existing, key, value)
                    existing.updated_at = datetime.utcnow()
                    if oai_id not in touched:
                        articles_updated_count += 1
                    touched[oai_id] = existing
                else:
                    article = Article(**article_data)
                    article.created_at = datetime.utcnow()
                    article.updated_at = datetime.utcnow()
                    db.add(article)
                    articles_new_count += 1
                    touched[oai_id] = article
            except Exception as e:
                error_msg = f"Erro ao gravar artigo {oai_id}: {e}"
                logger.error(error_msg)
                errors.append(error_msg)

        db.commit()

        # Indexar no Elasticsearch exatamente os artigos gravados agora
        try:
            articles_to_index = [article_to_index_dict(a) for a in touched.values()]
            if articles_to_index:
                get_elasticsearch_client().bulk_index_articles(articles_to_index)
                logger.info(f"✓ Indexados {len(articles_to_index)} artigos no Elasticsearch")
        except Exception as e:
            logger.error(f"Erro ao indexar no Elasticsearch: {e}")

        # Atualizar magazine
        magazine.last_sync = datetime.utcnow()
        db.commit()

        # Atualizar log
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        sync_log.status = "SUCCESS" if not errors else "PARTIAL"
        sync_log.articles_new = articles_new_count
        sync_log.articles_updated = articles_updated_count
        sync_log.articles_failed = len(errors)
        sync_log.errors = errors
        sync_log.ended_at = end_time
        sync_log.duration_seconds = int(duration)
        sync_log.message = f"Sincronizados {articles_new_count} novos e {articles_updated_count} atualizados"
        db.commit()

        logger.info(
            f"Sincronização de {magazine.name} concluída: "
            f"+{articles_new_count} novos, +{articles_updated_count} atualizados"
        )

        return {
            "status": "SUCCESS",
            "new_articles": articles_new_count,
            "updated_articles": articles_updated_count,
            "errors": len(errors),
        }

    except Exception as e:
        logger.error(f"Erro na sincronização de {magazine_id}: {e}")

        # A sessao pode ter ficado invalida (ex.: erro no commit); descarta antes de gravar o log
        db.rollback()
        if sync_log is not None:
            try:
                sync_log.status = "FAILED"
                sync_log.errors = [str(e)]
                sync_log.ended_at = datetime.utcnow()
                sync_log.duration_seconds = int((datetime.utcnow() - start_time).total_seconds())
                db.commit()
            except Exception as log_error:
                logger.error(f"Erro ao gravar log de falha da revista {magazine_id}: {log_error}")
                db.rollback()

        retry_in = 5**self.request.retries
        raise self.retry(exc=e, countdown=retry_in)

    finally:
        db.close()


@shared_task
def sync_all_magazines():
    db = SessionLocal()
    try:
        magazines = db.query(Magazine).filter(Magazine.is_active).all()
        logger.info(f"Iniciando sincronização de {len(magazines)} revistas")

        for magazine in magazines:
            sync_magazine.delay(magazine.id)

        return {"status": "OK", "magazines_queued": len(magazines)}
    finally:
        db.close()
