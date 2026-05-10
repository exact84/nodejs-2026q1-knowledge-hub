# Knowledge Hub

REST API for managing articles, categories, users, and comments.

Features:

- CRUD operations for all entities
- Pagination and sorting for list endpoints
- Filtering for selected endpoints
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting for auth endpoints
- AI endpoints for article summarize/translate/analyze
- RAG endpoints for article indexing, semantic search, and grounded chat
- Gemini integration with configurable model and API key via .env
- AI response caching with TTL and deterministic cache keys
- AI usage statistics (requests, tokens, latency)
- OpenAPI documentation available at `/doc`

## Downloading

```bash
git clone https://github.com/exact84/nodejs-2026q1-knowledge-hub
```

## Environment variables

Create a `.env` file based on `.env.example`.

Required variables:

- `PORT`
- `CRYPT_SALT`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `DATABASE_URL`
- `DOCKER_DATABASE_URL`
- `LOG_LEVEL`
- `LOG_MAX_FILE_SIZE`
- `GEMINI_API_KEY`
- `GEMINI_API_BASE_URL`
- `GEMINI_MODEL`
- `AI_RATE_LIMIT_RPM`
- `AI_CACHE_TTL_SEC`
- `GEMINI_EMBEDDING_MODEL`
- `RAG_VECTOR_DB_PROVIDER`
- `RAG_VECTOR_DB_URL`
- `RAG_VECTOR_COLLECTION`
- `RAG_CHUNK_SIZE`
- `RAG_CHUNK_OVERLAP`
- `RAG_CONVERSATION_MAX_MESSAGES`

## AI Setup (Gemini)

### 1. How to obtain Gemini API key

1. Open Google AI Studio: <https://aistudio.google.com>
2. Sign in with your Google account.
3. Open the API keys page from AI Studio.
4. Click **Create API key**.
5. Copy the generated key.

### 2. Which Gemini model is used

Default model in this project is:

- `gemini-2.0-flash`

It is configured by the `GEMINI_MODEL` environment variable.

### 3. Exact setup steps after cloning

Fill required variables in `.env`:

- `GEMINI_API_KEY`
- `GEMINI_API_BASE_URL`
- `GEMINI_MODEL`
- `AI_RATE_LIMIT_RPM`
- `AI_CACHE_TTL_SEC`

Paste your Gemini API key into:

- `GEMINI_API_KEY=<your-real-gemini-api-key>`

### 4. How to test AI endpoints

Endpoints:

- `POST /ai/articles/:articleId/summarize`
- `POST /ai/articles/:articleId/translate`
- `POST /ai/articles/:articleId/analyze`
- `POST /ai/generate`
- `GET /ai/stats`

Suggested flow:

- Create or seed article data.
- Login via `POST /auth/login` to get `accessToken`.
- Call AI endpoints from Swagger (`/doc`) using Authorize.

### 5. Known limitations

- Gemini free tier has request/token quotas and can return 429.
- Model response latency depends on prompt size and upstream load.
- Regional availability and model access can vary by account/location.
- Upstream service timeouts or temporary unavailability can occur.

## RAG Module

The project includes a Retrieval-Augmented Generation module for indexing published articles into a vector database and using them for semantic search and grounded chat.

### What the RAG module does

- indexes published articles into Qdrant
- splits article content into chunks using configurable chunk size and overlap
- generates Gemini embeddings for chunks and search queries
- supports semantic retrieval with metadata filters
- supports grounded chat over retrieved article chunks
- keeps short in-memory conversation history for chat follow-up questions

### RAG environment variables

- `GEMINI_EMBEDDING_MODEL` - Gemini embedding model used for vector generation
- `RAG_VECTOR_DB_PROVIDER` - current vector DB provider name
- `RAG_VECTOR_DB_URL` - Qdrant base URL
- `RAG_VECTOR_COLLECTION` - Qdrant collection name
- `RAG_CHUNK_SIZE` - chunk size used during indexing
- `RAG_CHUNK_OVERLAP` - overlap between adjacent chunks
- `RAG_CONVERSATION_MAX_MESSAGES` - max in-memory chat history size per conversation

### RAG endpoints

