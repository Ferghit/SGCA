# SGCA - Sistema de Gestion de Compras y Aprovisionamiento

> Proyecto academico - Universidad Nacional de Trujillo  
> Ingenieria de Sistemas | VII Ciclo | Cadena de Suministro

---

## Descripcion

Sistema web que digitaliza el proceso de compras empresariales desde la solicitud de materiales hasta el pago al proveedor. Desarrollado con arquitectura de microservicios modulares para que cada integrante del equipo pueda agregar su modulo de forma independiente.

## Stack Tecnologico

| Capa         | Tecnologia                              |
|--------------|----------------------------------------|
| Frontend     | Next.js 15 + TypeScript + Tailwind CSS + Zustand |
| Backend      | NestJS + TypeScript + Prisma ORM        |
| Base de datos| PostgreSQL                              |
| Autenticacion| JWT + bcrypt                            |

## Estructura del Proyecto

```
SGCA/
├── backend/                  # API REST con NestJS
│   ├── src/
│   │   ├── auth/             # Autenticacion y JWT
│   │   ├── users/            # Gestion de usuarios
│   │   ├── requerimientos/   # Modulo de requerimientos (Parte 1)
│   │   ├── notificaciones/   # Notificaciones internas
│   │   ├── prisma/           # Servicio de base de datos
│   │   └── common/           # Guards, decoradores, filtros
│   └── prisma/
│       ├── schema.prisma     # Esquema completo de BD
│       └── seed.ts           # Datos de prueba
├── frontend/                 # App Next.js 15
│   └── src/
│       ├── app/              # App Router de Next.js
│       ├── components/       # Componentes reutilizables
│       ├── store/            # Estado global con Zustand
│       ├── lib/              # API client y utilidades
│       └── types/            # Tipos TypeScript
└── database/
    └── seeds/
        └── init.sql          # Script SQL alternativo de seed
```

---

## Inicio Rapido

### Prerequisitos

- Node.js >= 18
- PostgreSQL >= 14 corriendo en localhost:5432
- npm o yarn

### 1. Clonar y preparar

```bash
git clone <url-del-repo>
cd SGCA
```

### 2. Configurar la base de datos

Crear la base de datos en PostgreSQL:
```sql
CREATE DATABASE sgca_db;
```

O desde la terminal:
```bash
psql -U postgres -c "CREATE DATABASE sgca_db;"
```

### 3. Instalar y configurar el Backend

```bash
cd backend
npm install
```

Copiar el archivo de variables de entorno:
```bash
copy .env.example .env
# Edita .env si tu usuario/contrasena de PostgreSQL es diferente
```

Crear las tablas y ejecutar el seed:
```bash
npm run prisma:migrate     # Crea todas las tablas
npm run prisma:seed        # Inserta datos de prueba
```

Iniciar el servidor:
```bash
npm run start:dev
# API disponible en: http://localhost:3001/api
```

### 4. Instalar y configurar el Frontend

```bash
cd ../frontend
npm install
npm run dev
# App disponible en: http://localhost:3000
```

---

## Credenciales de Prueba

Todos los usuarios tienen la contrasena: **Admin123!**

| Rol                | Email                    |
|--------------------|--------------------------|
| ADMIN              | admin@sgca.com           |
| TRABAJADOR         | trabajador@sgca.com      |
| JEFE_AREA          | jefe@sgca.com            |
| ANALISTA_COMPRAS   | analista@sgca.com        |
| GERENTE            | gerente@sgca.com         |
| PROVEEDOR          | proveedor@sgca.com       |
| ENCARGADO_ALMACEN  | almacen@sgca.com         |
| CONTADOR           | contador@sgca.com        |

---

## API Endpoints

### Autenticacion
```
POST /api/auth/login      - Iniciar sesion
POST /api/auth/register   - Registrar usuario
GET  /api/auth/profile    - Perfil del usuario autenticado
```

### Requerimientos
```
GET    /api/requerimientos                    - Listar requerimientos
POST   /api/requerimientos                    - Crear requerimiento
GET    /api/requerimientos/:id                - Ver detalle
PATCH  /api/requerimientos/:id/enviar         - Enviar para aprobacion
PATCH  /api/requerimientos/:id/estado         - Cambiar estado
GET    /api/requerimientos/pendientes         - Listar pendientes (Jefe)
GET    /api/requerimientos/estadisticas/mis-requerimientos
GET    /api/requerimientos/estadisticas/jefe
```

### Notificaciones
```
GET    /api/notificaciones             - Mis notificaciones
GET    /api/notificaciones/no-leidas/count
PATCH  /api/notificaciones/:id/leer    - Marcar como leida
PATCH  /api/notificaciones/leer-todas  - Marcar todas como leidas
```

### Usuarios
```
GET    /api/users                      - Listar usuarios (ADMIN)
GET    /api/users/:id                  - Ver usuario
GET    /api/users/por-rol?rol=JEFE_AREA
PATCH  /api/users/:id/toggle-activo   - Activar/desactivar (ADMIN)
```

---

## Flujo de Requerimientos

```
TRABAJADOR                          JEFE DE AREA
    |                                    |
    | Crea BORRADOR                      |
    |                                    |
    | Envia para aprobacion              |
    | (estado: PENDIENTE) ──────────────>|
    |                                    | Revisa el requerimiento
    |                                    |
    |<─────────────── APROBADO ──────────| Pasa a compras
    |<─────────────── RECHAZADO ─────────| Proceso termina
    |<─────────────── EN_REVISION ───────| Debe corregir
    |                                    |
    | Corrige y re-envia                 |
    | (estado: PENDIENTE nuevamente) ───>|
```

---

## Modulos del Equipo

Cada compañero debe agregar su modulo en `backend/src/`:

| Modulo                    | Archivos a crear                                    | Estado       |
|---------------------------|-----------------------------------------------------|--------------|
| **Requerimientos** (Parte 1) | `requerimientos/` (completado)                   | COMPLETADO   |
| **Cotizaciones** (Parte 2)   | `cotizaciones/cotizaciones.{controller,service,module}.ts` | Pendiente |
| **Ordenes de Compra** (Parte 3) | `ordenes-compra/`                             | Pendiente    |
| **Recepcion e Inventario** (Parte 4) | `recepciones/`, `inventario/`           | Pendiente    |
| **Facturacion y Pagos** (Parte 5) | `facturas/`, `pagos/`                     | Pendiente    |

Para agregar un nuevo modulo:
1. Crear la carpeta `backend/src/tu-modulo/`
2. Crear `tu-modulo.module.ts`, `tu-modulo.service.ts`, `tu-modulo.controller.ts`
3. Importar el modulo en `app.module.ts`

---

## Diseno Visual

Paleta de colores:
- **Azul oscuro (primario):** `#1B263B`
- **Verde azulado (secundario):** `#006D77`
- **Dorado (acento):** `#D4AF37`

---

## Comandos Utiles

```bash
# Backend
npm run start:dev       # Servidor en modo desarrollo (hot reload)
npm run prisma:studio   # Interfaz visual de la BD
npm run prisma:push     # Sincronizar schema sin migraciones
npm run prisma:seed     # Reinsertar datos de prueba

# Frontend
npm run dev             # Servidor de desarrollo
npm run build           # Build de produccion
npm run lint            # Verificar errores de codigo
```

---

*SGCA v1.0.0 - UNT Sistemas VII - 2026*
