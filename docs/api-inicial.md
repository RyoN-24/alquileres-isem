# API Inicial

## Convenciones

- API REST con JSON.
- Rutas versionadas bajo `/api/v1`.
- Fechas en formato ISO `YYYY-MM-DD` para fechas operativas.
- Fechas-hora en ISO 8601.
- Campos en `camelCase`.
- Enumeraciones en `UPPER_SNAKE`.
- Listados paginados con `page`, `pageSize`, `sortBy` y `sortOrder`.

## Respuesta de error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos invalidos",
    "details": {}
  }
}
```

## Autenticacion

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password-recovery`
- `POST /api/v1/auth/password-reset`
- `GET /api/v1/auth/me`

## Usuarios

- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`
- `PATCH /api/v1/users/:id/status`

Solo ADMIN.

## Sedes

- `GET /api/v1/sites`
- `POST /api/v1/sites`
- `GET /api/v1/sites/:id`
- `PATCH /api/v1/sites/:id`

## Proveedores

- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `GET /api/v1/suppliers/:id`
- `PATCH /api/v1/suppliers/:id`
- `GET /api/v1/suppliers/:id/history`

Filtros:

- `status`
- `q`

## Equipos

- `GET /api/v1/equipment`
- `POST /api/v1/equipment`
- `GET /api/v1/equipment/:id`
- `PATCH /api/v1/equipment/:id`

Filtros:

- `supplierId`
- `siteId`
- `status`
- `typeId`
- `q`

## Contratos

- `GET /api/v1/contracts`
- `POST /api/v1/contracts`
- `GET /api/v1/contracts/:id`
- `PATCH /api/v1/contracts/:id`
- `POST /api/v1/contracts/:id/export-pdf`

Filtros:

- `supplierId`
- `siteId`
- `status`
- `currency`
- `startDateFrom`
- `startDateTo`

Ejemplo de creacion:

```json
{
  "supplierId": "uuid",
  "siteId": "uuid",
  "contractNumber": "ISEM-2026-0001",
  "equipmentIds": ["uuid"],
  "startDate": "2026-06-01",
  "endDate": "2026-12-31",
  "billingMode": "HORA",
  "rate": "180.00",
  "currency": "PEN",
  "valuationMode": "POR_PERIODO",
  "valuationPeriod": "MENSUAL",
  "invoiceDueDays": 30,
  "notes": "Contrato inicial"
}
```

## Valorizaciones

- `GET /api/v1/valuations`
- `POST /api/v1/valuations`
- `GET /api/v1/valuations/:id`
- `PATCH /api/v1/valuations/:id`

Filtros:

- `contractId`
- `supplierId`
- `status`
- `periodStart`
- `periodEnd`

Regla de calculo:

- Backend calcula `calculatedAmount`.
- Frontend puede previsualizar el monto, pero el backend es la fuente de verdad.

## Facturas

- `GET /api/v1/invoices`
- `POST /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `PATCH /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/mark-paid`
- `POST /api/v1/invoices/:id/attachments`
- `GET /api/v1/invoices/:id/attachments/:attachmentId/download`

Filtros:

- `supplierId`
- `contractId`
- `siteId`
- `status`
- `currency`
- `dueFrom`
- `dueTo`

Reglas:

- No se permite guardar una factura sin adjunto.
- `mark-paid` exige `paidAt`.
- Si no se envia `dueDate`, se calcula con el plazo del contrato.

## Alertas

- `GET /api/v1/alerts`
- `PATCH /api/v1/alerts/:id/seen`

Reglas:

- Una alerta solo se resuelve cuando la factura asociada esta pagada.

## Dashboard

- `GET /api/v1/dashboard/summary`

Respuesta sugerida:

```json
{
  "activeContracts": {
    "total": 12,
    "bySite": [
      { "siteId": "uuid", "siteName": "Obra Norte", "total": 4 }
    ]
  },
  "pendingInvoices": {
    "PEN": "12500.00",
    "USD": "3200.00"
  },
  "dueSoonInvoices": [],
  "overdueInvoices": [],
  "monthlySpendBySupplier": []
}
```

## Reportes

- `GET /api/v1/reports/cost-by-supplier`
- `GET /api/v1/reports/cost-by-equipment`
- `GET /api/v1/reports/invoice-status`
- `GET /api/v1/reports/valuations-by-contract`
- `GET /api/v1/reports/consolidated`

Parametros comunes:

- `from`
- `to`
- `siteId`
- `format=json|xlsx|pdf`

