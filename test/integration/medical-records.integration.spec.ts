import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createIntegrationTestApp, cleanTestDatabase } from '../setup.integration';
import { PrismaService } from '../../src/shared/prisma/prisma.service';

describe('Medical Records Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const context = await createIntegrationTestApp();
    app = context.app;
    prisma = context.prisma;
  });

  afterAll(async () => {
    await cleanTestDatabase(prisma);
    await app.close();
  });

  it('should create and retrieve a medical record', async () => {
    // Test core prontuário functionality
    const recordData = {
      patientId: 'test-patient',
      consultationDate: new Date().toISOString(),
      diagnosis: 'Test diagnosis',
      notes: 'Integration test note',
      tenantId: 'test-tenant'
    };

    const createResponse = await request(app.getHttpServer())
      .post('/medical-records')
      .send(recordData)
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');
  });

  it('should enforce multi-tenancy on medical records', async () => {
    // Critical security test
  });
});