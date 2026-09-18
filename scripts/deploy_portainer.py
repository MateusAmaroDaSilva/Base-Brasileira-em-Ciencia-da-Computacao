#!/usr/bin/env python3
"""Atualiza a stack do Portainer para uma versao nova das imagens.

Ao contrario do webhook, este script reescreve a DEFINICAO da stack: manda o
arquivo do repositorio e a lista de variaveis com a TAG nova. Assim o que esta
declarado e o que esta rodando nunca se desencontram, e um "Update the stack"
feito depois pela interface nao reverte a versao.

Variaveis de ambiente esperadas:
  PORTAINER_URL          ex.: https://portainer.labs.unimar.br
  PORTAINER_TOKEN        token de acesso criado no Portainer (X-API-Key)
  PORTAINER_STACK_ID     id numerico da stack
  PORTAINER_ENDPOINT_ID  id numerico do ambiente (endpoint) onde ela roda
  TAG                    versao das imagens, sem o "v" (ex.: 1.0.2)
  STACK_FILE             caminho do compose (padrao: docker-compose.portainer.yml)
"""
import json
import os
import sys
import urllib.error
import urllib.request

# Sem estas variaveis a stack subiria sem banco ou sem dominio: melhor abortar
REQUIRED_ENV_KEYS = {"POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "DOMAIN"}

TIMEOUT = 60


def fail(message: str) -> "None":
    print(f"ERRO: {message}", file=sys.stderr)
    sys.exit(1)


def request(method: str, url: str, token: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("X-API-Key", token)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            body = response.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        fail(f"{method} {url} respondeu {e.code}: {detail}")
    except urllib.error.URLError as e:
        fail(f"nao foi possivel falar com o Portainer: {e.reason}")


def main() -> None:
    base = os.environ.get("PORTAINER_URL", "").rstrip("/")
    token = os.environ.get("PORTAINER_TOKEN", "")
    stack_id = os.environ.get("PORTAINER_STACK_ID", "")
    endpoint_id = os.environ.get("PORTAINER_ENDPOINT_ID", "")
    tag = os.environ.get("TAG", "")
    stack_file = os.environ.get("STACK_FILE", "docker-compose.portainer.yml")

    missing = [
        name
        for name, value in [
            ("PORTAINER_URL", base),
            ("PORTAINER_TOKEN", token),
            ("PORTAINER_STACK_ID", stack_id),
            ("PORTAINER_ENDPOINT_ID", endpoint_id),
            ("TAG", tag),
        ]
        if not value
    ]
    if missing:
        fail(f"faltam variaveis: {', '.join(missing)}")

    if not os.path.exists(stack_file):
        fail(f"arquivo da stack nao encontrado: {stack_file}")

    with open(stack_file, encoding="utf-8") as f:
        stack_content = f.read()

    stack = request("GET", f"{base}/api/stacks/{stack_id}", token)
    print(f"Stack {stack.get('Id')}: {stack.get('Name')}")

    current_env = stack.get("Env") or []
    present = {item.get("name") for item in current_env}
    faltando = REQUIRED_ENV_KEYS - present
    if faltando:
        # Enviar a definicao agora apagaria essas variaveis da stack
        fail(
            "a stack nao devolveu estas variaveis: "
            + ", ".join(sorted(faltando))
            + ". Atualize a TAG pela interface do Portainer desta vez e "
            "confira as permissoes do token."
        )

    new_env = [item for item in current_env if item.get("name") != "TAG"]
    new_env.append({"name": "TAG", "value": tag})

    antes = next((i.get("value") for i in current_env if i.get("name") == "TAG"), "(nenhuma)")
    print(f"TAG: {antes} -> {tag}")

    request(
        "PUT",
        f"{base}/api/stacks/{stack_id}?endpointId={endpoint_id}",
        token,
        {
            "stackFileContent": stack_content,
            "env": new_env,
            "prune": False,      # nao remove recursos fora da definicao
            "pullImage": True,   # baixa a imagem nova do registry
        },
    )

    print(f"Stack atualizada para a versao {tag}.")


if __name__ == "__main__":
    main()
