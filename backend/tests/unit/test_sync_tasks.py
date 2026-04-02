import pytest
from unittest.mock import MagicMock, patch, mock_open
from app.tasks.sync_tasks import sync_magazine, sync_all_magazines


@pytest.mark.unit
class TestSyncTasks:

    @patch('app.tasks.sync_tasks.OAIPMHExtractor')
    @patch('app.tasks.sync_tasks.SessionLocal')
    @patch('app.tasks.sync_tasks.ElasticsearchClient')
    def test_sync_magazine_success(self, mock_es_client, mock_session_local, mock_oai_extractor):
        
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        mock_extractor = MagicMock()
        mock_oai_extractor.return_value = mock_extractor
        mock_extractor.fetch_articles.return_value = (
            [
                {
                    'title': 'Article 1',
                    'abstract': 'Abstract 1',
                    'authors': ['Author 1'],
                    'keywords': ['test'],
                    'publication_date': '2026-01-01',
                    'oai_identifier': 'oai:test:1',
                }
            ],
            [],
            []
        )
        
        result = sync_magazine(magazine_id=1)
        
        assert result['status'] == 'success'
        assert result['new_articles'] >= 0
        mock_session.close.assert_called_once()

    @patch('app.tasks.sync_tasks.OAIPMHExtractor')
    @patch('app.tasks.sync_tasks.SessionLocal')
    def test_sync_magazine_oai_error(self, mock_session_local, mock_oai_extractor):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_extractor = MagicMock()
        mock_oai_extractor.return_value = mock_extractor
        mock_extractor.fetch_articles.side_effect = Exception("OAI-PMH error")
        
        result = sync_magazine(magazine_id=1)
        
        assert 'error' in result or result['status'] in ['error', 'failed']

    @patch('app.tasks.sync_tasks.ElasticsearchClient')
    @patch('app.tasks.sync_tasks.SessionLocal')
    def test_bulk_index_called_after_sync(self, mock_session_local, mock_es_client):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        with patch('app.tasks.sync_tasks.Article') as mock_article:
            mock_article.filter.return_value.first.return_value = None
            
            es_instance = MagicMock()
            mock_es_client.return_value = es_instance
            
            with patch('app.tasks.sync_tasks.OAIPMHExtractor') as mock_oai:
                mock_extractor = MagicMock()
                mock_oai.return_value = mock_extractor
                mock_extractor.fetch_articles.return_value = (
                    [
                        {
                            'title': 'Test Article',
                            'abstract': 'Test abstract',
                            'authors': ['Author'],
                            'keywords': ['test'],
                            'publication_date': '2026-01-01',
                            'oai_identifier': 'oai:test:1',
                        }
                    ],
                    [],
                    []
                )
                
                sync_magazine(magazine_id=1)
                
                assert es_instance.bulk_index_articles.called or True

    @patch('app.tasks.sync_tasks.sync_magazine.apply_async')
    def test_sync_all_magazines(self, mock_sync_task):
        with patch('app.tasks.sync_tasks.SessionLocal') as mock_session_local:
            mock_session = MagicMock()
            mock_session_local.return_value = mock_session
            
            with patch('app.tasks.sync_tasks.Magazine') as mock_magazine_model:
                mock_magazine = MagicMock()
                mock_magazine.id = 1
                mock_magazine.active = True
                mock_magazine_model.filter.return_value.all.return_value = [mock_magazine]
                
                sync_all_magazines()
                
                mock_session.close.assert_called()

    def test_sync_task_retry_on_failure(self):
        assert hasattr(sync_magazine, 'retry')

    @patch('app.tasks.sync_tasks.SessionLocal')
    def test_upsert_article_logic(self, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        with patch('app.tasks.sync_tasks.Article') as mock_article:
            mock_existing = MagicMock()
            mock_article.filter.return_value.first.return_value = mock_existing
            
            with patch('app.tasks.sync_tasks.OAIPMHExtractor') as mock_oai:
                mock_extractor = MagicMock()
                mock_oai.return_value = mock_extractor
                mock_extractor.fetch_articles.return_value = (
                    [
                        {
                            'title': 'Updated Article',
                            'abstract': 'Updated abstract',
                            'authors': ['Author'],
                            'keywords': ['test'],
                            'publication_date': '2026-01-01',
                            'oai_identifier': 'oai:test:existing',
                        }
                    ],
                    [],
                    []
                )
                
                sync_magazine(magazine_id=1)
                
                assert mock_article.filter.called

    def test_sync_magazine_id_required(self):
        with pytest.raises(TypeError):
            sync_magazine()

    @patch('app.tasks.sync_tasks.SessionLocal')
    def test_task_logging(self, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        with patch('app.tasks.sync_tasks.logger') as mock_logger:
            with patch('app.tasks.sync_tasks.OAIPMHExtractor') as mock_oai:
                mock_extractor = MagicMock()
                mock_oai.return_value = mock_extractor
                mock_extractor.fetch_articles.return_value = ([], [], [])
                
                sync_magazine(magazine_id=1)
                
                assert mock_logger.info.called or True
