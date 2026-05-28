# Diagnostico de Estructura, Mejoras y Preguntas Clave

## Enfoque correcto del proyecto

El objetivo no debe ser una interfaz bonita. El objetivo debe ser una plataforma operativa que reduzca el tiempo de revision entre proveedores, contratos, valorizaciones, facturas y documentos respaldatorios.

La aplicacion debe funcionar como una combinacion de:

- Sistema de control de alquileres.
- Archivo documental digital.
- Agenda de vencimientos.
- Tablero de deuda y compromisos.
- Historial por proveedor, equipo, contrato y sede.

Si el sistema no permite encontrar rapidamente "que le debo a este proveedor", "que contrato respalda esta factura", "que equipo estuvo en que obra" y "donde esta el PDF/foto de respaldo", entonces no estaria cumpliendo el objetivo principal.

## Diagnostico de la estructura inicial

La estructura funcional inicial esta bien encaminada porque contempla:

- Proveedores.
- Equipos.
- Contratos.
- Valorizaciones.
- Facturas.
- Alertas.
- Dashboard.
- Reportes.

Pero necesita reforzarse en cuatro puntos para que sea realmente util:

1. Expediente documental por entidad.
2. Trazabilidad completa entre documentos.
3. Flujo operativo diario claro.
4. Estados y reglas de bloqueo bien definidos.

## Mejora 1: Expediente documental digital

La especificacion inicial indica adjuntos obligatorios para facturas, pero el sistema deberia manejar documentos en mas niveles.

### Documentos recomendados por proveedor

- Ficha RUC.
- Constancia de cuenta bancaria.
- Contactos o documentos comerciales.
- Acuerdos generales de pago.
- Otros documentos administrativos.

### Documentos recomendados por contrato

- Contrato firmado.
- PDF generado por el sistema.
- Orden de servicio si existe.
- Correos o documentos de aprobacion.
- Anexos o adendas.

### Documentos recomendados por equipo

- Tarjeta de propiedad, si aplica.
- SOAT, si aplica.
- Revision tecnica, si aplica.
- Foto del equipo.
- Certificados o documentos tecnicos.

### Documentos recomendados por valorizacion

- Parte diario.
- Reporte de horas.
- Conformidad de servicio.
- Acta de avance.
- Evidencia fotografica.

### Documentos recomendados por factura

- PDF de factura.
- Imagen o foto del comprobante.
- Constancia de pago.
- Detraccion, retencion u otro documento tributario si aplica.

## Mejora 2: Estructura de carpetas reales

El sistema debe almacenar los archivos en una estructura logica, aunque fisicamente se guarden en S3, R2, Supabase Storage o disco local.

Estructura sugerida:

```text
ISEM/
  proveedores/
    {ruc-proveedor}-{nombre-proveedor}/
      ficha/
      cuentas-bancarias/
      contratos/
        {numero-contrato}/
          contrato-generado/
          contrato-firmado/
          anexos/
          valorizaciones/
            {numero-valorizacion}/
              partes-diarios/
              conformidades/
              evidencias/
              factura/
                comprobante/
                constancia-pago/
      equipos/
        {placa-o-codigo}/
          documentos/
          fotos/
  reportes/
    {anio}/
      {mes}/
  auditoria/
```

### Recomendacion tecnica

No conviene depender solo de carpetas manuales del sistema operativo. Lo ideal es:

- Guardar archivos en storage administrado.
- Registrar cada archivo en base de datos.
- Generar una ruta logica legible.
- Permitir descargar o navegar los documentos desde la app.
- Mantener metadatos: quien subio, cuando, tipo, entidad asociada, version.

Asi se obtiene orden documental sin perder control, permisos ni busqueda.

## Mejora 3: Centro de busqueda y revision

Para ahorrar tiempo, la app debe tener una busqueda global potente.

Debe permitir buscar por:

- Proveedor.
- RUC.
- Numero de contrato.
- Numero de factura.
- Numero de valorizacion.
- Placa o codigo de equipo.
- Sede.
- Estado.
- Fecha de vencimiento.
- Monto.

Resultado esperado:

- Si busco un proveedor, veo todo su expediente.
- Si busco una factura, veo contrato, valorizacion, adjunto y estado de pago.
- Si busco un equipo, veo proveedor, obra, contrato e historial.
- Si busco una sede, veo contratos activos, equipos y deuda asociada.

## Mejora 4: Vista 360 por proveedor

La ficha del proveedor debe ser una de las pantallas mas importantes del sistema.

Debe mostrar:

- Datos generales.
- Contactos.
- Cuenta bancaria.
- Condicion de pago.
- Equipos asociados.
- Contratos activos.
- Contratos finalizados.
- Valorizaciones pendientes de factura.
- Facturas pendientes.
- Facturas vencidas.
- Facturas pagadas.
- Monto total pendiente en PEN.
- Monto total pendiente en USD.
- Documentos del proveedor.
- Historial cronologico.

