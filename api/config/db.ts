import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['info', 'error'], // permite ver los errores del ORM, entre otros
});

