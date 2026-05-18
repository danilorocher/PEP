import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

export interface IntegrationTestContext {
  app: INestApplication;
  moduleRef: TestingModule;
  prisma: PrismaService;
}

export async function createIntegrationTestApp(): Promise<IntegrationTestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  
  // Apply global configurations that exist in main.ts
  // app.useGlobalPipes(new ValidationPipe()); // uncomment if needed
  
  await app.init();

  const prisma = moduleRef.get(PrismaService);

  return { app, moduleRef, prisma };
}

export async function cleanTestDatabase(prisma: PrismaService) {
  // Careful cleanup - only in test environment
  const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
  
  for (const model of models) {
    try {
      await (prisma as any)[model].deleteMany({});
    } catch (e) {
      // Ignore tables without deleteMany or view
    }
  }
}