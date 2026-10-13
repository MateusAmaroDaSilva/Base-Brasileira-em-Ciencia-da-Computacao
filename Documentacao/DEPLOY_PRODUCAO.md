# Deploy em produção

Como uma versão nova chega ao ar, o que é automático e o que continua manual.

> Este documento é público. Nenhum valor de segredo, endereço de painel administrativo,
> identificador de stack ou credencial deve ser escrito aqui — apenas os **nomes** das
> variáveis. Os valores ficam nos segredos do repositório e no painel de deploy.

---

## Visão geral

```
git push origin main          →  só guarda o código (não publica nada)
git tag vX.Y.Z                →  marca a versão
git push origin vX.Y.Z        →  dispara a esteira completa
```

A tag é o gatilho. Um push na `main` roda apenas as verificações de qualidade e constrói
imagens de desenvolvimento; ele **não** altera o ambiente de produção.

Ao receber uma tag `v*`, o workflow `.github/workflows/build.yml` executa, nesta ordem:

1. **Backend** — constrói a imagem do backend e publica no GHCR, com a versão da tag
   (`v1.2.3` vira a imagem `1.2.3`). Inclui varredura de vulnerabilidades.
2. **Frontend** — constrói a imagem do frontend (build do React servido por nginx) e publica.
3. **Deploy** — atualiza a stack no ambiente de produção e confere se o site respondeu.

Os três aparecem como blocos separados na aba **Actions**.

---

## Por que o deploy usa a API, e não um webhook

O painel oferece um webhook por serviço: um POST naquele endereço troca a imagem do
container em execução. É mais simples de configurar, mas tem um efeito colateral sério:

**o webhook não escreve na definição da stack.** A variável de versão declarada continua
apontando para a versão anterior. Fica um desencontro silencioso — roda a `1.2.3`, está
declarado `1.2.2` — e a próxima atualização feita pela interface **reverte a versão sem
avisar**.

Por isso o passo de deploy usa a API e reescreve a definição inteira: o arquivo da stack
do repositório mais a lista de variáveis, com a versão nova. O que está declarado e o que
está rodando nunca se separam.

O script é o `scripts/deploy_portainer.py`. Ele:

- lê a stack atual e **aborta antes de enviar** se as variáveis de banco e domínio não
  vierem na resposta (assim uma resposta incompleta nunca apaga credenciais);
- troca apenas a variável de versão, preservando todas as outras;
- envia `prune: false` (não remove nada fora da definição) e `pullImage: true`;
- em seguida o workflow tenta por 5 minutos até a API e a página responderem 200,
  e falha se isso não acontecer.

---

## Segredos necessários

Cadastrados em **Settings › Secrets and variables › Actions** do repositório. Só os nomes:

| Nome | O que é |
|---|---|
| `PORTAINER_URL` | endereço do painel de deploy |
| `PORTAINER_TOKEN` | token de acesso gerado no painel |
| `PORTAINER_STACK_ID` | identificador numérico da stack |
| `PORTAINER_ENDPOINT_ID` | identificador numérico do ambiente |

Sem eles, o passo de deploy falha com uma mensagem dizendo qual está faltando; as imagens
já publicadas continuam válidas e o deploy pode ser feito pela interface.

---

## A stack

Definida em `docker-compose.portainer.yml`, com cinco serviços: banco PostgreSQL, Redis,
backend, worker de sincronização e frontend.

Pontos que fazem a stack conviver com outros projetos no mesmo servidor:

- **nenhum serviço publica porta** — quem expõe para a internet é o proxy reverso do
  servidor, através das etiquetas no serviço do frontend, que também cuida do certificado;
- a rede de entrada entra como `external: true`, ou seja, é usada e nunca recriada;
- os volumes recebem o nome da stack como prefixo, então não encostam nos de outros projetos;
- o banco usa `order: stop-first` na atualização, para nunca existirem duas instâncias
  escrevendo no mesmo volume;
- backend e frontend usam `order: start-first` com `failure_action: rollback`: a versão
  nova sobe antes de a antiga cair e, se falhar, o próprio servidor volta atrás.

As variáveis da stack (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DOMAIN`,
`SECRET_KEY` e `TAG`) têm seus valores preenchidos no painel, nunca neste repositório. O
arquivo `.env.example` lista os nomes.

`SECRET_KEY` assina os tokens de login das contas de usuário. Em produção ela é obrigatória:
o backend **recusa subir** se ela estiver ausente, vazia, curta (menos de 32 caracteres) ou
igual à chave de desenvolvimento. Cadastre-a no painel **antes** de publicar a primeira versão
que traz as contas, senão o deploy falha na verificação de saúde e volta sozinho para a
versão anterior. Trocar a chave depois desconecta todos os usuários.

---

## Migrações do banco

Mudanças na estrutura do banco são aplicadas sozinhas quando o backend sobe
(`python -m app.core.migrate`, via Alembic, em `backend/migrations`). As migrações só criam o
que ainda não existe e **nunca apagam dados**, então o banco já em produção é atualizado no
lugar. Mesmo assim, antes de uma versão que altera a estrutura, faça uma cópia do banco.

Voltar a `TAG` para uma versão anterior não desfaz migrações: as colunas e tabelas novas
ficam no banco, e a versão antiga simplesmente as ignora.

---

## Voltar para a versão anterior

Como as imagens antigas continuam no registro, basta publicar de novo apontando para elas:

1. no painel, altere a variável `TAG` para a versão anterior e atualize a stack; **ou**
2. marque novamente o commit da versão anterior com uma tag nova.

É por isso que a versão é fixa e nunca uma etiqueta móvel como `latest`: sem número fixo,
não existe "voltar para a de ontem".

---

## Depois de publicar, confira

- os três blocos verdes na aba **Actions**;
- a variável `TAG` da stack igual à versão que acabou de subir;
- o site abrindo e uma busca real retornando resultados;
- `GET /api/v1/admin/health` respondendo 200.

---

## Depois de uma versão que muda o extrator

Os artigos já gravados só ganham os campos novos (data, DOI, volume, tipo, licença...) quando
são coletados de novo. Depois de publicar uma versão que altera o extrator, dispare uma
sincronização completa (`POST /api/v1/admin/sync`); ela atualiza os registros existentes no
lugar, sem duplicar.

---

## Primeira carga de dados

O banco sobe vazio. A inicialização cria as revistas cadastradas, e os artigos chegam pela
sincronização, que pode ser disparada pela API administrativa (`POST /api/v1/admin/sync`,
opcionalmente com `magazine_id`). O histórico de cada execução fica em
`GET /api/v1/admin/logs`, com o total de novos, atualizados e falhos.
