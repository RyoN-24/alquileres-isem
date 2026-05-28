# Design Brief Estricto - Alquileres ISEM

## 1. Objetivo del Archivo

Este archivo debe guiar el rediseño visual de la aplicacion Alquileres ISEM en Stitch/Figma.

El diseño debe respetar estrictamente el alcance funcional existente del producto. No inventar modulos, pestañas, secciones ni flujos que no existan en el sistema.

El objetivo no es crear una app nueva. El objetivo es rediseñar visualmente la app actual para que se vea moderna, confiable, segura, tecnologica y con jerarquia profesional, manteniendo exactamente la logica del producto: alquileres de maquinaria/vehiculos, contratos, valorizaciones, facturas, pagos, alertas, reportes, documentos y carpetas reales.

## 2. Producto

Nombre del producto:

```text
Alquileres ISEM
```

Empresa:

```text
INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL
RUC: 20220199968
Pais: Peru
```

Proposito:

Centralizar y controlar el alquiler de equipos, maquinaria y vehiculos que proveedores externos suministran a ISEM. La plataforma administra proveedores, equipos, contratos, valorizaciones, facturas, vencimientos de pago, documentos adjuntos y carpetas documentales reales.

## 3. Problema que Resuelve

El usuario no quiere revisar un Excel distinto por proveedor ni buscar documentos manualmente. Necesita una sola plataforma para saber:

- Que proveedor debe cobrar.
- Que factura vence.
- Que factura ya vencio.
- Que monto debe programar en PEN.
- Que monto debe programar en USD.
- Que contrato respalda la factura.
- Que equipo o vehiculo corresponde.
- Que valorizacion esta asociada.
- Que documentos faltan.
- Donde esta la carpeta real del respaldo documental.

La app debe ahorrar tiempo y reducir errores de seguimiento.

## 4. Regla Critica: No Inventar Pestañas

La navegacion principal del diseño debe contener SOLO estas secciones:

1. Dashboard
2. Proveedores
3. Equipos
4. Contratos
5. Valorizaciones
6. Facturas
7. Reportes
8. Configuracion

No crear ninguna otra pestaña principal.

No agregar:

- CRM
- Clientes
- Ventas
- Compras
- Inventario
- Recursos Humanos
- Finanzas generales
- Analytics separado
- Calendario separado
- Mensajeria
- Proyectos
- Tareas
- Cotizaciones
- Ordenes de compra
- Caja
- Bancos
- Almacen
- Mantenimiento
- Notificaciones como pestaña independiente
- Documentos como pestaña independiente
- Ajustes avanzados separados

Si se necesitan documentos, deben aparecer dentro de los detalles de factura, contrato, equipo, valorizacion o proveedor. No como modulo principal independiente.

Si se necesitan graficos, deben estar dentro de Dashboard o Reportes. No crear una pestaña "Analytics".

Si se necesitan alertas, deben aparecer en Dashboard, topbar o facturas. No crear una pestaña "Alertas".

## 5. Pantallas Permitidas

El diseño puede incluir solo estas pantallas o vistas:

### Pantallas principales

- Dashboard
- Proveedores
- Equipos
- Contratos
- Valorizaciones
- Facturas
- Reportes
- Configuracion

### Vistas de detalle permitidas

- Detalle 360 de proveedor
- Detalle de equipo
- Detalle de contrato
- Detalle de valorizacion
- Detalle de factura

### Formularios permitidos

- Nuevo proveedor
- Nuevo equipo
- Nuevo contrato
- Nueva valorizacion
- Nueva factura
- Registrar pago
- Registrar prorroga
- Subir adjunto
- Importar Excel
- Crear usuario
- Crear sede
- Crear tipo de equipo
- Editar parametros de alertas
- Editar plantilla de contrato

### Acciones permitidas

- Buscar globalmente
- Filtrar tablas
- Ver detalle
- Copiar ruta de carpeta
- Descargar adjunto
- Subir adjunto
- Generar PDF de contrato
- Exportar reporte Excel
- Exportar reporte PDF
- Previsualizar importacion Excel
- Importar datos desde Excel
- Marcar factura como pagada
- Registrar prorroga

No diseñar flujos fuera de esta lista.

## 6. Modulos Reales del Producto

### Proveedores

