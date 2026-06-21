
import { PrismaClient, Rol, EstadoRequerimiento, Prioridad, EstadoOrdenCompra, EstadoItemRecepcion, EstadoSolicitudCotizacion, EstadoOferta, EstadoFactura } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // ─── USUARIOS EXISTENTES (NO MODIFICAR) + NUEVOS ───────────────────────────
  const usuarios = await Promise.all([
    // Usuarios existentes
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
    // Nuevos JEFE_AREA
    prisma.usuario.upsert({
      where: { email: 'jefe.sistemas@sgca.com' },
      update: {},
      create: { nombre: 'Diego', apellido: 'Ruiz', email: 'jefe.sistemas@sgca.com', password: hashedPassword, rol: Rol.JEFE_AREA },
    }),
    prisma.usuario.upsert({
      where: { email: 'jefe.operaciones@sgca.com' },
      update: {},
      create: { nombre: 'Fernanda', apellido: 'Castillo', email: 'jefe.operaciones@sgca.com', password: hashedPassword, rol: Rol.JEFE_AREA },
    }),
    // Nuevos TRABAJADORES
    prisma.usuario.upsert({
      where: { email: 'trabajador2@sgca.com' },
      update: {},
      create: { nombre: 'Julio', apellido: 'Alvarez', email: 'trabajador2@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador3@sgca.com' },
      update: {},
      create: { nombre: 'Carla', apellido: 'Gutierrez', email: 'trabajador3@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador4@sgca.com' },
      update: {},
      create: { nombre: 'Mario', apellido: 'Fernandez', email: 'trabajador4@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador5@sgca.com' },
      update: {},
      create: { nombre: 'Lucia', apellido: 'Herrera', email: 'trabajador5@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador6@sgca.com' },
      update: {},
      create: { nombre: 'Raul', apellido: 'Molina', email: 'trabajador6@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador7@sgca.com' },
      update: {},
      create: { nombre: 'Valeria', apellido: 'Ortiz', email: 'trabajador7@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'trabajador8@sgca.com' },
      update: {},
      create: { nombre: 'Gustavo', apellido: 'Quispe', email: 'trabajador8@sgca.com', password: hashedPassword, rol: Rol.TRABAJADOR },
    }),
    // Nuevo ENCARGADO_ALMACEN
    prisma.usuario.upsert({
      where: { email: 'almacen2@sgca.com' },
      update: {},
      create: { nombre: 'Javier', apellido: 'Perez', email: 'almacen2@sgca.com', password: hashedPassword, rol: Rol.ENCARGADO_ALMACEN },
    }),
    // Nuevos PROVEEDORES
    prisma.usuario.upsert({
      where: { email: 'proveedor2@sgca.com' },
      update: {},
      create: { nombre: 'Ricardo', apellido: 'Silva', email: 'proveedor2@sgca.com', password: hashedPassword, rol: Rol.PROVEEDOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'proveedor3@sgca.com' },
      update: {},
      create: { nombre: 'Patricia', apellido: 'Rojas', email: 'proveedor3@sgca.com', password: hashedPassword, rol: Rol.PROVEEDOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'proveedor4@sgca.com' },
      update: {},
      create: { nombre: 'Oscar', apellido: 'Cruz', email: 'proveedor4@sgca.com', password: hashedPassword, rol: Rol.PROVEEDOR },
    }),
    prisma.usuario.upsert({
      where: { email: 'proveedor5@sgca.com' },
      update: {},
      create: { nombre: 'Monica', apellido: 'Flores', email: 'proveedor5@sgca.com', password: hashedPassword, rol: Rol.PROVEEDOR },
    }),
  ]);

  console.log(`Usuarios creados/actualizados: ${usuarios.length}`);

  // ─── PROVEEDORES EXISTENTE + NUEVOS ─────────────────────────────────────────
  const proveedores = await Promise.all([
    prisma.proveedor.upsert({
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
    }),
    prisma.proveedor.upsert({
      where: { ruc: '20987654321' },
      update: { email: 'proveedor2@sgca.com' },
      create: {
        ruc: '20987654321',
        razonSocial: 'Distribuidora Global S.A.',
        email: 'proveedor2@sgca.com',
        contacto: 'Ricardo Silva',
        telefono: '999888777',
        direccion: 'Av. Industrial 456, Lima',
      },
    }),
    prisma.proveedor.upsert({
      where: { ruc: '20111222333' },
      update: { email: 'proveedor3@sgca.com' },
      create: {
        ruc: '20111222333',
        razonSocial: 'Equipos y Tecnologia E.I.R.L.',
        email: 'proveedor3@sgca.com',
        contacto: 'Patricia Rojas',
        telefono: '988776655',
        direccion: 'Jr. Tecnologico 789, Arequipa',
      },
    }),
    prisma.proveedor.upsert({
      where: { ruc: '20444555666' },
      update: { email: 'proveedor4@sgca.com' },
      create: {
        ruc: '20444555666',
        razonSocial: 'Limpieza Profesional S.A.C.',
        email: 'proveedor4@sgca.com',
        contacto: 'Oscar Cruz',
        telefono: '977665544',
        direccion: 'Av. Higiene 321, Trujillo',
      },
    }),
    prisma.proveedor.upsert({
      where: { ruc: '20777888999' },
      update: { email: 'proveedor5@sgca.com' },
      create: {
        ruc: '20777888999',
        razonSocial: 'Ferreteria Industrial del Norte S.A.',
        email: 'proveedor5@sgca.com',
        contacto: 'Monica Flores',
        telefono: '966554433',
        direccion: 'Av. Industrial 654, Chiclayo',
      },
    }),
  ]);

  console.log(`Proveedores creados/actualizados: ${proveedores.length}`);

  // ─── PRODUCTOS EXISTENTES + NUEVOS (50 TOTAL) ─────────────────────────────
  const productosData = [
    // Utiles de Oficina (existentes)
    { codigo: 'PRD-001', nombre: 'Papel Bond A4 (resma 500 hojas)', unidadMedida: 'Resma', categoria: 'Utiles de Oficina', precioReferencial: 15.50 },
    { codigo: 'PRD-002', nombre: 'Lapicero Azul BIC', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 1.20 },
    { codigo: 'PRD-003', nombre: 'Cartucho de Tinta HP Negro', unidadMedida: 'Unidad', categoria: 'Insumos de Impresion', precioReferencial: 45.00 },
    { codigo: 'PRD-004', nombre: 'Folder Manila A4', unidadMedida: 'Paquete x25', categoria: 'Utiles de Oficina', precioReferencial: 8.00 },
    { codigo: 'PRD-005', nombre: 'Engrapador Estandar', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 22.00 },
    // Equipos de Computo (existentes)
    { codigo: 'PRD-006', nombre: 'Disco Duro Externo 1TB', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 280.00 },
    { codigo: 'PRD-007', nombre: 'Teclado USB Estandar', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 65.00 },
    { codigo: 'PRD-008', nombre: 'Desinfectante en Spray 500ml', unidadMedida: 'Frasco', categoria: 'Limpieza e Higiene', precioReferencial: 12.50 },
    { codigo: 'PRD-009', nombre: 'Silla Ergonomica de Oficina', unidadMedida: 'Unidad', categoria: 'Mobiliario', precioReferencial: 450.00 },
    { codigo: 'PRD-010', nombre: 'Monitor LED 24 pulgadas', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 850.00 },
    // UTILES DE OFICINA NUEVOS
    { codigo: 'PRD-011', nombre: 'Lapicero Negro BIC', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 1.20 },
    { codigo: 'PRD-012', nombre: 'Lapicero Rojo BIC', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 1.30 },
    { codigo: 'PRD-013', nombre: 'Lápiz HB 2B', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 0.80 },
    { codigo: 'PRD-014', nombre: 'Goma de Borrar Blanca', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 1.50 },
    { codigo: 'PRD-015', nombre: 'Sacapuntas Manual', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 3.00 },
    { codigo: 'PRD-016', nombre: 'Marcador Permanente Negro', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 4.50 },
    { codigo: 'PRD-017', nombre: 'Marcador Permanente Rojo', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 4.50 },
    { codigo: 'PRD-018', nombre: 'Marcador de Pizarra Negro', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 5.00 },
    { codigo: 'PRD-019', nombre: 'Tijeras Oficina 8"', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 12.00 },
    { codigo: 'PRD-020', nombre: 'Cutter Metalico', unidadMedida: 'Unidad', categoria: 'Utiles de Oficina', precioReferencial: 8.50 },
    // INSUMOS DE IMPRESION
    { codigo: 'PRD-021', nombre: 'Cartucho de Tinta HP Color', unidadMedida: 'Unidad', categoria: 'Insumos de Impresion', precioReferencial: 75.00 },
    { codigo: 'PRD-022', nombre: 'Toner HP LaserJet Negro', unidadMedida: 'Unidad', categoria: 'Insumos de Impresion', precioReferencial: 180.00 },
    { codigo: 'PRD-023', nombre: 'Papel Fotografico A4', unidadMedida: 'Hoja', categoria: 'Insumos de Impresion', precioReferencial: 0.80 },
    // EQUIPOS DE COMPUTO
    { codigo: 'PRD-024', nombre: 'Mouse USB Optico', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 35.00 },
    { codigo: 'PRD-025', nombre: 'Webcam HD 1080p', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 120.00 },
    { codigo: 'PRD-026', nombre: 'Audifonos USB con Microfono', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 85.00 },
    { codigo: 'PRD-027', nombre: 'UPS 600VA', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 250.00 },
    { codigo: 'PRD-028', nombre: 'Hub USB 4 Puertos', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 30.00 },
    { codigo: 'PRD-029', nombre: 'Cable HDMI 2m', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 20.00 },
    { codigo: 'PRD-030', nombre: 'Cable VGA 3m', unidadMedida: 'Unidad', categoria: 'Equipos de Computo', precioReferencial: 18.00 },
    // LIMPIEZA E HIGIENE
    { codigo: 'PRD-031', nombre: 'Jabon Liquido Antibacterial 500ml', unidadMedida: 'Frasco', categoria: 'Limpieza e Higiene', precioReferencial: 15.00 },
    { codigo: 'PRD-032', nombre: 'Papel Higienico 12 rollos', unidadMedida: 'Paquete', categoria: 'Limpieza e Higiene', precioReferencial: 25.00 },
    { codigo: 'PRD-033', nombre: 'Toallas de Papel Interdobladas', unidadMedida: 'Paquete x200', categoria: 'Limpieza e Higiene', precioReferencial: 18.00 },
    { codigo: 'PRD-034', nombre: 'Detergente Multiusos 5L', unidadMedida: 'Galon', categoria: 'Limpieza e Higiene', precioReferencial: 35.00 },
    { codigo: 'PRD-035', nombre: 'Escoba de Fibra', unidadMedida: 'Unidad', categoria: 'Limpieza e Higiene', precioReferencial: 20.00 },
    { codigo: 'PRD-036', nombre: 'Trapeador con Mango', unidadMedida: 'Unidad', categoria: 'Limpieza e Higiene', precioReferencial: 45.00 },
    { codigo: 'PRD-037', nombre: 'Recipiente de Basura 50L', unidadMedida: 'Unidad', categoria: 'Limpieza e Higiene', precioReferencial: 55.00 },
    // MOBILIARIO
    { codigo: 'PRD-038', nombre: 'Mesa de Oficina 1.60m', unidadMedida: 'Unidad', categoria: 'Mobiliario', precioReferencial: 550.00 },
    { codigo: 'PRD-039', nombre: 'Archivador de Metal 4 Gavetas', unidadMedida: 'Unidad', categoria: 'Mobiliario', precioReferencial: 380.00 },
    { codigo: 'PRD-040', nombre: 'Silla de Visitante', unidadMedida: 'Unidad', categoria: 'Mobiliario', precioReferencial: 180.00 },
    { codigo: 'PRD-041', nombre: 'Lampara de Escritorio LED', unidadMedida: 'Unidad', categoria: 'Mobiliario', precioReferencial: 60.00 },
    // SEGURIDAD INDUSTRIAL
    { codigo: 'PRD-042', nombre: 'Casco de Seguridad Blanco', unidadMedida: 'Unidad', categoria: 'Seguridad Industrial', precioReferencial: 45.00 },
    { codigo: 'PRD-043', nombre: 'Guantes de Nitrilo (Caja x100)', unidadMedida: 'Caja', categoria: 'Seguridad Industrial', precioReferencial: 35.00 },
    { codigo: 'PRD-044', nombre: 'Gafas de Seguridad Transparentes', unidadMedida: 'Unidad', categoria: 'Seguridad Industrial', precioReferencial: 18.00 },
    { codigo: 'PRD-045', nombre: 'Chaleco Reflectivo Naranja', unidadMedida: 'Unidad', categoria: 'Seguridad Industrial', precioReferencial: 28.00 },
    { codigo: 'PRD-046', nombre: 'Botas de Seguridad PVC', unidadMedida: 'Par', categoria: 'Seguridad Industrial', precioReferencial: 85.00 },
    // FERRETERIA
    { codigo: 'PRD-047', nombre: 'Destornillador Phillips #2', unidadMedida: 'Unidad', categoria: 'Ferreteria', precioReferencial: 12.00 },
    { codigo: 'PRD-048', nombre: 'Destornillador Plano 6mm', unidadMedida: 'Unidad', categoria: 'Ferreteria', precioReferencial: 11.00 },
    { codigo: 'PRD-049', nombre: 'Martillo de Garra 16oz', unidadMedida: 'Unidad', categoria: 'Ferreteria', precioReferencial: 45.00 },
    { codigo: 'PRD-050', nombre: 'Llave Ajustable 10"', unidadMedida: 'Unidad', categoria: 'Ferreteria', precioReferencial: 35.00 },
  ];

  const productos = await Promise.all(
    productosData.map(p => prisma.producto.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p
    }))
  );

  console.log(`Productos creados/actualizados: ${productos.length}`);

  const trabajador = usuarios.find(u => u.email === 'trabajador@sgca.com')!;
  const trabajador2 = usuarios.find(u => u.email === 'trabajador2@sgca.com')!;
  const trabajador3 = usuarios.find(u => u.email === 'trabajador3@sgca.com')!;
  const trabajador4 = usuarios.find(u => u.email === 'trabajador4@sgca.com')!;
  const jefe = usuarios.find(u => u.email === 'jefe@sgca.com')!;
  const jefeSistemas = usuarios.find(u => u.email === 'jefe.sistemas@sgca.com')!;
  const jefeOperaciones = usuarios.find(u => u.email === 'jefe.operaciones@sgca.com')!;
  const analista = usuarios.find(u => u.email === 'analista@sgca.com')!;
  const gerente = usuarios.find(u => u.email === 'gerente@sgca.com')!;
  const almacenUser = usuarios.find(u => u.email === 'almacen@sgca.com')!;
  const contador = usuarios.find(u => u.email === 'contador@sgca.com')!;

  // ─── REQUERIMIENTOS EXISTENTES + NUEVOS (10 TOTAL) ──────────────────────────
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

  // REQUERIMIENTOS NUEVOS
  const req6 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-006' },
    update: {},
    create: {
      codigo: 'REQ-2026-006',
      solicitanteId: trabajador2.id,
      estado: EstadoRequerimiento.APROBADO,
      prioridad: Prioridad.MEDIA,
      fechaRequerida: new Date('2026-06-25'),
      descripcion: 'Equipos de seguridad para el area de mantenimiento.',
      aprobadorId: jefeSistemas.id,
      comentarioJefe: 'Aprobado. Es necesario para cumplir con normativas.',
      detalles: {
        create: [
          { productoId: productos[41].id, cantidad: 5, unidadMedida: 'Unidad' }, // Casco
          { productoId: productos[42].id, cantidad: 2, unidadMedida: 'Caja' }, // Guantes
          { productoId: productos[43].id, cantidad: 10, unidadMedida: 'Unidad' }, // Gafas
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.APROBADO },
        ],
      },
    },
  });

  const req7 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-007' },
    update: {},
    create: {
      codigo: 'REQ-2026-007',
      solicitanteId: trabajador3.id,
      estado: EstadoRequerimiento.APROBADO,
      prioridad: Prioridad.BAJA,
      fechaRequerida: new Date('2026-07-05'),
      descripcion: 'Reposicion de mobiliario para la sala de reuniones.',
      aprobadorId: jefeOperaciones.id,
      detalles: {
        create: [
          { productoId: productos[40].id, cantidad: 6, unidadMedida: 'Unidad' }, // Sillas visitante
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.APROBADO },
        ],
      },
    },
  });

  const req8 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-008' },
    update: {},
    create: {
      codigo: 'REQ-2026-008',
      solicitanteId: trabajador4.id,
      estado: EstadoRequerimiento.PENDIENTE,
      prioridad: Prioridad.ALTA,
      fechaRequerida: new Date('2026-06-22'),
      descripcion: 'Materiales de ferreteria para mantenimiento del local.',
      detalles: {
        create: [
          { productoId: productos[46].id, cantidad: 3, unidadMedida: 'Unidad' },
          { productoId: productos[48].id, cantidad: 2, unidadMedida: 'Unidad' },
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

  const req9 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-009' },
    update: {},
    create: {
      codigo: 'REQ-2026-009',
      solicitanteId: trabajador.id,
      estado: EstadoRequerimiento.APROBADO,
      prioridad: Prioridad.URGENTE,
      fechaRequerida: new Date('2026-06-18'),
      descripcion: 'Insumos de limpieza urgentes por visita de auditoria.',
      aprobadorId: jefe.id,
      detalles: {
        create: [
          { productoId: productos[30].id, cantidad: 5, unidadMedida: 'Galon' },
          { productoId: productos[33].id, cantidad: 20, unidadMedida: 'Paquete' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.APROBADO },
        ],
      },
    },
  });

  const req10 = await prisma.requerimiento.upsert({
    where: { codigo: 'REQ-2026-010' },
    update: {},
    create: {
      codigo: 'REQ-2026-010',
      solicitanteId: trabajador2.id,
      estado: EstadoRequerimiento.APROBADO,
      prioridad: Prioridad.MEDIA,
      fechaRequerida: new Date('2026-06-28'),
      descripcion: 'Reposicion de utiles de oficina para el nuevo personal.',
      aprobadorId: jefeSistemas.id,
      detalles: {
        create: [
          { productoId: productos[0].id, cantidad: 5, unidadMedida: 'Resma' },
          { productoId: productos[10].id, cantidad: 100, unidadMedida: 'Unidad' },
          { productoId: productos[3].id, cantidad: 10, unidadMedida: 'Paquete x25' },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoRequerimiento.BORRADOR },
          { estadoAnterior: EstadoRequerimiento.BORRADOR, estadoNuevo: EstadoRequerimiento.PENDIENTE },
          { estadoAnterior: EstadoRequerimiento.PENDIENTE, estadoNuevo: EstadoRequerimiento.APROBADO },
        ],
      },
    },
  });

  const requerimientos = [req1, req2, req3, req4, req5, req6, req7, req8, req9, req10];
  console.log(`Requerimientos creados/actualizados: ${requerimientos.length}`);

  // ─── COTIZACIONES Y OFERTAS EXISTENTES + NUEVAS ─────────────────────────────
  const solicitud1 = await prisma.solicitudCotizacion.upsert({
    where: { codigo: 'COT-2026-001' },
    update: {},
    create: {
      codigo: 'COT-2026-001',
      requerimientoId: req1.id,
      analistaId: analista.id,
      titulo: 'Cotizacion de utiles de oficina',
      fechaLimite: new Date('2026-06-25'),
      estado: EstadoSolicitudCotizacion.ADJUDICADA,
      proveedorGanadorId: proveedores[0].id,
      justificacionSeleccion: 'Mejor relacion calidad-precio',
      items: {
        create: [
          { descripcion: productos[0].nombre, cantidad: 10, unidadMedida: 'Resma' },
          { descripcion: productos[1].nombre, cantidad: 50, unidadMedida: 'Unidad' }
        ]
      }
    },
    include: { items: true }
  });

  // Ofertas para COT-2026-001 (3 proveedores)
  const oferta1_1 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud1.id, proveedorId: proveedores[0].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud1.id,
      proveedorId: proveedores[0].id,
      montoTotal: 450,
      plazoEntregaDias: 5,
      condicionesPago: '30 dias',
      estado: EstadoOferta.SELECCIONADA,
      puntajePrecio: 95,
      puntajePlazo: 90,
      puntajeHistorial: 85,
      puntajeTotal: 91,
      posicionRanking: 1
    }
  });

  const oferta1_2 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud1.id, proveedorId: proveedores[1].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud1.id,
      proveedorId: proveedores[1].id,
      montoTotal: 480,
      plazoEntregaDias: 7,
      condicionesPago: '15 dias',
      estado: EstadoOferta.RECHAZADA,
      puntajePrecio: 80,
      puntajePlazo: 70,
      puntajeHistorial: 88,
      puntajeTotal: 79,
      posicionRanking: 2
    }
  });

  const oferta1_3 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud1.id, proveedorId: proveedores[2].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud1.id,
      proveedorId: proveedores[2].id,
      montoTotal: 520,
      plazoEntregaDias: 3,
      condicionesPago: 'Contra entrega',
      estado: EstadoOferta.RECHAZADA,
      puntajePrecio: 70,
      puntajePlazo: 95,
      puntajeHistorial: 80,
      puntajeTotal: 80,
      posicionRanking: 3
    }
  });

  // COTIZACION 2: REQUERIMIENTO 6 (SEGURIDAD INDUSTRIAL)
  const solicitud2 = await prisma.solicitudCotizacion.upsert({
    where: { codigo: 'COT-2026-002' },
    update: {},
    create: {
      codigo: 'COT-2026-002',
      requerimientoId: req6.id,
      analistaId: analista.id,
      titulo: 'Cotizacion de equipos de seguridad',
      fechaLimite: new Date('2026-06-22'),
      estado: EstadoSolicitudCotizacion.CERRADA,
      items: {
        create: [
          { descripcion: productos[41].nombre, cantidad: 5, unidadMedida: 'Unidad' },
          { descripcion: productos[42].nombre, cantidad: 2, unidadMedida: 'Caja' },
          { descripcion: productos[43].nombre, cantidad: 10, unidadMedida: 'Unidad' }
        ]
      }
    },
    include: { items: true }
  });

  const oferta2_1 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud2.id, proveedorId: proveedores[4].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud2.id,
      proveedorId: proveedores[4].id,
      montoTotal: 650,
      plazoEntregaDias: 4,
      condicionesPago: '30 dias',
      estado: EstadoOferta.RECIBIDA,
      puntajePrecio: 90,
      puntajePlazo: 88,
      puntajeHistorial: 85,
      puntajeTotal: 88,
      posicionRanking: 1
    }
  });

  const oferta2_2 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud2.id, proveedorId: proveedores[0].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud2.id,
      proveedorId: proveedores[0].id,
      montoTotal: 680,
      plazoEntregaDias: 6,
      condicionesPago: '15 dias',
      estado: EstadoOferta.RECIBIDA,
      puntajePrecio: 85,
      puntajePlazo: 80,
      puntajeHistorial: 88,
      puntajeTotal: 84,
      posicionRanking: 2
    }
  });

  // COTIZACION 3: REQUERIMIENTO 9 (LIMPIEZA) - ADJUDICADA
  const solicitud3 = await prisma.solicitudCotizacion.upsert({
    where: { codigo: 'COT-2026-003' },
    update: {},
    create: {
      codigo: 'COT-2026-003',
      requerimientoId: req9.id,
      analistaId: analista.id,
      titulo: 'Cotizacion de insumos de limpieza',
      fechaLimite: new Date('2026-06-19'),
      estado: EstadoSolicitudCotizacion.ADJUDICADA,
      proveedorGanadorId: proveedores[3].id,
      justificacionSeleccion: 'Especialistas en limpieza, entrega inmediata',
      items: {
        create: [
          { descripcion: productos[30].nombre, cantidad: 5, unidadMedida: 'Galon' },
          { descripcion: productos[33].nombre, cantidad: 20, unidadMedida: 'Paquete' }
        ]
      }
    },
    include: { items: true }
  });

  const oferta3_1 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud3.id, proveedorId: proveedores[3].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud3.id,
      proveedorId: proveedores[3].id,
      montoTotal: 535,
      plazoEntregaDias: 1,
      condicionesPago: 'Contra entrega',
      estado: EstadoOferta.SELECCIONADA,
      puntajePrecio: 92,
      puntajePlazo: 98,
      puntajeHistorial: 95,
      puntajeTotal: 95,
      posicionRanking: 1
    }
  });

  const oferta3_2 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud3.id, proveedorId: proveedores[1].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud3.id,
      proveedorId: proveedores[1].id,
      montoTotal: 500,
      plazoEntregaDias: 5,
      condicionesPago: '30 dias',
      estado: EstadoOferta.RECHAZADA,
      puntajePrecio: 95,
      puntajePlazo: 75,
      puntajeHistorial: 85,
      puntajeTotal: 86,
      posicionRanking: 2
    }
  });

  // COTIZACION 4: REQUERIMIENTO 10 (UTILES) - ABIERTA
  const solicitud4 = await prisma.solicitudCotizacion.upsert({
    where: { codigo: 'COT-2026-004' },
    update: {},
    create: {
      codigo: 'COT-2026-004',
      requerimientoId: req10.id,
      analistaId: analista.id,
      titulo: 'Cotizacion de utiles para nuevo personal',
      fechaLimite: new Date('2026-06-24'),
      estado: EstadoSolicitudCotizacion.ABIERTA,
      items: {
        create: [
          { descripcion: productos[0].nombre, cantidad: 5, unidadMedida: 'Resma' },
          { descripcion: productos[10].nombre, cantidad: 100, unidadMedida: 'Unidad' },
          { descripcion: productos[3].nombre, cantidad: 10, unidadMedida: 'Paquete x25' }
        ]
      }
    },
    include: { items: true }
  });

  // COTIZACION 5: REQUERIMIENTO 10 (UTILES OFICINA) - ADJUDICADA, SIN OC
  const solicitud5 = await prisma.solicitudCotizacion.upsert({
    where: { codigo: 'COT-2026-005' },
    update: {},
    create: {
      codigo: 'COT-2026-005',
      requerimientoId: req10.id,
      analistaId: analista.id,
      titulo: 'Cotizacion de utiles de oficina para nuevo personal',
      fechaLimite: new Date('2026-06-21'),
      estado: EstadoSolicitudCotizacion.ADJUDICADA,
      proveedorGanadorId: proveedores[1].id,
      justificacionSeleccion: 'Mejor relacion calidad-precio',
      items: {
        create: [
          { descripcion: productos[0].nombre, cantidad: 5, unidadMedida: 'Resma' },
          { descripcion: productos[10].nombre, cantidad: 100, unidadMedida: 'Unidad' },
          { descripcion: productos[3].nombre, cantidad: 10, unidadMedida: 'Paquete x25' }
        ]
      }
    },
    include: { items: true }
  });

  const oferta5_1 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud5.id, proveedorId: proveedores[1].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud5.id,
      proveedorId: proveedores[1].id,
      montoTotal: 480,
      plazoEntregaDias: 3,
      condicionesPago: '15 dias',
      estado: EstadoOferta.SELECCIONADA,
      puntajePrecio: 90,
      puntajePlazo: 85,
      puntajeHistorial: 88,
      puntajeTotal: 88,
      posicionRanking: 1
    }
  });

  const oferta5_2 = await prisma.ofertaProveedor.upsert({
    where: { solicitudCotizacionId_proveedorId: { solicitudCotizacionId: solicitud5.id, proveedorId: proveedores[0].id } },
    update: {},
    create: {
      solicitudCotizacionId: solicitud5.id,
      proveedorId: proveedores[0].id,
      montoTotal: 500,
      plazoEntregaDias: 5,
      condicionesPago: '30 dias',
      estado: EstadoOferta.RECHAZADA,
      puntajePrecio: 85,
      puntajePlazo: 75,
      puntajeHistorial: 90,
      puntajeTotal: 83,
      posicionRanking: 2
    }
  });

  console.log('Cotizaciones y ofertas creadas/actualizadas');

  // ─── ORDENES DE COMPRA EXISTENTES + NUEVAS ─────────────────────────────────
  let numOC = 1;
  const generarNumOC = () => `OC-2026-${String(numOC++).padStart(3, '0')}`;

  // OC-2026-001 EXISTENTE: RECEPCION PARCIAL
  const subtotal1 = 450;
  const igv1 = subtotal1 * 0.18;
  const total1 = subtotal1 + igv1;
  const orden1 = await prisma.ordenCompra.upsert({
    where: { numero: 'OC-2026-001' },
    update: {},
    create: {
      numero: 'OC-2026-001',
      solicitudCotizacionId: solicitud1.id,
      ofertaGanadoraId: oferta1_1.id,
      proveedorId: proveedores[0].id,
      estado: EstadoOrdenCompra.RECEPCION_PARCIAL,
      subtotal: subtotal1,
      igv: igv1,
      montoTotal: total1,
      fechaEmision: new Date(),
      fechaEntregaEsperada: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      condicionesComerciales: '30 dias',
      gerenteAprobadorId: gerente.id,
      fechaAprobacion: new Date(),
      detalles: {
        create: [
          { productoId: productos[0].id, descripcion: productos[0].nombre, cantidad: 10, precioUnitario: 20, subtotal: 200 },
          { productoId: productos[1].id, descripcion: productos[1].nombre, cantidad: 25, precioUnitario: 10, subtotal: 250 },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoOrdenCompra.PENDIENTE_APROBACION, usuarioId: analista.id, observaciones: 'Orden creada' },
          { estadoAnterior: EstadoOrdenCompra.PENDIENTE_APROBACION, estadoNuevo: EstadoOrdenCompra.APROBADA, usuarioId: gerente.id, observaciones: 'Aprobada por gerencia' },
          { estadoAnterior: EstadoOrdenCompra.APROBADA, estadoNuevo: EstadoOrdenCompra.ENVIADA_PROVEEDOR, usuarioId: analista.id },
          { estadoAnterior: EstadoOrdenCompra.ENVIADA_PROVEEDOR, estadoNuevo: EstadoOrdenCompra.EN_RECEPCION },
          { estadoAnterior: EstadoOrdenCompra.EN_RECEPCION, estadoNuevo: EstadoOrdenCompra.RECEPCION_PARCIAL }
        ]
      }
    },
  });

  // OC-2026-002: ENVIADA PROVEEDOR
  const subtotal2 = 535;
  const igv2 = subtotal2 * 0.18;
  const total2 = subtotal2 + igv2;
  const orden2 = await prisma.ordenCompra.upsert({
    where: { numero: 'OC-2026-002' },
    update: {},
    create: {
      numero: 'OC-2026-002',
      solicitudCotizacionId: solicitud3.id,
      ofertaGanadoraId: oferta3_1.id,
      proveedorId: proveedores[3].id,
      estado: EstadoOrdenCompra.ENVIADA_PROVEEDOR,
      subtotal: subtotal2,
      igv: igv2,
      montoTotal: total2,
      fechaEmision: new Date(),
      fechaEntregaEsperada: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      condicionesComerciales: 'Contra entrega',
      gerenteAprobadorId: gerente.id,
      fechaAprobacion: new Date(),
      detalles: {
        create: [
          { productoId: productos[30].id, descripcion: productos[30].nombre, cantidad: 5, precioUnitario: 35, subtotal: 175 },
          { productoId: productos[33].id, descripcion: productos[33].nombre, cantidad: 20, precioUnitario: 18, subtotal: 360 },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoOrdenCompra.PENDIENTE_APROBACION, usuarioId: analista.id, observaciones: 'Orden creada' },
          { estadoAnterior: EstadoOrdenCompra.PENDIENTE_APROBACION, estadoNuevo: EstadoOrdenCompra.APROBADA, usuarioId: gerente.id, observaciones: 'Aprobada, entrega inmediata' },
          { estadoAnterior: EstadoOrdenCompra.APROBADA, estadoNuevo: EstadoOrdenCompra.ENVIADA_PROVEEDOR, usuarioId: analista.id },
        ]
      }
    },
  });

  // OC-2026-003: RECEPCION COMPLETA, CERRADA
  const subtotal3 = 650;
  const igv3 = subtotal3 * 0.18;
  const total3 = subtotal3 + igv3;
  const orden3 = await prisma.ordenCompra.upsert({
    where: { numero: 'OC-2026-003' },
    update: {},
    create: {
      numero: 'OC-2026-003',
      solicitudCotizacionId: solicitud2.id,
      ofertaGanadoraId: oferta2_1.id,
      proveedorId: proveedores[4].id,
      estado: EstadoOrdenCompra.CERRADA,
      subtotal: subtotal3,
      igv: igv3,
      montoTotal: total3,
      fechaEmision: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      fechaEntregaEsperada: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      condicionesComerciales: '30 dias',
      gerenteAprobadorId: gerente.id,
      fechaAprobacion: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      detalles: {
        create: [
          { productoId: productos[41].id, descripcion: productos[41].nombre, cantidad: 5, precioUnitario: 45, subtotal: 225 },
          { productoId: productos[42].id, descripcion: productos[42].nombre, cantidad: 2, precioUnitario: 35, subtotal: 70 },
          { productoId: productos[43].id, descripcion: productos[43].nombre, cantidad: 10, precioUnitario: 18, subtotal: 180 },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoOrdenCompra.PENDIENTE_APROBACION, usuarioId: analista.id },
          { estadoAnterior: EstadoOrdenCompra.PENDIENTE_APROBACION, estadoNuevo: EstadoOrdenCompra.APROBADA, usuarioId: gerente.id },
          { estadoAnterior: EstadoOrdenCompra.APROBADA, estadoNuevo: EstadoOrdenCompra.ENVIADA_PROVEEDOR, usuarioId: analista.id },
          { estadoAnterior: EstadoOrdenCompra.ENVIADA_PROVEEDOR, estadoNuevo: EstadoOrdenCompra.EN_RECEPCION },
          { estadoAnterior: EstadoOrdenCompra.EN_RECEPCION, estadoNuevo: EstadoOrdenCompra.RECEPCION_COMPLETA },
          { estadoAnterior: EstadoOrdenCompra.RECEPCION_COMPLETA, estadoNuevo: EstadoOrdenCompra.CERRADA, usuarioId: contador.id, observaciones: 'Factura recibida y pagada' },
        ]
      }
    },
  });

  // OC-2026-004: PENDIENTE APROBACION
  const subtotal4 = 390;
  const igv4 = subtotal4 * 0.18;
  const total4 = subtotal4 + igv4;
  const orden4 = await prisma.ordenCompra.upsert({
    where: { numero: 'OC-2026-004' },
    update: {},
    create: {
      numero: 'OC-2026-004',
      solicitudCotizacionId: solicitud1.id,
      ofertaGanadoraId: oferta1_1.id,
      proveedorId: proveedores[0].id,
      estado: EstadoOrdenCompra.PENDIENTE_APROBACION,
      subtotal: subtotal4,
      igv: igv4,
      montoTotal: total4,
      fechaEmision: new Date(),
      fechaEntregaEsperada: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      condicionesComerciales: '30 dias',
      detalles: {
        create: [
          { productoId: productos[3].id, descripcion: productos[3].nombre, cantidad: 20, precioUnitario: 8, subtotal: 160 },
          { productoId: productos[4].id, descripcion: productos[4].nombre, cantidad: 5, precioUnitario: 22, subtotal: 110 },
          { productoId: productos[5].id, descripcion: productos[5].nombre, cantidad: 2, precioUnitario: 60, subtotal: 120 },
        ],
      },
      historial: {
        create: [
          { estadoNuevo: EstadoOrdenCompra.PENDIENTE_APROBACION, usuarioId: analista.id, observaciones: 'Orden creada, esperando aprobacion gerencial' },
        ]
      }
    },
  });

  const ordenesCompra = [orden1, orden2, orden3, orden4];
  console.log(`Ordenes de compra creadas/actualizadas: ${ordenesCompra.length}`);

  // ─── RECEPCIONES ─────────────────────────────────────────────────────────────
  const recepcion1 = await prisma.recepcion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      ordenCompraId: orden1.id,
      fechaRecepcion: new Date(),
      responsableId: almacenUser.id,
      estado: 'PARCIAL',
      observaciones: 'Primera entrega de la orden OC-2026-001. Faltan 2 resmas de papel.',
      detalles: {
        create: [
          {
            productoId: productos[0].id,
            descripcion: productos[0].nombre,
            cantidadEsperada: 10,
            cantidadRecibida: 8,
            estado: EstadoItemRecepcion.CONFORME,
            observacion: 'Faltan 2 resmas'
          },
          {
            productoId: productos[1].id,
            descripcion: productos[1].nombre,
            cantidadEsperada: 25,
            cantidadRecibida: 25,
            estado: EstadoItemRecepcion.CONFORME,
          }
        ]
      }
    }
  });

  const recepcion2 = await prisma.recepcion.upsert({
    where: { id: 2 },
    update: {},
    create: {
      ordenCompraId: orden3.id,
      fechaRecepcion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      responsableId: almacenUser.id,
      estado: 'COMPLETA',
      observaciones: 'Entrega completa OC-2026-003',
      detalles: {
        create: [
          {
            productoId: productos[41].id,
            descripcion: productos[41].nombre,
            cantidadEsperada: 5,
            cantidadRecibida: 5,
            estado: EstadoItemRecepcion.CONFORME,
          },
          {
            productoId: productos[42].id,
            descripcion: productos[42].nombre,
            cantidadEsperada: 2,
            cantidadRecibida: 2,
            estado: EstadoItemRecepcion.CONFORME,
          },
          {
            productoId: productos[43].id,
            descripcion: productos[43].nombre,
            cantidadEsperada: 10,
            cantidadRecibida: 10,
            estado: EstadoItemRecepcion.CONFORME,
          }
        ]
      }
    }
  });

  console.log(`Recepciones creadas/actualizadas: 2`);

  // ─── INVENTARIO ─────────────────────────────────────────────────────────────
  // Actualizar inventario para productos que tienen recepciones
  await prisma.inventario.upsert({
    where: { productoId: productos[0].id },
    update: { cantidad: 8, stockMinimo: 5 },
    create: { productoId: productos[0].id, cantidad: 8, stockMinimo: 5 },
  });
  await prisma.inventario.upsert({
    where: { productoId: productos[1].id },
    update: { cantidad: 25, stockMinimo: 10 },
    create: { productoId: productos[1].id, cantidad: 25, stockMinimo: 10 },
  });
  await prisma.inventario.upsert({
    where: { productoId: productos[41].id },
    update: { cantidad: 5, stockMinimo: 3 },
    create: { productoId: productos[41].id, cantidad: 5, stockMinimo: 3 },
  });
  await prisma.inventario.upsert({
    where: { productoId: productos[42].id },
    update: { cantidad: 2, stockMinimo: 1 },
    create: { productoId: productos[42].id, cantidad: 2, stockMinimo: 1 },
  });
  await prisma.inventario.upsert({
    where: { productoId: productos[43].id },
    update: { cantidad: 10, stockMinimo: 5 },
    create: { productoId: productos[43].id, cantidad: 10, stockMinimo: 5 },
  });
  // Inventario para otros productos comunes
  for (let i = 2; i <= 8; i++) {
    await prisma.inventario.upsert({
      where: { productoId: productos[i].id },
      update: { cantidad: Math.floor(Math.random() * 20) + 5 },
      create: { productoId: productos[i].id, cantidad: Math.floor(Math.random() * 20) + 5, stockMinimo: 3 },
    });
  }

  console.log(`Inventario actualizado`);

  // ─── FACTURAS ───────────────────────────────────────────────────────────────
  const factura1 = await prisma.factura.upsert({
    where: { numero: 'FAC-2026-001' },
    update: {},
    create: {
      numero: 'FAC-2026-001',
      proveedorId: proveedores[4].id,
      ordenCompraId: orden3.id,
      monto: subtotal3,
      igv: igv3,
      total: total3,
      fechaEmision: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      fechaVencimiento: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
      estado: EstadoFactura.PAGADA,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    }
  });

  console.log('Factura creada');

  // ─── PAGOS ───────────────────────────────────────────────────────────────────
  const pago1 = await prisma.pago.upsert({
    where: { id: 1 },
    update: {},
    create: {
      facturaId: factura1.id,
      monto: total3,
      fechaPago: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      metodoPago: 'Transferencia bancaria',
      referencia: 'TRX-123456',
    }
  });

  console.log('Pago registrado');

  // ─── NOTIFICACIONES ─────────────────────────────────────────────────────────
  const notificacionesData = [
    // Notificaciones existentes
    { emisorId: trabajador.id, receptorId: jefe.id, requerimientoId: req2.id, titulo: 'Nuevo requerimiento urgente pendiente', mensaje: `El trabajador ${trabajador.nombre} ${trabajador.apellido} ha enviado el requerimiento REQ-2026-002 con prioridad URGENTE. Por favor revise.`, leida: false },
    { emisorId: jefe.id, receptorId: trabajador.id, requerimientoId: req1.id, titulo: 'Requerimiento REQ-2026-001 aprobado', mensaje: 'Su requerimiento REQ-2026-001 ha sido aprobado. El proceso de compra continuara.', leida: true },
    { emisorId: jefe.id, receptorId: trabajador.id, requerimientoId: req3.id, titulo: 'Requerimiento REQ-2026-003 rechazado', mensaje: 'Su requerimiento REQ-2026-003 ha sido rechazado. Motivo: presupuesto comprometido.', leida: false },
    { emisorId: jefe.id, receptorId: trabajador.id, requerimientoId: req4.id, titulo: 'Requerimiento REQ-2026-004 requiere correcciones', mensaje: 'Su requerimiento REQ-2026-004 requiere informacion adicional. Por favor adjunte cotizaciones.', leida: false },
    // Notificaciones nuevas
    { emisorId: trabajador2.id, receptorId: jefeSistemas.id, requerimientoId: req6.id, titulo: 'Nuevo requerimiento de seguridad', mensaje: 'Se ha creado el requerimiento REQ-2026-006 para equipos de seguridad.', leida: false },
    { emisorId: jefeSistemas.id, receptorId: trabajador2.id, requerimientoId: req6.id, titulo: 'Requerimiento REQ-2026-006 aprobado', mensaje: 'Su requerimiento ha sido aprobado.', leida: true },
    { emisorId: analista.id, receptorId: gerente.id, ordenCompraId: orden4.id, titulo: 'Orden de compra pendiente de aprobacion', mensaje: 'La orden OC-2026-004 requiere su aprobacion.', leida: false },
    { emisorId: analista.id, receptorId: proveedores[0].id, ordenCompraId: orden1.id, titulo: 'Orden de compra generada', mensaje: `Se ha generado la orden OC-2026-001 a su nombre.`, leida: true },
    { emisorId: analista.id, receptorId: proveedores[3].id, ordenCompraId: orden2.id, titulo: 'Orden de compra generada', mensaje: `Se ha generado la orden OC-2026-002 a su nombre.`, leida: false },
    { emisorId: gerente.id, receptorId: analista.id, ordenCompraId: orden3.id, titulo: 'Orden de compra aprobada', mensaje: `La orden OC-2026-003 ha sido aprobada.`, leida: true },
  ];

  for (const notifData of notificacionesData) {
    await prisma.notificacion.createMany({
      data: notifData,
      skipDuplicates: true,
    });
  }

  console.log(`Notificaciones creadas`);
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

