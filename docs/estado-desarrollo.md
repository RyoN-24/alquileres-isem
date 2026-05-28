# Estado de Desarrollo

## Implementado ahora

### Backend base

Carpeta:

```text
api/
```

Incluye:

- Express + TypeScript.
- Prisma ORM.
- SQLite local para desarrollo inmediato.
- Docker Compose preparado como referencia para PostgreSQL local cuando Docker este disponible.
- Variables de entorno de ejemplo.
- Manejo uniforme de errores.
- Endpoint de salud.
- Auth base con JWT.
- Middleware de autenticacion y roles.
- CRUD inicial de proveedores.
- CRUD inicial de equipos.
- CRUD inicial de contratos.
- CRUD inicial de valorizaciones.
- CRUD inicial de facturas.
- Carga inicial de adjuntos.
- Alertas reales iniciales.
- Dashboard real inicial.
- Reporte principal de vencimientos.
- Busqueda global inicial.
- Vista 360 inicial de proveedor.
- Detalle inicial de factura.
- Detalle inicial de contrato.
- Auditoria al crear y editar proveedores.
- Auditoria al crear y editar equipos.
- Auditoria al crear y editar contratos.
- Auditoria al crear y editar valorizaciones.
- Auditoria al crear, editar y marcar pagada una factura.
- Auditoria al subir adjuntos.
- Seed inicial de empresa ISEM, usuarios, sedes y tipos de equipo.

### Servicio de carpetas visibles

Implementado modo:

```text
LOCAL_VISIBLE
```

Raiz por defecto:

```text
E:/ISEM_ARCHIVOS
```

Estructura que puede crear:

```text
proveedores/
  RUC-NOMBRE/
    ficha/
    contratos/
      NUMERO-CONTRATO/
        contrato/
        orden-servicio/
        valorizaciones/
          NUMERO-VALORIZACION/
            valorizacion-proveedor/
            factura/
            comprobante-pago/
            otros/
    equipos/
```

### Endpoints iniciales

