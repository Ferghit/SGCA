# Stage 1: Builder
FROM node:20 AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (incluyendo dev)
RUN npm ci

# Copiar código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Construir la aplicación NestJS
RUN npm run build


# Stage 2: Production
FROM node:20-alpine AS production

# Establecer directorio de trabajo
WORKDIR /app

# Instalar bash (para el script de inicialización)
RUN apk add --no-cache bash

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias completas (necesarias para prisma migrate y seed)
RUN npm ci

# Copiar código compilado y archivos necesarios
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./

# Dar permisos de ejecución al script
RUN chmod +x ./start.sh

# Exponer puerto
EXPOSE 3001

# Comando para ejecutar la aplicación
CMD ["./start.sh"]
