# Plan Maestro de Desarrollo Completo

## Objetivo de esta etapa

Construir una aplicacion util y completa antes de invertir tiempo fuerte en el acabado visual. La prioridad es que cada pantalla, boton, filtro, formulario, estado, exportacion, alerta y flujo tenga comportamiento real contra base de datos, con validaciones, permisos y trazabilidad.

## Principio de desarrollo

La aplicacion no debe avanzar como maqueta visual. Debe avanzar por flujos funcionales completos:

1. Usuario inicia sesion.
2. Registra proveedor.
3. Registra equipo.
4. Crea contrato.
5. Genera valorizacion.
6. Registra factura con adjunto.
7. El sistema calcula vencimientos.
8. El sistema alerta.
9. El usuario marca pago.
10. Dashboard y reportes reflejan el cambio.

Un modulo se considera terminado solo si guarda datos reales, valida reglas, respeta roles, registra auditoria y se prueba desde frontend hasta base de datos.

## Arquitectura objetivo

### Monorepo

Estructura propuesta:

```text
/
  apps/
    web/                 Aplicacion responsive
    api/                 Backend REST
  packages/
    shared/              Tipos, enums, validaciones compartidas
  infra/
    docker-compose.yml   PostgreSQL, storage local y servicios auxiliares
  docs/
    *.md
```

La carpeta actual `web/` puede moverse a `apps/web/` cuando se inicie la fase de backend. No es obligatorio hacerlo inmediatamente, pero ayuda a escalar el proyecto.

### Frontend

- React + TypeScript.
- React Router para rutas reales.
- TanStack Query o equivalente para server state.
- React Hook Form + validaciones compartidas.
- Manejo centralizado de errores API.
- Componentes funcionales antes que componentes bonitos.

### Backend

- Node.js + TypeScript.
- API REST.
- Framework recomendado: NestJS o Express modular.
- Validacion de entrada con esquemas.
- Autorizacion por rol en cada endpoint.
- Servicios de dominio separados por modulo.
- Jobs programados para vencimientos y notificaciones.

### Base de datos

- PostgreSQL.
- ORM recomendado: Prisma o Drizzle.
- Migraciones versionadas.
- Seeds para empresa, usuario admin, sedes iniciales y parametros.
- Auditoria en acciones sensibles.

### Archivos

- Storage inicial en servidor propio con carpetas visibles.
- Storage S3/Supabase compatible en una fase futura.
- Adjuntos privados.
- Descarga mediante URL firmada o endpoint autenticado.
- Validacion de tipo, peso y extension.

La capa de archivos debe permitir dos modos:

- `LOCAL_VISIBLE`: guarda archivos en carpetas reales visibles en servidor propio.
- `CLOUD_STORAGE`: guarda archivos en Supabase Storage, S3 o compatible.

La primera version debe implementar `LOCAL_VISIBLE`.

### Notificaciones

- Notificaciones en pantalla desde base de datos.
- Correo por proveedor SMTP/transaccional.
- WhatsApp mediante proveedor desacoplado.
- Log de intentos de envio.
- Reintentos controlados.

## Definicion de terminado

Cada boton o accion esta terminado cuando cumple:

- Ejecuta una accion real o abre una pantalla/formulario conectado.
- Muestra estado de carga.
- Muestra error comprensible si falla.
- Valida permisos del usuario.
- Persiste o consulta datos reales.
- Actualiza la pantalla sin recargar innecesariamente.
- Registra auditoria si modifica datos importantes.
- Tiene prueba minima de backend o flujo.

## Fase 0: Congelar prototipo visual y preparar base real

### Tarea 0.1: Separar prototipo de funcionalidad real

Descripcion: Mantener la UI actual como referencia, pero dejar claro que los datos mock seran reemplazados por API.

Criterios de aceptacion:

- Existe documento de plan maestro.
- Se identifica cada dato mock usado actualmente.
- Se define que ninguna nueva pantalla se considera terminada si usa datos quemados.

Verificacion:

