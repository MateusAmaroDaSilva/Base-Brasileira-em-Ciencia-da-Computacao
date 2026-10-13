"""Contas de usuario: usuarios, historico de buscas, artigos salvos e alertas

Revision ID: 0002
Revises: 0001
"""
import sqlalchemy as sa
from alembic import op

from migrations.helpers import has_column, has_table

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if not has_table("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("email", sa.String(320), nullable=False),
            sa.Column("password_hash", sa.String(100), nullable=False),
            sa.Column("institution", sa.String(200)),
            sa.Column("areas", sa.JSON),
            sa.Column("save_history", sa.Boolean, nullable=False, server_default=sa.true()),
            sa.Column("avatar", sa.LargeBinary),
            sa.Column("avatar_mime", sa.String(20)),
            sa.Column("created_at", sa.DateTime),
        )
        op.create_index("ix_users_id", "users", ["id"])
        op.create_index("ix_users_email", "users", ["email"], unique=True)
    else:
        # Bancos de desenvolvimento criados antes da foto de perfil
        if not has_column("users", "avatar"):
            op.add_column("users", sa.Column("avatar", sa.LargeBinary))
        if not has_column("users", "avatar_mime"):
            op.add_column("users", sa.Column("avatar_mime", sa.String(20)))

    if not has_table("search_history"):
        op.create_table(
            "search_history",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("query", sa.String(500), nullable=False),
            sa.Column("kind", sa.String(20), nullable=False, server_default="publicacoes"),
            sa.Column("area", sa.String(100)),
            sa.Column("result_count", sa.Integer),
            sa.Column("created_at", sa.DateTime),
        )
        op.create_index("ix_search_history_id", "search_history", ["id"])
        op.create_index("ix_search_history_user_id", "search_history", ["user_id"])
        op.create_index("ix_search_history_created_at", "search_history", ["created_at"])

    if not has_table("saved_articles"):
        op.create_table(
            "saved_articles",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("article_id", sa.Integer, sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("created_at", sa.DateTime),
            sa.UniqueConstraint("user_id", "article_id", name="uq_saved_user_article"),
        )
        op.create_index("ix_saved_articles_id", "saved_articles", ["id"])
        op.create_index("ix_saved_articles_user_id", "saved_articles", ["user_id"])
        op.create_index("ix_saved_articles_article_id", "saved_articles", ["article_id"])

    if not has_table("alerts"):
        op.create_table(
            "alerts",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("query", sa.String(500), nullable=False),
            sa.Column("created_at", sa.DateTime),
        )
        op.create_index("ix_alerts_id", "alerts", ["id"])
        op.create_index("ix_alerts_user_id", "alerts", ["user_id"])


def downgrade() -> None:
    for table in ("alerts", "saved_articles", "search_history", "users"):
        op.drop_table(table)
