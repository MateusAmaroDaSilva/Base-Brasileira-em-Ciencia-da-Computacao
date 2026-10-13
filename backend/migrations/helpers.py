"""Verificacoes para migracoes idempotentes.

O banco de producao foi criado por create_all, sem controle de versao: ao adotar o Alembic ele ja tem
as tabelas do estado inicial. Por isso cada passo confere o que ja existe antes de criar ou alterar.
"""
import sqlalchemy as sa
from alembic import op


def has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def has_column(table: str, column: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return inspector.has_table(table) and column in {c["name"] for c in inspector.get_columns(table)}


def has_index(table: str, name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return inspector.has_table(table) and name in {i["name"] for i in inspector.get_indexes(table)}