- Revisar `web/src/App.tsx` y listar datos mock a migrar.

### Tarea 0.2: Definir variables de entorno

Variables minimas:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_API_KEY`
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`

Verificacion:

- Archivo `.env.example` documentado.
- Backend no inicia si falta configuracion critica.

## Fase 1: Backend base y base de datos

### Tarea 1.1: Crear backend API

Descripcion: Crear aplicacion backend con estructura modular.

Modulos iniciales:

- `auth`
- `users`
- `sites`
- `suppliers`
- `equipment`
- `contracts`
- `valuations`
- `invoices`
- `files`
- `alerts`
- `reports`
- `audit`

Criterios de aceptacion:

- API responde `GET /health`.
- Existe manejo uniforme de errores.
- Existe validacion de payloads.
- Existe logger basico.

Verificacion:

- `npm run build`
- `npm test`
- `GET /health` devuelve estado OK.

### Tarea 1.2: Implementar modelo de datos completo

Descripcion: Crear migraciones para todas las entidades del modelo ER.

Criterios de aceptacion:

- Tablas creadas con relaciones reales.
- Enums aplicados.
- Indices criticos aplicados.
- Restricciones de unicidad aplicadas.
- Decimales para montos.

Verificacion:

- Ejecutar migraciones desde cero.
- Ejecutar seed.
- Consultar datos semilla.

### Tarea 1.3: Seeds de operacion

Datos iniciales:

- Empresa ISEM.
- Usuario administrador.
- Usuario operativo de prueba.
- Sedes de prueba.
- Tipos de equipo.
- Periodos de valorizacion.
- Plantilla contractual base.

Criterios de aceptacion:

- Un entorno limpio queda usable despues de `seed`.
- Se puede iniciar sesion con usuario admin.

## Fase 2: Autenticacion, autorizacion y auditoria

### Tarea 2.1: Login real

Acciones:

- Login.
- Logout.
- Obtener usuario actual.
- Renovacion o expiracion de sesion.

Botones funcionales:

- `Ingresar`
- `Cerrar sesion`

Criterios de aceptacion:

- Credenciales incorrectas devuelven error claro.
- Usuario inactivo no puede ingresar.
- Sesion expirada redirige a login.

### Tarea 2.2: Recuperacion de contrasena

Botones funcionales:

- `Olvide mi contrasena`
- `Enviar enlace`
- `Restablecer contrasena`

Criterios de aceptacion:

- Token expira.
- Token no se puede reutilizar.
- Correo queda registrado como enviado o fallido.

### Tarea 2.3: Roles y permisos

Reglas:

- ADMIN tiene acceso total.
- OPERATIVO registra y consulta.
- OPERATIVO no administra usuarios, sedes ni parametros criticos.
- En la primera etapa el usuario principal sera ADMIN y sera quien marque pagos.

Criterios de aceptacion:

- Backend bloquea rutas no autorizadas.
- Frontend oculta acciones no permitidas.
- Intento no autorizado registra evento.

### Tarea 2.4: Auditoria

Registrar:

- Crear, editar, activar, inactivar.
- Cambiar estado de contrato, valorizacion o factura.
- Marcar factura como pagada.
- Descargar adjuntos sensibles.
- Exportar reportes.

## Fase 3: Maestros funcionales

### Tarea 3.1: Sedes

Pantallas:

- Listado.
- Crear sede.
- Editar sede.
- Activar/inactivar sede.

Botones funcionales:

- `Nueva sede`
- `Guardar`
- `Cancelar`
- `Editar`
- `Activar`
- `Inactivar`

Validaciones:

- Nombre obligatorio.
- No permitir inactivar sede con contratos activos sin confirmacion.

### Tarea 3.2: Tipos de equipo y parametros

Parametros:

- Tipos de equipo.
- Periodos de valorizacion.
- Plazos comunes de pago.
- Plantilla contractual.

Botones funcionales:

- `Nuevo tipo`
- `Editar`
- `Guardar plantilla`
- `Restaurar plantilla base`