- `POST /ai/rag/index`
  Reindexes published articles into vector storage
  -> `202 Accepted`
  -> `503 Service Unavailable`

- `DELETE /ai/rag/index/articles/:articleId`
  Removes all vectors for a specific article
  -> `200 OK`
  -> `503 Service Unavailable`

- `POST /ai/rag/search`
  Performs semantic search over indexed article chunks
  Supports optional filters: `articleStatus`, `categoryId`, `tags`
  -> `201 Created`
  -> `400 Bad Request`
  -> `503 Service Unavailable`

- `POST /ai/rag/chat`
  Performs retrieval + grounded answer generation over indexed content
  Supports short conversation memory through `conversationId`
  -> `201 Created`
  -> `400 Bad Request`
  -> `503 Service Unavailable`

### How RAG works

1. `POST /ai/rag/index` loads published articles from PostgreSQL.
2. HTML content is normalized and split into chunks.
3. Each chunk is embedded with Gemini and stored in Qdrant together with metadata:
   `articleId`, `articleTitle`, `articleStatus`, `categoryId`, `tags`, `chunkIndex`, `indexedAt`.
4. `POST /ai/rag/search` embeds the query, retrieves vector candidates from Qdrant, applies hybrid ranking, and returns the most relevant chunks.
5. `POST /ai/rag/chat` retrieves relevant chunks, builds a grounded prompt, and generates an answer using Gemini.

### RAG search behavior

- vector search uses Qdrant
- metadata filters support article status, category, and tags
- hybrid ranking combines semantic similarity with lexical overlap
- AI reranking is available for search and is intentionally reduced for chat retrieval to avoid excessive Gemini quota usage

### RAG chat behavior

- chat stores short in-memory history keyed by `conversationId`
- follow-up questions can reuse recent user context for retrieval
- if Gemini generation is temporarily unavailable, chat returns a fallback answer built from retrieved sources instead of failing completely

### Running RAG with Docker Compose

`docker-compose.yml` starts a dedicated `vectordb` container based on Qdrant.

The application connects to it through:

- `RAG_VECTOR_DB_URL=http://vectordb:6333`
- `RAG_VECTOR_COLLECTION=<collection-name>`

## Installing NPM modules

```bash
npm install
```

## Running the project

```bash
docker compose up --build
```

This will automatically:

- start PostgreSQL
- apply all Prisma migrations (`prisma migrate deploy`)
- run database seed (`prisma db seed`)
- start the NestJS application

After starting the app on port `4000` by default, OpenAPI documentation will be available at:

`http://localhost:4000/doc`

You can start database container separately:

```bash
 docker compose up -d db

 npx prisma migrate reset --force
 npx prisma generate
```

After you finish working with the repository, don’t forget to stop the containers:

```bash
docker compose down -v
```

## Check database in Adminer

Start Adminer:

```bash
docker compose --profile debug up -d adminer
```

Then open:

`http://localhost:8080`

Use these credentials:

- System: `PostgreSQL`
- Server: `db`
- Username: value from `POSTGRES_USER`
- Password: value from `POSTGRES_PASSWORD`
- Database: value from `POSTGRES_DB`

## Testing

After the application is running, open a new terminal and run:

To run all tests with authorization:

```bash
npm run test
```

To run auth-specific tests:

```bash
npm run test:auth
```

To run refresh tests:

```bash
npm run test:refresh
```

To run RBAC tests:

```bash
npm run test:rbac
```

## Auto-fix and format

```bash
npm run lint
```

```bash
npm run format
```

## API Documentation

OpenAPI documentation is available at:

`http://localhost:4000/doc`

## Endpoints

### Auth

- `POST /auth/signup`
  Creates a new user with role `viewer`
  -> `201 Created`
  -> `400 Bad Request`

- `POST /auth/login`
  Authenticates user by `login` and `password`, returns `accessToken` and `refreshToken`
  -> `200 OK`
  -> `400 Bad Request`
  -> `403 Forbidden`

- `POST /auth/refresh`
  Validates refresh token and returns a new token pair
  -> `200 OK`
  -> `401 Unauthorized`
  -> `403 Forbidden`

- `POST /auth/logout`
  Invalidates the provided refresh token
  -> `200 OK`
  -> `401 Unauthorized`
  -> `403 Forbidden`

