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
      content: 'Introduction to NestJS basics.',
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
      content: 'How to use Prisma with PostgreSQL.',
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
      content: 'Using Docker in backend development.',
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
      title: 'Science News Overview',
      content: 'Recent science news and discoveries.',
      status: ArticleStatus.archived,
      authorId: editor.id,
      categoryId: scienceCategory.id,
      tags: {
        connect: [{ id: apiTag.id }],
      },
    },
  });

  const article5 = await prisma.article.create({
    data: {
      title: 'Healthy Daily Habits',
      content: 'Simple habits for a healthier life.',
      status: ArticleStatus.draft,
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
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
  