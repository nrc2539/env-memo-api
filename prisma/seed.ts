import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Start seeding...');
  const hashedPassword =
    '$2b$10$8CtHuB0kWzm7TY6egL.RrucCJs79zq9oEqw15LuqIHOxhHObtbXNq';

  const user = await prisma.user.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: {
      email: 'admin@email.com',
      name: 'Admin',
      password: hashedPassword,
    },
  });

  console.log('Seeded user:', user.email);

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@email.com' },
    update: {},
    create: {
      email: 'editor@email.com',
      name: 'Editor',
      password: hashedPassword,
    },
  });

  console.log('Seeded user:', editorUser.email);

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@email.com' },
    update: {},
    create: {
      email: 'viewer@email.com',
      name: 'Viewer',
      password: hashedPassword,
    },
  });

  console.log('Seeded user:', viewerUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
