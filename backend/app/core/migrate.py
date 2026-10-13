"""Aplica as migracoes do banco (Alembic). Roda na subida do container, antes da API."""
import logging
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]


def run_migrations(url: str | None = None, revision: str = "head") -> None:
    # Os arquivos de migracao importam migrations.helpers
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    config.attributes["url"] = url or settings.DATABASE_URL
    logger.info("Aplicando migracoes do banco...")
    command.upgrade(config, revision)
    logger.info("Banco na versao mais recente.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
