import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ArticleStatus, UserRole } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const [usersCount, categoriesCount, articlesCount, commentsCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.article.count(),
      prisma.comment.count(),
    ]);

  const isEmptyDatabase =
    usersCount === 0 &&
    categoriesCount === 0 &&
    articlesCount === 0 &&
    commentsCount === 0;

  if (!isEmptyDatabase) {
    console.log('Database is not empty. Skipping seed.');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      password: 'admin123',
      role: UserRole.admin,
    },
  });

  const editor = await prisma.user.create({
    data: {
      login: 'editor',
      password: 'editor123',
      role: UserRole.editor,
    },
  });

  const techCategory = await prisma.category.create({
    data: {
      name: 'Tech',
      description: 'Technology articles',
    },
  });

  const scienceCategory = await prisma.category.create({
    data: {
      name: 'Science',
      description: 'Science articles',
    },
  });

  const lifestyleCategory = await prisma.category.create({
    data: {
      name: 'Lifestyle',
      description: 'Lifestyle articles',
    },
  });

  const nestTag = await prisma.tag.create({
    data: { name: 'nestjs' },
  });

  const prismaTag = await prisma.tag.create({
    data: { name: 'prisma' },
  });

  const dockerTag = await prisma.tag.create({
    data: { name: 'docker' },
  });

  const apiTag = await prisma.tag.create({
    data: { name: 'api' },
  });

  const backendTag = await prisma.tag.create({
    data: { name: 'backend' },
  });

  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with NestJS',
      content: `
NestJS is a progressive Node.js framework for building efficient and scalable server-side applications. 
It is built with TypeScript and combines concepts from object-oriented programming, functional programming, 
and reactive programming.

NestJS uses decorators extensively to define modules, controllers, services, and middleware. 
A module is a class annotated with the @Module decorator and serves as the main organizational unit 
of the application.

Controllers are responsible for handling incoming HTTP requests and returning responses to the client. 
Services contain reusable business logic and are typically injected into controllers using NestJS dependency injection.

One of the main advantages of NestJS is its modular architecture. Applications can be split into feature modules, 
making large backend systems easier to maintain and scale.

NestJS also integrates well with databases such as PostgreSQL and MongoDB through ORMs like Prisma and TypeORM. 
It supports REST APIs, GraphQL, WebSockets, and microservice architectures out of the box.

Because NestJS relies heavily on TypeScript metadata and decorators, it provides a clean and structured development experience 
for backend engineers building enterprise-grade APIs.
`,
      status: ArticleStatus.draft,
      authorId: admin.id,
      categoryId: techCategory.id,
      tags: {
        connect: [{ id: nestTag.id }, { id: backendTag.id }],
      },
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'Prisma with PostgreSQL',
      content: `
Prisma is a modern TypeScript ORM that simplifies database access in Node.js applications. 
It provides type-safe queries, schema migrations, and auto-generated database clients.

When using Prisma with PostgreSQL, developers define database models in the Prisma schema file. 
After running migrations, Prisma generates a strongly typed client that can be used inside services and repositories.

Prisma supports common database operations such as create, update, delete, filtering, pagination, and transactions. 
Its type safety significantly reduces runtime errors caused by invalid queries or missing fields.

A common backend architecture combines NestJS, Prisma, and PostgreSQL. 
In this setup, PrismaService is usually registered as a singleton provider and injected into application services.

Prisma migrations help synchronize application models with the PostgreSQL database schema. 
Developers can version-control migration files and apply them consistently across local, staging, and production environments.

Prisma also supports relational queries, eager loading, raw SQL execution, and connection pooling strategies 
for high-performance backend systems.
`,
      status: ArticleStatus.published,
      authorId: admin.id,
      categoryId: techCategory.id,
      tags: {
        connect: [{ id: prismaTag.id }, { id: apiTag.id }],
      },
    },
  });

  const article3 = await prisma.article.create({
    data: {
      title: 'Docker for Backend Developers',
      content: `
Docker is a containerization platform that allows backend developers to package applications together 
with their runtime environment and dependencies.

Containers help ensure consistency between local development, testing, and production deployments. 
A backend application running inside Docker behaves the same way regardless of the host operating system.

A typical backend Docker setup includes:
- application container
- PostgreSQL database container
- Redis container
- reverse proxy or API gateway

Docker Compose simplifies orchestration of multiple containers in local environments. 
Developers can define services, networks, environment variables, volumes, and health checks in a docker-compose.yml file.

Using Docker in backend projects improves onboarding speed because new developers can start the entire environment 
with a single command.

Docker volumes are commonly used to persist PostgreSQL and vector database data between container restarts. 
Health checks help ensure that dependent services only start after databases become available.

Containerized backend systems are also easier to deploy in Kubernetes and cloud-native infrastructure environments.
`,
      status: ArticleStatus.published,
      authorId: editor.id,
      categoryId: techCategory.id,
      tags: {
        connect: [{ id: dockerTag.id }, { id: backendTag.id }],
      },
    },
  });

  const article4 = await prisma.article.create({
    data: {
      title: 'Recent Science Discoveries and Innovations',
      content: `
Scientific research continues to advance rapidly across fields such as medicine, space exploration, artificial intelligence, 
and renewable energy. Researchers around the world are developing new technologies that improve healthcare, communication, 
transportation, and environmental sustainability.

One major area of progress is biotechnology. Scientists are using gene-editing tools such as CRISPR to study genetic diseases 
and develop targeted treatments. Personalized medicine is becoming more common as researchers analyze DNA data to create therapies 
tailored to individual patients.

Space exploration has also accelerated in recent years. Private aerospace companies and government agencies are launching missions 
to the Moon and Mars while deploying advanced satellites for scientific observation and global communication. 
Modern telescopes allow astronomers to study distant galaxies and exoplanets with unprecedented precision.

Artificial intelligence is transforming scientific research itself. Machine learning models can process massive datasets, 
identify patterns, and assist researchers in areas such as climate modeling, drug discovery, and particle physics.

Renewable energy technologies continue to evolve as countries seek to reduce carbon emissions. Advances in battery storage, 
solar panels, and wind turbine efficiency are helping accelerate the transition toward sustainable energy systems.

Scientists also emphasize the importance of international collaboration. Large-scale research projects often involve universities, 
private companies, and government organizations working together to solve complex global challenges.
`,
      status: ArticleStatus.published,
      authorId: editor.id,
      categoryId: scienceCategory.id,
      tags: {
        connect: [{ id: apiTag.id }],
      },
    },
  });

  const article5 = await prisma.article.create({
    data: {
      title: 'Healthy Daily Habits for Better Productivity',
      content: `
Healthy daily habits can significantly improve physical health, mental well-being, and long-term productivity. 
Many experts recommend building small but consistent routines rather than relying on short-term motivation.

Regular sleep is one of the most important factors affecting concentration and energy levels. 
Adults are generally encouraged to maintain a consistent sleep schedule and aim for seven to eight hours of sleep per night.

Physical activity also plays a major role in maintaining health. Simple activities such as walking, stretching, 
or short exercise sessions can improve cardiovascular health, reduce stress, and increase focus during work or study.

Nutrition is equally important. Balanced meals that include vegetables, protein, whole grains, and adequate hydration 
help support cognitive performance and stable energy throughout the day.

Time management habits can improve productivity and reduce burnout. Techniques such as task prioritization, 
calendar planning, and focused work intervals are commonly used in professional environments.

Mental health should not be ignored. Many people benefit from mindfulness practices, regular breaks, social interaction, 
and limiting excessive screen time during non-working hours.

Developing healthy routines requires consistency over time. Small improvements repeated daily often produce better long-term 
results than drastic lifestyle changes that are difficult to maintain.
`,
      status: ArticleStatus.published,
      authorId: admin.id,
      categoryId: lifestyleCategory.id,
      tags: {
        connect: [{ id: backendTag.id }],
      },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Very useful article.',
      authorId: editor.id,
      articleId: article1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thanks, this helped me a lot.',
      authorId: admin.id,
      articleId: article2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Clear explanation.',
      authorId: editor.id,
      articleId: article3.id,
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
