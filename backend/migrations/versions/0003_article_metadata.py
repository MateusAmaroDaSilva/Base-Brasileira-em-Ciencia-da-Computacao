"""Metadados que as revistas ja enviam: tipo, editora, licenca e acesso aberto

Revision ID: 0003
Revises: 0002
"""
import sqlalchemy as sa
from alembic import op

from migrations.helpers import has_column, has_index

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not has_column("articles", "article_type"):
        op.add_column(
            "articles",
            sa.Column("article_type", sa.String(30), nullable=False, server_default="artigo"),
        )
    if not has_index("articles", "ix_articles_article_type"):
        op.create_index("ix_articles_article_type", "articles", ["article_type"])
    if not has_column("articles", "publisher"):
        op.add_column("articles", sa.Column("publisher", sa.String(300)))
    if not has_column("articles", "license"):
        op.add_column("articles", sa.Column("license", sa.String(300)))
    if not has_column("articles", "open_access"):
        op.add_column("articles", sa.Column("open_access", sa.Boolean))

    # Alguns DOIs em forma de link passam de 100 caracteres
    if op.get_bind().dialect.name == "postgresql":
        op.alter_column("articles", "doi", type_=sa.String(255), existing_type=sa.String(100))


def downgrade() -> None:
    op.drop_index("ix_articles_article_type", table_name="articles")
    for column in ("open_access", "license", "publisher", "article_type"):
        op.drop_column("articles", column)