Datos:

- Razon social
- Nombre comercial
- RUC
- Contacto
- Telefono
- Correo
- Direccion
- Banco
- Cuenta
- Condicion de pago por defecto
- Estado activo/inactivo
- Historial de contratos
- Historial de facturas
- Carpeta documental

### Equipos

Datos:

- Tipo
- Descripcion
- Marca
- Modelo
- Año
- Placa o codigo interno
- Proveedor
- Sede
- Estado
- Documentos/fotos

### Contratos

Datos:

- Numero de contrato
- Proveedor
- Equipos incluidos
- Sede
- Fecha inicio
- Fecha fin
- Modalidad de cobro: hora o dia
- Tarifa
- Moneda: PEN o USD
- Plazo de vencimiento de factura
- Observaciones
- Estado
- Contrato generado PDF
- Contrato firmado
- Orden de servicio

### Valorizaciones

Datos:

- Numero de valorizacion
- Contrato
- Equipo
- Periodo o fecha de corte
- Horas o dias trabajados
- Tarifa
- Monto calculado
- Moneda
- Estado
- Archivo de valorizacion del proveedor

### Facturas

Datos:

- Numero de factura
- Proveedor
- Contrato
- Valorizacion
- Fecha de emision
- Fecha de vencimiento
- Moneda
- Monto
- Estado
- Archivo factura PDF/imagen
- Comprobante de pago
- Fecha de pago
- Prorroga
- Observaciones

### Alertas

No son una pestaña.

Deben aparecer en:

- Dashboard
- Topbar
- Facturas

Reglas:

- Avisar 3 dias antes del vencimiento.
- Factura vencida sin pagar debe destacarse.
- Alertas permanecen hasta marcar como pagada.
- Puede existir prorroga.

### Reportes

Tipos reales:

- Facturas por vencer/vencidas
- Costo por proveedor
- Costo por equipo
- Valorizaciones por contrato
- Consolidado por rango de fechas

Exportaciones:

- Excel
- PDF

## 7. Direccion Visual

La interfaz debe transmitir:

- Confianza
- Seguridad
- Tecnologia
- Jerarquia
- Orden
- Control financiero
- Control documental

No debe parecer:

- Proyecto generico de IA
- Dashboard de plantilla
- Landing page
- App estatica
- Cambio superficial de colores
- Sistema con pestañas inventadas

La estetica debe ser tecnologica corporativa: base clara, sidebar oscuro, colores sobrios, datos bien jerarquizados y microinteracciones funcionales.

## 8. Paleta de Color Recomendada

Usar una paleta de tecnologia confiable. No usar negro + verde neon como base. No usar morado SaaS generico.

```css
--bg-main: #F5F7FA;
--surface: #FFFFFF;
--surface-alt: #EEF2F6;
--surface-strong: #E4EAF1;
--border: #D8E0EA;

--text-main: #101820;
--text-secondary: #5E6B78;
--text-soft: #8A96A3;

--primary: #123C69;
--primary-2: #0F5C8C;
--primary-soft: #E3EEF7;

--accent: #00A6A6;
--accent-soft: #DDF7F5;

--success: #2E7D52;
--warning: #C88719;
--danger: #B23A32;
--info: #3267C8;

--sidebar: #0B1220;
--sidebar-active: #17233A;
--sidebar-text: #F8FAFC;
--sidebar-muted: #AAB6C5;
```

Uso:

- Azul profundo para confianza y autoridad.
- Teal para tecnologia e interaccion.
- Fondo claro para legibilidad.
- Sidebar oscuro para jerarquia.
- Verde para pagado/activo.
- Ambar para por vencer/prorroga.
- Rojo para vencido/error.
- Azul informativo para documentos/reportes.

## 9. Tipografia

Usar tipografia que comunique precision, tecnologia y confianza.

Recomendacion:

```text
IBM Plex Sans
```

Alternativa:

```text
Inter
```

Escala:

```css
H1 pantalla: 24-28px, 700
H2 seccion: 18-20px, 700
H3 bloque: 15-16px, 700
Body: 14px, 400/500
Tabla: 13px, 400/500
Labels: 12px, 600
Montos principales: 28-34px, 700
Badges: 11-12px, 700
```

