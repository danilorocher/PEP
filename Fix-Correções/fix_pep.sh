#!/bin/bash

echo "==============================="
echo "🚀 Subindo ambiente PEP..."
echo "==============================="

# Derruba containers antigos
echo "🧹 Limpando containers antigos..."
docker-compose down

# Remove containers órfãos (evita bug chato)
docker system prune -f

# Builda tudo novamente
echo "🔨 Buildando containers..."
docker-compose build --no-cache

# Sobe ambiente
echo "📦 Subindo serviços..."
docker-compose up -d

# Aguarda serviços subirem
echo "⏳ Aguardando inicialização..."
sleep 10

# Mostra status
echo "📊 Status dos containers:"
docker ps

echo "==============================="
echo "✅ Ambiente PEP pronto!"
echo "API: http://localhost:3000"
echo "Bull Board: http://localhost:3001"
echo "==============================="
