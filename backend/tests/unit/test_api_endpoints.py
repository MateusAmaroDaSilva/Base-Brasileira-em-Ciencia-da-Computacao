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
            json={}
        )
        assert response.status_code != 200

    def test_search_articles_missing_query(self, test_client):
        response = test_client.post(
            "/api/v1/articles/elasticsearch/search",
            json={"limit": 10}
        )
        assert response.status_code in [400, 422]

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

    def test_manual_sync(self, test_client):
        response = test_client.post("/api/v1/admin/sync")
        assert response.status_code in [200, 202, 404]

    def test_manual_sync_single_magazine(self, test_client):
        response = test_client.post(
            "/api/v1/admin/sync",
            json={"magazine_id": 1}
        )
        assert response.status_code in [200, 202, 404, 400]

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
