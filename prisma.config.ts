import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Configuração do SEED exigida pela versão nova
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});