### Tarea 3.3: Usuarios

Botones funcionales:

- `Nuevo usuario`
- `Editar usuario`
- `Cambiar rol`
- `Activar/Inactivar`
- `Enviar recuperacion`

Validaciones:

- Email unico.
- No permitir que el unico ADMIN activo se inactive a si mismo.

## Fase 4: Proveedores

### Tarea 4.1: CRUD completo de proveedores

Botones funcionales:

- `Nuevo proveedor`
- `Guardar proveedor`
- `Editar`
- `Activar/Inactivar`
- `Ver historial`
- `Limpiar filtros`

Validaciones:

- RUC obligatorio y unico.
- Plazo de pago por defecto obligatorio.
- Email con formato valido si se ingresa.
- Banco y cuenta opcionales, pero persistentes.

Filtros:

- Texto libre.
- Estado.
- RUC.

### Tarea 4.2: Ficha de proveedor

Debe mostrar:

- Datos generales.
- Equipos asociados.
- Contratos asociados.
- Valorizaciones asociadas.
- Facturas asociadas.
- Monto pendiente por moneda.

Botones funcionales:

- `Nuevo equipo para este proveedor`
- `Nuevo contrato para este proveedor`
- `Nueva factura asociada`
- `Exportar historial`

## Fase 5: Equipos y vehiculos

### Tarea 5.1: CRUD completo de equipos

Botones funcionales:

- `Nuevo equipo`
- `Guardar equipo`
- `Editar`
- `Cambiar estado`
- `Ver contratos`

Validaciones:

- Tipo obligatorio.
- Proveedor obligatorio.
- Sede obligatoria si estado es EN_OBRA.
- Placa o codigo unico cuando exista.

Regla critica:

- No permitir asignar un equipo a un contrato activo superpuesto si ya esta comprometido, salvo confirmacion admin y registro de auditoria.

### Tarea 5.2: Historial de equipo

Debe mostrar:

- Contratos donde participo.
- Sedes donde estuvo asignado.
- Costo acumulado.
- Estado actual.

Botones funcionales:

- `Exportar historial`
- `Ver contrato`
- `Ver proveedor`

## Fase 6: Contratos

### Tarea 6.1: Crear contrato real

Botones funcionales:

- `Nuevo contrato`
- `Agregar equipo`
- `Quitar equipo`
- `Guardar borrador`
- `Guardar y activar`
- `Cancelar`

Validaciones:

- Proveedor obligatorio.
- Sede obligatoria.
- Al menos un equipo.
- Fecha inicio menor o igual a fecha fin.
- Tarifa mayor a cero.
- Moneda obligatoria.
- Modalidad de cobro excluyente: HORA o DIA.
- Plazo de factura hereda del proveedor, pero editable.

Reglas:

- Si se selecciona proveedor, cargar sus equipos.
- Si se cambia proveedor, limpiar equipos incompatibles.
- Numero puede autogenerarse o ingresarse manualmente.

### Tarea 6.2: Detalle de contrato

Botones funcionales:

- `Editar contrato`
- `Finalizar`
- `Cancelar contrato`
- `Generar valorizacion`
- `Exportar PDF`
- `Ver proveedor`
- `Ver equipos`

Reglas:

- No permitir editar campos economicos si ya existen valorizaciones facturadas, salvo admin y auditoria.
- Finalizar contrato actualiza estado de equipos si corresponde.
- Contrato activo debe advertir si falta contrato firmado u orden de servicio.

### Tarea 6.3: PDF contractual

Botones funcionales:

- `Previsualizar PDF`
- `Descargar PDF`
- `Editar plantilla`

Criterios:

- PDF incluye datos de ISEM.
- PDF incluye proveedor.
- PDF incluye equipos, sede, fechas, tarifa, moneda y condiciones.
- Plantilla editable por ADMIN.

## Fase 7: Valorizaciones

### Tarea 7.1: Crear valorizacion

Botones funcionales:

- `Nueva valorizacion`
- `Seleccionar contrato`
- `Calcular monto`
- `Guardar`
- `Guardar y crear factura`

