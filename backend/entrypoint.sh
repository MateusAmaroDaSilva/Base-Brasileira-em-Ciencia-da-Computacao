#!/bin/sh
set -e

echo "Inicializando banco de dados..."
python -c "from app.core.init_db import init_db; init_db()"

echo "Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
