import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rawHost = this.configService.get<string>('REDIS_HOST');
    // Força localhost se estiver a rodar fora do docker, mas a env diz 'redis'
    const host = rawHost === 'redis' ? 'localhost' : rawHost; 
    const port = this.configService.get<number>('REDIS_PORT') || 6379;

    this.redisClient = new Redis({
      host,
      port,
      maxRetriesPerRequest: 3,
    });

    this.redisClient.on('connect', () => this.logger.log('Conectado ao Redis com sucesso.'));
    this.redisClient.on('error', (err) => this.logger.error(`Erro no Redis: ${err.message}`));
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  /**
   * Padrão Cache-Aside: Tenta buscar no Redis. Se não existir, executa a factory (banco),
   * salva no Redis com o TTL definido e retorna os dados.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    try {
      const cachedData = await this.redisClient.get(key);
      if (cachedData) {
        return JSON.parse(cachedData) as T; // Cache Hit
      }
    } catch (error) {
      this.logger.warn(`Falha ao ler cache da chave ${key}. Ignorando e indo ao banco...`);
    }

    // Cache Miss - Executa a consulta ao Prisma
    const freshData = await factory();

    try {
      if (freshData) {
        await this.redisClient.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
      }
    } catch (error) {
      this.logger.warn(`Falha ao salvar cache na chave ${key}.`);
    }

    return freshData;
  }

  /**
   * Invalida uma chave específica (Ex: quando um leito muda de status, limpamos o cache de leitos)
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Erro ao invalidar chave ${key}`);
    }
  }
}