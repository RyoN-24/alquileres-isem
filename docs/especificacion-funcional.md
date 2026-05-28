# Especificacion Funcional

## Objetivo

Centralizar la gestion de proveedores, contratos, equipos, valorizaciones, facturas, adjuntos y alertas de vencimiento relacionados con alquileres de maquinarias y vehiculos usados por INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL.

## Usuarios y roles

### Administrador

Acceso total a la aplicacion.

- Gestiona usuarios.
- Gestiona sedes.
- Configura tipos de equipo, periodos de valorizacion y plantilla de contrato.
- Registra, edita, consulta y elimina informacion operativa segun reglas de auditoria.
- Recibe alertas por correo y WhatsApp.

### Operativo

Acceso de registro y consulta.

- Registra proveedores, equipos, contratos, valorizaciones y facturas.
- Consulta dashboard y reportes permitidos.
- No accede a configuracion, usuarios ni parametros maestros criticos.

## Modulos

### 1. Proveedores

Cada proveedor debe registrar:

- Razon social o nombre comercial.
- RUC.
- Contacto principal.
- Telefono.
- Correo electronico.
- Direccion.
- Banco.
- Numero de cuenta.
- Condicion de pago por defecto en dias.
- Estado: activo o inactivo.
- Historial de contratos, valorizaciones y facturas asociadas.

Reglas:

- Un proveedor puede tener varios equipos alquilados simultaneamente.
- El plazo de pago del proveedor se hereda al contrato, pero puede sobrescribirse.
- El RUC debe ser unico.

### 2. Equipos y vehiculos

Cada equipo o vehiculo debe registrar:

- Tipo configurable.
- Descripcion o nombre.
- Marca.
- Modelo.
- Anio.
- Placa o codigo interno.
- Proveedor propietario.
- Sede u obra asignada.
- Estado: en obra, disponible o finalizado.

Reglas:

- Un equipo pertenece a un proveedor.
- Un equipo puede estar en varios contratos a lo largo del tiempo.
- La app debe permitir detectar traslapes de contrato para el mismo equipo.

### 3. Contratos de servicio

Cada contrato debe registrar:

- Numero de contrato, autogenerado o manual.
- Proveedor.
- Uno o varios equipos.
- Sede u obra.
- Fecha de inicio.
- Fecha de fin.
- Modalidad de cobro: por hora o por dia.
- Tarifa segun modalidad.
- Moneda: PEN o USD.
- Modalidad de valorizacion: por valorizacion o por periodo.
- Periodo: semanal, quincenal, mensual u otro valor configurable cuando aplique.
- Plazo de vencimiento de facturas.
- Observaciones.
- Estado: activo, finalizado o cancelado.

Reglas:

- La moneda del contrato se hereda a valorizaciones y facturas.
- El contrato debe poder exportarse como PDF profesional.
- La plantilla del contrato debe ser editable por el administrador.
- La empresa contratante siempre es INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL.

### 4. Valorizaciones

Cada valorizacion debe registrar:

- Numero de valorizacion.
- Contrato.
- Periodo o fecha de corte.
- Horas o dias trabajados segun modalidad del contrato.
- Monto calculado automaticamente.
- Estado: pendiente de factura, facturado o pagado.
- Observaciones.

Reglas:

- Formula por hora: horas trabajadas * tarifa por hora.
- Formula por dia: dias trabajados * tarifa por dia.
- El monto se calcula en la moneda del contrato.
- Una valorizacion puede tener cero o una factura asociada.

### 5. Facturas

Cada factura debe registrar:

- Numero de factura.
- Proveedor.
- Contrato.
- Valorizacion asociada.
- Fecha de emision.
- Fecha de vencimiento.
- Moneda: PEN o USD.
- Monto total.
- Estado: pendiente, pagada, vencida u observada.
- Adjunto obligatorio en PDF o imagen.
- Fecha de pago efectivo.
- Observaciones.

Reglas:

- La fecha de vencimiento se calcula desde la fecha de emision mas el plazo pactado.
- La fecha de vencimiento puede editarse manualmente.
- Al marcar como pagada, debe registrarse la fecha de pago.
- Una factura vencida sin pago cambia automaticamente a vencida.
- El adjunto es obligatorio para guardar una factura.

### 6. Alertas y notificaciones

Alertas automaticas:

- 3 dias antes de la fecha de vencimiento de factura.
- Facturas vencidas sin pagar.

Canales:

- Notificacion en pantalla.
- Correo electronico al administrador.
- WhatsApp mediante WhatsApp Business API, Twilio o 360dialog.

Reglas:

- Las alertas permanecen activas hasta que la factura sea marcada como pagada.
- Marcar una alerta como vista no la elimina.
- Las facturas vencidas deben destacarse visualmente en rojo.

### 7. Dashboard principal

Debe mostrar:

- Total de contratos activos.
- Contratos activos por sede.
- Facturas pendientes acumuladas en PEN.
- Facturas pendientes acumuladas en USD.
- Facturas proximas a vencer en los proximos 7 dias.
- Facturas vencidas sin pagar.
- Grafico de gasto mensual por proveedor.
- Accesos rapidos a nuevo contrato, nueva factura y nueva valorizacion.

### 8. Reportes y exportacion

Reportes requeridos:

- Costo total por proveedor.
- Costo por equipo o vehiculo.
- Facturas pagadas vs. pendientes vs. vencidas.
- Resumen de valorizaciones por contrato.
- Consolidado general por rango de fechas.

Filtros:

- Rango de fechas.
- Sede.
- Proveedor cuando aplique.
- Estado cuando aplique.
- Moneda cuando aplique.

Formatos:

- Excel .xlsx.
- PDF.

