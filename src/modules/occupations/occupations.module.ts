import { Module } from '@nestjs/common';
import { OccupationsService } from './occupations.service';
import { OccupationsController } from './occupations.controller';

@Module({
  controllers: [OccupationsController],
  providers: [OccupationsService],
  exports: [OccupationsService],
})
export class OccupationsModule {}