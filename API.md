# Vispro API — Rotas

Base URL: `/api`

Todas as rotas retornam/recebem JSON. Rotas autenticadas exigem o header:

```
Authorization: Bearer <token JWT do Keycloak>
```

Erros seguem o formato:

```json
{ "erro": "mensagem descrevendo o erro" }
```

Erros de validação de request (400) vêm com um campo extra `detalhes` (array com o que falhou em cada campo).

Status codes possíveis: `400` (request inválido), `401` (sem token / token inválido), `403` (autenticado mas sem permissão), `404` (recurso não encontrado), `409` (conflito, ex: solicitação duplicada ou já processada), `500` (erro inesperado).

---

## Usuários

### `POST /api/usuarios`
Registra um novo usuário (cria no Keycloak e no banco). **Não exige autenticação.**

Request body:
```json
{
  "nome": "string, obrigatório",
  "sobrenome": "string, obrigatório",
  "email": "string, email válido, obrigatório",
  "senha": "string, mínimo 6 caracteres, obrigatório"
}
```

Resposta `201 Created`:
```json
{
  "handle": 1,
  "keyPublica": "uuid",
  "nome": "string",
  "sobrenome": "string",
  "email": "string"
}
```

---

### `GET /api/usuarios/me`
Retorna o perfil do usuário autenticado, incluindo a empresa da qual ele é dono (se houver). 🔒 **Autenticado.**

Sem request body.

Resposta `200 OK`:
```json
{
  "handle": 1,
  "keyPublica": "uuid",
  "nome": "string",
  "sobrenome": "string",
  "email": "string",
  "empresaDona": {
    "handle": 1,
    "nome": "string",
    "usuarioDonoHandle": 1
  }
}
```

`empresaDona` vem `null` quando o usuário não é dono de nenhuma empresa.

Erros: `404` usuário autenticado não está cadastrado no sistema.

---

### `GET /api/usuarios/me/solicitacoes`
Lista as solicitações de vínculo (empresa → funcionário) **pendentes** para o usuário autenticado. 🔒 **Autenticado.**

Sem request body.

Resposta `200 OK`:
```json
[
  {
    "handle": 1,
    "empresaHandle": 1,
    "usuarioHandle": 1,
    "status": "Pendente"
  }
]
```

---

## Empresas

### `POST /api/empresas`
Cria uma empresa. O dono é o usuário autenticado. 🔒 **Autenticado.**

Request body:
```json
{
  "nome": "string, mínimo 1 caractere, obrigatório"
}
```

Resposta `201 Created`:
```json
{
  "handle": 1,
  "nome": "string",
  "usuarioDonoHandle": 1
}
```

---

### `POST /api/empresas/:empresaHandle/funcionarios`
Solicita o vínculo de um usuário como funcionário da empresa. Só o **dono da empresa** pode chamar. 🔒 **Autenticado.**

Path params: `empresaHandle` (número)

Request body:
```json
{
  "keyPublicaUsuario": "uuid do usuário que será convidado, obrigatório"
}
```

Resposta `201 Created`:
```json
{
  "handle": 1,
  "empresaHandle": 1,
  "usuarioHandle": 2,
  "status": "Pendente"
}
```

Erros: `404` empresa ou usuário alvo não encontrados · `403` quem chama não é o dono · `409` já existe solicitação pendente para esse par empresa/usuário.

---

### `POST /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle/aceitar`
Aceita uma solicitação de vínculo. Só o **usuário alvo** da solicitação pode chamar. 🔒 **Autenticado.**

Path params: `empresaHandle` (número), `solicitacaoHandle` (número)

Sem request body.

Resposta `200 OK`:
```json
{
  "handle": 1,
  "empresaHandle": 1,
  "usuarioHandle": 2,
  "status": "Aceito"
}
```

Erros: `404` solicitação não encontrada · `403` quem chama não é o alvo · `409` solicitação não está mais pendente.

---

### `POST /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle/negar`
Nega uma solicitação de vínculo. Só o **usuário alvo** da solicitação pode chamar. 🔒 **Autenticado.**

Path params: `empresaHandle` (número), `solicitacaoHandle` (número)

Sem request body.

Resposta `200 OK`:
```json
{
  "handle": 1,
  "empresaHandle": 1,
  "usuarioHandle": 2,
  "status": "Negado"
}
```

Erros: `404` solicitação não encontrada · `403` quem chama não é o alvo · `409` solicitação não está mais pendente.

---

### `POST /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle/cancelar`
Cancela uma solicitação de vínculo que ainda está pendente. Só o **dono da empresa** pode chamar. 🔒 **Autenticado.**

Path params: `empresaHandle` (número), `solicitacaoHandle` (número)

Sem request body.

Resposta `204 No Content`.

Erros: `404` solicitação ou empresa não encontrada · `403` quem chama não é o dono · `409` solicitação não está mais pendente.

---

### `DELETE /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle`
Remove o vínculo de um funcionário já aceito. Só o **dono da empresa** pode chamar. 🔒 **Autenticado.**

Path params: `empresaHandle` (número), `solicitacaoHandle` (número)

Sem request body.

Resposta `204 No Content`.

Erros: `404` solicitação ou empresa não encontrada · `403` quem chama não é o dono · `409` solicitação não está aceita.

---

### `GET /api/empresas/:empresaHandle/funcionarios`
Lista todas as solicitações de funcionário da empresa (qualquer status). Só o **dono da empresa** pode chamar. 🔒 **Autenticado.**

Path params: `empresaHandle` (número)

Sem request body.

Resposta `200 OK`:
```json
[
  {
    "handle": 1,
    "keyPublica": "00000000-0000-0000-0000-000000000002",
    "nome": "Arthur",
    "sobrenome": "Souza",
    "email": "arthur@vispro.com",
    "status": "Pendente"
  }
]
```

Erros: `404` empresa não encontrada · `403` quem chama não é o dono.

---

## Valores possíveis de `status`

`"Pendente"` | `"Aceito"` | `"Negado"`
