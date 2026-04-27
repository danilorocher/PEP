# 🏥 PEP+ — ESTRATÉGIA DE BACKUP E RETENÇÃO DE DADOS (CONFORMIDADE CFM/LGPD)

Este documento descreve os procedimentos de backup, retenção e recuperação de desastres para garantir a integridade dos dados e o cumprimento da Resolução CFM nº 1.821/2007 e da Lei Geral de Proteção de Dados (LGPD).

## 1. POLÍTICA DE RETENÇÃO

| Tipo de Dado | Prazo de Retenção | Justificativa Legal |
| :--- | :--- | :--- |
| Prontuário Eletrônico | Mínimo 20 anos | Resolução CFM 1.821/2007 |
| Trilhas de Auditoria | Mínimo 20 anos | Resolução CFM 1.821/2007 |
| Dados de Faturamento | 10 anos | Prescrição tributária/civil |
| Logs de Acesso (Geral) | 6 meses | Marco Civil da Internet |

## 2. AGENDAMENTO DE BACKUPS (POSTGRESQL)

O sistema utiliza o utilitário `pg_dump` para cópias lógicas e o Cloud Storage para armazenamento geodistribuído.

### 2.1. Backup Diário (Incremental/Full)
- **Frequência:** Diária (às 02:00 UTC).
- **Retenção:** 30 dias.
- **Escopo:** Banco de dados completo (`pep_plus_db`).

### 2.2. Backup Semanal
- **Frequência:** Todos os domingos.
- **Retenção:** 1 ano.
- **Escopo:** Banco de dados completo + Snapshots dos volumes de anexos.

### 2.3. Backup Mensal (Arquivo Morto)
- **Frequência:** Todo dia 01 de cada mês.
- **Retenção:** 20 anos.
- **Escopo:** Backup integral imutável (WORM - Write Once Read Many).

## 3. PROCEDIMENTOS TÉCNICOS

### 3.1. Execução Manual de Backup
```bash
docker exec -t pep_postgres pg_dumpall -c -U pep_admin > backup_$(date +%Y-%m-%d_%H%M%S).sql