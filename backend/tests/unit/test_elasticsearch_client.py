import pytest
from unittest.mock import MagicMock, patch
from app.core.elasticsearch_client import ElasticsearchClient


@pytest.mark.unit
class TestElasticsearchClient:

    @pytest.fixture
    def es_client(self):
        with patch('app.core.elasticsearch_client.Elasticsearch'):
            with patch('app.core.elasticsearch_client.settings'):
                return ElasticsearchClient()

    def test_elasticsearch_client_init(self, es_client):
        assert es_client.es is not None
        assert es_client.index_name == 'articles'

    def test_create_index(self, es_client):
        assert es_client.index_name == 'articles'

    def test_bulk_index_articles_success(self, es_client):
        es_client.es = MagicMock()
        
        articles = [
            {
                'id': 1,
                'title': 'Test Article',
                'abstract': 'Test abstract',
                'authors': ['Author 1'],
                'keywords': ['test'],
                'magazine_id': 1,
                'publication_date': '2026-01-15',
                'created_at': '2026-03-26 12:00:00',
                'updated_at': '2026-03-26 12:00:00',
            }
        ]
        
        es_client.bulk_index_articles(articles)
        
        es_client.es.index.assert_called_once()

    def test_bulk_index_articles_date_formatting(self, es_client):
        es_client.es = MagicMock()
        
        articles = [
            {
                'id': 1,
                'title': 'Test Article',
                'abstract': 'Test abstract',
                'authors': ['Author 1'],
                'keywords': ['test'],
                'magazine_id': 1,
                'publication_date': '2026-01-15 10:30:45',
                'created_at': '2026-03-26 12:00:00',
                'updated_at': '2026-03-26 12:00:00',
            }
        ]
        
        es_client.bulk_index_articles(articles)
        
        assert es_client.es.index.called
        
        call_args = es_client.es.index.call_args
        body = call_args[1]['body']
        
        assert 'T' in body['created_at']
        assert 'T' in body['publication_date']

    def test_search_articles(self, es_client):
        es_client.es = MagicMock()
        es_client.es.search.return_value = {
            'hits': {
                'total': {'value': 10},
                'hits': [
                    {'_source': {'title': 'Result 1'}},
                    {'_source': {'title': 'Result 2'}},
                ]
            }
        }
        
        results = es_client.search(query='test', limit=10)
        
        assert results['total'] == 10
        assert len(results['articles']) == 2
        es_client.es.search.assert_called_once()

    def test_search_with_magazine_filter(self, es_client):
        es_client.es = MagicMock()
        es_client.es.search.return_value = {
            'hits': {
                'total': {'value': 5},
                'hits': []
            }
        }
        
        results = es_client.search(query='test', magazine_id=1, limit=10)
        
        es_client.es.search.assert_called_once()
        call_args = es_client.es.search.call_args
        
        query_body = call_args[1]['body']
        assert 'bool' in query_body['query']
        assert 'must' in query_body['query']['bool']

    def test_suggest_articles(self, es_client):
        es_client.es = MagicMock()
        es_client.es.search.return_value = {
            'hits': {
                'hits': [
                    {'_source': {'title': 'machine learning'}},
                    {'_source': {'title': 'machine vision'}},
                ]
            }
        }
        
        suggestions = es_client.suggest(query='machine', limit=5)
        
        assert len(suggestions) == 2
        assert suggestions[0] == 'machine learning'
        es_client.es.search.assert_called_once()

    def test_recreate_index(self, es_client):
        es_client.es = MagicMock()
        es_client.es.indices.exists.return_value = True 
        es_client.recreate_index()
        es_client.es.indices.delete.assert_called()
        es_client.es.indices.exists.assert_called()

    def test_elastic_connection_error(self, es_client):
        es_client.es = MagicMock()
        es_client.es.search.side_effect = Exception("Connection refused")
        result = es_client.search(query='test')
        
        assert result['total'] == 0
        assert result['articles'] == []

    def test_bulk_index_with_empty_list(self, es_client):
        es_client.es = MagicMock()  
        es_client.bulk_index_articles([])
        es_client.es.index.assert_not_called()

    def test_search_with_pagination(self, es_client):
        es_client.es = MagicMock()
        es_client.es.search.return_value = {
            'hits': {
                'total': {'value': 100},
                'hits': []
            }
        }
        
        results = es_client.search(query='test', limit=10, offset=20)
        
        call_args = es_client.es.search.call_args
        body = call_args[1]['body']
        
        assert body['from'] == 20
        assert body['size'] == 10
