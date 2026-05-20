import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return { app, moduleRef };
}

// Helper para limpar dados de teste
export async function cleanTestDatabase(prisma: PrismaService) {
  // Implementação básica - pode ser expandida
  console.log('🧹 Limpando banco de testes...');
}