# tc_fase02

Este é o segundo Tech Challenge onde será criado um plataforma para cadastro  e
busca de posts.

### Tecnologias utilizadas

- Node 24
- Postgres 18
- express 5
- Swagger
- nginx

### Urls do projeto:

- Aplicação: http://localhost:3030
- Produção: https://teste.diogooliveira.dev.br

### Iniciando o projeto

1. Clone o repositório

```bash
git clone git@github.com:diogobest/tc_fase02.git
```

2. Build o projeto

```bash
docker compose build
```

3. Inicie o projeto

```bash
docker compose up -d
```

3.1. Outra forma de iniciar o projeto seria, caso queira utilizar o console

```bash
docker compose run --rm --service-ports web bash
```

4. Inicializando o banco de dados:

- Pegue o ip do container do postgres

```bash

docker inspect <container_id> | grep "IPAddress"
```

Para criar a tabela `posts` com alguns dados inseridos no banco de dados, execute o seguinte comando:

```bash
psql -h <container_ip> -U postgres -d tc_db_dev -f db/create-posts-table.sql
```

4.1. Se preferir, pode executar o seguinte script para criar os bancos de
desenvolvimento e testes:

```bash
psql -h <container_ip> -U postgres -f db/create-databases.sql
```

5. Executando os testes

```bash
docker compose run --rm web npm run test
```

### Acessando a aplicação

A aplicação estará disponível em `http://localhost:3030`.


### ENV vars

Copie o arquivo .env.example para .env e preencha as variáveis de ambiente.

POSTGRES_USER -> O nome do usuário que foi criado no postgres, em
desenvolvimento é `postgres`
POSTGRES_PASSWORD -> A senha do usuário do postgres, em desenvolvimento é
`postgres`
POSTGRES_DB -> O nome do banco de dados, em desenvolvimento é `postgres`


### Testando a aplicação

Para rodar os testes, utilize o comando:

```bash
npm run test
```

Para ver a cobertura de testes:

```bash
npm run coverage
```

### Testando a aplicação com o curl

-> GET /posts - Lista de Posts:
Este endpoint permitirá aos alunos visualizarem uma lista de todos os posts disponíveis na página principal.

```bash

curl http://localhost:3030/posts \
  -H "Content-Type: application/json"
```


-> GET /posts/:id - Leitura de Posts:
Ao acessar este endpoint com um ID específico de post, os alunos poderão ler o conteúdo completo desse post.

```bash
curl http://localhost:3030/posts/1 \
  -H "Content-Type: application/json"
```

-> POST /posts - Criação de Postagens:
Permite que docentes criem novas postagens. Este endpoint aceitará dados como título, conteúdo e autor no corpo da requisição.

```bash
curl http://localhost:3030/posts \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título do Post",
    "content": "Conteúdo do Post",
    "author": "Nome do Autor"
  }'
```


-> PUT /posts/:id - Edição de Postagens:
Usado para editar uma postagem existente. Professores deverão fornecer o ID do post que desejam editar e os novos dados no corpo da requisição.

```bash
curl http://localhost:3030/posts/1 \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título do Post Atualizado",
    "content": "Conteúdo do Post Atualizado",
    "author": "Nome do Autor Atualizado"
  }'
```


-> GET /posts - Listagem de Todas as Postagens:
Este endpoint permitirá que professores vejam todas as postagens criadas, facilitando a gestão do conteúdo.

```bash
curl http://localhost:3030/posts?type=all \
  -H "Content-Type: application/json"
```

-> DELETE /posts/:id - Exclusão de Postagens:
Permite que docentes excluam uma postagem específica, usando o ID do post como parâmetro.

```bash
curl http://localhost:3030/posts/1 \
  -X DELETE \
  -H "Content-Type: application/json"
```

-> GET /posts/search - Busca de Posts:

Este endpoint permitirá a busca de posts por palavraschave. Os usuários poderão passar uma query string com o
termo de busca e o sistema retornará uma lista de posts que contêm esse termo no título ou conteúdo.

```bash
curl http://localhost:3030/posts/search?q=termo-de-busca \
  -H "Content-Type: application/json"
```

### Swagger

Todas as rotas estão documentadas no swagger, para acessar a documentação, basta
acessar `http://localhost:3030/swagger`

### Scripts

- `npm start` - Inicia a aplicação na porta 3030, caso queira alterar essa
  porta, edite o script dentro da pasta bin/www