Acciones necesarias:

- Nuevo contrato para este proveedor.
- Nuevo equipo para este proveedor.
- Nueva factura para este proveedor.
- Subir documento.
- Exportar expediente.
- Ver carpeta documental.

## Mejora 5: Flujo operativo diario

La pantalla de inicio no debe ser decorativa. Debe responder preguntas del dia:

- Que facturas vencen pronto.
- Que facturas ya vencieron.
- Que proveedores tienen deuda pendiente.
- Que valorizaciones aun no tienen factura.
- Que contratos estan por terminar.
- Que equipos siguen en obra.
- Que documentos faltan.

Se recomienda agregar bandejas de trabajo:

1. Facturas por vencer.
2. Facturas vencidas.
3. Valorizaciones sin factura.
4. Contratos por vencer.
5. Documentos faltantes.
6. Pagos recientes.

## Mejora 6: Estados mas precisos

Los estados iniciales son buenos, pero pueden quedar cortos.

### Proveedor

- ACTIVO.
- INACTIVO.
- BLOQUEADO.

### Equipo

- DISPONIBLE.
- EN_OBRA.
- EN_MANTENIMIENTO.
- RETIRADO.
- FINALIZADO.

### Contrato

- BORRADOR.
- ACTIVO.
- POR_VENCER.
- FINALIZADO.
- CANCELADO.

### Valorizacion

- BORRADOR.
- PENDIENTE_FACTURA.
- FACTURADA.
- OBSERVADA.
- PAGADA.
- ANULADA.

### Factura

- REGISTRADA.
- PENDIENTE.
- OBSERVADA.
- VENCIDA.
- PAGADA.
- ANULADA.

Estas diferencias ayudan a controlar mejor el trabajo pendiente.

## Mejora 7: Control de documentos faltantes

Ademas de subir documentos, el sistema deberia indicar que falta.

Ejemplos:

- Factura sin adjunto: no se permite guardar.
- Contrato activo sin PDF firmado: advertencia.
- Equipo vehicular sin SOAT: advertencia.
- Valorizacion sin conformidad: advertencia.
- Pago registrado sin constancia: advertencia opcional.

Esto convierte el sistema en una herramienta de control, no solo en una base de datos.

## Mejora 8: Auditoria e historial cronologico

Cada entidad importante debe tener una linea de tiempo:

- Creacion.
- Ediciones.
- Cambios de estado.
- Archivos subidos.
- Archivos reemplazados.
- Facturas registradas.
- Pagos registrados.
- Alertas generadas.
- Reportes exportados.

Esto es clave cuando varias personas usan el sistema.

## Mejora 9: Reportes orientados a decisiones

Ademas de los reportes iniciales, se recomiendan:

- Ranking de proveedores por gasto.
- Deuda pendiente por proveedor.
- Deuda vencida por proveedor.
- Contratos por vencer.
- Equipos por sede.
- Equipos con mayor gasto acumulado.
- Valorizaciones pendientes de factura.
- Facturas sin constancia de pago.
- Documentos faltantes por proveedor o contrato.

## Mejora 10: Permisos mas claros

Roles iniciales:

- Administrador.
- Operativo.

Recomendacion:

Mantener esos dos roles al inicio, pero definir permisos internos:

### Administrador

- Gestiona usuarios.
- Gestiona parametros.
- Edita plantillas.
- Anula registros.
- Reemplaza adjuntos.
- Exporta reportes completos.
- Ve auditoria.

### Operativo

- Registra proveedores.
- Registra equipos.
- Registra valorizaciones.
- Registra facturas.
- Sube adjuntos.
- Consulta dashboard y reportes basicos.
- No elimina ni anula sin permiso.

## Mejora 11: No borrar informacion sensible

En este tipo de sistema, eliminar registros puede causar perdida de trazabilidad.

Recomendacion:

- Usar anulacion o inactivacion.
- Mantener historial.
- Registrar motivo.
- Permitir eliminar solo registros sin relaciones y solo al administrador.

## Mejora 12: Preparar importacion masiva

Aunque no este en el alcance inicial, seria muy util permitir cargar datos existentes desde Excel.

Importaciones recomendadas:

- Proveedores.
- Equipos.
- Contratos vigentes.
- Facturas pendientes.

Esto ahorraria tiempo al iniciar el sistema.

## Preguntas clave para mejorar el proyecto

## Respuestas ya confirmadas

