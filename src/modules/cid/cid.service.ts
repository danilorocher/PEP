import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CidService {
  private readonly logger = new Logger(CidService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 🔥 MOTOR DE SINCRONIZAÇÃO EM MASSA (Suporte Nativo a FHIR/DATASUS)
  async syncDatabase() {
    this.logger.log('Iniciando sincronização da Base de Dados CID-10...');
    
    try {
      const filePath = path.join(process.cwd(), 'prisma', 'seeds', 'cid10.json');

      if (!fs.existsSync(filePath)) {
        this.logger.error(`Arquivo não encontrado no caminho: ${filePath}`);
        throw new InternalServerErrorException('Arquivo cid10.json não foi encontrado no servidor.');
      }

      const rawData = fs.readFileSync(filePath, 'utf-8');
      const parsedData = JSON.parse(rawData);
      
      let cidDatabase = [];

      // 🧠 INTELIGÊNCIA: Deteta se é o arquivo oficial FHIR do DATASUS
      if (parsedData.resourceType === 'CodeSystem' && Array.isArray(parsedData.concept)) {
        this.logger.log('Formato FHIR/DATASUS detetado. Traduzindo payload...');
        
        cidDatabase = parsedData.concept.map((item: any) => ({
          codigo: item.code,
          descricao: item.display,
          // Como o JSON base do DATASUS não traz a coluna capítulo, garantimos que não dá erro
          capitulo: null, 
          grupo: null 
        }));
      } 
      // Fallback: Se for a nossa matriz simples de testes
      else if (Array.isArray(parsedData)) {
        cidDatabase = parsedData;
      } else {
        throw new Error('Formato de arquivo JSON não reconhecido.');
      }

      this.logger.log(`Traduzidos ${cidDatabase.length} registros. Iniciando injeção no PostgreSQL...`);

      // Injeção Massiva (Upsert)
      const result = await this.prisma.cid10.createMany({
        data: cidDatabase,
        skipDuplicates: true, 
      });

      this.logger.log(`Sincronização concluída com sucesso. ${result.count} novos CIDs inseridos.`);
      return { success: true, message: `${result.count} registros sincronizados com sucesso na base de dados.` };
      
    } catch (error) {
      this.logger.error('Falha ao sincronizar CID-10', error);
      throw new InternalServerErrorException('Falha crítica ao ler o arquivo ou gravar na base de dados.');
    }
  }

  // PESQUISA OTIMIZADA PARA O BANCO DE DADOS
  async findAll(search: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = search ? {
      OR: [
        { codigo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [data, total] = await Promise.all([
      this.prisma.cid10.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.cid10.count({ where: whereClause })
    ]);

    return { data, total, page, limit };
  }
}