### Users (/user)

- `GET /user`
  Get all users
  -> `200 OK`

- `GET /user/:id`
  Get user by ID
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`

- `POST /user`
  Create a new user
  -> `201 Created`
  -> `400 Bad Request`

- `PUT /user/:id`
  Update user password
  -> `200 OK`
  -> `400 Bad Request`
  -> `403 Forbidden`
  -> `404 Not Found`

- `DELETE /user/:id`
  Delete user
  -> `204 No Content`
  -> `400 Bad Request`
  -> `404 Not Found`

### Articles (/article)

- `GET /article`
  Get all articles
  Supports optional query parameters: `status`, `categoryId`, `tag`
  -> `200 OK`

- `GET /article/:id`
  Get article by ID
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`

- `POST /article`
  Create a new article
  -> `201 Created`
  -> `400 Bad Request`

- `PUT /article/:id`
  Update article
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`

- `DELETE /article/:id`
  Delete article
  -> `204 No Content`
  -> `400 Bad Request`
  -> `404 Not Found`

### Categories (/category)

- `GET /category`
  Get all categories
  -> `200 OK`

- `GET /category/:id`
  Get category by ID
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`

- `POST /category`
  Create a new category
  -> `201 Created`
  -> `400 Bad Request`

- `PUT /category/:id`
  Update category
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`

- `DELETE /category/:id`
  Delete category
  -> `204 No Content`
  -> `400 Bad Request`
  -> `404 Not Found`

### Comments (/comment)

- `GET /comment?articleId={articleId}`
  Get comments for a specific article
  -> `200 OK`
  -> `400 Bad Request`

- `GET /comment/:id`
  Get comment by ID
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`

- `POST /comment`
  Create a new comment
  Required fields: `content`, `articleId`
  -> `201 Created`
  -> `400 Bad Request`
  -> `422 Unprocessable Entity`

- `PUT /comment/:id`
  Update comment
  -> `200 OK`
  -> `400 Bad Request`
  -> `404 Not Found`
  -> `422 Unprocessable Entity`

- `DELETE /comment/:id`
  Delete comment
  -> `204 No Content`
  -> `400 Bad Request`
  -> `404 Not Found`

## Pagination and Sorting

All list endpoints support pagination and sorting via query parameters.

### Pagination

- `page` - page number (default: `1`)
- `limit` - number of items per page (default: `10`)

Example:

```http
GET /article?page=1&limit=10
```

Response:

```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "data": []
}
```

### Sorting

- `sortBy` - field to sort by
- `order` - `asc` or `desc`

Example:

```http
GET /article?sortBy=createdAt&order=desc
```

## Filtering

Some endpoints support filtering.

Examples:

```http
GET /article?status=published
```

```http
GET /article?categoryId=<uuid>
```

```http
GET /article?tag=nodejs
```

## Security

- Passwords are hashed with `bcryptjs` using `CRYPT_SALT` from `.env`
- Access token payload contains `userId`, `login`, and `role`
- Refresh tokens are used to obtain a new token pair
- Logout invalidates refresh tokens
- Authentication is required for all routes except `/`, `/doc`, `/auth/signup`, `/auth/login`, and `/auth/refresh`
- RBAC is implemented for `viewer`, `editor`, and `admin`
- Rate limiting is enabled for `/auth/signup` and `/auth/login`

## Tech Stack

- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- class-validator
- Swagger (OpenAPI)

## Docker

### Run with Docker Compose

```bash
docker compose up --build
```

The application will be available at:

- API: `http://localhost:4000`
- Adminer (debug profile only): `http://localhost:8080`

To run Adminer as well:

```bash
docker compose --profile debug up --build
```

### Docker Hub image

<https://hub.docker.com/r/exact84/knowledge-hub-api> - only for task 06a

## Security scan

Security scan was performed using Docker Scout for the final application image.

Result:

- Critical vulnerabilities: `0`
- High vulnerabilities: present in base image packages (`tar`, `minimatch`, `picomatch`)

Notes:

- Reported vulnerabilities are inherited from the official Node.js image and npm toolchain
- They are not introduced by the application code
- No critical vulnerabilities were detected