La jerarquia no debe depender solo del tamaño. Usar posicion, peso, contraste, agrupacion e iconografia.

## 10. Layout Principal

### Sidebar

Debe incluir SOLO:

- Logo ISEM
- Dashboard
- Proveedores
- Equipos
- Contratos
- Valorizaciones
- Facturas
- Reportes
- Configuracion

No agregar otros items.

Sidebar recomendado:

- Fondo `#0B1220`
- Texto claro
- Estado activo con azul/teal
- Iconos funcionales
- Logo visible

### Topbar

Debe incluir:

- Titulo de pantalla actual
- Nombre de empresa o contexto ISEM
- Busqueda global
- Indicador de alertas
- Boton salir o usuario

No agregar menus sociales, mensajes ni accesos no existentes.

### Contenido

Base clara, paneles blancos, bordes sutiles, tablas densas y areas de accion claras.

## 11. Dashboard

El Dashboard es la pantalla principal.

Debe ser una bandeja de decision operativa, no un tablero decorativo.

Debe incluir:

### Resumen financiero

- Pendiente PEN
- Pendiente USD
- Facturas vencidas
- Facturas proximas a vencer
- Contratos activos

### Bandeja de proximos pagos

Lista de facturas por vencer con:

- Factura
- Proveedor
- Fecha de vencimiento
- Dias restantes
- Moneda
- Monto
- Accion ver detalle

### Bandeja de vencidas

Lista de facturas vencidas con:

- Factura
- Proveedor
- Dias vencida
- Moneda
- Monto
- Accion registrar pago
- Accion prorroga

### Graficos interactivos

Incluir graficos interactivos dentro del Dashboard, no en una pestaña nueva.

Graficos permitidos:

1. Gasto mensual por proveedor
2. Facturas por estado
3. Pendiente por moneda
4. Vencimientos proximos por semana

No agregar graficos que no tengan relacion con pagos, proveedores, contratos, valorizaciones o facturas.

### Accesos rapidos

- Nuevo contrato
- Nueva valorizacion
- Nueva factura
- Importar Excel

## 12. Graficos Interactivos

Agregar graficos interactivos modernos y utiles.

No deben ser decorativos. Deben ayudar a tomar decisiones de pago.

### Grafico 1: Gasto mensual por proveedor

Tipo sugerido:

- Barras horizontales o columnas.

Datos:

- Proveedor
- Total PEN
- Total USD si aplica
- Rango mensual

Interacciones:

- Tooltip al pasar el mouse con proveedor, moneda y monto.
- Click en proveedor filtra o abre detalle del proveedor.
- Selector de periodo: mes actual, ultimos 3 meses, rango personalizado.
- Leyenda para PEN y USD.

### Grafico 2: Facturas por estado

Tipo sugerido:

- Dona o barras apiladas.

Estados:

- Pendiente
- Por vencer
- Vencida
- Vencida con prorroga
- Observada
- Pagada

Interacciones:

- Click en un estado filtra la tabla de facturas.
- Tooltip con cantidad y monto total.
- Colores semanticos por estado.

### Grafico 3: Pendiente por moneda

Tipo sugerido:

- Dos tarjetas-grafico o barras comparativas.

Datos:

- Total pendiente PEN
- Total pendiente USD

Interacciones:

- Click en PEN abre facturas pendientes en PEN.
- Click en USD abre facturas pendientes en USD.
- Tooltip con desglose por proveedor principal.

### Grafico 4: Vencimientos proximos

Tipo sugerido:

- Timeline semanal o barras por dia.

Datos:

- Facturas que vencen en los proximos 7 dias.
- Facturas vencidas.

Interacciones:

- Hover muestra facturas del dia.
- Click en dia filtra facturas por vencimiento.
- Indicadores rojo/ambar segun urgencia.

### Reglas para graficos

- No usar graficos falsos ni decorativos.
- No crear una pestaña Analytics.
- Los graficos deben convivir con tablas y acciones.
- Los graficos deben tener tooltips, filtros o clicks utiles.
- Deben funcionar en mobile como tarjetas o listas graficas simples.

## 13. Facturas

La pantalla Facturas es critica.

Debe ser una bandeja de pagos.

Debe incluir:

