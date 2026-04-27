import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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