import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/shared/prisma/prisma.service';
import { createIntegrationTestApp, cleanTestDatabase } from '../setup.integration';

describe('Pharmacy Integration', () => {
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

  it('should dispense medication with stock validation', async () => {
    const dispenseData = {
      prescriptionId: 'test-prescription-id',
      medicationId: 'test-med-id',
      quantity: 5,
      tenantId: 'test-tenant'
    };

    const response = await request(app.getHttpServer())
      .post('/pharmacy/dispense')
      .send(dispenseData)
      .set('Authorization', 'Bearer test-token')
      .expect(201);

    expect(response.body).toBeDefined();
  });

  it('should block dispensing if stock insufficient', async () => {
    // TODO: implement specific stock test
  });
});