Validaciones:

- Contrato activo o finalizado permitido segun regla.
- Equipo obligatorio.
- El equipo debe pertenecer al contrato seleccionado.
- Cantidad mayor a cero.
- Cantidad representa horas o dias segun contrato.
- Periodo no debe duplicarse sin confirmacion.
- Moneda obligatoria.

Reglas:

- Tarifa se toma del contrato.
- Moneda se hereda del contrato, pero puede modificarse en la valorizacion.
- Monto lo calcula backend.
- Estado inicial: PENDIENTE_FACTURA.
- Cada valorizacion corresponde a un solo equipo.

### Tarea 7.2: Detalle de valorizacion

Botones funcionales:

- `Editar`
- `Crear factura`
- `Ver contrato`
- `Anular`

Reglas:

- No editar cantidad si ya esta facturada, salvo admin y auditoria.
- Al crear factura, valorizacion pasa a FACTURADO.
- Al pagar factura, valorizacion pasa a PAGADO.

## Fase 8: Facturas y adjuntos

### Tarea 8.1: Crear factura

Botones funcionales:

- `Nueva factura`
- `Seleccionar valorizacion`
- `Subir adjunto`
- `Eliminar adjunto antes de guardar`
- `Guardar factura`
- `Guardar y marcar observada`

Validaciones:

- Numero obligatorio.
- Numero unico por proveedor.
- Proveedor, contrato y valorizacion consistentes.
- Una valorizacion solo puede tener una factura.
- Una factura solo puede pertenecer a una valorizacion.
- Fecha emision obligatoria.
- Fecha vencimiento calculada pero editable.
- Monto mayor a cero.
- Moneda heredada desde la valorizacion, editable por administrador.
- Adjunto de factura obligatorio.
- Adjunto de valorizacion emitida por proveedor obligatorio.

Regla de control:

- Si el monto de factura no coincide con el monto de valorizacion, mostrar alerta de diferencia.
- La diferencia no bloquea el guardado si el administrador confirma.

### Tarea 8.2: Gestionar factura

Botones funcionales:

- `Editar factura`
- `Marcar como pagada`
- `Marcar observada`
- `Descargar adjunto`
- `Reemplazar adjunto`
- `Ver valorizacion`
- `Ver contrato`
- `Ver proveedor`

Reglas:

- Marcar pagada exige fecha de pago.
- Marcar pagada exige comprobante de pago.
- Solo ADMIN puede marcar pagada en la primera version.
- Factura pagada resuelve alertas.
- Factura vencida no pagada se muestra en rojo.
- Reemplazo de adjunto registra auditoria.

Pagos parciales quedan fuera de la primera version. La primera version maneja pago unico por factura.

## Fase 9: Alertas y notificaciones

### Tarea 9.1: Alertas en pantalla

Botones funcionales:

- `Ver alertas`
- `Marcar como vista`
- `Ir a factura`
- `Registrar prorroga`

Reglas:

- Vista no resuelve alerta.
- Solo pago resuelve alerta.
- Alertas vencidas se mantienen destacadas.
- Si se registra prorroga, la alerta diaria se pausa hasta la nueva fecha.
- Una factura con prorroga sigue apareciendo como pendiente reprogramada.

### Tarea 9.2: Jobs automaticos

Jobs:

- Actualizar facturas vencidas.
- Crear alertas 3 dias antes.
- Crear alertas de contratos por vencer.
- Marcar visualmente contratos vencidos que sigan activos.
- Enviar correos.
- Enviar WhatsApp.
- Reintentar envios fallidos.

Verificacion:

- Ejecutar jobs manualmente en desarrollo.
- Simular fechas.
- Confirmar cambios de estado y logs.
- Simular factura vencida con prorroga y confirmar que no vuelve a alertar hasta la fecha reprogramada.

### Tarea 9.3: Configuracion de notificaciones

Botones funcionales:

- `Enviar prueba de correo`
- `Enviar prueba de WhatsApp`
- `Guardar destinatarios`

