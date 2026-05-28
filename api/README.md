# API Alquileres ISEM

Backend inicial para convertir la maqueta en una aplicacion funcional.

## Requisitos

- Node.js 24+
- Para desarrollo inmediato se usa SQLite local.
- Para produccion se recomienda PostgreSQL administrado o servidor propio.

## Configuracion local

1. Copiar `.env.example` a `.env`.
2. Ajustar `LOCAL_STORAGE_ROOT` a la carpeta visible del servidor propio.
3. Generar cliente Prisma y migrar:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Iniciar API:

```powershell
npm run dev
```

## Nota sobre base de datos

La primera etapa local usa SQLite para poder avanzar sin instalar Docker o PostgreSQL. Antes de produccion se debe migrar el datasource a PostgreSQL y ejecutar una migracion limpia sobre la base definitiva.

## Usuarios semilla

- Admin: `admin@isem.local` / `Admin12345!`
- Operativo: `operativo@isem.local` / `Operativo12345!`

## Endpoints iniciales

- `GET /health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `GET /api/v1/suppliers/:id`
- `PATCH /api/v1/suppliers/:id`
- `GET /api/v1/equipment`
- `POST /api/v1/equipment`
- `GET /api/v1/contracts`
- `POST /api/v1/contracts`
- `GET /api/v1/valuations`
- `POST /api/v1/valuations`
- `GET /api/v1/invoices`
- `POST /api/v1/invoices`
- `POST /api/v1/invoices/:id/mark-paid`
- `GET /api/v1/attachments`
- `POST /api/v1/attachments`
- `GET /api/v1/alerts`
- `POST /api/v1/alerts/run`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/reports/due-invoices`
- `GET /api/v1/search?q=texto`
