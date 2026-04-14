# Knowledge Hub

REST API for managing articles, categories, users, and comments.

Features:

- CRUD operations for all entities
- Pagination and sorting for list endpoints
- Filtering for selected endpoints
- OpenAPI documentation available at /doc

## Downloading

```
git clone https://github.com/exact84/nodejs-2026q1-knowledge-hub
```

### Environment variables

Create a .env file based on .env.example.

Required database variables:

PORT
POSTGRES_USER  
POSTGRES_PASSWORD  
POSTGRES_DB  
POSTGRES_HOST  
POSTGRES_PORT  
DATABASE_URL
DOCKER_DATABASE_URL

## Installing NPM modules

```
npm install
```

## Running the Project

```
docker compose up --build
```

This will automatically:

- start PostgreSQL
- apply all Prisma migrations (prisma migrate deploy)
- run database seed (prisma db seed)
- start the NestJS application

After starting the app on port (4000 as default) you can open
in your browser OpenAPI documentation by typing http://localhost:4000/doc/

## Check database in Adminer

Start Adminer:

```
docker compose --profile debug up -d adminer
```

Then open:

http://localhost:8080

Use these credentials:

System: PostgreSQL  
Server: db  
Username: value from POSTGRES_USER  
Password: value from POSTGRES_PASSWORD  
Database: value from POSTGRES_DB

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

## API Documentation

OpenAPI documentation is available at:

http://localhost:3000/doc

## Endpoints

### Users (/user)

- GET /user -
  Get all users  
  → 200 OK

- GET /user/:id -
  Get user by ID  
  → 200 OK  
  → 400 Bad Request (invalid UUID)  
  → 404 Not Found

- POST /user -
  Create a new user  
  → 201 Created  
  → 400 Bad Request

- PUT /user/:id -
  Update user password  
  → 200 OK  
  → 400 Bad Request  
  → 403 Forbidden (incorrect old password)  
  → 404 Not Found

- DELETE /user/:id -
  Delete user  
  → 204 No Content  
  → 400 Bad Request  
  → 404 Not Found

### Articles (/article)

- GET /article -
  Get all articles  
  Supports optional query parameters: status, categoryId, tag  
  → 200 OK

- GET /article/:id -
  Get article by ID  
  → 200 OK  
  → 400 Bad Request  
  → 404 Not Found

- POST /article -
  Create a new article  
  → 201 Created  
  → 400 Bad Request

- PUT /article/:id -
  Update article  
  → 200 OK  
  → 400 Bad Request  
  → 404 Not Found

- DELETE /article/:id -
  Delete article  
  → 204 No Content  
  → 400 Bad Request  
  → 404 Not Found

### Categories (/category)

- GET /category -
  Get all categories  
  → 200

- GET /category/:id -
  Get category by ID  
  → 200 OK  
  → 400 Bad Request  
  → 404 Not Found

- POST /category -
  Create a new category  
  → 201 Created  
  → 400 Bad Request

- PUT /category/:id -
  Update category  
  → 200 OK  
  → 400 Bad Request  
  → 404 Not Found

- DELETE /category/:id -
  Delete category  
  → 204 No Content  
  → 400 Bad Request  
  → 404 Not Found

### Comments (/comment)

- GET /comment?articleId={articleId} -
  Get comments for a specific article  
  → 200 OK  
  → 400 Bad Request (missing articleId)

- POST /comment -
  Create a new comment  
  Required fields: content, articleId  
  → 201 Created  
  → 400 Bad Request  
  → 422 Unprocessable Entity (article does not exist)

- DELETE /comment/:id -
  Delete comment  
  → 204 No Content  
  → 400 Bad Request  
  → 404 Not Found

## Pagination and Sorting

All list endpoints support pagination and sorting via query parameters.

### Pagination

- `page` — page number (default: 1)
- `limit` — number of items per page (default: 10)

Example:

```http
GET /articles?page=1&limit=10
```

Response:

```
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "data": [...]
}
```

### Sorting

sortBy — field to sort by  
order — asc or desc

Example:

```
GET /articles?sortBy=createdAt&order=desc
```

## Filtering

Some endpoints support filtering.

Example:

```http
GET /articles?status=published
```

## Tech Stack

- Node.js
- NestJS
- TypeScript
- class-validator
- Swagger (OpenAPI)

## Docker

### Run with Docker Compose

```bash
docker compose up --build
```

The application will be available at:

API: http://localhost:4000

Adminer (debug profile only): http://localhost:8080

To run Adminer as well:

```bash
docker compose --profile debug up --build
```

### Docker Hub image

https://hub.docker.com/r/exact84/knowledge-hub-api - only for task 06a

## Security scan

Security scan was performed using Docker Scout for the final application image.

Result:

- Critical vulnerabilities: 0
- High vulnerabilities: present in base image packages (`tar`, `minimatch`, `picomatch`)

Notes:

- Reported vulnerabilities are inherited from the official Node.js image and npm toolchain
- They are not introduced by the application code
- No critical vulnerabilities were detected
