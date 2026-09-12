import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private client?: PrismaClient;

  get db(): PrismaClient {
    if (!this.client) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString)
        throw new ServiceUnavailableException('Database is not configured');
      const schema =
        new URL(connectionString).searchParams.get('schema') ?? 'public';
      this.client = new PrismaClient({
        adapter: new PrismaPg({ connectionString }, { schema }),
      });
    }
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }
}
