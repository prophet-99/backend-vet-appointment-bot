import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '@config/env';

class PrismaClientManager {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaClientManager.instance) {
      const adapter = new PrismaPg({
        connectionString: env.DATABASE_URL,
      });
      PrismaClientManager.instance = new PrismaClient({ adapter });
    }

    return PrismaClientManager.instance;
  }
}

export const prismaClient = PrismaClientManager.getInstance();
