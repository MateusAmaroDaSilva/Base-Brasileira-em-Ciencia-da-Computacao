import sqlalchemy as sa
import pytest

from app.core.migrate import run_migrations


@pytest.fixture
def db_url(tmp_path):
    return f"sqlite:///{tmp_path / 'migracao.db'}"


def columns(url, table):
    return {c["name"] for c in sa.inspect(sa.create_engine(url)).get_columns(table)}


@pytest.mark.unit
class TestMigrations:
    def test_fresh_database_gets_every_table_and_column(self, db_url):
        run_migrations(db_url)
        tables = set(sa.inspect(sa.create_engine(db_url)).get_table_names())
        assert {"magazines", "articles", "sync_logs", "users", "search_history", "saved_articles", "alerts"} <= tables
        assert {"article_type", "publisher", "license", "open_access"} <= columns(db_url, "articles")
        assert {"avatar", "avatar_mime"} <= columns(db_url, "users")

    def test_running_twice_changes_nothing(self, db_url):
        run_migrations(db_url)
        run_migrations(db_url)

    def test_existing_production_database_is_upgraded_and_keeps_its_data(self, db_url):
        # Producao foi criada sem Alembic: tem as tabelas do estado inicial, com dados, e nenhum alembic_version
        run_migrations(db_url, revision="0001")
        engine = sa.create_engine(db_url)
        with engine.begin() as conn:
            conn.execute(sa.text("INSERT INTO magazines (name, url_oai_pmh) VALUES ('RBIE', 'http://x/oai')"))
            conn.execute(
                sa.text("INSERT INTO articles (oai_identifier, magazine_id, title) VALUES ('oai:1', 1, 'Antigo')")
            )
            conn.execute(sa.text("DROP TABLE alembic_version"))

        run_migrations(db_url)

        with engine.connect() as conn:
            row = conn.execute(sa.text("SELECT title, article_type, open_access FROM articles")).one()
        assert row == ("Antigo", "artigo", None)  # dado mantido; tipo recebe o padrao
        assert "users" in sa.inspect(engine).get_table_names()

    def test_development_database_with_avatar_columns_already_added(self, db_url):
        run_migrations(db_url, revision="0002")
        engine = sa.create_engine(db_url)
        with engine.begin() as conn:
            conn.execute(sa.text("DROP TABLE alembic_version"))
        run_migrations(db_url)  # nao pode falhar por coluna ou tabela repetida
