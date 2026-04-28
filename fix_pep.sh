#!/bin/bash
# =============================================================================
# fix_pep.sh — Script de correção automática do projeto PEP+
# Execute na RAIZ do projeto: bash fix_pep.sh
# =============================================================================
 
set -e
 
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
 
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
 
# Verificar se está na raiz do projeto
[ -f "package.json" ] && grep -q "nestjs" package.json || err "Execute este script na raiz do projeto PEP+"
 
echo ""
echo "============================================================"
echo "  PEP+ — Aplicando correções de compilação"
echo "============================================================"
echo ""
 
# =============================================================================
# CORREÇÃO 1: PrismaModule — import do PrismaService no caminho errado
# =============================================================================
cat > src/shared/infrastructure/database/prisma.module.ts << 'EOF'
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/repositories/prisma.service';
 
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
EOF
ok "1/12 — PrismaModule: import do PrismaService corrigido"
 
# =============================================================================
# CORREÇÃO 2: DoctorsController — import do DoctorsUseCases no caminho errado
# =============================================================================
cat > src/modules/doctors/doctors.controller.ts << 'EOF'
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { DoctorsUseCases } from '../../shared/application/use-cases/users/doctors/doctors.use-cases';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import type { TenantRequest } from '../../common/middlewares/tenant.middleware';
 
@ApiTags('Doctors (Médicos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsUseCases: DoctorsUseCases) {}
 
  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createDoctorDto: CreateDoctorDto, @Req() req: TenantRequest) {
    return this.doctorsUseCases.create(req.tenant.id, createDoctorDto);
  }
 
  @Get()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(
    @Req() req: TenantRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('specialtyId') specialtyId: string,
    @Query('status') status: string,
  ) {
    return this.doctorsUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10, specialtyId, status);
  }
 
  @Get(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.doctorsUseCases.findOne(id, req.tenant.id);
  }
 
  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto, @Req() req: TenantRequest) {
    return this.doctorsUseCases.update(id, req.tenant.id, updateDoctorDto);
  }
 
  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.doctorsUseCases.remove(id, req.tenant.id);
  }
}
EOF
ok "2/12 — DoctorsController: import do DoctorsUseCases corrigido"
 
# =============================================================================
# CORREÇÃO 3: NursesController — import do NursesUseCases no caminho errado
# =============================================================================
cat > src/modules/nurses/nurses.controller.ts << 'EOF'
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { NursesUseCases } from '../../shared/application/use-cases/users/nurses/nurses.use-cases';
import { CreateNurseDto, UpdateNurseDto } from './dto/nurse.dto';
import type { TenantRequest } from '../../common/middlewares/tenant.middleware';
 
@ApiTags('Nurses (Enfermeiros)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('nurses')
export class NursesController {
  constructor(private readonly nursesUseCases: NursesUseCases) {}
 
  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createNurseDto: CreateNurseDto, @Req() req: TenantRequest) {
    const requesterRole = (req as any).user.role;
    return this.nursesUseCases.create(req.tenant.id, createNurseDto, requesterRole);
  }
 
  @Get()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(@Req() req: TenantRequest, @Query('page') page: string, @Query('limit') limit: string) {
    return this.nursesUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10);
  }
 
  @Get(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.nursesUseCases.findOne(id, req.tenant.id);
  }
 
  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateNurseDto: UpdateNurseDto, @Req() req: TenantRequest) {
    const requesterRole = (req as any).user.role;
    return this.nursesUseCases.update(id, req.tenant.id, updateNurseDto, requesterRole);
  }
 
  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.nursesUseCases.remove(id, req.tenant.id);
  }
}
EOF
ok "3/12 — NursesController: import do NursesUseCases corrigido"
 
