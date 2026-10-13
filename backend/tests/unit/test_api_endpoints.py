import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


@pytest.mark.unit
class TestArticlesEndpoints:

    def test_get_articles_empty(self, test_client):
        response = test_client.get("/api/v1/articles")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_articles_with_limit(self, test_client):
        response = test_client.get("/api/v1/articles?limit=5")
        assert response.status_code == 200

    def test_get_articles_with_offset(self, test_client):
        response = test_client.get("/api/v1/articles?offset=10&limit=5")
        assert response.status_code == 200

    def test_search_articles_invalid_body(self, test_client):
        response = test_client.post(
            "/api/v1/articles/elasticsearch/search",
            json={"limit": "abc"}
        )
        assert response.status_code == 422

    def test_search_articles_missing_query_lists_all(self, test_client):
        # query vazia e valida: lista todos os artigos (busca sem termo)
        response = test_client.post(
            "/api/v1/articles/elasticsearch/search",
            json={"limit": 10}
        )
        assert response.status_code == 200
        assert isinstance(response.json()["total"], int)

    def test_search_articles_valid_query(self, test_client):
        response = test_client.post(
            "/api/v1/articles/elasticsearch/search",
            json={"query": "test", "limit": 10}
        )
        assert response.status_code in [200, 404]

    def test_search_articles_with_magazine_filter(self, test_client):
        response = test_client.post(
            "/api/v1/articles/elasticsearch/search",
            json={
                "query": "machine learning",
                "magazine_id": 1,
                "limit": 10
            }
        )
        assert response.status_code in [200, 404]

    def test_suggest_articles_empty_query(self, test_client):
        response = test_client.get("/api/v1/articles/elasticsearch/suggest?q=")
        assert response.status_code in [200, 400]

    def test_suggest_articles_valid_query(self, test_client):
        response = test_client.get("/api/v1/articles/elasticsearch/suggest?q=machine")
        assert response.status_code in [200, 404]

    def test_suggest_articles_with_limit(self, test_client):
        response = test_client.get("/api/v1/articles/elasticsearch/suggest?q=test&limit=5")
        assert response.status_code in [200, 404]

    def test_suggest_articles_invalid_limit(self, test_client):
        response = test_client.get("/api/v1/articles/elasticsearch/suggest?q=test&limit=invalid")
        assert response.status_code in [400, 422]

    def test_reindex_articles(self, test_client):
        response = test_client.post("/api/v1/articles/elasticsearch/reindex")
        assert response.status_code in [200, 202]

    def test_reindex_response_format(self, test_client):
        response = test_client.post("/api/v1/articles/elasticsearch/reindex")
        if response.status_code in [200, 202]:
            data = response.json()
            assert "status" in data or "message" in data

    def test_get_article_by_id(self, test_client, sample_article):
        response = test_client.get(f"/api/v1/articles/{sample_article['id']}")
        assert response.status_code in [200, 404]


@pytest.mark.unit
class TestMagazinesEndpoints:

    def test_get_magazines(self, test_client):
        response = test_client.get("/api/v1/magazines")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_magazine_invalid_data(self, test_client):
        response = test_client.post(
            "/api/v1/magazines",
            json={"name": "Test"}  
        )
        assert response.status_code in [400, 422]

    def test_create_magazine_valid_data(self, test_client, sample_magazine):
        response = test_client.post(
            "/api/v1/magazines",
            json=sample_magazine
        )
        assert response.status_code in [200, 201]

    def test_get_magazine_by_id(self, test_client):
        response = test_client.get("/api/v1/magazines/1")
        assert response.status_code in [200, 404]

    def test_update_magazine(self, test_client, sample_magazine):
        response = test_client.put(
            "/api/v1/magazines/1",
            json=sample_magazine
        )
        assert response.status_code in [200, 404]

    def test_delete_magazine(self, test_client):
        response = test_client.delete("/api/v1/magazines/1")
        assert response.status_code in [200, 204, 404]


@pytest.mark.unit
class TestAdminEndpoints:

    def test_get_sync_logs(self, test_client):
        response = test_client.get("/api/v1/admin/logs")
        assert response.status_code == 200
        assert isinstance(response.json(), (list, dict))

    def test_manual_sync(self, test_client, mock_celery_tasks):
        response = test_client.post("/api/v1/admin/sync")
        assert response.status_code in [200, 202]
        mock_celery_tasks['sync_all_magazines'].delay.assert_called_once()

    def test_manual_sync_single_magazine(self, test_client, mock_celery_tasks):
        response = test_client.post(
            "/api/v1/admin/sync?magazine_id=1"
        )
        assert response.status_code in [200, 202]
        mock_celery_tasks['sync_magazine'].delay.assert_called_once_with(1)

    def test_health_check(self, test_client):
        response = test_client.get("/health")
        assert response.status_code in [200, 404]


@pytest.mark.unit
class TestErrorHandling:

    def test_invalid_endpoint(self, test_client):
        response = test_client.get("/api/v1/invalid")
        assert response.status_code == 404

    def test_method_not_allowed(self, test_client):
        response = test_client.put("/api/v1/articles")
        assert response.status_code == 405

    def test_request_timeout(self, test_client):
        pass


@pytest.mark.unit
class TestElasticsearchSearchEndpoint:

    def _add_articles(self, db_session, prefix):
        from app.core.database import Article
        first = Article(oai_identifier=f"oai:{prefix}:1", magazine_id=1, title="Primeiro")
        second = Article(oai_identifier=f"oai:{prefix}:2", magazine_id=1, title="Segundo")
        db_session.add_all([first, second])
        db_session.commit()
        return first, second

    def test_preserves_elasticsearch_order(self, test_client, db_session):
        first, second = self._add_articles(db_session, "es-order")
        es = MagicMock()
        es.search.return_value = {
            "total": 2,
            "articles": [{"article_id": second.id}, {"article_id": first.id}],
            "facets": {},
            "available": True,
        }

        with patch('app.api.articles.get_elasticsearch_client', return_value=es):
            response = test_client.post("/api/v1/articles/elasticsearch/search", json={"query": "x"})

        assert [a["id"] for a in response.json()["articles"]] == [second.id, first.id]

    def test_passes_all_filters_to_elasticsearch(self, test_client):
        es = MagicMock()
        es.search.return_value = {"total": 0, "articles": [], "facets": {}, "available": True}

        with patch('app.api.articles.get_elasticsearch_client', return_value=es):
            test_client.post(
                "/api/v1/articles/elasticsearch/search",
                json={"query": "x", "language": "pt", "keyword": "ia", "has_doi": True},
            )

        kwargs = es.search.call_args.kwargs
        assert (kwargs["language"], kwargs["keyword"], kwargs["has_doi"]) == ("pt", "ia", True)

    def test_sql_fallback_applies_language_filter(self, test_client, db_session):
        from app.core.database import Article
        db_session.add_all([
            Article(oai_identifier="oai:fallback-lang:pt", magazine_id=1, title="Fallback lang", language="pt"),
            Article(oai_identifier="oai:fallback-lang:en", magazine_id=1, title="Fallback lang", language="en"),
        ])
        db_session.commit()
        es = MagicMock()
        es.search.return_value = {"total": 0, "articles": [], "facets": {}, "available": False}

        with patch('app.api.articles.get_elasticsearch_client', return_value=es):
            response = test_client.post(
                "/api/v1/articles/elasticsearch/search",
                json={"query": "Fallback lang", "language": "en"},
            )

        data = response.json()
        assert data["facets"]["search_engine"] == "sql_fallback"
        assert [a["oai_identifier"] for a in data["articles"]] == ["oai:fallback-lang:en"]