## Fase 10: Dashboard funcional

### Tarea 10.1: Resumen ejecutivo real

Tarjetas:

- Contratos activos total.
- Contratos activos por sede.
- Pendiente PEN.
- Pendiente USD.
- Proximas a vencer en 7 dias.
- Vencidas.

Botones funcionales:

- Click en tarjeta de contratos: filtra contratos activos.
- Click en pendiente PEN/USD: abre facturas pendientes filtradas.
- Click en vencidas: abre facturas vencidas.
- Click en proximas a vencer: abre reporte operativo de pagos por programar.
- `Nuevo contrato`
- `Nueva valorizacion`
- `Nueva factura`

La prioridad del dashboard debe ser pagos por programar. Debe responder primero: que facturas vencen pronto y que monto necesito preparar.

### Tarea 10.2: Grafico real

Grafico:

- Gasto mensual por proveedor.
- Filtro por rango y sede.

Botones funcionales:

- `Cambiar rango`
- `Exportar grafico`
- Click en proveedor: abre reporte filtrado.

## Fase 11: Reportes y exportacion

### Tarea 11.1: Reportes backend

Reportes:

- Facturas proximas a vencer y vencidas.
- Costo total por proveedor.
- Costo por equipo.
- Facturas por estado.
- Valorizaciones por contrato.
- Consolidado general.

Filtros:

- Fecha desde/hasta.
- Sede.
- Proveedor.
- Estado.
- Moneda.

### Tarea 11.2: Exportacion

Botones funcionales:

- `Generar`
- `Exportar Excel`
- `Exportar PDF`
- `Limpiar filtros`

Criterios:

- Excel respeta filtros.
- PDF respeta filtros.
- No mezclar PEN y USD como un solo total.
- Registrar auditoria de exportacion.
- Totales PEN y USD siempre separados.

El reporte principal de version 1 es `Facturas proximas a vencer y vencidas`.

## Fase 12: Busqueda global, filtros y navegacion

### Tarea 12.1: Busqueda global

Barra superior:

- Buscar proveedor.
- Buscar contrato.
- Buscar factura.
- Buscar equipo.

Comportamiento:

- Resultados agrupados por tipo.
- Click lleva al detalle.

### Tarea 12.2: Filtros persistentes

Reglas:

- Filtros viven en URL.
- Recargar pagina mantiene filtros.
- Boton `Limpiar filtros` resetea URL.

## Fase 13: Calidad, pruebas y seguridad

### Tarea 13.1: Pruebas backend

Minimo:

- Auth.
- Permisos.
- Proveedores.
- Contratos.
- Valorizaciones.
- Facturas.
- Jobs de vencimiento.
- Reportes.

### Tarea 13.2: Pruebas end-to-end

Flujos:

- Login admin.
- Crear proveedor.
- Crear equipo.
- Crear contrato.
- Crear valorizacion.
- Crear factura con adjunto.
- Ejecutar job de vencimiento.
- Marcar factura pagada.
- Exportar reporte.

### Tarea 13.3: Seguridad

Revisar:

- Permisos por endpoint.
- Tamano maximo de adjuntos.
- Tipo MIME real del archivo.
- Descarga autenticada.
- Hash de contrasenas.
- Tokens de recuperacion.
- Errores sin datos sensibles.

## Fase 14: Pulido visual final

Solo despues de que los flujos esten funcionales:

- Aplicar logo y paleta oficial.
- Mejorar responsive.
- Refinar tablas.
- Mejorar formularios.
- Optimizar estados vacios.
- Ajustar accesibilidad.
- Crear estilo final de PDF.

## Mapa de botones principales

