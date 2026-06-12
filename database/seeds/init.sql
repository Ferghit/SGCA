-- ============================================================
-- SGCA - Sistema de Gestion de Compras y Aprovisionamiento
-- Universidad Nacional de Trujillo - Ingenieria de Sistemas VII
-- Archivo: database/seeds/init.sql
-- Encoding: UTF-8 sin BOM
-- ============================================================
--
-- INSTRUCCIONES DE USO:
--
-- OPCION 1 (Recomendada): Usar el seeder de Prisma
--   cd backend
--   npm run prisma:seed
--
-- OPCION 2: Este archivo SQL (ejecutar DESPUES de las migraciones)
--   1. Crear la base de datos:
--      psql -U postgres -c "CREATE DATABASE sgca_db;"
--   2. Ejecutar las migraciones:
--      cd backend && npm run prisma:migrate
--   3. Ejecutar este seed:
--      psql -U postgres -d sgca_db -f database/seeds/init.sql
--
-- NOTA: Las contrasenas usan bcrypt con 10 rondas.
--       Todos los usuarios tienen contrasena: Admin123!
--       Usa la OPCION 1 (seed.ts) para que bcrypt calcule los hashes
--       correctamente en tiempo de ejecucion.
-- ============================================================

-- Habilitar extension pgcrypto para hashing de contrasenas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── LIMPIAR DATOS EXISTENTES (orden correcto para FK) ────────────────────────
TRUNCATE TABLE auditoria RESTART IDENTITY CASCADE;
TRUNCATE TABLE notificaciones RESTART IDENTITY CASCADE;
TRUNCATE TABLE historial_requerimientos RESTART IDENTITY CASCADE;
TRUNCATE TABLE requerimiento_detalles RESTART IDENTITY CASCADE;
TRUNCATE TABLE requerimientos RESTART IDENTITY CASCADE;
TRUNCATE TABLE productos RESTART IDENTITY CASCADE;
TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE;

-- ─── USUARIOS (1 por cada rol) ────────────────────────────────────────────────
-- Contrasena para todos: Admin123!
-- crypt() con gen_salt('bf', 10) genera hash compatible con bcrypt

INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, "createdAt", "updatedAt")
VALUES
  (
    'Carlos', 'Mendoza', 'admin@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'ADMIN', true, NOW(), NOW()
  ),
  (
    'Ana', 'Torres', 'trabajador@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'TRABAJADOR', true, NOW(), NOW()
  ),
  (
    'Luis', 'Garcia', 'jefe@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'JEFE_AREA', true, NOW(), NOW()
  ),
  (
    'Maria', 'Lopez', 'analista@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'ANALISTA_COMPRAS', true, NOW(), NOW()
  ),
  (
    'Roberto', 'Sanchez', 'gerente@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'GERENTE', true, NOW(), NOW()
  ),
  (
    'Juan', 'Perez', 'proveedor@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'PROVEEDOR', true, NOW(), NOW()
  ),
  (
    'Sofia', 'Ramirez', 'almacen@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'ENCARGADO_ALMACEN', true, NOW(), NOW()
  ),
  (
    'Pedro', 'Vargas', 'contador@sgca.com',
    crypt('Admin123!', gen_salt('bf', 10)),
    'CONTADOR', true, NOW(), NOW()
  );

-- ─── PRODUCTOS (10 de ejemplo) ────────────────────────────────────────────────

INSERT INTO productos (codigo, nombre, descripcion, "unidadMedida", categoria, "precioReferencial", activo, "createdAt", "updatedAt")
VALUES
  ('PRD-001', 'Papel Bond A4 (resma 500 hojas)', 'Papel bond 75g para impresora', 'Resma',        'Utiles de Oficina',    15.50,  true, NOW(), NOW()),
  ('PRD-002', 'Lapicero Azul BIC',                'Lapicero BIC punta fina azul',  'Unidad',       'Utiles de Oficina',     1.20,  true, NOW(), NOW()),
  ('PRD-003', 'Cartucho de Tinta HP Negro',       'Compatible HP 664 negro',        'Unidad',       'Insumos de Impresion', 45.00,  true, NOW(), NOW()),
  ('PRD-004', 'Folder Manila A4',                 'Paquete x25 unidades',          'Paquete x25',  'Utiles de Oficina',     8.00,  true, NOW(), NOW()),
  ('PRD-005', 'Engrapador Estandar',              'Engrapador metalico 26/6',       'Unidad',       'Utiles de Oficina',    22.00,  true, NOW(), NOW()),
  ('PRD-006', 'Disco Duro Externo 1TB',           'USB 3.0, compatible Win/Mac',    'Unidad',       'Equipos de Computo',  280.00,  true, NOW(), NOW()),
  ('PRD-007', 'Teclado USB Estandar',             'Teclado espanol USB 2.0',        'Unidad',       'Equipos de Computo',   65.00,  true, NOW(), NOW()),
  ('PRD-008', 'Desinfectante en Spray 500ml',     'Desinfectante multiusos',        'Frasco',       'Limpieza e Higiene',   12.50,  true, NOW(), NOW()),
  ('PRD-009', 'Silla Ergonomica de Oficina',      'Con apoyabrazos y ruedas',       'Unidad',       'Mobiliario',          450.00,  true, NOW(), NOW()),
  ('PRD-010', 'Monitor LED 24 pulgadas',          'Full HD 1920x1080, HDMI+VGA',    'Unidad',       'Equipos de Computo',  850.00,  true, NOW(), NOW());

