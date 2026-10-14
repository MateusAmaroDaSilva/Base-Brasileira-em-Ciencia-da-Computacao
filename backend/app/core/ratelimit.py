"""Limite de tentativas de login falhas (em memoria, por processo).

Barra adivinhacao de senha: depois de varias falhas seguidas para o mesmo e-mail (ou muitas vindas do mesmo
endereco), novas tentativas recebem 429 ate a janela passar. Um login correto zera o contador do e-mail.
"""
import time
from collections import defaultdict, deque
from threading import Lock

WINDOW_SECONDS = 15 * 60
MAX_FAILS_PER_EMAIL = 5
MAX_FAILS_PER_IP = 30

_fails = defaultdict(deque)
_lock = Lock()


def _prune(key: str, now: float) -> deque:
    q = _fails[key]
    while q and now - q[0] > WINDOW_SECONDS:
        q.popleft()
    if not q:
        _fails.pop(key, None)
        return deque()
    return q


def retry_after(email: str, ip: str) -> int:
    """Segundos ate poder tentar de novo; 0 quando liberado."""
    now = time.monotonic()
    with _lock:
        waits = []
        for key, limit in ((f"e:{email}", MAX_FAILS_PER_EMAIL), (f"i:{ip}", MAX_FAILS_PER_IP)):
            q = _prune(key, now)
            if len(q) >= limit:
                waits.append(int(WINDOW_SECONDS - (now - q[0])) + 1)
        return max(waits, default=0)


def register_failure(email: str, ip: str) -> None:
    now = time.monotonic()
    with _lock:
        _fails[f"e:{email}"].append(now)
        _fails[f"i:{ip}"].append(now)


def reset(email: str) -> None:
    with _lock:
        _fails.pop(f"e:{email}", None)


def clear_all() -> None:
    with _lock:
        _fails.clear()
