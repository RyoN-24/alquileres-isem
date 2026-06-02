# Guia de cierre y preparacion para produccion

## Estado actual

La aplicacion queda lista como MVP funcional local para uso interno y pruebas con datos reales. Incluye login, roles, proveedores, equipos, contratos, valorizaciones, facturas, adjuntos en carpetas visibles, alertas, prorrogas, reportes, importacion Excel, contrato PDF y dashboard operativo.

## Ejecucion local

API:

```powershell
cd "E:\PROYECTO CODEX\ALQUILERES ISEM\api"
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Web:

```powershell
cd "E:\PROYECTO CODEX\ALQUILERES ISEM\web"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

URL local:

```text
http://127.0.0.1:5174
```

Usuarios semilla:

```text
admin@isem.local / Admin12345!
operativo@isem.local / Operativo12345!
```

Cambiar estas contrasenas antes de usar datos reales sensibles.

## Carpetas visibles

La raiz documental se define en:

```text
LOCAL_STORAGE_ROOT=E:/ISEM_ARCHIVOS
```

No mover manualmente carpetas despues de cargar documentos, porque la base de datos guarda la ruta exacta del archivo. Para backups se debe copiar completa la carpeta `E:/ISEM_ARCHIVOS` junto con la base de datos.

## Produccion gratis en Render + Vercel + Supabase

La configuracion de produccion usa Render solo para ejecutar la API, Vercel para la web y Supabase Free para conservar la base de datos y adjuntos. No usar SQLite en `/tmp` para datos reales: Render recrea ese almacenamiento en reinicios o redeploys y se perderian proveedores, usuarios, facturas y adjuntos.

Supabase:

1. Crear un proyecto en Supabase.
2. En Storage, crear un bucket privado llamado `isem-documentos`.
3. Copiar el `Project URL`.
4. Copiar la connection string de Postgres en modo URI y usarla como `DATABASE_URL`.
5. Copiar la `service_role key` solo para Render. No colocarla en Vercel ni en el frontend.

Render API:

- Blueprint/root: usar `render.yaml` desde la raiz del repositorio.
- Build command: `npm install && npm run prisma:generate && npm run build`.
- Start command: `npm run start:prod`.
- Health check: `/health`.
- `DATABASE_URL`: connection string de Supabase Postgres.
- `FILE_STORAGE_MODE`: `CLOUD_STORAGE`.
- `SUPABASE_URL`: Project URL de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key de Supabase.
- `SUPABASE_STORAGE_BUCKET`: `isem-documentos`.
- `APP_URL`: URL final de Vercel.
- `APP_URLS`: dominios adicionales separados por coma, por ejemplo previews de Vercel.

Con esta configuracion, aunque Render Free se duerma o reinicie, la informacion queda guardada en Supabase.

Vercel web:

- Root/build desde repo raiz con `vercel.json`.
- Variable obligatoria: `VITE_API_URL=https://tu-api-render.onrender.com`.
- Si `VITE_API_URL` no existe, la web solo intentara usar backend local en `localhost` o `127.0.0.1`.

Comandos de verificacion local antes de subir:

```powershell
cd "E:\PROYECTOS ANTIGRAVITY\ALQUILERES ISEM\api"
npm test
npm run build

cd "E:\PROYECTOS ANTIGRAVITY\ALQUILERES ISEM\web"
npm run lint
npm run build
```

Importante: `/tmp` es temporal. En Render Free la app levanta, pero la base y adjuntos pueden perderse si el servicio se reinicia. Para datos reales se debe usar Render Disk pagado, PostgreSQL/Supabase o un servidor propio con almacenamiento persistente.

## Produccion en servidor propio

Recomendacion minima:

- Windows Server o Linux VPS.
- Node.js LTS instalado.
- PostgreSQL para produccion.
- Servicio permanente para API con PM2, NSSM o systemd.
- Web compilada y servida por Nginx, IIS o un hosting estatico.
- HTTPS obligatorio si se accede desde internet.
- Backup diario de base de datos y carpeta documental.

Pasos generales:

1. Crear base de datos final o usar SQLite con carpeta persistente.
2. Cambiar `DATABASE_URL` en `api/.env`.
3. Usar un `JWT_SECRET` largo y privado.
4. Definir `APP_URL` con el dominio real del frontend.
5. Definir `VITE_API_URL` con el dominio real de la API.
6. Ejecutar migraciones Prisma sobre la base final.
7. Crear usuario administrador definitivo.
8. Probar carga/descarga de adjuntos desde una red externa.

## PostgreSQL / Supabase

El proyecto ya queda preparado para PostgreSQL/Supabase:

- Prisma usa provider `postgresql`.
- El build de produccion ejecuta `prisma db push` y luego el seed inicial. El arranque solo levanta el servidor para que Render detecte el puerto sin esperar tareas de base de datos.
- Los adjuntos se guardan en Supabase Storage cuando `FILE_STORAGE_MODE=CLOUD_STORAGE`.
- En desarrollo local se puede seguir usando carpetas visibles con `FILE_STORAGE_MODE=LOCAL_VISIBLE`, pero para eso la base local debe ser PostgreSQL.

## Alertas por correo y WhatsApp

El sistema ya detecta facturas por vencer, vencidas y prorrogas. Para envio real externo falta configurar proveedor:

- Correo: SMTP, Resend, SendGrid o similar.
- WhatsApp: Twilio, 360dialog o WhatsApp Business API.

No se deben simular envios en produccion. Antes de activar envios reales se requieren:

- Correo destino del administrador.
- Numero WhatsApp autorizado.
- Credenciales del proveedor.
- Plantillas aprobadas si el proveedor WhatsApp lo exige.

## Verificacion antes de produccion

Ejecutar:

```powershell
cd "E:\PROYECTO CODEX\ALQUILERES ISEM\api"
npm test
npm run build
npm audit --audit-level=high

cd "E:\PROYECTO CODEX\ALQUILERES ISEM\web"
npm run lint
npm run build
npm audit --audit-level=high
```

Resultado esperado actual:

- API tests: pasan.
- API build: pasa.
- Web lint: pasa.
- Web build: pasa.
- Web audit high: sin vulnerabilidades.
- API audit high: sin vulnerabilidades altas; queda advertencia moderada transitiva de `exceljs/uuid`.
