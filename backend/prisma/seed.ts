import { PrismaClient, Rol, EstadoRequerimiento, Prioridad } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // ─── USUARIOS ────────────────────────────────────────────────────────────────
  const usuarios = await Promise.all([
    prisma.usuario.upsert({
      where: { email: 'admin@sgca.com' },
      update: {},
      create: { nombre: 'Carlos', apellido: 'Mendoza', email: 'admin@sgca.com', password: hashedPassword, rol: Rol.ADMIN },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador@sgca.com' },
      update: {},
      create: { nombre: 'Ana', apellido: 'Torres', email: 'trabajador@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'jefe@sgca.com' },
      update: {},
      create: { nombre: 'Luis', apellido: 'Garcia', email: 'jefe@sgca.com', password: hashedPassword, rol: Rol.JEFE_AREA },
    }),
    prisma.usuario.upsert({
      where: { email: 'analista@sgca.com' },
      update: {},
      create: { nombre: 'Maria', apellido: 'Lopez', email: 'analista@sgca.com', password: hashedPassword, rol: Rol.ANALISTA_COMPRAS },
    }),
    prisma.usuario.upsert({
      where: { email: 'gerente@sgca.com' },
      update: {},
      create: { nombre: 'Roberto', apellido: 'Sanchez', email: 'gerente@sgca.com', password: hashedPassword, rol: Rol.GERENTE },
    }),
    prisma.usuario.upsert({
      where: { email: 'proveedor@sgca.com' },
      update: {},
      create: { nombre: 'Juan', apellido: 'Perez', email: 'proveedor@sgca.com', password: hashedPassword, rol: Rol.PROVEEDOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'almacen@sgca.com' },
      update: {},
      create: { nombre: 'Sofia', apellido: 'Ramirez', email: 'almacen@sgca.com', password: hashedPassword, rol: Rol.ENCARGADO_ALMACEN },
    }),
    prisma.usuario.upsert({
      where: { email: 'contador@sgca.com' },
      update: {},
      create: { nombre: 'Pedro', apellido: 'Vargas', email: 'contador@sgca.com', password: hashedPassword, rol: Rol.CONTADOR },
    }),
  ]);

  console.log(`Usuarios creados: ${usuarios.length}`);

  // Proveedor (vinculado por email con el usuario PROVEEDOR)
  const proveedor = await prisma.proveedor.upsert({
    where: { ruc: '20123456789' },
    update: { email: 'proveedor@sgca.com' },
    create: {
      ruc: '20123456789',
      razonSocial: 'Proveedor Demo S.A.C.',
      email: 'proveedor@sgca.com',
      contacto: 'Juan Pérez',
      telefono: '987654321',
      direccion: 'Av. Ejemplo 123, Trujillo',
    },
  });

  console.log(`Proveedor creado: ${proveedor.razonSocial}`);

  // ─── Productos ───────────────────────────────────────────────────────────────
  const productos = await Promise.all([
    prisma.producto.upsert({
      where: { codigo: 'PRD-001' },
      update: {},
      create: { codigo: 'PRD-001', nombre: 'Papel Bond A4 (resma 500 hojas)', unidadMedida: 'Resma', categoria: 'Utiles de Oficina', precioReferencial: 15.50 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-002' },
      update: {},
      create: { codigo: 'PRD-002', nombre: 'Lapicero Azul BIC', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 1.20 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-003' },
      update: {},
      create: { codigo: 'PRD-003', nombre: 'Cartucho de Tinta HP Negro', unidadMedida: 'Unidad', categoria: 'Insumos de Impresion', precioReferencial: 45.00 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-004' },
      update: {},
      create: { codigo: 'PRD-004', nombre: 'Folder Manila A4', unidadMedida: 'Paquete x25', categoria: 'Utiles de Oficina', precioReferencial: 8.00 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-005' },
      update: {},
      create: { codigo: 'PRD-005', nombre: 'Engrapador Estandar', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 22.00 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-006' },
      update: {},
      create: { codigo: 'PRD-006', nombre: 'Disco Duro Externo 1TB', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 280.00 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-007' },
      update: {},
      create: { codigo: 'PRD-007', nombre: 'Teclado USB Estandar', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 65.00 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-008' },
      update: {},
      create: { codigo: 'PRD-008', nombre: 'Desinfectante en Spray 500ml', unidadMedida: 'Frasco', categoria: 'Limpieza e Higiene', precioReferencial: 12.50 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-009' },
      update: {},
      create: { codigo: 'PRD-009', nombre: 'Silla Ergonomica de Oficina', unidadMedida: 'Unidad', categoria: 'Mobiliario', precioReferencial: 450.00 },
    }),
    prisma.producto.upsert({
      where: { codigo: 'PRD-010' },
      update: {},
      create: { codigo: 'PRD-010', nombre: 'Monitor LED 24 pulgadas', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 850.00 },
    }),
  ]);

  console.log(`Productos creados: ${productos.length}`);

  const trabajador = usuarios.find(u => u.rol === Rol.TRABAJADOR)!;
  const jefe = usuarios.find(u => u.rol === Rol.JEFE_AREA)!;

  // ─── REQUERIMIENTOS DE EJEMPLO ───────────────────────────────────────────────
  const req1 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-001' },
    update: {},
    create: {
      codigo: 'REQ-2026-001',
      solicitanteId: trabajador.id,
      estado: EstadoRequerimiento.APROBADO,
      prioridad: Prioridad.ALTA,
      fechaRequerida: new Date('2026-06-20'),
      descripcion: 'Reposicion urgente de materiales de oficina para el area de sistemas.',
      aprobadorId: jefe.id,
      comentarioJefe: 'Aprobado. Los materiales son necesarios para el proyecto del trimestre.',
      detalles: {
        create: [
          { productoId: productos[0].id, cantidad: 10, unidadMedida: 'Resma' },
          { productoId: productos[1].id, cantidad: 50, unidadMedida: 'Unidad' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR, comentario: 'Requerimiento creado' },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE, comentario: 'Enviado a jefe de area para aprobacion' },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.APROBADO, comentario: 'Aprobado. Los materiales son necesarios para el proyecto del trimestre.' },
        ],
      },
    },
  });

  const req2 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-002' },
    update: {},
    create: {
      codigo: 'REQ-2026-002',
      solicitanteId: trabajador.id,
      estado: EstadoRequerimiento.PENDIENTE,
      prioridad: Prioridad.URGENTE,
      fechaRequerida: new Date('2026-06-15'),
      descripcion: 'Necesito cartuchos de tinta para las impresoras del departamento urgente.',
      detalles: {
        create: [
          { productoId: productos[2].id, cantidad: 5, unidadMedida: 'Unidad', observacion: 'Cartuchos negros compatibles con HP LaserJet' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
        ],
      },
    },
  });

  const req3 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-003' },
    update: {},
    create: {
      codigo: 'REQ-2026-003',
      solicitanteId: trabajador.id,
      estado: EstadoRequerimiento.RECHAZADO,
      prioridad: Prioridad.BAJA,
      fechaRequerida: new Date('2026-07-01'),
      descripcion: 'Solicitud de sillas nuevas para el area de recepcion.',
      aprobadorId: jefe.id,
      comentarioJefe: 'Rechazado por el momento. El presupuesto del mes ya fue comprometido. Reagendar para el proximo periodo.',
      detalles: {
        create: [
          { productoId: productos[8].id, cantidad: 5, unidadMedida: 'Unidad' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.RECHAZADO, comentario: 'Rechazado por el momento. El presupuesto del mes ya fue comprometido.' },
        ],
      },
    },
  });

  const req4 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-004' },
    update: {},
    create: {
      codigo: 'REQ-2026-004',
      solicitanteId: trabajador.id,
      estado: EstadoRequerimiento.EN_REVISION,
      prioridad: Prioridad.MEDIA,
      fechaRequerida: new Date('2026-06-30'),
      descripcion: 'Requerimiento de equipos de computo para el laboratorio de sistemas.',
      aprobadorId: jefe.id,
      comentarioJefe: 'Por favor adjuntar cotizaciones previas de al menos dos proveedores.',
      detalles: {
        create: [
          { productoId: productos[5].id, cantidad: 3, unidadMedida: 'Unidad' },
          { productoId: productos[9].id, cantidad: 2, unidadMedida: 'Unidad' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.EN_REVISION, comentario: 'Por favor adjuntar cotizaciones previas de al menos dos proveedores.' },
        ],
      },
    },
  });

  const req5 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-005' },
    update: {},
    create: {
      codigo: 'REQ-2026-005',
      solicitanteId: trabajador.id,
      estado: EstadoRequerimiento.BORRADOR,
      prioridad: Prioridad.MEDIA,
      fechaRequerida: new Date('2026-07-10'),
      descripcion: 'Requerimiento de insumos de limpieza para las instalaciones.',
      detalles: {
        create: [
          { productoId: productos[7].id, cantidad: 20, unidadMedida: 'Frasco' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR, comentario: 'Requerimiento en borrador' },
        ],
      },
    },
  });

  console.log(`Requerimientos creados: 5`);

  const ordenPrueba = await prisma.ordenCompra.upsert({
    where: { numero: 'OC-2026-001' },
    update: {},
    create: {
      numero: 'OC-2026-001',
      proveedorId: proveedor.id,
      estado: 'APROBADA',
      montoTotal: 450.0,
      fechaEntregaEsperada: new Date(),
      detalles: {
        create: [
          { productoId: productos[0].id, descripcion: productos[0].nombre, cantidad: 10, precioUnitario: 20, subtotal: 200 },
          { productoId: productos[1].id, descripcion: productos[1].nombre, cantidad: 25, precioUnitario: 10, subtotal: 250 },
        ],
      },
    },
  });
  console.log(`Orden de compra de prueba creada: ${ordenPrueba.numero}`);

  // ─── NOTIFICACIONES ──────────────────────────────────────────────────────────
  await prisma.notificacion.createMany({
    data: [
      {
        emisorId: trabajador.id,
        receptorId: jefe.id,
        requerimientoId: req2.id,
        titulo: 'Nuevo requerimiento urgente pendiente',
        mensaje: `El trabajador ${trabajador.nombre} ${trabajador.apellido} ha enviado el requerimiento REQ-2026-002 con prioridad URGENTE. Por favor revise.`,
        leida: false,
      },
      {
        emisorId: jefe.id,
        receptorId: trabajador.id,
        requerimientoId: req1.id,
        titulo: 'Requerimiento REQ-2026-001 aprobado',
        mensaje: 'Su requerimiento REQ-2026-001 ha sido aprobado. El proceso de compra continuara.',
        leida: true,
      },
      {
        emisorId: jefe.id,
        receptorId: trabajador.id,
        requerimientoId: req3.id,
        titulo: 'Requerimiento REQ-2026-003 rechazado',
        mensaje: 'Su requerimiento REQ-2026-003 ha sido rechazado. Motivo: presupuesto comprometido.',
        leida: false,
      },
      {
        emisorId: jefe.id,
        receptorId: trabajador.id,
        requerimientoId: req4.id,
        titulo: 'Requerimiento REQ-2026-004 requiere correcciones',
        mensaje: 'Su requerimiento REQ-2026-004 requiere informacion adicional. Por favor adjunte cotizaciones.',
        leida: false,
      },
    ],
  });

  console.log('Notificaciones creadas: 4');
  console.log('\n✅ Seed completado exitosamente!');
  console.log('\n─── Credenciales de acceso ───────────────────────');
  console.log('  ADMIN:            admin@sgca.com     | Admin123!');
  console.log('  TRABAJADOR:       trabajador@sgca.com| Admin123!');
  console.log('  JEFE_AREA:        jefe@sgca.com      | Admin123!');
  console.log('  ANALISTA_COMPRAS: analista@sgca.com  | Admin123!');
  console.log('  GERENTE:          gerente@sgca.com   | Admin123!');
  console.log('  PROVEEDOR:        proveedor@sgca.com | Admin123!');
  console.log('  ENCARGADO_ALMACEN:almacen@sgca.com   | Admin123!');
  console.log('  CONTADOR:         contador@sgca.com  | Admin123!');
  console.log('───────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
