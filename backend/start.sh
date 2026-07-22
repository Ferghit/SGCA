#!/bin/sh

echo "=============================================="
echo "Iniciando SGCA Backend"
echo "=============================================="

# Ejecutar migraciones de Prisma
echo "Aplicando migraciones de la base de datos..."
npx prisma migrate deploy

# Ejecutar seed (si es la primera vez)
echo "Aplicando seed de datos (si es necesario)..."
node dist/prisma/seed.js

# Iniciar la aplicación
echo "Iniciando servidor NestJS..."
node dist/src/main.js
