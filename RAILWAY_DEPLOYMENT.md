# Guía de Despliegue en Railway

## Por qué Railway?

Railway es la opción más sencilla y económica para desplegar este proyecto:
- **Capa gratuita**: Incluye base de datos PostgreSQL y recursos suficientes para probar
- **Despliegue automático**: Conecta tu repositorio de GitHub y se actualiza automáticamente
- **Fácil de usar**: Interfaz intuitiva
- **SSL incluido**: Sitio seguro por defecto

## Pasos para desplegar

### 1. Preparar tu repositorio

Antes de empezar, sube tu código a GitHub, GitLab o Bitbucket.

### 2. Crear una cuenta en Railway

Ve a https://railway.app y crea una cuenta (gratuita).

### 3. Crear un nuevo proyecto

1. Haz clic en **"New Project"**
2. Selecciona **"Empty Project"**
3. Nombra tu proyecto (ej: "SGCA")

### 4. Añadir la base de datos PostgreSQL

1. Dentro de tu proyecto, haz clic en **"+ Add a service"**
2. Selecciona **"Database"** > **"PostgreSQL"**
3. Espera a que se cree la base de datos

### 5. Desplegar el backend

1. Haz clic en **"+ Add a service"**
2. Selecciona **"GitHub"** (conecta tu cuenta si es necesario)
3. Busca y selecciona tu repositorio
4. **IMPORTANTE**: En **"Root Directory"**, escribe `backend`
5. Haz clic en **"Deploy"**

#### Configurar variables de entorno del backend

1. Ve al servicio del backend
2. Haz clic en **"Variables"**
3. Añade las siguientes variables:
   - `DATABASE_URL`: Copia el valor del servicio PostgreSQL (Railway lo pone automáticamente si usaste el plugin, pero si no, ve al servicio PostgreSQL y copia la variable `DATABASE_URL`)
   - `JWT_SECRET`: Escribe una clave segura (ej: usa https://www.uuidgenerator.net/)
   - `JWT_EXPIRES_IN`: `24h`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: (lo pondremos después, primero lo podemos dejar como `http://localhost:3000`)
   - `PORT`: `3001` (Railway lo configura automáticamente, pero es bueno ponerlo)

**Nota**: Las variables de Google OAuth son opcionales si no las vas a usar.

### 6. Desplegar el frontend

1. Haz clic en **"+ Add a service"**
2. Selecciona **"GitHub"**
3. Selecciona tu repositorio
4. **IMPORTANTE**: En **"Root Directory"**, escribe `frontend`
5. Haz clic en **"Deploy"**

#### Configurar variables de entorno del frontend

1. Ve al servicio del frontend
2. Haz clic en **"Variables"**
3. Añade la variable:
   - `NEXT_PUBLIC_API_URL`: Coloca la URL del backend que Railway generó (ej: `https://sgca-backend-production.up.railway.app/api`)

### 7. Actualizar la variable FRONTEND_URL en el backend

1. Ve al servicio del backend
2. Actualiza la variable `FRONTEND_URL` con la URL del frontend que Railway generó (ej: `https://sgca-frontend-production.up.railway.app`)

### 8. Verificar el despliegue

1. Abre la URL del frontend
2. Prueba a iniciar sesión con las credenciales del seed:
   - Correo: admin@sgca.com
   - Contraseña: Admin123!

## Costos

La capa gratuita de Railway incluye:
- 500 horas de ejecución al mes
- 1 GB de almacenamiento
- 1 GB de ancho de banda

Esto es suficiente para probar el sistema. Si necesitas más recursos, los planes son muy económicos.

## Otras opciones (si Railway no te convence)

Si prefieres otras plataformas:

- **Render**: Similar a Railway, también con capa gratuita
- **Vercel**: Excelente para frontend (Next.js), pero necesitas otro servicio para backend
- **Supabase**: Para base de datos y funciones serverless

Pero **Railway es la opción recomendada** para este proyecto porque es la más fácil de configurar todo en un solo lugar.
