import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Tipamos a aplicação como NestExpressApplication para acessar as configurações de baixo nível do Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- SEGURANÇA: Configuração de Trust Proxy ---
  // Fundamental para o Rate Limiting funcionar corretamente atrás de Load Balancers (AWS, Cloudflare, Nginx).
  // Garante que o `req.ip` leia o IP real do cliente via header X-Forwarded-For, evitando bloqueio de usuários legítimos.
  app.set('trust proxy', 1);

  // Validação Global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('PEP+ - Prontuário Eletrônico de Pacientes')
    .setDescription('API robusta para gestão hospitalar e clínica SaaS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/api/docs`);
}
bootstrap();