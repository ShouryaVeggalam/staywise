import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Aiven uses a self-signed cert; accept it for managed MySQL
  if (url.includes('ssl-mode=REQUIRED') && !url.includes('sslaccept=')) {
    return url.includes('?') ? `${url}&sslaccept=accept_invalid_certs` : `${url}?sslaccept=accept_invalid_certs`;
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
