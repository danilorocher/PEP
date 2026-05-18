import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/shared/prisma/prisma.service';
import { createIntegrationTestApp, cleanTestDatabase } from '../setup.integration';

describe('Hospitalizations Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { app: testApp, prisma: testPrisma } = await createIntegrationTestApp();
    app = testApp;
    prisma = testPrisma;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanTestDatabase(prisma);
  });

  it('should create a hospitalization successfully', async () => {
    const hospitalizationData = {
      patientId: 'test-patient-id',
      admissionDate: new Date().toISOString(),
      reason: 'Suspeita de pneumonia',
      status: 'ACTIVE'
    };

    const response = await request(app.getHttpServer())
      .post('/hospitalizations')
      .send(hospitalizationData)
      .set('Authorization', 'Bearer test-token')
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });

  it('should validate required fields', async () => {
    const invalidData = {};
    await request(app.getHttpServer())
      .post('/hospitalizations')
      .send(invalidData)
      .expect(400);
  });
});