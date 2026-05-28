# Plan de Implementacion

## Vision general

Construir una aplicacion web responsive con backend API, base de datos PostgreSQL, almacenamiento de adjuntos y jobs de alertas. El desarrollo debe avanzar por entregas verticales verificables, empezando por autenticacion, maestros y flujo principal proveedor -> equipo -> contrato -> valorizacion -> factura -> alerta.

## Decisiones iniciales

- API REST versionada bajo `/api/v1`.
- PostgreSQL como fuente transaccional.
- Adjuntos en storage compatible con S3.
- Roles simples: ADMIN y OPERATIVO.
- Estados mediante enumeraciones controladas.
- Moneda obligatoria en contratos, valorizaciones y facturas.
- Calculos monetarios siempre en backend.

## Fase 1: Fundacion

### Tarea 1: Configuracion base del proyecto

Descripcion: Crear monorepo o estructura separada para frontend, backend, migraciones y documentacion.

Criterios de aceptacion:

- Existe estructura de carpetas de frontend, backend y docs.
- Variables de entorno documentadas.
- Scripts de desarrollo definidos.

Verificacion:

- Ejecutar instalacion de dependencias.
- Ejecutar build inicial.

Dependencias: ninguna.

### Tarea 2: Modelo de datos y migraciones iniciales

Descripcion: Implementar tablas principales, enumeraciones, indices y restricciones.

Criterios de aceptacion:

- Migraciones crean usuarios, sedes, proveedores, equipos, contratos, valorizaciones, facturas, adjuntos, alertas y auditoria.
- Indices y unicidades criticas aplicadas.
- Datos semilla incluyen empresa ISEM y usuario administrador inicial.

Verificacion:

- Ejecutar migraciones en base local.
- Consultar tablas creadas.

Dependencias: Tarea 1.

### Tarea 3: Autenticacion y roles

Descripcion: Implementar login, cierre de sesion, recuperacion de contrasena y autorizacion por rol.

Criterios de aceptacion:

- Usuario puede iniciar sesion.
- ADMIN accede a configuracion.
- OPERATIVO no accede a configuracion.

Verificacion:

- Pruebas de login exitoso y fallido.
- Pruebas de acceso por rol.

Dependencias: Tarea 2.

## Checkpoint Fundacion

- La aplicacion inicia localmente.
- Existe usuario administrador.
- La API protege rutas por autenticacion.

## Fase 2: Maestros operativos

### Tarea 4: Gestion de sedes y parametros

Descripcion: Crear CRUD de sedes, tipos de equipo y periodos configurables.

Criterios de aceptacion:

- ADMIN crea y edita sedes.
- ADMIN crea tipos de equipo.
- OPERATIVO solo consulta parametros necesarios.

Verificacion:

- Pruebas API de CRUD.
- Validacion visual de formularios.

Dependencias: Tarea 3.

### Tarea 5: Gestion de proveedores

Descripcion: Implementar listado, creacion, edicion y ficha de proveedor.

Criterios de aceptacion:

- RUC unico.
- Plazo de pago por defecto obligatorio.
- Ficha muestra historial vacio o asociado.

Verificacion:

- Crear proveedor.
- Intentar duplicar RUC y recibir error controlado.

Dependencias: Tarea 3.

### Tarea 6: Gestion de equipos

Descripcion: Implementar registro de maquinaria y vehiculos asociados a proveedor y sede.

Criterios de aceptacion:

- Equipo se asocia a proveedor.
- Equipo se filtra por sede, proveedor y estado.
- Estado se actualiza correctamente.

Verificacion:

- Crear equipo desde proveedor existente.
- Filtrar listado.

Dependencias: Tareas 4 y 5.

## Checkpoint Maestros

- Flujo proveedor -> equipo funciona en web y mobile.
- Formularios validan datos obligatorios.

## Fase 3: Flujo contractual

### Tarea 7: Gestion de contratos

Descripcion: Implementar creacion, edicion, consulta y listado de contratos.

Criterios de aceptacion:

- Contrato hereda plazo de pago del proveedor.
- Contrato permite sobrescribir plazo.
- Contrato admite varios equipos.
- Modalidad de cobro define si se capturan horas o dias.

Verificacion:

- Crear contrato por hora.
- Crear contrato por dia.
- Validar equipos incluidos.

Dependencias: Tarea 6.

### Tarea 8: Exportacion PDF de contrato