| Area | Boton/accion | Resultado funcional |
| --- | --- | --- |
| Login | Ingresar | Crea sesion y abre dashboard |
| Login | Olvide mi contrasena | Envia correo con token |
| Topbar | Buscar | Abre resultados globales |
| Topbar | Alertas | Lista alertas activas |
| Dashboard | Nuevo contrato | Abre formulario real de contrato |
| Dashboard | Nueva valorizacion | Abre formulario real de valorizacion |
| Dashboard | Nueva factura | Abre formulario real de factura |
| Proveedores | Nuevo proveedor | Crea proveedor en base de datos |
| Proveedores | Editar | Actualiza proveedor |
| Proveedores | Ver historial | Abre detalle con contratos/facturas |
| Equipos | Nuevo equipo | Crea equipo asociado a proveedor |
| Equipos | Cambiar estado | Actualiza estado y audita |
| Contratos | Guardar y activar | Crea contrato activo |
| Contratos | Exportar PDF | Genera y descarga PDF |
| Contratos | Finalizar | Cambia estado y actualiza equipos |
| Valorizaciones | Calcular monto | Calcula en backend |
| Valorizaciones | Guardar y crear factura | Persiste valorizacion y abre factura |
| Facturas | Subir adjunto | Carga archivo validado |
| Facturas | Marcar pagada | Registra pago y resuelve alertas |
| Facturas | Descargar adjunto | Descarga autenticada |
| Alertas | Marcar vista | Cambia solo estado visual |
| Alertas | Ir a factura | Navega al detalle |
| Reportes | Generar | Consulta reporte filtrado |
| Reportes | Exportar Excel | Descarga XLSX |
| Reportes | Exportar PDF | Descarga PDF |
| Configuracion | Nuevo usuario | Crea usuario |
| Configuracion | Guardar plantilla | Actualiza plantilla de contrato |

## Orden recomendado de ejecucion

1. Backend base, DB, migraciones y seeds.
2. Auth, roles y auditoria.
3. Proveedores y sedes.
4. Equipos.
5. Contratos.
6. Valorizaciones.
7. Facturas y adjuntos.
8. Alertas y jobs.
9. Dashboard real.
10. Reportes y exportaciones.
11. Busqueda global y filtros persistentes.
12. Pruebas end-to-end.
13. Pulido visual final.

## Primer sprint recomendado

Duracion sugerida: 1 semana de desarrollo concentrado.

Entregable:

- Backend iniciado.
- PostgreSQL local.
- Migraciones base.
- Seed con ISEM y usuarios.
- Login real.
- CRUD real de proveedores.
- Servicio de archivos local visible definido, aunque todavia no se use en todos los modulos.
- Frontend conectado a API para proveedores.

Criterios de cierre:

- Admin inicia sesion.
- Admin crea proveedor.
- Admin edita proveedor.
- Operativo puede consultar proveedor.
- RUC duplicado falla con error claro.
- Datos sobreviven al reiniciar la app.
- Se crea estructura base de carpetas en servidor propio.

## Segundo sprint recomendado

Entregable:

- Sedes.
- Tipos de equipo.
- CRUD real de equipos.
- Filtros funcionales.
- Ficha de proveedor con equipos asociados.

## Tercer sprint recomendado

Entregable:

- Contratos completos.
- Asociacion de multiples equipos.
- Validacion de fechas y tarifas.
- PDF contractual inicial.

## Cuarto sprint recomendado

Entregable:

- Valorizaciones.
- Facturas.
- Adjuntos obligatorios: factura, valorizacion emitida por proveedor y comprobante de pago.
- Relacion 1 a 1 entre valorizacion y factura.
- Estados relacionados.

## Quinto sprint recomendado

Entregable:

- Alertas.
- Jobs.
- Dashboard real.
- Reportes Excel/PDF.

## Decisiones pendientes antes de construir

- Confirmar stack backend: NestJS o Express modular.
- Confirmar ORM: Prisma o Drizzle.
- Confirmar storage: AWS S3, Cloudflare R2, Supabase Storage u otro.
- Confirmar proveedor de correo.
- Confirmar proveedor WhatsApp.
- Definir si mobile sera responsive web o app separada.
- Definir texto legal final de contrato.
- Definir sedes reales.
- Definir usuarios iniciales.
- Definir plataforma futura de produccion y dominio.