# =============================================================================
# CORREÇÃO 4: JwtStrategy — tipo do secretOrKey corrigido
# =============================================================================
cat > src/modules/auth/jwt.strategy.ts << 'EOF'
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }
 
  async validate(payload: any) {
    if (!payload || !payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido ou incompleto.');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
EOF
ok "4/12 — JwtStrategy: tipo do secretOrKey corrigido"
 
# =============================================================================
# CORREÇÃO 5: RedisService — adicionar métodos genéricos get/set/delete
# =============================================================================
cat > src/shared/infrastructure/redis/redis.service.ts << 'EOF'
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
EOF
ok "5/12 — RedisService: métodos genéricos get/set/delete adicionados"
 
# =============================================================================
# CORREÇÃO 6: tsconfig.build.json — excluir pasta frontend do build do backend
# =============================================================================
cat > tsconfig.build.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts", "frontend"]
}
EOF
ok "6/12 — tsconfig.build.json: pasta frontend excluída do build do NestJS"
 
# =============================================================================
# CORREÇÃO 7: hospitalizations.module.ts — remover do lugar errado e recriar no correto
# =============================================================================
# Remover o arquivo do lugar errado (use-cases/ não é lugar de módulo NestJS)
rm -f src/shared/application/use-cases/hospitalizations/hospitalizations.module.ts
 
# Recriar no lugar correto com paths corretos
cat > src/modules/hospitalizations/hospitalizations.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { HospitalizationsController } from './hospitalizations.controller';
import { HospitalizationsUseCases } from '../../shared/application/use-cases/hospitalizations/hospitalizations.use-cases';
import { HOSPITALIZATION_REPOSITORY_TOKEN } from '../../shared/domain/repositories/hospitalization.repository.interface';
import { PrismaHospitalizationRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-hospitalization.repository';
import { BED_REPOSITORY_TOKEN } from '../../shared/domain/repositories/bed.repository.interface';
import { PrismaBedRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-bed.repository';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';
 
@Module({
  controllers: [HospitalizationsController],
  providers: [
    HospitalizationsUseCases,
    { provide: HOSPITALIZATION_REPOSITORY_TOKEN, useClass: PrismaHospitalizationRepository },
    { provide: BED_REPOSITORY_TOKEN, useClass: PrismaBedRepository },
    { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useClass: PrismaMedicalRecordRepository },
  ],
  exports: [HospitalizationsUseCases],
})
export class HospitalizationsModule {}
EOF
ok "7/12 — HospitalizationsModule: movido para src/modules/hospitalizations/ com paths corretos"
 
# =============================================================================
# CORREÇÃO 8: prisma-prescription.repository.ts — renomear arquivo
# =============================================================================
if [ -f "src/shared/infrastructure/database/prisma/repositories/prescription.repository.ts" ]; then
  cp src/shared/infrastructure/database/prisma/repositories/prescription.repository.ts \
     src/shared/infrastructure/database/prisma/repositories/prisma-prescription.repository.ts
  ok "8/12 — prisma-prescription.repository.ts: arquivo criado com nome correto"
else
  warn "8/12 — prescription.repository.ts não encontrado (pode já estar com o nome certo)"
fi
 
# =============================================================================
# CORREÇÃO 9: doctors.use-cases.ts — corrigir imports relativos
# =============================================================================
sed -i "s|from '../../../domain/repositories/doctor.repository.interface'|from '../../../../domain/repositories/doctor.repository.interface'|g" \
  src/shared/application/use-cases/users/doctors/doctors.use-cases.ts 2>/dev/null || true
 
sed -i "s|from '../../../domain/entities/doctor.entity'|from '../../../../domain/entities/doctor.entity'|g" \
  src/shared/application/use-cases/users/doctors/doctors.use-cases.ts 2>/dev/null || true
 
sed -i "s|from '../../../infrastructure/database/prisma/repositories/services/encryption.service'|from '../../../../infrastructure/database/prisma/repositories/services/encryption.service'|g" \
  src/shared/application/use-cases/users/doctors/doctors.use-cases.ts 2>/dev/null || true
 
sed -i "s|from '../../../../modules/doctors/dto/doctor.dto'|from '../../../../../modules/doctors/dto/doctor.dto'|g" \
  src/shared/application/use-cases/users/doctors/doctors.use-cases.ts 2>/dev/null || true
 
ok "9/12 — doctors.use-cases.ts: imports relativos corrigidos"
 
# =============================================================================
# CORREÇÃO 10: nurses.use-cases.ts — corrigir imports relativos
# =============================================================================
sed -i "s|from '../../../domain/repositories/nurse.repository.interface'|from '../../../../domain/repositories/nurse.repository.interface'|g" \
  src/shared/application/use-cases/users/nurses/nurses.use-cases.ts 2>/dev/null || true
 
sed -i "s|from '../../../domain/entities/nurse.entity'|from '../../../../domain/entities/nurse.entity'|g" \
  src/shared/application/use-cases/users/nurses/nurses.use-cases.ts 2>/dev/null || true
 
sed -i "s|from '../../../infrastructure/database/prisma/repositories/services/encryption.service'|from '../../../../infrastructure/database/prisma/repositories/services/encryption.service'|g" \
  src/shared/application/use-cases/users/nurses/nurses.use-cases.ts 2>/dev/null || true
 
sed -i "s|from '../../../../modules/nurses/dto/nurse.dto'|from '../../../../../modules/nurses/dto/nurse.dto'|g" \
  src/shared/application/use-cases/users/nurses/nurses.use-cases.ts 2>/dev/null || true
 
ok "10/12 — nurses.use-cases.ts: imports relativos corrigidos"
 
# =============================================================================
# CORREÇÃO 11: Módulo Exams — criação completa (ausente no projeto)
# =============================================================================
mkdir -p src/modules/exams/dto
 
cat > src/modules/exams/dto/exam.dto.ts << 'EOF'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
 
export enum ExamType {
  LABORATORIAL = 'LABORATORIAL',
  IMAGEM = 'IMAGEM',
  FUNCIONAL = 'FUNCIONAL',
  OUTRO = 'OUTRO',
}
 
export enum EntityStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
 
export class CreateExamDto {
  @ApiProperty({ example: 'Hemograma Completo' })
  @IsString()
  nome: string;
 
  @ApiProperty({ enum: ExamType })
  @IsEnum(ExamType)
  tipo: ExamType;
 
  @ApiPropertyOptional({ example: 24, description: 'Tempo médio em horas' })
  @IsOptional()
  @IsInt()
  tempoMedioResultado?: number;
 
  @ApiPropertyOptional({ example: 'Jejum de 8 horas' })
  @IsOptional()
  @IsString()
  preparacaoNecessaria?: string;
 
  @ApiPropertyOptional({ example: 'EX-001' })
  @IsOptional()
  @IsString()
  codigoInterno?: string;
 
  @ApiPropertyOptional({ example: '40304361', description: 'Código TUSS obrigatório para convênios' })
  @IsOptional()
  @IsString()
  codigoTUSS?: string;
 
  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
 
export class UpdateExamDto extends PartialType(CreateExamDto) {}
EOF
 
cat > src/modules/exams/dto/exam-request.dto.ts << 'EOF'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
 
export enum UrgencyType {
  ROTINA = 'ROTINA',
  URGENTE = 'URGENTE',
  EMERGENCIA = 'EMERGENCIA',
}
 
export class CreateExamRequestDto {
  @ApiProperty() @IsUUID() medicalRecordId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() hospitalizationId?: string;
  @ApiProperty() @IsUUID() patientId: string;
  @ApiProperty() @IsUUID() examId: string;
  @ApiPropertyOptional({ description: 'CID-10 obrigatório para convênios' })
  @IsOptional() @IsUUID() cid10Id?: string;
  @ApiPropertyOptional({ enum: UrgencyType }) @IsOptional() @IsEnum(UrgencyType) urgencia?: UrgencyType;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codigoAutorizacaoConvenio?: string;
}
 
export class RegisterResultDto {
  @ApiProperty({ description: 'Resultado do exame' })
  @IsString()
  resultado: string;
}
 
export class UpdateExamRequestDto extends PartialType(CreateExamRequestDto) {}
 
// Alias para compatibilidade com o use-case existente
export { RegisterResultDto as UpdateExamResultDto };
EOF
 
cat > src/modules/exams/exams.controller.ts << 'EOF'
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { CreateExamRequestDto, RegisterResultDto } from './dto/exam-request.dto';
import type { TenantRequest } from '../../common/middlewares/tenant.middleware';
 
@ApiTags('Exams (Exames)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsUseCases: ExamsUseCases,
    private readonly examRequestsUseCases: ExamRequestsUseCases,
  ) {}
 
  // ─── Catálogo ──────────────────────────────────────────────────────────────
  @Post('catalog')
  @ApiOperation({ summary: 'Criar exame no catálogo' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  createExam(@Body() dto: CreateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.create(req.tenant.id, dto);
  }
 
  @Get('catalog')
  @ApiOperation({ summary: 'Listar catálogo de exames' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAllExams(@Req() req: TenantRequest, @Query('page') page: string, @Query('limit') limit: string) {
    return this.examsUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10);
  }
 
  @Patch('catalog/:id')
  @ApiOperation({ summary: 'Atualizar exame no catálogo' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.update(id, req.tenant.id, dto);
  }
 
  @Delete('catalog/:id')
  @ApiOperation({ summary: 'Remover exame do catálogo' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  removeExam(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.examsUseCases.remove(id, req.tenant.id);
  }
 
  // ─── Solicitações ──────────────────────────────────────────────────────────
  @Post('requests')
  @ApiOperation({ summary: 'Solicitar exame para paciente' })
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  createRequest(@Body() dto: CreateExamRequestDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.create(req.tenant.id, userId, dto, ip, ua);
  }
 
  @Get('requests')
  @ApiOperation({ summary: 'Listar solicitações de exames' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAllRequests(
    @Req() req: TenantRequest,
    @Query('patientId') patientId: string,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.findAll(
      req.tenant.id,
      Number(page) || 1,
      Number(limit) || 10,
      { patientId, status },
      userId,
      ip,
      ua,
    );
  }
 
  @Patch('requests/:id/result')
  @ApiOperation({ summary: 'Registrar resultado de exame' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  registerResult(@Param('id') id: string, @Body() dto: RegisterResultDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.registerResult(id, req.tenant.id, dto.resultado, userId, ip, ua);
  }
 
  @Delete('requests/:id')
  @ApiOperation({ summary: 'Cancelar solicitação de exame' })
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  cancelRequest(@Param('id') id: string, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.cancel(id, req.tenant.id, userId, ip, ua);
  }
}
EOF
 
cat > src/modules/exams/exams.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';
import { EXAM_REPOSITORY_TOKEN } from '../../shared/domain/repositories/exam.repository.interface';
import { PrismaExamRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-exam.repository';
import { EXAM_REQUEST_REPOSITORY_TOKEN } from '../../shared/domain/repositories/exam-request.repository.interface';
import { PrismaExamRequestRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-exam-request.repository';
 
@Module({
  controllers: [ExamsController],
  providers: [
    ExamsUseCases,
    ExamRequestsUseCases,
    { provide: EXAM_REPOSITORY_TOKEN, useClass: PrismaExamRepository },
    { provide: EXAM_REQUEST_REPOSITORY_TOKEN, useClass: PrismaExamRequestRepository },
  ],
  exports: [ExamsUseCases, ExamRequestsUseCases],
})
export class ExamsModule {}
EOF
ok "11/12 — Módulo Exams: criado completo (dto, controller, module)"
 
# =============================================================================
# CORREÇÃO 12: Gerar o Prisma Client (causa raiz de 220+ erros TS2339)
# =============================================================================
echo ""
warn "12/12 — Gerando Prisma Client (npx prisma generate)..."
npx prisma generate
ok "12/12 — Prisma Client gerado com sucesso"
 
# =============================================================================
# VERIFICAÇÃO FINAL
# =============================================================================
echo ""
echo "============================================================"
echo "  Verificando compilação do backend..."
echo "============================================================"
ERRORS=$(npx tsc -p tsconfig.build.json --noEmit 2>&1 | grep "error TS" | wc -l)
 
if [ "$ERRORS" -eq "0" ]; then
  echo ""
  echo -e "${GREEN}============================================================"
  echo "  ✅ SUCESSO — Backend compila sem erros!"
  echo "  Próximos passos:"
  echo "    1. Copie o .env.example para .env e preencha as variáveis"
  echo "    2. docker-compose up -d"
  echo "    3. npx prisma migrate dev"
  echo "    4. npx prisma db seed"
  echo "    5. npm run start:dev"
  echo -e "============================================================${NC}"
else
  echo ""
  echo -e "${YELLOW}============================================================"
  echo "  ⚠️  Ainda há $ERRORS erro(s) de compilação."
  echo "  Erros restantes:"
  echo -e "============================================================${NC}"
  npx tsc -p tsconfig.build.json --noEmit 2>&1 | grep "error TS" | head -20