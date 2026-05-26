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
                            "analyzer": {"portuguese_analyzer": {"type": "standard", "stopwords": "_portuguese_"}}
                        },
                    },
                    "mappings": {
                        "properties": {
                            "id": {"type": "integer"},
                            "article_id": {"type": "integer"},
                            "title": {
                                "type": "text",
                                "analyzer": "portuguese_analyzer",
                                "fields": {"keyword": {"type": "keyword"}},
                            },
                            "abstract": {"type": "text", "analyzer": "portuguese_analyzer"},
                            "authors": {"type": "text", "analyzer": "portuguese_analyzer"},
                            "keywords": {"type": "text", "analyzer": "portuguese_analyzer"},
                            "magazine_id": {"type": "integer"},
                            "publication_date": {"type": "date"},
                            "url": {"type": "keyword"},
                            "oai_identifier": {"type": "keyword"},
                            "created_at": {"type": "date"},
                            "updated_at": {"type": "date"},
                        }
                    },
                }
                self.es.indices.create(index=self.index_name, body=mapping)
                logger.info(f"✓ Index '{self.index_name}' criado")
        except Exception as e:
            logger.error(f"Erro ao criar index: {e}")

    def create_index(self):
        self._create_index_if_not_exists()

    def index_article(self, article_dict: dict):
        try:
            doc_id = article_dict.get("id")

            created_at = article_dict.get("created_at")
            updated_at = article_dict.get("updated_at")
            pub_date = article_dict.get("publication_date")

            if created_at:
                created_at = str(created_at).replace(" ", "T") if " " in str(created_at) else str(created_at)
            if updated_at:
                updated_at = str(updated_at).replace(" ", "T") if " " in str(updated_at) else str(updated_at)
            if pub_date:
                pub_date = str(pub_date).replace(" ", "T") if " " in str(pub_date) else str(pub_date)

            body = {
                "id": article_dict.get("id"),
                "article_id": article_dict.get("id"),
                "title": article_dict.get("title", ""),
                "abstract": article_dict.get("abstract", ""),
                "authors": " ".join(article_dict.get("authors", [])) if article_dict.get("authors") else "",
                "keywords": " ".join(article_dict.get("keywords", [])) if article_dict.get("keywords") else "",
                "magazine_id": article_dict.get("magazine_id"),
                "publication_date": pub_date,
                "url": article_dict.get("url", ""),
                "oai_identifier": article_dict.get("oai_identifier", ""),
                "created_at": created_at,
                "updated_at": updated_at,
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
                doc_id = article.get("id")
                created_at = article.get("created_at")
                updated_at = article.get("updated_at")
                pub_date = article.get("publication_date")

                if created_at:
                    created_at = str(created_at).replace(" ", "T") if " " in str(created_at) else str(created_at)
                if updated_at:
                    updated_at = str(updated_at).replace(" ", "T") if " " in str(updated_at) else str(updated_at)
                if pub_date:
                    pub_date = str(pub_date).replace(" ", "T") if " " in str(pub_date) else str(pub_date)

                authors_raw = article.get("authors", [])
                authors_val = (
                    " ".join(authors_raw)
                    if isinstance(authors_raw, list)
                    else (authors_raw if isinstance(authors_raw, str) else "")
                )
                keywords_raw = article.get("keywords", [])
                keywords_val = (
                    " ".join(keywords_raw)
                    if isinstance(keywords_raw, list)
                    else (keywords_raw if isinstance(keywords_raw, str) else "")
                )

                body = {
                    "id": article.get("id"),
                    "article_id": article.get("id"),
                    "title": article.get("title", ""),
                    "abstract": article.get("abstract", ""),
                    "authors": authors_val,
                    "keywords": keywords_val,
                    "magazine_id": article.get("magazine_id"),
                    "publication_date": pub_date,
                    "url": article.get("url", ""),
                    "oai_identifier": article.get("oai_identifier", ""),
                    "created_at": created_at,
                    "updated_at": updated_at,
                }
                self.es.index(index=self.index_name, id=doc_id, body=body)
                indexed_count += 1
            except Exception as e:
                logger.error(f"Erro ao indexar artigo {article.get('id')}: {e}")
                failed_count += 1

        logger.info(f"✓ Bulk indexing: {indexed_count} sucesso, {failed_count} falhas")

    def _has_boolean_operators(self, query: str) -> bool:
        tokens = query.split()
        return any(t in ("AND", "OR", "NOT") for t in tokens) or '"' in query or "(" in query

    def search(
        self,
        query: str,
        magazine_id: int = None,
        limit: int = 20,
        offset: int = 0,
        year_from: int = None,
        year_to: int = None,
        language: str = None,
        search_type: str = "simple",
    ):
        try:
            # Build main query clause
            if not query:
                query_clause = {"match_all": {}}
            elif search_type == "boolean" or self._has_boolean_operators(query):
                query_clause = {
                    "query_string": {
                        "query": query,
                        "fields": ["title^3", "abstract^2", "authors", "keywords"],
                        "default_operator": "OR",
                        "lenient": True,
                    }
                }
            else:
                query_clause = {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "abstract^2", "authors", "keywords"],
                        "type": "best_fields",
                        "operator": "or",
                    }
                }

            # Build filters
            filters = []
            if magazine_id:
                filters.append({"term": {"magazine_id": magazine_id}})
            if year_from or year_to:
                date_range = {}
                if year_from:
                    date_range["gte"] = f"{year_from}-01-01"
                if year_to:
                    date_range["lte"] = f"{year_to}-12-31"
                filters.append({"range": {"publication_date": date_range}})
            if language:
                filters.append({"term": {"language": language}})

            if filters:
                final_query = {"bool": {"must": [query_clause], "filter": filters}}
            else:
                final_query = query_clause if not query else {"bool": {"must": [query_clause]}}

            search_body = {
                "query": final_query,
                "sort": [{"publication_date": {"order": "desc", "missing": "_last"}}],
                "from": offset,
                "size": limit,
                "aggs": {
                    "by_magazine": {"terms": {"field": "magazine_id", "size": 20}},
                    "by_year": {
                        "date_histogram": {
                            "field": "publication_date",
                            "calendar_interval": "year",
                            "format": "yyyy",
                            "min_doc_count": 1,
                        }
                    },
                },
            }

            results = self.es.search(index=self.index_name, body=search_body)

            hits = results.get("hits", {})
            total = hits.get("total", {}).get("value", 0)
            articles = [hit["_source"] for hit in hits.get("hits", [])]

            aggs = results.get("aggregations", {})
            facets = {
                "by_magazine": [
                    {"id": b["key"], "count": b["doc_count"]}
                    for b in aggs.get("by_magazine", {}).get("buckets", [])
                ],
                "by_year": [
                    {"year": b["key_as_string"], "count": b["doc_count"]}
                    for b in aggs.get("by_year", {}).get("buckets", [])
                ],
            }

            return {
                "total": total,
                "articles": articles,
                "limit": limit,
                "offset": offset,
                "facets": facets,
            }
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return {"total": 0, "articles": [], "limit": limit, "offset": offset, "facets": {}}

    def suggest(self, query: str, limit: int = 5):
        try:
            search_body = {
                "query": {"match": {"title": {"query": query, "fuzziness": "AUTO"}}},
                "_source": ["title"],
                "size": limit,
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
