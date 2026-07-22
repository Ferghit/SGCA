#!/bin/bash

echo "=== Iniciando SGCA Backend en Railway ==="

# Ejecutar migraciones de Prisma
echo "Aplicando migraciones..."
npx prisma migrate deploy

# Ejecutar seed (solo la primera vez)
echo "Aplicando seed (si es necesario)..."
node dist/prisma/seed.js

# Iniciar la aplicación
echo "Iniciando servidor NestJS..."
node dist/src/main.js
