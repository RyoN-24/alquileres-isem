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

## Produccion en Render + Vercel

La configuracion incluida usa SQLite con un disco persistente de Render montado en `/var/data`. No usar `/tmp` para datos reales: Render recrea ese almacenamiento en reinicios o redeploys y se perderian proveedores, usuarios, facturas y adjuntos.

Render API:

- Blueprint/root: usar `render.yaml` desde la raiz del repositorio.
- Build command: `npm install && npm run prisma:generate && npm run build`.
- Start command: `npm run start:prod`.
- Health check: `/health`.
- Disk: Persistent Disk montado en `/var/data`.
- `DATABASE_URL`: `file:/var/data/isem.db`.
- `LOCAL_STORAGE_ROOT`: `/var/data/ISEM_ARCHIVOS`.
- `APP_URL`: URL final de Vercel.
- `APP_URLS`: dominios adicionales separados por coma, por ejemplo previews de Vercel.

Si se mantiene Render Free sin disco persistente, la aplicacion sirve solo para pruebas. Cualquier proveedor, usuario o factura creada puede desaparecer al reiniciarse la instancia.

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

## PostgreSQL / Supabase futuro

Cuando se migre a Supabase:

- Cambiar el provider de Prisma de `sqlite` a `postgresql`.
- Crear una migracion limpia para PostgreSQL o usar `prisma db push` en una base nueva controlada.
- Usar Supabase Postgres como `DATABASE_URL`.
- Mantener adjuntos localmente si el cliente necesita carpetas visibles.
- Si se migra storage a Supabase Storage, crear una capa de almacenamiento cloud y decidir si se mantiene una copia local visible.

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
