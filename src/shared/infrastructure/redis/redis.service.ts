import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
 
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
 
  constructor(private readonly configService: ConfigService) {}
 
  onModuleInit() {
    const rawHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    // Força localhost se a variável ainda estiver vindo como 'redis' do .env ou cache
    const host = rawHost === 'redis' ? 'localhost' : rawHost;
    const port = this.configService.get<number>('REDIS_PORT') || 6379;

    this.redisClient = new Redis({
      host: host,
      port: port,
      // Adiciona uma tentativa de reconexão automática para não travar o log
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      }
    });

    this.redisClient.on('error', (err) => {
      // Apenas loga o erro sem derrubar a aplicação
      console.error('⚠️ Erro de Conexão no Redis:', err.message);
    });
  }
 
  onModuleDestroy() {
    this.redisClient.disconnect();
  }
 
  // ─── Métodos genéricos (usados por Reports e outros módulos) ───
 
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
 
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }
 
  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
 
  // ─── Refresh Tokens ────────────────────────────────────────────
 
  async setRefreshToken(userId: string, token: string, expiresInSeconds: number): Promise<void> {
    await this.set(`refresh_token:${userId}`, token, expiresInSeconds);
  }
 
  async getRefreshToken(userId: string): Promise<string | null> {
    return this.get(`refresh_token:${userId}`);
  }
 
  async deleteRefreshToken(userId: string): Promise<void> {
    await this.delete(`refresh_token:${userId}`);
  }
}