- `GET /health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `GET /api/v1/suppliers/:id`
- `PATCH /api/v1/suppliers/:id`
- `GET /api/v1/equipment`
- `POST /api/v1/equipment`
- `GET /api/v1/equipment/:id`
- `PATCH /api/v1/equipment/:id`
- `GET /api/v1/equipment/types`
- `GET /api/v1/equipment/sites`
- `GET /api/v1/contracts`
- `POST /api/v1/contracts`
- `GET /api/v1/contracts/:id`
- `PATCH /api/v1/contracts/:id`
- `POST /api/v1/contracts/:id/generate-pdf`
- `GET /api/v1/valuations`
- `POST /api/v1/valuations`
- `GET /api/v1/valuations/:id`
- `PATCH /api/v1/valuations/:id`
- `GET /api/v1/invoices`
- `POST /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `PATCH /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/mark-paid`
- `GET /api/v1/imports/template`
- `POST /api/v1/imports/excel?commit=false`
- `POST /api/v1/imports/excel?commit=true`
- `GET /api/v1/attachments`
- `POST /api/v1/attachments`
- `GET /api/v1/alerts`
- `POST /api/v1/alerts/run`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/reports/due-invoices`
- `GET /api/v1/search?q=texto`
- `GET /api/v1/settings/contract-template`
- `PATCH /api/v1/settings/contract-template`

### Verificacion ejecutada

- `npx prisma generate`: correcto.
- `npm test`: correcto.
- `npm run build`: correcto.
- `GET http://127.0.0.1:4000/health`: correcto.
- Creacion de carpeta raiz `E:/ISEM_ARCHIVOS`: correcto.
- Migracion SQLite local: correcto.
- Seed inicial: correcto.
- Login admin contra base real: correcto.
- Listado de proveedores contra base real: correcto.
- Creacion de proveedor con carpeta visible: correcto.
- Frontend abre login real contra API.
- Creacion de equipo contra API real: correcto.
- Creacion de carpetas `documentos` y `fotos` por equipo: correcto.
- Frontend conectado a listado y formulario real de equipos.
- Creacion de contrato contra API real: correcto.
- Asociacion de contrato con proveedor, sede y equipo: correcto.
- Creacion de carpetas `contrato`, `orden-servicio` y `valorizaciones`: correcto.
- Frontend conectado a listado y formulario real de contratos.
- Creacion de valorizacion contra API real: correcto.
- Calculo backend de monto: correcto.
- Validacion de equipo dentro del contrato: implementada.
- Creacion de carpetas `valorizacion-proveedor`, `factura`, `comprobante-pago` y `otros`: correcto.
- Frontend conectado a listado y formulario real de valorizaciones.
- Creacion de factura contra API real: correcto.
- Relacion uno a uno factura-valorizacion: implementada.
- Fecha de vencimiento calculada segun plazo del contrato: correcto.
- Al crear factura, valorizacion pasa a `FACTURADA`: correcto.
- Marcar factura como pagada: correcto.
- Al pagar factura, valorizacion pasa a `PAGADA`: correcto.
- Frontend conectado a listado, formulario real y accion de marcar pagada.
- Subida real de adjunto por API: correcto.
- Archivo guardado fisicamente en carpeta visible de factura: correcto.
- Metadatos de adjunto registrados en base de datos: correcto.
- Formulario de factura exige adjuntar factura y valorizacion emitida por proveedor.
- Accion de pago abre modal con fecha de pago y comprobante obligatorio.
- Comprobante de pago se sube a carpeta visible `comprobante-pago`.
- Evaluacion de alertas de facturas por vencer en 3 dias: implementada.
- Evaluacion de facturas vencidas: implementada.
- Prorrogas de pago respetadas por evaluador de alertas.
- Evaluacion de contratos por vencer en 3 dias: implementada.
- Dashboard real con contratos activos, pendientes PEN/USD, vencidas y valorizaciones pendientes.
- Reporte JSON de facturas por vencer y vencidas: correcto.
- Exportacion Excel `.xlsx` del reporte principal: correcto.
- Exportacion PDF del reporte principal: correcto.
- Frontend conectado al reporte principal con botones Generar, Exportar Excel y Exportar PDF.
- Busqueda global por proveedor, RUC, contrato, factura, valorizacion y equipo: implementada.
- Barra superior conectada a busqueda real.
- Panel de resultados agrupados: implementado.
- Vista 360 inicial de proveedor con equipos, contratos, valorizaciones, facturas pendientes y ruta de carpeta: implementada.
- Boton para copiar ruta de carpeta visible: implementado.
- Detalle de factura con monto, valorizacion, equipo, vencimiento, ruta documental y adjuntos: implementado.
- Detalle de contrato con equipos, valorizaciones, facturas, adjuntos, ruta documental y documentos faltantes: implementado.
- Detalle de equipo con ficha tecnica, proveedor, contratos, valorizaciones, pendientes PEN/USD, documentos y ruta documental: implementado.
- Detalle de valorizacion con calculo, periodo, equipo, factura asociada, archivo del proveedor y ruta documental: implementado.
- Prorroga de factura desde interfaz con nueva fecha, motivo, estado `VENCIDA_CON_PRORROGA` y recarga de dashboard/facturas: implementado.
- Prueba de prorroga contra API real y navegador local: correcto.
- Descarga autenticada de adjuntos por API `GET /api/v1/attachments/:id/download`: implementada.
- Gestor documental reutilizable en detalles de factura, contrato, equipo y valorizacion: implementado.
- Carga de contrato firmado, orden de servicio, documentos/fotos de equipo y archivos de valorizacion desde la interfaz: implementada.
- Descarga de adjuntos desde la interfaz: implementada.
- Prueba real de subida y descarga de contrato firmado en carpeta visible: correcto.
- Filtros funcionales en tablas principales por texto, estado, sede, moneda y rango de fechas cuando aplica: implementados.
- Contador de resultados filtrados y boton `Limpiar`: implementados.
- Prueba en navegador de filtro de facturas por texto y limpieza de filtros: correcto.
- Dashboard convertido en bandeja operativa inicial: metricas de pendiente PEN/USD abren facturas filtradas por moneda y no pagadas.
- Metrica de facturas vencidas abre la bandeja de facturas filtrada por estado vencido.
- Alertas del dashboard abren el detalle completo de la factura usando la factura cargada en el listado principal.
- Prueba en navegador de metrica `Pendiente PEN` y apertura de alerta a detalle de factura: correcto.
- Configuracion editable de tipos de equipo por API: crear, activar y desactivar.
- Configuracion editable de sedes por API: crear, activar y desactivar.
- Pantalla de configuracion conectada a tipos de equipo y sedes reales.
- Formularios de equipo y contrato usan solo sedes/tipos activos.
- Prueba real por API y navegador de creacion de tipo y sede: correcto.
- Configuracion persistente de alertas en base de datos con tabla `AppSetting`: implementada.
- API `GET/PATCH /api/v1/settings/alerts` para dias de anticipacion de facturas, contratos y recordatorio de vencidas: implementada.
- Evaluador de alertas usa los parametros guardados en base de datos con fallback `.env`: implementado.
- Pantalla de configuracion permite editar parametros de alerta: implementada.
- Prueba real por API y navegador guardando facturas 2 dias y contratos 6 dias: correcto.
- API `GET/POST/PATCH /api/v1/users` para administrar usuarios: implementada.
- Crear usuario con contrasena temporal y rol ADMIN/OPERATIVO desde interfaz: implementado.
- Activar/desactivar usuarios y cambiar rol desde interfaz: implementado.
- Proteccion para no desactivar el usuario propio: implementada.
- Prueba real por API y navegador creando usuarios operativos: correcto.
- Reporte consolidado de costos `GET /api/v1/reports/cost-summary`: implementado.
- Reporte de costos incluye costo por proveedor, costo por equipo y detalle de valorizaciones facturadas.
- Exportacion Excel `.xlsx` con hojas separadas proveedor/equipo/valorizaciones: implementada.
- Exportacion PDF del reporte consolidado de costos: implementada.
- Pantalla de reportes permite seleccionar facturas por vencer o costos consolidados: implementada.
- Prueba real por API de reporte de costos: 1 proveedor, 1 equipo, 3 valorizaciones, total PEN 3060, Excel/PDF generados: correcto.
- Plantilla editable de contrato guardada en base de datos con fallback inicial: implementada.
- Pantalla de configuracion permite editar el texto base del contrato y sus variables: implementada.
- Generacion de PDF de contrato desde el detalle del contrato: implementada.
- PDF generado se guarda fisicamente en la carpeta visible `contrato` y se registra como adjunto `CONTRATO_GENERADO`.
- Prueba real por API de generacion de PDF: archivo creado y existente en `E:/ISEM_ARCHIVOS`: correcto.
- Plantilla Excel de importacion inicial con hojas Proveedores, Equipos, Contratos, Valorizaciones y Facturas: implementada.
- Importacion Excel en dos pasos: previsualizar sin guardar e importar confirmando: implementada.
- Importador valida referencias entre RUC, placa/codigo, contrato y valorizacion antes de crear registros.
- Importador crea datos reales y respeta duplicados existentes con resultado `SKIP`.
- Pantalla de configuracion permite descargar plantilla, seleccionar Excel, previsualizar errores e importar datos: implementada.
- Prueba real por API importando un Excel unico: 1 proveedor, 1 equipo, 1 contrato, 1 valorizacion y 1 factura creados: correcto.
- Carpetas visibles creadas durante la importacion real para proveedor y contrato: correcto.
- Primera capa de rediseno visual oscuro/moderno inspirada en referencia fintech: implementada.
- Paleta aplicada: fondo oscuro, superficies elevadas, acento lima, estados rojo/ambar/verde/celeste.
- Layout principal, sidebar, topbar, metricas, tablas, formularios, modales, buscador, adjuntos e importacion actualizados visualmente.
- Logo oficial de ISEM integrado como asset `web/public/brand/isem-logo.png`.
- Logo aplicado en sidebar y login con filtro visual para que sea legible sobre el tema oscuro sin modificar el archivo original.
- Responsive mobile revisado a 390px con navegador automatizado: dashboard carga y mantiene acciones principales.
- Revision desktop 1440px con navegador automatizado: dashboard carga sin errores ni advertencias de consola.

## Usuarios semilla definidos

- Admin: `admin@isem.local` / `Admin12345!`
- Operativo: `operativo@isem.local` / `Operativo12345!`

Estos usuarios se crean al ejecutar el seed.

## Pendiente para completar primer sprint

1. Reemplazar/versionar adjuntos existentes y registrar historial.
2. Preparacion para produccion.
3. Ajustes visuales finos luego de probar con datos reales del usuario.

## Proximo bloque recomendado

Completar documentos e importacion:

- Versionado de adjuntos.
- Preparacion para produccion local/externa.
- Pulir visualmente detalles finales cuando se entregue logo/paleta oficial.
