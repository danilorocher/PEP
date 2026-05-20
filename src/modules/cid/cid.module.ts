import { Module } from '@nestjs/common';
import { CidController } from './cid.controller';
import { CidService } from './cid.service';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CidController],
  providers: [CidService],
})
export class CidModule {}