-- ─── REQUERIMIENTOS DE EJEMPLO ────────────────────────────────────────────────
-- Usar subquery para obtener IDs de usuario

INSERT INTO requerimientos (codigo, "solicitanteId", "aprobadorId", estado, prioridad, "fechaRequerida", descripcion, "comentarioJefe", "createdAt", "updatedAt")
VALUES
  (
    'REQ-2026-001',
    (SELECT id FROM usuarios WHERE email = 'trabajador@sgca.com'),
    (SELECT id FROM usuarios WHERE email = 'jefe@sgca.com'),
    'APROBADO', 'ALTA',
    '2026-06-20',
    'Reposicion urgente de materiales de oficina para el area de sistemas.',
    'Aprobado. Los materiales son necesarios para el proyecto del trimestre.',
    NOW() - INTERVAL '5 days', NOW()
  ),
  (
    'REQ-2026-002',
    (SELECT id FROM usuarios WHERE email = 'trabajador@sgca.com'),
    NULL,
    'PENDIENTE', 'URGENTE',
    '2026-06-15',
    'Necesito cartuchos de tinta para las impresoras del departamento urgente.',
    NULL,
    NOW() - INTERVAL '2 days', NOW()
  ),
  (
    'REQ-2026-003',
    (SELECT id FROM usuarios WHERE email = 'trabajador@sgca.com'),
    (SELECT id FROM usuarios WHERE email = 'jefe@sgca.com'),
    'RECHAZADO', 'BAJA',
    '2026-07-01',
    'Solicitud de sillas nuevas para el area de recepcion.',
    'Rechazado. El presupuesto del mes ya fue comprometido. Reagendar para el proximo periodo.',
    NOW() - INTERVAL '10 days', NOW()
  ),
  (
    'REQ-2026-004',
    (SELECT id FROM usuarios WHERE email = 'trabajador@sgca.com'),
    (SELECT id FROM usuarios WHERE email = 'jefe@sgca.com'),
    'EN_REVISION', 'MEDIA',
    '2026-06-30',
    'Requerimiento de equipos de computo para el laboratorio de sistemas.',
    'Por favor adjuntar cotizaciones previas de al menos dos proveedores.',
    NOW() - INTERVAL '7 days', NOW()
  ),
  (
    'REQ-2026-005',
    (SELECT id FROM usuarios WHERE email = 'trabajador@sgca.com'),
    NULL,
    'BORRADOR', 'MEDIA',
    '2026-07-10',
    'Requerimiento de insumos de limpieza para las instalaciones.',
    NULL,
    NOW() - INTERVAL '1 day', NOW()
  );

-- ─── DETALLES DE REQUERIMIENTOS ───────────────────────────────────────────────

INSERT INTO requerimiento_detalles ("requerimientoId", "productoId", cantidad, "unidadMedida", observacion)
VALUES
  -- REQ-2026-001: papel y lapiceros
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-001'), (SELECT id FROM productos WHERE codigo = 'PRD-001'), 10, 'Resma',  NULL),
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-001'), (SELECT id FROM productos WHERE codigo = 'PRD-002'), 50, 'Unidad', NULL),
  -- REQ-2026-002: cartuchos
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-002'), (SELECT id FROM productos WHERE codigo = 'PRD-003'),  5, 'Unidad', 'Cartuchos negros HP 664'),
  -- REQ-2026-003: sillas
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-003'), (SELECT id FROM productos WHERE codigo = 'PRD-009'),  5, 'Unidad', NULL),
  -- REQ-2026-004: discos y monitores
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-004'), (SELECT id FROM productos WHERE codigo = 'PRD-006'),  3, 'Unidad', NULL),
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-004'), (SELECT id FROM productos WHERE codigo = 'PRD-010'),  2, 'Unidad', NULL),
  -- REQ-2026-005: desinfectante
  ((SELECT id FROM requerimientos WHERE codigo = 'REQ-2026-005'), (SELECT id FROM productos WHERE codigo = 'PRD-008'), 20, 'Frasco', NULL);