- Filtros por texto
- Filtro por estado
- Filtro por sede
- Filtro por moneda
- Rango de fechas
- Boton limpiar filtros
- Tabla/lista de facturas

Columnas:

- Numero
- Proveedor
- Contrato
- Vencimiento
- Monto
- Estado
- Acciones

Acciones por fila:

- Ver detalle
- Marcar pagada
- Prorroga

No agregar columnas ajenas como cliente, vendedor, prioridad comercial, campaña, ticket, canal, region comercial.

## 14. Detalle de Factura

Vista tipo expediente.

Debe incluir:

- Numero de factura
- Estado
- Proveedor
- Contrato
- Valorizacion
- Equipo
- Fecha emision
- Fecha vencimiento
- Moneda
- Monto
- Monto valorizado
- Alerta si no coincide monto/moneda
- Prorroga si existe
- Fecha de pago si existe
- Observaciones
- Ruta de carpeta real
- Adjuntos

Adjuntos permitidos:

- Factura
- Valorizacion proveedor
- Comprobante de pago
- Otros

Acciones:

- Registrar pago
- Registrar prorroga
- Subir adjunto
- Descargar adjunto
- Copiar ruta

## 15. Proveedores

Pantalla Proveedores:

- Tabla/lista de proveedores
- Filtros
- Boton nuevo proveedor
- Accion ver detalle

Detalle proveedor:

- Datos generales
- Contacto
- Banco/cuenta
- Condiciones de pago
- Equipos
- Contratos
- Facturas
- Pendiente PEN
- Pendiente USD
- Ruta carpeta

No agregar oportunidades, pipeline, ventas, clientes finales ni CRM.

## 16. Equipos

Pantalla Equipos:

- Tabla/lista de equipos
- Tipo
- Descripcion
- Marca/modelo/año
- Placa/codigo
- Proveedor
- Sede
- Estado
- Accion ver detalle

Detalle equipo:

- Ficha tecnica
- Proveedor
- Contratos
- Valorizaciones
- Facturas asociadas
- Documentos/fotos
- Ruta carpeta

No convertirlo en modulo de mantenimiento ni inventario general.

## 17. Contratos

Pantalla Contratos:

- Tabla/lista de contratos
- Numero
- Proveedor
- Sede
- Equipos
- Fechas
- Modalidad hora/dia
- Tarifa
- Moneda
- Estado
- Accion ver detalle

Detalle contrato:

- Equipos incluidos
- Valorizaciones
- Facturas
- Documentos faltantes
- Adjuntos
- Ruta carpeta
- Boton generar PDF

Documentos:

- Contrato generado
- Contrato firmado
- Orden de servicio
- Otro documento

No agregar aprobaciones complejas, firmas electronicas externas ni compras.

## 18. Valorizaciones

Pantalla Valorizaciones:

- Tabla/lista de valorizaciones
- Numero
- Contrato
- Equipo
- Fecha de corte
- Cantidad horas/dias
- Monto calculado
- Moneda
- Estado
- Accion ver detalle

Detalle:

- Contrato
- Equipo
- Cantidad
- Tarifa
- Monto
- Factura asociada
- Archivo valorizacion proveedor
- Ruta carpeta

## 19. Reportes

Pantalla Reportes:

Debe permitir seleccionar solo estos reportes:

- Facturas por vencer/vencidas
- Costos consolidados
- Costo por proveedor
- Costo por equipo
- Valorizaciones por contrato

Elementos:

- Selector de reporte
- Filtros por fecha
- Filtro por sede
- Totales PEN/USD
- Vista previa de resultados
- Exportar Excel
- Exportar PDF

Graficos interactivos permitidos en reportes:

- Barras por proveedor
- Barras por equipo
- Distribucion por estado de factura
- Evolucion mensual

No crear pestaña nueva para estos graficos.

## 20. Configuracion

Pantalla Configuracion:

Debe incluir:

- Usuarios
- Roles
- Tipos de equipo
- Sedes
- Alertas
- Plantilla de contrato
- Importacion Excel

No dividir en subpestañas principales nuevas. Puede usar secciones internas o acordeones dentro de Configuracion.

Importacion Excel:

- Descargar plantilla
- Seleccionar archivo
- Previsualizar
- Importar
- Mostrar creados/omitidos/errores
- Mostrar hoja/fila/mensaje

