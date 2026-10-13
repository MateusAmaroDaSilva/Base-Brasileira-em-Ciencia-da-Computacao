from elasticsearch import Elasticsearch
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class ElasticsearchClient:
    def __init__(self):
        self.es = Elasticsearch(
            [f"http://{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}"],
            request_timeout=3,
            max_retries=0,
            retry_on_timeout=False,
        )
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
                            "keywords_exact": {"type": "keyword"},
                            "language": {"type": "keyword"},
                            "doi": {"type": "keyword"},
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

    @staticmethod
    def _iso(value):
        if not value:
            return value
        return str(value).replace(" ", "T")

    @staticmethod
    def _join(value) -> str:
        if isinstance(value, list):
            return " ".join(v for v in value if isinstance(v, str))
        return value if isinstance(value, str) else ""

    def _build_document(self, article: dict) -> dict:
        keywords = article.get("keywords") or []
        if not isinstance(keywords, list):
            keywords = []
        return {
            "id": article.get("id"),
            "article_id": article.get("id"),
            "title": article.get("title", ""),
            "abstract": article.get("abstract", ""),
            "authors": self._join(article.get("authors")),
            "keywords": self._join(keywords),
            # mesma normalizacao das facetas de palavra-chave da busca SQL
            "keywords_exact": [k.strip().lower() for k in keywords if isinstance(k, str) and k.strip()],
            "language": article.get("language"),
            "doi": article.get("doi"),
            "magazine_id": article.get("magazine_id"),
            "publication_date": self._iso(article.get("publication_date")),
            "url": article.get("url", ""),
            "oai_identifier": article.get("oai_identifier", ""),
            "created_at": self._iso(article.get("created_at")),
            "updated_at": self._iso(article.get("updated_at")),
        }

    def index_article(self, article_dict: dict):
        doc_id = article_dict.get("id")
        try:
            self.es.index(index=self.index_name, id=doc_id, body=self._build_document(article_dict))
            return True
        except Exception as e:
            logger.error(f"Erro ao indexar artigo {doc_id}: {e}")
            return False

    def bulk_index_articles(self, articles: list):
        indexed_count = 0
        failed_count = 0

        for article in articles:
            if self.index_article(article):
                indexed_count += 1
            else:
                failed_count += 1

        logger.info(f"✓ Bulk indexing: {indexed_count} sucesso, {failed_count} falhas")

    def _has_boolean_operators(self, query: str) -> bool:
        tokens = query.split()
        return any(t in ("AND", "OR", "NOT") for t in tokens) or '"' in query or "(" in query

    def _build_filters(self, magazine_id, year_from, year_to, language, keyword, has_doi) -> dict:
        filters = {}
        if magazine_id:
            filters["magazine"] = {"term": {"magazine_id": magazine_id}}
        if year_from or year_to:
            date_range = {}
            if year_from:
                date_range["gte"] = f"{year_from}-01-01"
            if year_to:
                date_range["lte"] = f"{year_to}-12-31"
            filters["year"] = {"range": {"publication_date": date_range}}
        if language:
            filters["language"] = {"term": {"language": language}}
        if keyword:
            filters["keyword"] = {"term": {"keywords_exact": keyword.strip().lower()}}
        if has_doi is True:
            filters["doi"] = {"exists": {"field": "doi"}}
        elif has_doi is False:
            filters["doi"] = {"bool": {"must_not": {"exists": {"field": "doi"}}}}
        return filters

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
        keyword: str = None,
        has_doi: bool = None,
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

            filters = self._build_filters(magazine_id, year_from, year_to, language, keyword, has_doi)

            # Como na busca SQL, cada faceta ignora o proprio filtro para o usuario poder trocar de valor:
            # os filtros vao no post_filter (afeta so os hits) e cada agregacao reaplica os demais.
            def facet(dimension, agg):
                others = [f for name, f in filters.items() if name != dimension]
                return {"filter": {"bool": {"filter": others}}, "aggs": {"values": agg}}

            search_body = {
                "query": {"bool": {"must": [query_clause]}},
                "sort": [{"publication_date": {"order": "desc", "missing": "_last"}}],
                "from": offset,
                "size": limit,
                "track_total_hits": True,
                "aggs": {
                    "by_magazine": facet("magazine", {"terms": {"field": "magazine_id", "size": 50}}),
                    "by_year": facet(
                        "year",
                        {
                            "date_histogram": {
                                "field": "publication_date",
                                "calendar_interval": "year",
                                "format": "yyyy",
                                "min_doc_count": 1,
                            }
                        },
                    ),
                    "by_language": facet("language", {"terms": {"field": "language", "size": 20}}),
                    "by_keyword": facet("keyword", {"terms": {"field": "keywords_exact", "size": 15}}),
                    "by_doi": facet(
                        "doi",
                        {
                            "filters": {
                                "filters": {
                                    "com_doi": {"exists": {"field": "doi"}},
                                    "sem_doi": {"bool": {"must_not": {"exists": {"field": "doi"}}}},
                                }
                            }
                        },
                    ),
                },
            }
            if filters:
                search_body["post_filter"] = {"bool": {"filter": list(filters.values())}}

            results = self.es.search(index=self.index_name, body=search_body)

            hits = results.get("hits", {})
            total = hits.get("total", {}).get("value", 0)
            articles = [hit["_source"] for hit in hits.get("hits", [])]

            aggs = results.get("aggregations", {})

            def buckets(name):
                return aggs.get(name, {}).get("values", {}).get("buckets", [])

            doi_buckets = buckets("by_doi") or {}
            facets = {
                "by_magazine": [{"id": b["key"], "count": b["doc_count"]} for b in buckets("by_magazine")],
                "by_year": [{"year": b["key_as_string"], "count": b["doc_count"]} for b in buckets("by_year")],
                "by_language": [{"code": b["key"], "count": b["doc_count"]} for b in buckets("by_language")],
                "by_keyword": [{"keyword": b["key"], "count": b["doc_count"]} for b in buckets("by_keyword")],
                "by_doi": [
                    {"value": "com_doi", "label": "Com DOI", "count": doi_buckets.get("com_doi", {}).get("doc_count", 0)},
                    {"value": "sem_doi", "label": "Sem DOI", "count": doi_buckets.get("sem_doi", {}).get("doc_count", 0)},
                ],
            }

            return {
                "total": total,
                "articles": articles,
                "limit": limit,
                "offset": offset,
                "facets": facets,
                "available": True,
            }
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return {"total": 0, "articles": [], "limit": limit, "offset": offset, "facets": {}, "available": False}

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


def article_to_index_dict(article) -> dict:
    """Converte um Article (ORM) no dict aceito por index_article/bulk_index_articles."""
    return {
        "id": article.id,
        "title": article.title,
        "abstract": article.abstract or "",
        "authors": article.authors or [],
        "keywords": article.keywords or [],
        "language": article.language,
        "doi": article.doi,
        "magazine_id": article.magazine_id,
        "publication_date": article.publication_date,
        "url": article.url,
        "oai_identifier": article.oai_identifier,
        "created_at": article.created_at,
        "updated_at": article.updated_at,
    }


_es_client = None


def get_elasticsearch_client():
    global _es_client
    if _es_client is None:
        _es_client = ElasticsearchClient()
    return _es_client
