import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// 🔥 NOVA IMPORTAÇÃO: Filtro Global de Exceções
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- CORS DINÂMICO BASEADO EM VARIÁVEL DE AMBIENTE ---
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3001', 'http://127.0.0.1:3001'];
  
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-tenant-subdomain'],
  });

  // --- SEGURANÇA: Configuração de Trust Proxy ---
  app.set('trust proxy', 1);

  // Validação Global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 🔥 REGISTRO DO FILTRO GLOBAL: Padronização de erros profissional
  // Colocamos aqui para que ele capture todos os erros da aplicação
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('PEP+ - Prontuário Eletrônico de Pacientes')
    .setDescription('API robusta para gestão hospitalar e clínica SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Escutando na porta 3000 em todas as interfaces (0.0.0.0)
  await app.listen(3000, '0.0.0.0');
  
  console.log(`🚀 Backend rodando em: http://localhost:3000`);
  console.log(`📝 Documentação: http://localhost:3000/api/docs`);
}
bootstrap();