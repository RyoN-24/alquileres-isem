# Decisiones Funcionales Confirmadas

Este documento registra decisiones ya confirmadas para orientar el desarrollo real del sistema.

## Situacion actual

- Actualmente solo se controla informacion de 1 proveedor.
- No se ha ampliado el control a mas proveedores porque mantener un Excel distinto por proveedor resulta pesado.
- El principal ahorro esperado es centralizar proveedores futuros sin multiplicar archivos Excel.

## Prioridad del sistema

La prioridad principal es:

- Saber que facturas estan proximas a vencer.
- Controlar los montos a vencer.
- Programar pagos con anticipacion.
- Evitar revisar proveedor por proveedor manualmente.

El dashboard y los reportes deben construirse alrededor de esta prioridad.

## Uso inicial y despliegue futuro

Decision:

- En la primera etapa el sistema sera usado solo por la persona encargada del seguimiento y pagos.
- El sistema debe poder funcionar inicialmente en entorno local o servidor propio.
- Cuando el producto este completo, se lanzara a produccion para acceso desde internet.

Implicacion tecnica:

- No sobredimensionar permisos complejos en la primera etapa.
- Mantener autenticacion desde el inicio para que la migracion a produccion no obligue a redisenar seguridad.
- Documentar el despliegue futuro paso a paso porque el usuario aun no tiene experiencia publicando aplicaciones en internet.

## Carpeta documental visible

Decision:

- El sistema debe crear carpetas visibles en servidor propio.
- Esto es importante porque parte del equipo es mayor y necesita una estructura familiar de carpetas.
- La app debe guardar la referencia en base de datos, pero tambien debe dejar los archivos ordenados en carpetas reales navegables.

Implicacion tecnica:

- En desarrollo y primera version se usara almacenamiento en servidor propio.
- A futuro se debe poder migrar a Supabase Storage u otro storage cloud.
- La capa de archivos debe abstraerse para que el cambio futuro no obligue a reescribir la logica del negocio.

## Relacion valorizacion-factura

Decision:

- Cada factura pertenece a una unica valorizacion.
- Cada valorizacion tiene una unica factura.
- No se permitiran varias facturas para una valorizacion.
- No se permitira una factura que cubra varias valorizaciones.
- Cada valorizacion corresponde a un equipo especifico.
- Un proveedor puede tener varios equipos alquilados, pero se valorizan por separado.

Implicacion en base de datos:

- `invoices.valuation_id` debe ser unico.
- La relacion es uno a uno.
- `valuations.equipment_id` debe ser obligatorio.

## Pagos

Decision actual:

- Por ahora los pagos son al finalizar el servicio o a 30 dias.
- Los pagos parciales pueden quedar previstos como opcion futura, pero no son necesarios para la primera version.
- La persona encargada del seguimiento y pagos marcara las facturas como pagadas.

Regla version 1:

- Una factura se marca como pagada con fecha de pago y comprobante.
- No se implementara fraccionamiento de pagos en la primera version.
- Solo el rol administrador puede marcar una factura como pagada.

Preparacion futura:

- El modelo puede dejar preparada una tabla de pagos si no agrega complejidad excesiva, pero la interfaz inicial debe manejar pago unico.

## Adjuntos obligatorios

Adjuntos obligatorios confirmados:

- Factura del proveedor.
- Valorizacion emitida por el proveedor.
- Comprobante de pago al marcar como pagada.

Adjuntos opcionales:

- Parte diario.
- Evidencia adicional.
- Otros documentos de soporte.

## Reporte mas importante

Reporte principal:

- Facturas proximas a vencer.
- Facturas vencidas.
- Monto total a vencer por rango de fechas.
- Monto total separado por moneda.
- Agrupacion por proveedor y sede.

Este reporte debe ser visible desde el dashboard, no escondido solo en reportes.

Decision de moneda:

- Los reportes deben mostrar PEN y USD siempre separados.
- No se consolidaran a soles en la primera version.
- Las facturas en dolares se pagan desde cuenta en dolares.
- Las facturas en soles se pagan desde cuenta en soles.

## Moneda por valorizacion

Decision:

- Algunos servicios se cotizan en soles y otros en dolares.
- La moneda debe poder seleccionarse por valorizacion.
- Por defecto debe heredarse del contrato, pero debe poder ajustarse si el caso operativo lo requiere.

Regla:

- La valorizacion define la moneda que luego hereda la factura.
- Los reportes deben separar PEN y USD.
- No se debe sumar PEN y USD como un unico total si no hay tipo de cambio definido.

## Diferencia entre valorizacion y factura

Decision:

- En la mayoria de casos el monto de factura coincide con la valorizacion.
- En algunos casos puede no coincidir.
- El sistema no debe bloquear automaticamente si no coincide.

Regla:

- Si el monto de factura no coincide con el monto de valorizacion, el sistema muestra una alerta.
- El administrador decide si la diferencia es aceptable.
- La diferencia debe quedar visible en el detalle de factura y en auditoria.

## Alertas adicionales

Decision:

- Ademas de facturas por vencer, el sistema debe alertar contratos por vencer.

Regla inicial:

- Alertar contratos que vencen en los proximos 3 dias.
- Mostrar contratos vencidos que sigan activos.
- Permitir configurar este plazo en el futuro.

## Alertas de facturas vencidas y prorrogas

Decision:

- Las alertas de facturas deben activarse 3 dias antes del vencimiento.
- Las facturas vencidas deben seguir visibles hasta ser pagadas.
- No conviene que una alerta vencida moleste diariamente si ya existe una prorroga acordada con el proveedor.

Regla recomendada:

- Una factura vencida puede tener una `fecha de prorroga`.
- Si se registra prorroga, la factura sigue como no pagada, pero la alerta diaria se pausa hasta la nueva fecha.
- El dashboard debe mostrarla como `vencida con prorroga` o `pago reprogramado`.
- Si llega la fecha de prorroga y no se paga, la alerta vuelve a activarse.
- Registrar motivo o comentario de la prorroga.

Esto mantiene control sin generar ruido innecesario.

## Documentos obligatorios por contrato

Decision:

- Contrato firmado.
- Orden de servicio.

Regla:

- Un contrato activo debe advertir si falta contrato firmado u orden de servicio.
- Puede guardarse inicialmente como borrador sin esos documentos.

## Documentos por equipo

Decision:

- Los documentos dependen de cada maquinaria o vehiculo.
- No se debe imponer la misma lista obligatoria a todos los equipos.

Regla:

- Cada equipo puede tener documentos personalizados.
- Para vehiculos se puede sugerir SOAT, tarjeta, revision tecnica y fotos.
- Para maquinaria se puede sugerir ficha tecnica, certificados, fotos u otros documentos.
- La obligatoriedad debe ser configurable por tipo de equipo en una fase posterior.

## Importacion inicial

Decision:

- Existe un Excel de 1 proveedor.
- Conviene usarlo como piloto de importacion o carga inicial.

Recomendacion:

- Primero construir la carga manual bien hecha.
- Luego crear un importador simple para ese Excel si su estructura es consistente.

## Alcance recomendado para Version 1

La Version 1 debe enfocarse en:

1. Login.
2. Proveedores.
3. Equipos.
4. Contratos.
5. Valorizaciones.
6. Facturas.
7. Adjuntos obligatorios.
8. Carpetas visibles en servidor.
9. Alertas de vencimiento.
10. Dashboard de pagos por vencer.
11. Reporte de facturas por vencer/vencidas.

Dejar para Version 2:

- Pagos parciales.
- Supabase Storage.
- App nativa mobile.
- WhatsApp avanzado.
- OCR de facturas.
- Importador flexible de multiples formatos Excel.
