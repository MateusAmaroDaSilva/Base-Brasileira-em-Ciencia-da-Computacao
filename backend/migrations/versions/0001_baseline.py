"""Estado inicial: revistas, artigos e logs de sincronizacao

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op

from migrations.helpers import has_table

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not has_table("magazines"):
        op.create_table(
            "magazines",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("url_oai_pmh", sa.String(500), nullable=False, unique=True),
            sa.Column("description", sa.Text),
            sa.Column("is_active", sa.Boolean),
            sa.Column("last_sync", sa.DateTime),
            sa.Column("created_at", sa.DateTime),
            sa.Column("updated_at", sa.DateTime),
            sa.Column("extra_metadata", sa.JSON),
        )
        op.create_index("ix_magazines_id", "magazines", ["id"])
        op.create_index("ix_magazines_name", "magazines", ["name"], unique=True)
        op.create_index("ix_magazines_is_active", "magazines", ["is_active"])

    if not has_table("articles"):
        op.create_table(
            "articles",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("oai_identifier", sa.String(500), nullable=False),
            sa.Column("magazine_id", sa.Integer, nullable=False),
            sa.Column("title", sa.String(500), nullable=False),
            sa.Column("authors", sa.JSON),
            sa.Column("abstract", sa.Text),
            sa.Column("keywords", sa.JSON),
            sa.Column("publication_date", sa.DateTime),
            sa.Column("url", sa.String(500)),
            sa.Column("doi", sa.String(100)),
            sa.Column("issn", sa.String(20)),
            sa.Column("volume", sa.String(50)),
            sa.Column("issue", sa.String(50)),
            sa.Column("pages", sa.String(50)),
            sa.Column("language", sa.String(10)),
            sa.Column("is_indexed", sa.Boolean),
            sa.Column("raw_metadata", sa.JSON),
            sa.Column("created_at", sa.DateTime),
            sa.Column("updated_at", sa.DateTime),
        )
        op.create_index("ix_articles_id", "articles", ["id"])
        op.create_index("ix_articles_oai_identifier", "articles", ["oai_identifier"], unique=True)
        op.create_index("ix_articles_magazine_id", "articles", ["magazine_id"])
        op.create_index("ix_articles_title", "articles", ["title"])
        op.create_index("ix_articles_publication_date", "articles", ["publication_date"])
        op.create_index("ix_articles_is_indexed", "articles", ["is_indexed"])

    if not has_table("sync_logs"):
        op.create_table(
            "sync_logs",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("magazine_id", sa.Integer, nullable=False),
            sa.Column("status", sa.String(20), nullable=False),
            sa.Column("articles_new", sa.Integer),
            sa.Column("articles_updated", sa.Integer),
            sa.Column("articles_failed", sa.Integer),
            sa.Column("errors", sa.JSON),
            sa.Column("duration_seconds", sa.Integer),
            sa.Column("started_at", sa.DateTime),
            sa.Column("ended_at", sa.DateTime),
        )
        op.create_index("ix_sync_logs_id", "sync_logs", ["id"])
        op.create_index("ix_sync_logs_magazine_id", "sync_logs", ["magazine_id"])
        op.create_index("ix_sync_logs_status", "sync_logs", ["status"])


def downgrade() -> None:
    op.drop_table("sync_logs")
    op.drop_table("articles")
    op.drop_table("magazines")
