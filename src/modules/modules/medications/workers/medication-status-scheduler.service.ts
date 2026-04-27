import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MedicationStatusSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(MedicationStatusSchedulerService.name);

  constructor(@InjectQueue('medication-status') private readonly medicationQueue: Queue) {}

  async onModuleInit() {
    const repeatableJobs = await this.medicationQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.medicationQueue.removeRepeatableByKey(job.key);
    }

    await this.medicationQueue.add(
      'check-overdue',
      {},
      {
        repeat: {
          pattern: '*/15 * * * *',
        },
      },
    );

    this.logger.log('Job de verificação de medicações agendado para rodar a cada 15 minutos via BullMQ.');
  }
}