-- ─── HISTORIAL DE REQUERIMIENTOS ──────────────────────────────────────────────

INSERT INTO historial_requerimientos ("requerimientoId", "estadoAnterior", "estadoNuevo", comentario, "usuarioId", "createdAt")
VALUES
  -- REQ-2026-001
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-001'), NULL,         'BORRADOR',   'Requerimiento creado', (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '5 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-001'), 'BORRADOR',   'PENDIENTE',  'Enviado para aprobacion', (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '4 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-001'), 'PENDIENTE',  'APROBADO',   'Aprobado. Los materiales son necesarios para el proyecto del trimestre.', (SELECT id FROM usuarios WHERE email='jefe@sgca.com'), NOW()-INTERVAL '3 days'),
  -- REQ-2026-002
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-002'), NULL,         'BORRADOR',   'Requerimiento creado', (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '2 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-002'), 'BORRADOR',   'PENDIENTE',  'Enviado para aprobacion', (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '1 day'),
  -- REQ-2026-003
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-003'), NULL,         'BORRADOR',   NULL, (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '10 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-003'), 'BORRADOR',   'PENDIENTE',  NULL, (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '9 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-003'), 'PENDIENTE',  'RECHAZADO',  'Rechazado. Presupuesto comprometido.', (SELECT id FROM usuarios WHERE email='jefe@sgca.com'), NOW()-INTERVAL '8 days'),
  -- REQ-2026-004
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-004'), NULL,         'BORRADOR',   NULL, (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '7 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-004'), 'BORRADOR',   'PENDIENTE',  NULL, (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '6 days'),
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-004'), 'PENDIENTE',  'EN_REVISION','Por favor adjuntar cotizaciones de al menos dos proveedores.', (SELECT id FROM usuarios WHERE email='jefe@sgca.com'), NOW()-INTERVAL '5 days'),
  -- REQ-2026-005
  ((SELECT id FROM requerimientos WHERE codigo='REQ-2026-005'), NULL,         'BORRADOR',   'Requerimiento en borrador', (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'), NOW()-INTERVAL '1 day');

-- ─── NOTIFICACIONES DE EJEMPLO ────────────────────────────────────────────────

INSERT INTO notificaciones ("emisorId", "receptorId", "requerimientoId", titulo, mensaje, leida, "createdAt")
VALUES
  (
    (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'),
    (SELECT id FROM usuarios WHERE email='jefe@sgca.com'),
    (SELECT id FROM requerimientos WHERE codigo='REQ-2026-002'),
    'Nuevo requerimiento urgente pendiente',
    'Ana Torres ha enviado el requerimiento REQ-2026-002 con prioridad URGENTE. Por favor revise.',
    false, NOW()-INTERVAL '1 day'
  ),
  (
    (SELECT id FROM usuarios WHERE email='jefe@sgca.com'),
    (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'),
    (SELECT id FROM requerimientos WHERE codigo='REQ-2026-001'),
    'Requerimiento REQ-2026-001 aprobado',
    'Su requerimiento REQ-2026-001 ha sido aprobado. El proceso de compra continuara.',
    true, NOW()-INTERVAL '3 days'
  ),
  (
    (SELECT id FROM usuarios WHERE email='jefe@sgca.com'),
    (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'),
    (SELECT id FROM requerimientos WHERE codigo='REQ-2026-003'),
    'Requerimiento REQ-2026-003 rechazado',
    'Su requerimiento REQ-2026-003 ha sido rechazado. Motivo: presupuesto comprometido.',
    false, NOW()-INTERVAL '8 days'
  ),
  (
    (SELECT id FROM usuarios WHERE email='jefe@sgca.com'),
    (SELECT id FROM usuarios WHERE email='trabajador@sgca.com'),
    (SELECT id FROM requerimientos WHERE codigo='REQ-2026-004'),
    'Requerimiento REQ-2026-004 requiere correcciones',
    'Su requerimiento REQ-2026-004 requiere informacion adicional. Por favor adjunte cotizaciones.',
    false, NOW()-INTERVAL '5 days'
  );

-- ─── RESUMEN ──────────────────────────────────────────────────────────────────
SELECT 'SEED COMPLETADO' AS resultado,
       (SELECT COUNT(*) FROM usuarios)               AS usuarios,
       (SELECT COUNT(*) FROM productos)              AS productos,
       (SELECT COUNT(*) FROM requerimientos)         AS requerimientos,
       (SELECT COUNT(*) FROM notificaciones)         AS notificaciones;
