from celery import shared_task
from datetime import datetime, timedelta
from app.core.database import SessionLocal, Article, Magazine, SyncLog
from app.extractors.oai_pmh import OAIPMHExtractor
from app.core.elasticsearch_client import get_elasticsearch_client
import logging
import time

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def sync_magazine(self, magazine_id: int):
    db = SessionLocal()
    start_time = datetime.utcnow()
    
    try:
        magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()
        if not magazine:
            logger.error(f"Revista {magazine_id} não encontrada")
            return {"status": "FAILED", "error": "Magazine not found"}
        
        if not magazine.is_active:
            logger.info(f"Revista {magazine.name} está inativa")
            return {"status": "SKIPPED"}
        
        # Criar log de sincronização
        sync_log = SyncLog(
            magazine_id=magazine_id,
            status="RUNNING",
            started_at=start_time
        )
        db.add(sync_log)
        db.commit()
        
        logger.info(f"Iniciando sincronização de {magazine.name}")
        
        # Executar extrator
        extractor = OAIPMHExtractor(magazine.url_oai_pmh)
        new_articles, updated_articles, errors = extractor.fetch_articles()
        
        # Armazenar no banco com upsert 
        articles_new_count = 0
        articles_updated_count = 0
        
        for article_data in new_articles:
            try:
                article_data['magazine_id'] = magazine_id
                oai_id = article_data.get('oai_identifier')
                
                existing = db.query(Article).filter(Article.oai_identifier == oai_id).first()
                
                if existing:
                    for key, value in article_data.items():
                        setattr(existing, key, value)
                    existing.updated_at = datetime.utcnow()
                    articles_updated_count += 1
                else:
                    article = Article(**article_data)
                    article.created_at = datetime.utcnow()
                    article.updated_at = datetime.utcnow()
                    db.add(article)
                    articles_new_count += 1
            except Exception as e:
                logger.error(f"Erro ao adicionar artigo {article_data.get('oai_identifier', '?')}: {e}")
        
        for article_id, article_data in updated_articles.items():
            try:
                article = db.query(Article).filter(Article.id == article_id).first()
                if article:
                    article_data['magazine_id'] = magazine_id
                    for key, value in article_data.items():
                        setattr(article, key, value)
                    article.updated_at = datetime.utcnow()
                    articles_updated_count += 1
            except Exception as e:
                logger.error(f"Erro ao atualizar artigo {article_id}: {e}")
        
        db.commit()
        
        # Indexar artículos no Elasticsearch
        try:
            es_client = get_elasticsearch_client()
            indexed_articles = db.query(Article)\
                .filter(Article.magazine_id == magazine_id)\
                .order_by(Article.id.desc())\
                .limit(articles_new_count + articles_updated_count)\
                .all()
            
            articles_to_index = [
                {
                    "id": a.id,
                    "title": a.title,
                    "abstract": a.abstract or "",
                    "authors": a.authors or [],
                    "keywords": a.keywords or [],
                    "magazine_id": a.magazine_id,
                    "publication_date": a.publication_date,
                    "url": a.url,
                    "oai_identifier": a.oai_identifier,
                    "created_at": a.created_at,
                    "updated_at": a.updated_at
                }
                for a in indexed_articles
            ]
            
            if articles_to_index:
                es_client.bulk_index_articles(articles_to_index)
                logger.info(f"✓ Indexados {len(articles_to_index)} artículos no Elasticsearch")
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
        
        logger.info(f"Sincronização de {magazine.name} concluída: "
                   f"+{articles_new_count} novos, +{articles_updated_count} atualizados")
        
        return {
            "status": "SUCCESS",
            "new_articles": articles_new_count,
            "updated_articles": articles_updated_count,
            "errors": len(errors)
        }
        
    except Exception as e:
        logger.error(f"Erro na sincronização de {magazine_id}: {e}")
        
        # Atualizar log
        sync_log.status = "FAILED"
        sync_log.errors = [str(e)]
        sync_log.ended_at = datetime.utcnow()
        sync_log.duration_seconds = int((datetime.utcnow() - start_time).total_seconds())
        db.commit()
        
        retry_in = 5 ** self.request.retries  
        raise self.retry(exc=e, countdown=retry_in)
    
    finally:
        db.close()


@shared_task
def sync_all_magazines():
    db = SessionLocal()
    try:
        magazines = db.query(Magazine).filter(Magazine.is_active == True).all()
        logger.info(f"Iniciando sincronização de {len(magazines)} revistas")
        
        for magazine in magazines:
            sync_magazine.delay(magazine.id)
        
        return {"status": "OK", "magazines_queued": len(magazines)}
    finally:
        db.close()
