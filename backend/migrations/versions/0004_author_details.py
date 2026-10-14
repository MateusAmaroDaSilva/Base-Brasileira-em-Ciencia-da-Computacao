"""Autores com afiliacao e ORCID

Revision ID: 0004
Revises: 0003
"""
import sqlalchemy as sa
from alembic import op

from migrations.helpers import has_column

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not has_column("articles", "author_details"):
        op.add_column("articles", sa.Column("author_details", sa.JSON))


def downgrade() -> None:
    op.drop_column("articles", "author_details")
