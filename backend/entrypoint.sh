#!/bin/sh
set -e

echo "Aguardando PostgreSQL ficar disponivel..."
MAX=30
N=0
until python -c "
import os, sys
try:
    from sqlalchemy import create_engine, text
    e = create_engine(os.environ['DATABASE_URL'])
    with e.connect() as c: c.execute(text('SELECT 1'))
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
  N=$((N+1))
  if [ $N -ge $MAX ]; then
    echo "PostgreSQL nao respondeu apos $MAX tentativas. Abortando."
    exit 1
  fi
  echo "  tentativa $N/$MAX..."
  sleep 3
done

echo "Inicializando banco de dados..."
python -c "from app.core.init_db import init_db; init_db()"

echo "Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
