const { execSync } = require('child_process');

console.log('=== Iniciando SGCA Backend en Railway ===');

// Ejecutar migraciones de Prisma
console.log('Aplicando migraciones...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (error) {
  console.error('Error al aplicar migraciones:', error.message);
  process.exit(1);
}

// Ejecutar seed (solo la primera vez)
console.log('Aplicando seed (si es necesario)...');
try {
  execSync('node dist/prisma/seed.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error al aplicar seed:', error.message);
}

// Iniciar la aplicación
console.log('Iniciando servidor NestJS...');
require('./dist/src/main.js');
