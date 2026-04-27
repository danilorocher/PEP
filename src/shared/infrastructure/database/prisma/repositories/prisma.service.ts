import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Captura a URL do banco a partir das variáveis de ambiente
    const connectionString = process.env.DATABASE_URL;
    
    // Cria o pool de conexão do PostgreSQL
    const pool = new Pool({ connectionString });
    
    // Cria o Adapter oficial exigido pelo Prisma 7+
    const adapter = new PrismaPg(pool);

    // Repassa o adapter para a classe pai (PrismaClient)
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}