- Actualmente solo existe informacion controlada de 1 proveedor.
- El problema principal es que llevar un Excel por proveedor es pesado.
- Se necesitan carpetas visibles porque parte del equipo esta mas familiarizado con estructuras tradicionales de archivos.
- El almacenamiento inicial sera en servidor propio.
- A futuro se considera Supabase para produccion.
- Cada factura corresponde a una sola valorizacion.
- Cada valorizacion corresponde a una sola factura.
- Los pagos parciales no son prioridad para la primera version.
- Es obligatorio adjuntar factura, valorizacion emitida por proveedor y comprobante de pago.
- No todas las valorizaciones tienen parte diario.
- El reporte mas importante es facturas proximas a vencer y montos a vencer para programar pagos.
- Existe un Excel actual de un proveedor que puede servir como piloto.
- La primera etapa sera usada solo por el encargado del seguimiento y pagos.
- El sistema debe prepararse para produccion por internet cuando este terminado.
- Solo el administrador marcara facturas como pagadas en la primera etapa.
- La moneda debe poder seleccionarse por valorizacion.
- Los reportes deben mantener PEN y USD separados.
- Si factura y valorizacion no coinciden en monto, debe mostrarse alerta sin bloquear automaticamente.
- Cada valorizacion es por equipo.
- Un proveedor puede tener varios equipos alquilados.
- Tambien se requieren alertas de contratos por vencer.
- Las alertas deben activarse 3 dias antes.
- Las facturas vencidas pueden tener prorroga acordada con proveedor.
- Contrato firmado y orden de servicio son documentos obligatorios por contrato.
- Los documentos de maquinaria o vehiculo dependen de cada equipo.

## Preguntas aun pendientes

### Sobre el trabajo operativo actual

1. Cuantas facturas de alquiler esperan recibir aproximadamente por mes cuando el sistema este en uso completo?
2. Cuantos proveedores activos proyectan controlar en la primera etapa?
3. Cuantos equipos o vehiculos alquilados manejan o esperan manejar al mismo tiempo?

### Sobre carpetas y documentos

4. Necesitan conservar versiones cuando se reemplaza un archivo?
5. Que documentos son obligatorios por proveedor?

### Sobre contratos

6. El contrato se genera siempre desde la app o a veces se sube un contrato externo firmado?
7. El numero de contrato debe seguir un correlativo obligatorio?
8. Un contrato puede incluir equipos de diferentes proveedores o siempre un solo proveedor?
9. Un contrato puede aplicar a varias sedes o solo una?
10. Que pasa si el contrato vence pero el equipo sigue trabajando?
11. Se manejan adendas o ampliaciones de contrato?

### Sobre valorizaciones

12. Quien aprueba la valorizacion antes de facturar?
13. Se requiere adjuntar conformidad para cada valorizacion?
14. Se debe permitir editar una valorizacion despues de facturada?

### Sobre facturas y pagos

15. Se registra detraccion, retencion, IGV u otros conceptos tributarios?
16. Las facturas observadas deben seguir generando alerta?

### Sobre alertas

17. A que correos deben llegar las alertas?
18. A que numeros de WhatsApp deben llegar?
19. Desean alertas para documentos faltantes?
20. Desean alertas para valorizaciones pendientes de factura?

### Sobre reportes

21. Que fecha manda en reportes: emision, vencimiento, pago o periodo de valorizacion?
22. Necesitan reporte mensual automatico enviado por correo?

### Sobre usuarios y permisos

23. El operativo puede editar registros despues de guardarlos?
24. El operativo puede ver montos o solo registrar documentos?
25. Debe existir aprobacion del administrador para cambios sensibles?

### Sobre implementacion inicial

26. Tienen ya una estructura de carpetas existente que deba respetarse?
27. Se usara desde celulares en obra con mala conexion?
28. Hay una fecha limite para tener una primera version usable?

## Recomendacion de ajuste al alcance inicial

Antes de construir mas pantallas, conviene ajustar el alcance minimo viable a esto:

### Version 1 realmente util

- Login.
- Proveedores.
- Equipos.
- Contratos.
- Valorizaciones.
- Facturas.
- Adjuntos por proveedor, contrato, valorizacion y factura.
- Busqueda global.
- Vista 360 del proveedor.
- Alertas de vencimiento.
- Dashboard operativo.
- Reportes basicos.

### Dejar para version 2

- App nativa mobile.
- WhatsApp avanzado con plantillas aprobadas.
- Aprobaciones complejas.
- Integracion contable.
- OCR de facturas.
- Tipo de cambio automatico.

## Conclusion

La estructura inicial es buena como base, pero debe evolucionar hacia un sistema de expedientes digitales y trazabilidad. La mejora mas importante es incorporar documentos y carpetas logicas desde el inicio, no como extra al final.

La app debe responder rapido estas preguntas:

- Que tengo alquilado?
- A quien pertenece?
- En que sede esta?
- Que contrato lo respalda?
- Que valorizaciones tiene?
- Que facturas estan pendientes?
- Que facturas vencen o ya vencieron?
- Donde esta el documento que lo sustenta?

Si esas preguntas se responden en pocos clics, la plataforma realmente ahorra tiempo.