## 21. Estados Visuales

Estados reales:

### Facturas

- Registrada
- Pendiente
- Observada
- Vencida
- Vencida con prorroga
- Pagada
- Anulada

### Contratos

- Borrador
- Activo
- Por vencer
- Finalizado
- Cancelado

### Valorizaciones

- Borrador
- Pendiente factura
- Facturada
- Observada
- Pagada
- Anulada

### Equipos

- Disponible
- En obra
- En mantenimiento
- Retirado
- Finalizado

Los badges deben usar texto, color e icono. No depender solo del color.

## 22. Componentes Permitidos

Componentes que si deben diseñarse:

- Sidebar
- Topbar
- Busqueda global
- Tarjetas de resumen
- Bandeja de pagos
- Tabla densa
- Filtros
- Badges de estado
- Botones
- Drawer/modal de detalle
- Panel de adjuntos
- Panel de carpeta documental
- Graficos interactivos
- Formularios
- Alertas
- Skeleton loading
- Empty states
- Upload area

Componentes que no deben aparecer:

- Chat
- Inbox
- Calendario completo
- Kanban
- CRM pipeline
- E-commerce
- Mapa geografico
- Timeline de proyecto
- Feed social
- Campañas
- Productos/stock

## 23. Movimiento e Interaccion

La app no debe sentirse estatica.

Interacciones esperadas:

- Hover en filas de facturas con acciones visibles.
- Click en tarjeta PEN/USD filtra facturas.
- Click en grafico filtra o abre detalle.
- Tooltip en graficos.
- Drawer lateral para detalle de factura/proveedor/contrato.
- Transicion suave al abrir modales.
- Feedback visual al marcar pagada.
- Skeletons al cargar.
- Estado de carga al importar Excel.
- Focus visible en formularios.

Tiempos:

- 120ms a 180ms para hover y botones.
- 180ms a 240ms para drawers/modales.

Evitar:

- Parallax
- Animaciones largas
- Efectos decorativos
- Movimiento que distraiga de los pagos

## 24. Responsive

Diseñar para:

- Desktop 1440px
- Tablet 768px
- Mobile 390px

Mobile:

- Sidebar se convierte en menu.
- Dashboard prioriza vencidas, por vencer, PEN y USD.
- Facturas se muestran como lista de tarjetas compactas.
- Acciones criticas visibles: detalle, pagar, prorroga.
- Graficos se simplifican pero siguen siendo utiles.

No ocultar informacion critica.

## 25. Datos de Mockup

Usar datos realistas:

- Proveedor: Maquinarias Andinas SAC
- Proveedor: Transportes del Sur EIRL
- Factura: F001-004582
- Factura: E001-000731
- Contrato: ISEM-2026-001
- Equipo: Excavadora CAT 320
- Equipo: Camioneta Toyota Hilux
- Sede: Obra Norte
- Moneda: PEN
- Moneda: USD
- Monto: S/ 12,240.00
- Monto: USD 1,140.00
- Estado: Vencida
- Estado: Pendiente
- Estado: Pagada
- Ruta: E:\ISEM_ARCHIVOS\proveedores\...\contratos\...

No usar lorem ipsum.

## 26. Entregables Esperados

Stitch debe generar diseños para estas pantallas, sin agregar otras:

1. Dashboard desktop
2. Facturas desktop
3. Detalle de factura
4. Proveedores desktop
5. Detalle 360 de proveedor
6. Contratos desktop
7. Detalle de contrato
8. Reportes desktop con graficos interactivos
9. Configuracion desktop
10. Dashboard mobile
11. Facturas mobile

No generar pantallas de modulos inexistentes.

## 27. Criterio de Exito

El diseño sera correcto si:

- Respeta exactamente las 8 secciones reales de navegacion.
- No inventa pestañas.
- No inventa modulos.
- Transmite confianza, seguridad, tecnologia y jerarquia.
- Hace evidente que el foco es pagos, vencimientos, proveedores, contratos y documentos.
- Los graficos interactivos ayudan a filtrar o decidir, no decoran.
- Las acciones criticas son visibles.
- La app se siente dinamica, no estatica.
- La identidad de ISEM se siente profesional.
- Parece un producto hecho para ISEM, no una plantilla generica.
