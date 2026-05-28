# Wireframes Iniciales

Estos wireframes son de baja fidelidad y sirven para validar flujo antes de diseno visual final. La identidad visual definitiva debe aplicar logo y paleta oficial entregados por el cliente.

## Layout general escritorio

```text
+--------------------------------------------------------------------------------+
| Logo ISEM                  Buscar...                 Alertas  Usuario           |
+----------------------+---------------------------------------------------------+
| Dashboard            | Titulo de pantalla                                      |
| Proveedores          |---------------------------------------------------------|
| Equipos              | Contenido principal                                     |
| Contratos            |                                                         |
| Valorizaciones       |                                                         |
| Facturas             |                                                         |
| Reportes             |                                                         |
| Configuracion        |                                                         |
+----------------------+---------------------------------------------------------+
```

## Layout general mobile

```text
+--------------------------------+
| Logo ISEM      Alertas  Menu   |
+--------------------------------+
| Titulo                         |
|--------------------------------|
| Contenido                      |
|                                |
|                                |
+--------------------------------+
| Inicio Proveedores + Facturas  |
+--------------------------------+
```

## Dashboard

```text
+--------------------------------------------------------------------------------+
| Dashboard                                                                      |
+--------------------+--------------------+--------------------+------------------+
| Contratos activos | Pendiente PEN      | Pendiente USD      | Vencidas          |
+--------------------+--------------------+--------------------+------------------+
| Proximas a vencer en 7 dias                                                    |
| [Factura] [Proveedor] [Vence] [Monto] [Accion]                                 |
+--------------------------------------------------------------------------------+
| Gasto mensual por proveedor                                                    |
| [Grafico de barras]                                                            |
+--------------------------------------------------------------------------------+
| Accesos rapidos: Nuevo contrato | Nueva valorizacion | Nueva factura           |
+--------------------------------------------------------------------------------+
```

## Proveedores

```text
+--------------------------------------------------------------------------------+
| Proveedores                                               [Nuevo proveedor]     |
+--------------------------------------------------------------------------------+
| Filtros: Buscar | Estado                                                        |
+--------------------------------------------------------------------------------+
| Razon social        RUC          Contacto       Estado       Acciones           |
| Proveedor SAC       201...       Juan Perez     Activo       Ver Editar         |
+--------------------------------------------------------------------------------+
```

## Ficha de proveedor

```text
+--------------------------------------------------------------------------------+
| Proveedor SAC                                                        [Editar]   |
+--------------------------------------------------------------------------------+
| Datos generales | Banco y pagos | Historial                                     |
+--------------------------------------------------------------------------------+
| RUC, contacto, telefono, correo, direccion                                      |
| Banco, cuenta, plazo de pago por defecto                                        |
+--------------------------------------------------------------------------------+
| Contratos asociados                                                            |
| Facturas asociadas                                                             |
+--------------------------------------------------------------------------------+
```

## Contratos

```text
+--------------------------------------------------------------------------------+
| Contratos                                                  [Nuevo contrato]     |
+--------------------------------------------------------------------------------+
| Filtros: Proveedor | Sede | Estado | Moneda | Rango                             |
+--------------------------------------------------------------------------------+
| Numero       Proveedor       Sede       Inicio     Fin       Estado   Acciones  |
+--------------------------------------------------------------------------------+
```

## Formulario de contrato

```text
+--------------------------------------------------------------------------------+
| Nuevo contrato                                                                  |
+--------------------------------------------------------------------------------+
| Proveedor [select]        Sede [select]        Numero [auto/manual]             |
| Equipos incluidos [multi-select]                                                |
| Inicio [date]             Fin [date]                                            |
| Modalidad [Hora/Dia]      Tarifa [decimal]      Moneda [PEN/USD]                |
| Valorizacion [modo]       Periodo [select]                                      |
| Vencimiento factura [dias]                                                       |
| Observaciones [textarea]                                                        |
|                                                   [Cancelar] [Guardar]          |
+--------------------------------------------------------------------------------+
```

## Valorizaciones

```text
+--------------------------------------------------------------------------------+
| Nueva valorizacion                                                              |
+--------------------------------------------------------------------------------+
| Contrato [select]                                                               |
| Periodo desde [date]     Periodo hasta [date]     Corte [date]                  |
| Horas/Dias trabajados [decimal]                                                 |
| Tarifa heredada [readonly]      Monto calculado [readonly]                      |
| Observaciones                                                                  |
|                                                   [Cancelar] [Guardar]          |
+--------------------------------------------------------------------------------+
```

## Facturas

```text
+--------------------------------------------------------------------------------+
| Nueva factura                                                                   |
+--------------------------------------------------------------------------------+
| Valorizacion [select]                                                           |
| Proveedor [readonly]       Contrato [readonly]                                  |
| Numero de factura [text]                                                        |
| Emision [date]           Vencimiento [date autocalculado editable]              |
| Moneda [select]          Monto [decimal]                                        |
| Estado [select]                                                              |
| Adjunto PDF/imagen [subir archivo]                                              |
| Observaciones                                                                  |
|                                                   [Cancelar] [Guardar]          |
+--------------------------------------------------------------------------------+
```

## Reportes

```text
+--------------------------------------------------------------------------------+
| Reportes                                                                        |
+--------------------------------------------------------------------------------+
| Tipo de reporte [select]                                                        |
| Desde [date] Hasta [date] Sede [select] Proveedor [select] Moneda [select]      |
|                                                [Generar] [Exportar Excel] [PDF] |
+--------------------------------------------------------------------------------+
| Resultado                                                                       |
+--------------------------------------------------------------------------------+
```

