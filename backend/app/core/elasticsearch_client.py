from elasticsearch import Elasticsearch
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class ElasticsearchClient:
    def __init__(self):
        self.es = Elasticsearch([f"http://{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}"])
        self.index_name = "articles"
        self._create_index_if_not_exists()
    
    def _create_index_if_not_exists(self):
        try:
            if not self.es.indices.exists(index=self.index_name):
                mapping = {
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0,
                        "analysis": {
                            "analyzer": {
                                "portuguese_analyzer": {
                                    "type": "standard",
                                    "stopwords": "_portuguese_"
                                }
                            }
                        }
                    },
                    "mappings": {
                        "properties": {
                            "id": {"type": "integer"},
                            "article_id": {"type": "integer"},
                            "title": {
                                "type": "text",
                                "analyzer": "portuguese_analyzer",
                                "fields": {
                                    "keyword": {"type": "keyword"}
                                }
                            },
                            "abstract": {
                                "type": "text",
                                "analyzer": "portuguese_analyzer"
                            },
                            "authors": {
                                "type": "text",
                                "analyzer": "portuguese_analyzer"
                            },
                            "keywords": {
                                "type": "text",
                                "analyzer": "portuguese_analyzer"
                            },
                            "magazine_id": {"type": "integer"},
                            "publication_date": {"type": "date"},
                            "url": {"type": "keyword"},
                            "oai_identifier": {"type": "keyword"},
                            "created_at": {"type": "date"},
                            "updated_at": {"type": "date"}
                        }
                    }
                }
                self.es.indices.create(index=self.index_name, body=mapping)
                logger.info(f"✓ Index '{self.index_name}' criado")
        except Exception as e:
            logger.error(f"Erro ao criar index: {e}")
    
    def index_article(self, article_dict: dict):
        try:
            doc_id = article_dict.get('id')
            
            created_at = article_dict.get('created_at')
            updated_at = article_dict.get('updated_at')
            pub_date = article_dict.get('publication_date')
            
            if created_at:
                created_at = str(created_at).replace(' ', 'T') if ' ' in str(created_at) else str(created_at)
            if updated_at:
                updated_at = str(updated_at).replace(' ', 'T') if ' ' in str(updated_at) else str(updated_at)
            if pub_date:
                pub_date = str(pub_date).replace(' ', 'T') if ' ' in str(pub_date) else str(pub_date)
            
            body = {
                "id": article_dict.get('id'),
                "article_id": article_dict.get('id'),
                "title": article_dict.get('title', ''),
                "abstract": article_dict.get('abstract', ''),
                "authors": ' '.join(article_dict.get('authors', [])) if article_dict.get('authors') else '',
                "keywords": ' '.join(article_dict.get('keywords', [])) if article_dict.get('keywords') else '',
                "magazine_id": article_dict.get('magazine_id'),
                "publication_date": pub_date,
                "url": article_dict.get('url', ''),
                "oai_identifier": article_dict.get('oai_identifier', ''),
                "created_at": created_at,
                "updated_at": updated_at
            }
            self.es.index(index=self.index_name, id=doc_id, body=body)
            return True
        except Exception as e:
            logger.error(f"Erro ao indexar artigo {doc_id}: {e}")
            return False
    
    def bulk_index_articles(self, articles: list):
        indexed_count = 0
        failed_count = 0
        
        for article in articles:
            try:
                doc_id = article.get('id')
                created_at = article.get('created_at')
                updated_at = article.get('updated_at')
                pub_date = article.get('publication_date')
                
                if created_at:
                    created_at = str(created_at).replace(' ', 'T') if ' ' in str(created_at) else str(created_at)
                if updated_at:
                    updated_at = str(updated_at).replace(' ', 'T') if ' ' in str(updated_at) else str(updated_at)
                if pub_date:
                    pub_date = str(pub_date).replace(' ', 'T') if ' ' in str(pub_date) else str(pub_date)
                
                body = {
                    "id": article.get('id'),
                    "article_id": article.get('id'),
                    "title": article.get('title', ''),
                    "abstract": article.get('abstract', ''),
                    "authors": ' '.join(article.get('authors', [])) if isinstance(article.get('authors'), list) and article.get('authors') else (article.get('authors', '') if isinstance(article.get('authors'), str) else ''),
                    "keywords": ' '.join(article.get('keywords', [])) if isinstance(article.get('keywords'), list) and article.get('keywords') else (article.get('keywords', '') if isinstance(article.get('keywords'), str) else ''),
                    "magazine_id": article.get('magazine_id'),
                    "publication_date": pub_date,
                    "url": article.get('url', ''),
                    "oai_identifier": article.get('oai_identifier', ''),
                    "created_at": created_at,
                    "updated_at": updated_at
                }
                self.es.index(index=self.index_name, id=doc_id, body=body)
                indexed_count += 1
            except Exception as e:
                logger.error(f"Erro ao indexar artigo {article.get('id')}: {e}")
                failed_count += 1
        
        logger.info(f"✓ Bulk indexing: {indexed_count} sucesso, {failed_count} falhas")
    
    def search(self, query: str, magazine_id: int = None, limit: int = 20, offset: int = 0):
        try:
            must_clauses = [
                {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "abstract^2", "authors", "keywords"],
                        "type": "best_fields",
                        "operator": "or"
                    }
                }
            ]
            
            if magazine_id:
                must_clauses.append({"term": {"magazine_id": magazine_id}})
            
            search_body = {
                "query": {
                    "bool": {
                        "must": must_clauses
                    }
                },
                "sort": [{"publication_date": {"order": "desc"}}],
                "from": offset,
                "size": limit
            }
            
            results = self.es.search(index=self.index_name, body=search_body)
            
            hits = results.get("hits", {})
            total = hits.get("total", {}).get("value", 0)
            articles = [hit["_source"] for hit in hits.get("hits", [])]
            
            return {
                "total": total,
                "articles": articles,
                "limit": limit,
                "offset": offset
            }
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return {"total": 0, "articles": [], "limit": limit, "offset": offset}
    
    def suggest(self, query: str, limit: int = 5):
        try:
            search_body = {
                "query": {
                    "match": {
                        "title": {
                            "query": query,
                            "fuzziness": "AUTO"
                        }
                    }
                },
                "_source": ["title"],
                "size": limit
            }
            
            results = self.es.search(index=self.index_name, body=search_body)
            
            suggestions = [hit["_source"]["title"] for hit in results.get("hits", {}).get("hits", [])]
            return suggestions
        except Exception as e:
            logger.error(f"Erro ao gerar sugestões: {e}")
            return []
    
    def delete_index(self):
        try:
            self.es.indices.delete(index=self.index_name)
            logger.info(f" Index '{self.index_name}' deletado")
        except Exception as e:
            logger.error(f"Erro ao deletar index: {e}")
    
    def recreate_index(self):
        try:
            self.delete_index()
            self._create_index_if_not_exists()
            logger.info(f" Index '{self.index_name}' recriado")
        except Exception as e:
            logger.error(f"Erro ao recriar index: {e}")


_es_client = None

def get_elasticsearch_client():
    global _es_client
    if _es_client is None:
        _es_client = ElasticsearchClient()
    return _es_client
