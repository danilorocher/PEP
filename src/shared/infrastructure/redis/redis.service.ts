import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  // Salva o refresh token com tempo de expiração em segundos (7 dias = 604800 segundos)
  async setRefreshToken(userId: string, token: string, expiresInSeconds: number): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.redisClient.set(key, token, 'EX', expiresInSeconds);
  }

  // Busca o refresh token do usuário
  async getRefreshToken(userId: string): Promise<string | null> {
    const key = `refresh_token:${userId}`;
    return this.redisClient.get(key);
  }

  // Remove o refresh token (Logout)
  async deleteRefreshToken(userId: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.redisClient.del(key);
  }
}