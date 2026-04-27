# 🏥 PEP+ (Prontuário Eletrônico de Pacientes Plus)

Um sistema SaaS robusto, moderno e escalável projetado para gestão hospitalar e clínica, inspirado nos mais altos padrões do mercado de HealthTechs brasileiras (MV Soul, Tasy, Wareline).

## 🚀 Arquitetura e Tecnologias

A aplicação é construída utilizando o conceito de **Clean Architecture**, isolando as regras de negócios da infraestrutura (Banco, Cache e Filas).

- **Framework:** Node.js com [NestJS](https://nestjs.com/)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL 15
- **ORM:** Prisma (v7+)
- **Cache e Queues:** Redis + BullMQ
- **Segurança:** JWT, Bcrypt, AES-256-GCM para dados sensíveis (LGPD)
- **Containerização:** Docker + Docker Compose

## ☁️ Estratégia Multi-Tenant

A arquitetura do PEP+ baseia-se no modelo **Shared Database / Shared Schema**. 
- Todas as clínicas e hospitais compartilham o mesmo banco de dados.
- O isolamento é estritamente garantido por um middleware de interceptação que detecta o subdomínio (`tenantId`) de quem faz a requisição e o injeta no ciclo de vida do NestJS.
- Há um limite de taxa (Rate Limit) autônomo por subdomínio + IP, prevenindo ataques que afetem outros clientes na mesma base.

## 📦 Módulos Atuais Implementados (Fase 1 a 3)

1. **Infra e Core:** Autenticação JWT, Guard global de rotas, Interceptor de Auditoria e Serviço de Criptografia em tempo real.
2. **Access Control (Roles):** Sistema RBAC via JSON escalável para gerenciar o que cada cargo pode fazer no sistema.
3. **Users:** Gestão de acesso do ecossistema hospitalar (recepção, TI, etc).
4. **Doctors & Nurses:** Catálogo de profissionais de saúde, interligado a validações de CRM/COREN e Especialidades Médicas.
5. **Wards & Beds:** Estrutura física da internação. Controle analítico da taxa de ocupação hospitalar.

## 🛠️ Como Executar o Projeto

Certifique-se de ter o **Node.js 20+** e o **Docker Desktop** rodando na sua máquina.

### 1. Clonar e Instalar
```bash
npm install