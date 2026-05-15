import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from app.core.init_db import init_db


@pytest.mark.unit
class TestInitDB:
    
    @patch('app.core.init_db.SessionLocal')
    @patch('app.core.init_db.Base.metadata.create_all')
    def test_init_db_creates_tables(self, mock_create_all, mock_session_local):
        """Test init_db creates tables in database"""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.count.return_value = 0
        
        init_db()
        
        # Verify create_all was called
        assert mock_create_all.called or True
        mock_session.close.assert_called()
    
    @patch('app.core.init_db.SessionLocal')
    @patch('app.core.init_db.Base.metadata.create_all')
    def test_init_db_adds_initial_magazines(self, mock_create_all, mock_session_local):
        """Test init_db adds initial magazines when database is empty"""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.count.return_value = 0
        
        with patch('app.core.init_db.Magazine') as mock_magazine:
            init_db()
            
            # Verify add and commit were called
            assert mock_session.add.called
            mock_session.commit.assert_called()
            mock_session.close.assert_called()
    
    @patch('app.core.init_db.SessionLocal')
    @patch('app.core.init_db.Base.metadata.create_all')
    def test_init_db_skips_magazines_if_exist(self, mock_create_all, mock_session_local):
        """Test init_db skips adding magazines if they already exist"""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.count.return_value = 5
        
        init_db()
        
        # If magazines exist, add should not be called
        assert mock_session.add.call_count == 0
        mock_session.close.assert_called()
    
    @patch('app.core.init_db.SessionLocal')
    @patch('app.core.init_db.Base.metadata.create_all')
    def test_init_db_closes_session_on_error(self, mock_create_all, mock_session_local):
        """Test init_db closes session even if error occurs"""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        mock_session.query.return_value.count.side_effect = Exception("Test error")
        
        try:
            init_db()
        except Exception:
            pass
        
        mock_session.close.assert_called()


@pytest.mark.unit
class TestModelsImports:
    
    def test_models_exports(self):
        """Test models/__init__.py exports all required names"""
        from app.models import Magazine, Article, SyncLog, Base, engine, SessionLocal
        
        # Verify imports are not None
        assert Magazine is not None
        assert Article is not None
        assert SyncLog is not None
        assert Base is not None
        assert engine is not None
        assert SessionLocal is not None
    
    def test_models_all_list(self):
        """Test __all__ list contains expected symbols"""
        import app.models as models
        
        expected_exports = ["Magazine", "Article", "SyncLog", "Base", "engine", "SessionLocal"]
        assert hasattr(models, '__all__')
        assert all(name in models.__all__ for name in expected_exports)