Descripcion: Generar contrato en PDF con datos de ISEM, proveedor, sede, equipos y condiciones.

Criterios de aceptacion:

- PDF se genera desde un contrato existente.
- Plantilla incluye datos del contratante y contratado.
- ADMIN puede editar plantilla inicial.

Verificacion:

- Exportar PDF y revisar formato.

Dependencias: Tarea 7.

### Tarea 9: Valorizaciones

Descripcion: Implementar registro de valorizaciones por contrato con calculo automatico.

Criterios de aceptacion:

- Contrato por hora calcula horas * tarifa.
- Contrato por dia calcula dias * tarifa.
- Estado inicial es PENDIENTE_FACTURA.

Verificacion:

- Crear valorizacion y comparar monto calculado.

Dependencias: Tarea 7.

## Checkpoint Contratos

- Flujo contrato -> valorizacion funciona.
- PDF contractual se genera correctamente.

## Fase 4: Facturacion y alertas

### Tarea 10: Registro de facturas con adjunto

Descripcion: Implementar factura asociada a valorizacion, contrato y proveedor.

Criterios de aceptacion:

- Factura exige adjunto PDF o imagen.
- Fecha de vencimiento se calcula automaticamente.
- Moneda y monto se heredan o editan segun reglas.

Verificacion:

- Crear factura con adjunto.
- Intentar guardar sin adjunto y recibir error.

Dependencias: Tarea 9.

### Tarea 11: Estados de factura y pago

Descripcion: Implementar cambio de estado, marcado como pagada y fecha de pago.

Criterios de aceptacion:

- Marcar pagada exige fecha de pago.
- Factura pagada resuelve alertas.
- Valorizacion asociada cambia a PAGADO cuando corresponde.

Verificacion:

- Marcar factura como pagada.
- Validar estados relacionados.

Dependencias: Tarea 10.

### Tarea 12: Alertas automaticas

Descripcion: Implementar jobs de vencimiento y notificaciones.

Criterios de aceptacion:

- Facturas por vencer en 3 dias generan alerta.
- Facturas vencidas cambian a VENCIDA.
- Alertas permanecen activas hasta pago.

Verificacion:

- Ejecutar job manual con fechas de prueba.
- Validar notificacion en pantalla.

Dependencias: Tarea 11.

## Checkpoint Facturacion

- Flujo valorizacion -> factura -> alerta -> pago funciona de punta a punta.

## Fase 5: Dashboard y reportes

### Tarea 13: Dashboard ejecutivo

Descripcion: Implementar pantalla principal con resumen, alertas y grafico de gasto mensual por proveedor.

Criterios de aceptacion:

- Muestra contratos activos.
- Muestra pendientes PEN y USD por separado.
- Muestra vencidas y proximas a vencer.
- Incluye accesos rapidos.

Verificacion:

- Cargar datos semilla y validar cifras.

Dependencias: Tarea 12.

### Tarea 14: Reportes exportables

Descripcion: Implementar reportes filtrables y exportacion a Excel y PDF.

Criterios de aceptacion:

- Reportes filtran por sede y rango de fechas.
- Exporta .xlsx.
- Exporta PDF.

Verificacion:

- Generar cada reporte con datos de prueba.

Dependencias: Tarea 13.

## Checkpoint Final

- Aplicacion web responsive operativa.
- Flujo principal completo probado.
- Documentacion basica de uso creada.
- Codigo listo para repositorio privado.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Integracion WhatsApp requiere aprobaciones externas | Medio | Definir proveedor temprano y encapsular envio en servicio reemplazable |
| Cliente aun no entrega logo y paleta | Bajo | Usar tema temporal configurable y aplicar identidad al recibir assets |
| Plantilla contractual puede requerir revision legal | Alto | Implementar plantilla editable y validar texto final con cliente |
| Adjuntos desde celular pueden ser pesados | Medio | Limitar tamano, comprimir imagenes y validar tipo |
| Montos en PEN y USD no deben mezclarse | Alto | Reportar siempre separado por moneda salvo que se defina tipo de cambio |

## Preguntas abiertas

- Lista oficial de sedes u obras.
- Usuarios iniciales y correos administradores.
- Proveedor elegido para WhatsApp.
- Proveedor elegido para correo transaccional.
- Texto legal definitivo de la plantilla de contrato.
- Tamano maximo permitido para adjuntos.
- Politica de eliminacion o anulacion de contratos, valorizaciones y facturas.

