# Guía de Despliegue de SGCA

## Requisitos previos

- Docker y Docker Compose instalados
- Variables de entorno configuradas

## Despliegue rápido con Docker Compose

1. Copia el archivo `.env.example` a `.env` en la raíz del proyecto
2. Ajusta las variables de entorno en el archivo `.env` (especialmente `JWT_SECRET`)
3. Ejecuta el siguiente comando:

```bash
docker-compose up -d --build
```

## Variables de entorno importantes

### Base de datos
- `DB_USER`: Usuario de PostgreSQL
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `DB_NAME`: Nombre de la base de datos

### Backend
- `DATABASE_URL`: URL de conexión a la base de datos
- `JWT_SECRET`: Clave secreta para JWT (IMPORTANTE: CAMBIAR EN PRODUCCIÓN)
- `JWT_EXPIRES_IN`: Tiempo de expiración de los tokens (ej: `24h`)
- `FRONTEND_URL`: URL del frontend para CORS

### Frontend
- `NEXT_PUBLIC_API_URL`: URL del backend API

## Acceso al sistema

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Base de datos: localhost:5432

## Credenciales iniciales (del seed)

Usuario administrador:
- Correo: admin@sgca.com
- Contraseña: Admin123!

Otros usuarios:
- Trabajadores: trabajador1@sgca.com a trabajador8@sgca.com
- Jefes de área: jefe1@sgca.com a jefe4@sgca.com
- Analista de compras: analista@sgca.com
- Gerente: gerente@sgca.com
- Proveedores: proveedor1@sgca.com a proveedor5@sgca.com
- Encargados de almacén: almacen1@sgca.com y almacen2@sgca.com
- Contador: contador@sgca.com

(Todos usan la misma contraseña: `Admin123!`)

## Despliegue sin Docker

### Backend

1. Ve al directorio `backend`
2. Instala dependencias: `npm ci`
3. Genera cliente Prisma: `npx prisma generate`
4. Aplica migraciones: `npx prisma migrate deploy`
5. Ejecuta seed (opcional): `npx prisma db seed`
6. Construye: `npm run build`
7. Inicia: `npm run start:prod`

### Frontend

1. Ve al directorio `frontend`
2. Instala dependencias: `npm ci`
3. Construye: `npm run build`
4. Inicia: `npm start`
