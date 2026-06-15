import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'vitecomm',
  password: 'ViteComm@2026!',
  database: 'vitecomm',
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
