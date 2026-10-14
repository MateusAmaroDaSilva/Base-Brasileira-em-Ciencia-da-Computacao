"""Normalizacao de nomes de autores e instituicoes, para contar pessoas e lugares distintos."""
import re
import unicodedata
from typing import Optional

_SPACES = re.compile(r"\s+")
_NON_WORD = re.compile(r"[^\w\s]")
# "Instituto Federal Farroupilha - Campus Sao Borja" e "... - Campus Frederico Westphalen": mesma instituicao
_CAMPUS = re.compile(
    r"\s*[-–,]\s*(?:c[aâ]mpus|campus|centro|faculdade|escola|departamento|instituto de|programa)\b.*$", re.I
)


def fold(text: str) -> str:
    """Minusculas, sem acentos nem pontuacao e com espacos simples."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return _SPACES.sub(" ", _NON_WORD.sub(" ", text.casefold())).strip()


def person_key(name: str, orcid: Optional[str] = None) -> str:
    """ORCID quando existe (identifica a pessoa); senao o nome, com 'Sobrenome, Nome' virado para 'nome sobrenome'."""
    if orcid:
        return f"orcid:{orcid.upper()}"
    if "," in name:
        family, _, given = name.partition(",")
        name = f"{given} {family}"
    return f"name:{fold(name)}"


_INSTITUTION_WORDS = re.compile(
    r"univers|instituto|institut|faculdade|centro|escola|funda[cç][aã]o|embrapa|hospital|secretaria|college|school|"
    r"cefet|senac|senai|ufrj|usp|uf[a-z]{2,4}\b|if[a-z]{2,}\b",
    re.I,
)
_JOB_TITLE = re.compile(
    r"^(?:professor|prof\.?|doutor|mestre|pesquisador|aluno|estudante|docente)[^,()]*?\b(?:da|do|de|na|no)\s+", re.I
)
_PLACE_TAIL = re.compile(r",\s*[^,]+,\s*[A-Z]{2}\b.*$|,\s*(?:brasil|brazil|portugal)\.?$", re.I)
_PAREN_ACRONYM = re.compile(r"\(([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-\.]{1,11})\)")
_LEADING_ACRONYM = re.compile(r"^([A-Z]{2,8})\s*[-–]\s*(?=\S{3})")


def _clean_affiliation(text: str) -> str:
    """Uma instituicao por texto: escolhe o trecho que parece instituicao e tira cargo, campus e cidade."""
    parts = [p.strip() for p in re.split(r"[\n;]|\s{2,}", text) if p.strip()]
    chosen = next((p for p in parts if _INSTITUTION_WORDS.search(p)), parts[0] if parts else text.strip())
    chosen = _JOB_TITLE.sub("", chosen)
    chosen = _PLACE_TAIL.sub("", chosen)
    return _CAMPUS.sub("", chosen).strip(" .,-–")


def _split_acronym(cleaned: str):
    """Devolve (nome, sigla): 'Universidade de Sao Paulo (USP)' -> ('...', 'usp'); 'USP' -> ('', 'usp')."""
    paren = _PAREN_ACRONYM.search(cleaned)
    if paren:
        return cleaned.replace(paren.group(0), " "), fold(paren.group(1))
    leading = _LEADING_ACRONYM.match(cleaned)
    if leading:
        return cleaned[leading.end():], fold(leading.group(1))
    if " " not in cleaned and cleaned.isupper() and len(cleaned) <= 10:
        return "", fold(cleaned)
    return cleaned, None


def institution_keys(affiliations) -> set:
    """Instituicoes distintas. O mesmo lugar chega escrito de varios jeitos (nome por extenso,
    nome com a sigla entre parenteses, so a sigla): quando alguma forma traz as duas coisas, as
    demais passam a contar como a mesma instituicao."""
    entries = []
    for text in affiliations:
        name, acronym = _split_acronym(_clean_affiliation(text))
        entries.append((fold(name), acronym))

    alias = {name: acr for name, acr in entries if name and acr}
    keys = set()
    for name, acr in entries:
        key = acr or alias.get(name) or name
        if key:
            keys.add(key)
    return keys


def institution_key(affiliation: str) -> str:
    """Chave de uma instituicao isolada (sem cruzar com as outras escritas)."""
    keys = institution_keys([affiliation])
    return next(iter(keys)) if keys else ""
