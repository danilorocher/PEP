import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    // Extrai a URL com segurança através do ConfigService (já validada pelo Joi no AppModule)
    const connectionString = configService.get<string>('DATABASE_URL');
    
    if (!connectionString) {
      throw new Error('DATABASE_URL não configurada no ambiente.');
    }
    
    // Cria o pool de conexão do PostgreSQL
    const pool = new Pool({ connectionString });
    
    // Cria o Adapter oficial exigido pelo Prisma 7+
    const adapter = new PrismaPg(pool);

    // Repassa o adapter para a classe pai (PrismaClient)
    super();
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