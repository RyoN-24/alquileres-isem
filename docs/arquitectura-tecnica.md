# Arquitectura Tecnica

## Stack recomendado

### Frontend web responsive

- React con TypeScript.
- Vite o Next.js, segun estrategia de despliegue.
- Componentes UI reutilizables.
- Formularios con validacion del lado cliente.

### Backend

- Node.js con TypeScript.
- API REST.
- Validacion de entrada con esquemas tipados.
- Jobs programados para alertas y actualizacion de facturas vencidas.

### Base de datos

- PostgreSQL.
- Migraciones versionadas.
- Zona horaria operativa: America/Lima.

### Almacenamiento de adjuntos

- S3 compatible: AWS S3, Cloudflare R2, Supabase Storage o similar.
- Guardar en base de datos solo metadatos y URL/clave del archivo.

### Autenticacion

- Login con usuario y contrasena.
- Recuperacion por correo electronico.
- Roles: ADMIN y OPERATIVO.
- Sesiones con JWT o cookies seguras.

## Despliegue sugerido

Opcion simple para 2 a 5 usuarios:

- Frontend y backend en una misma plataforma cloud.
- PostgreSQL administrado.
- Storage S3 compatible.
- Proveedor SMTP para correos.
- Integracion WhatsApp mediante Twilio o 360dialog.

## Reglas transversales

- Todas las fechas se registran con precision suficiente para auditoria.
- Las fechas operativas se interpretan en America/Lima.
- Los montos se guardan como decimal, no como float.
- Los valores monetarios siempre deben incluir moneda.
- Las eliminaciones criticas deben ser logicas cuando exista historial asociado.
- Las operaciones relevantes deben registrar auditoria basica: usuario, fecha, entidad y accion.

## Seguridad minima

- Contrasenas hasheadas con algoritmo robusto.
- Control de acceso por rol en backend.
- Validacion de archivos adjuntos por tipo y tamano.
- URLs privadas o firmadas para adjuntos.
- Registro de cambios en facturas y contratos.

## Jobs programados

### Actualizacion de facturas vencidas

Frecuencia sugerida: diaria, 00:10 America/Lima.

Acciones:

- Buscar facturas pendientes u observadas con fecha de vencimiento menor a la fecha actual.
- Cambiar estado a vencida.
- Mantener alertas activas mientras no esten pagadas.

### Generacion/envio de alertas

Frecuencia sugerida: diaria, 08:00 America/Lima.

Acciones:

- Buscar facturas no pagadas que vencen en 3 dias.
- Buscar facturas vencidas no pagadas.
- Crear notificacion en pantalla.
- Enviar correo al administrador.
- Enviar WhatsApp al administrador si la integracion esta configurada.

