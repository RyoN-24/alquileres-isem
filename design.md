# Design Brief - Alquileres ISEM

## 1. Contexto del Producto

Alquileres ISEM es una plataforma web responsive para INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL, empresa peruana que controla alquileres de maquinaria, equipos y vehiculos provistos por proveedores externos.

La aplicacion centraliza proveedores, contratos, equipos, valorizaciones, facturas, alertas de vencimiento, comprobantes de pago, documentos adjuntos y carpetas documentales reales.

El producto debe ahorrar tiempo. Actualmente el control manual por Excel o por proveedor genera trabajo repetitivo, riesgo de olvido y poca visibilidad sobre pagos proximos. La interfaz debe convertir esa informacion dispersa en una bandeja de control clara, segura y accionable.

No disenar una landing page. No disenar una maqueta estatica. No disenar un dashboard generico de IA. Disenar una herramienta real de gestion operativa y financiera.

## 2. Objetivo del Diseno

Crear una aplicacion que transmita:

- Confianza.
- Seguridad.
- Tecnologia.
- Jerarquia.
- Orden.
- Precision.
- Control financiero.
- Control documental.

El usuario debe entender en pocos segundos:

- Cuanto debe pagar.
- En que moneda debe pagar: PEN o USD.
- Que facturas vencen pronto.
- Que facturas ya vencieron.
- Que proveedor esta asociado.
- Que contrato y equipo respaldan la factura.
- Que documentos faltan.
- Donde esta la carpeta documental.
- Que accion debe tomar ahora.

El diseno debe sentirse como un centro de control financiero-operativo para una empresa tecnica, no como una plantilla SaaS comun.

## 3. Cambio de Direccion Visual

Olvidar la referencia visual anterior basada en negro y verde neon. La nueva direccion no debe depender de una captura especifica.

La prioridad ahora es construir una identidad visual propia para ISEM:

- Tecnologica.
- Corporativa.
- Segura.
- Con jerarquia clara.
- Profesional para uso diario.
- Legible para usuarios administrativos y directivos.

La interfaz puede usar sidebar oscuro y superficies claras, o una variante hibrida, pero no debe caer en el error de solo cambiar colores. El diseno debe replantear composicion, densidad, tipografia, estados, interacciones, ritmo visual y jerarquia.

## 4. Paleta de Color Recomendada

Direccion: Tecnologia Confiable.

Esta paleta comunica seguridad y jerarquia mediante azul profundo, tecnologia mediante teal, y control operativo mediante estados sobrios.

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

## 5. Uso de la Paleta

### Azul profundo

Usar `#123C69` como color principal. Debe comunicar confianza, seguridad, estabilidad y autoridad.

Usos:

- Botones primarios.
- Estados activos importantes.
- Titulos o indicadores clave.
- Sidebar accents.
- Iconos principales.

### Azul tecnologia

Usar `#0F5C8C` como apoyo para elementos tecnologicos o de navegacion.

Usos:

- Hover.
- Enlaces.
- Borde activo.
- Graficos secundarios.

### Teal tecnologico

Usar `#00A6A6` como acento de modernidad, no como color dominante.

Usos:

- Indicadores de sistema.
- Confirmaciones menores.
- Elementos interactivos.
- Chips informativos.
- Detalles tecnologicos.

### Fondo claro

Usar `#F5F7FA` como fondo general para mejorar legibilidad y confianza.

La app no debe sentirse pesada ni oscura por completo. El producto es de uso diario y debe ser facil de leer.

### Sidebar oscuro

Usar `#0B1220` para sidebar y zonas de estructura. Esto aporta jerarquia, tecnologia y presencia corporativa.

### Estados

Los estados deben ser sobrios y claros:

- Pagado / activo: `#2E7D52`.
- Por vencer / advertencia: `#C88719`.
- Vencido / error: `#B23A32`.
- Informativo / documento: `#3267C8`.

Los colores de estado nunca deben ser el unico indicador. Agregar texto, icono y/o marcador visual.

## 6. Tipografia Recomendada

La tipografia debe comunicar precision, tecnologia y confianza. Evitar fuentes demasiado redondeadas, decorativas o con personalidad excesivamente amigable.

### Opcion principal recomendada

```text
IBM Plex Sans
```

Por que:

- Tiene caracter tecnico.
- Se siente institucional.
- Funciona bien en tablas y formularios.
- Comunica ingenieria y sistema serio.

### Opcion alternativa

```text
Inter
```

Por que:

- Muy legible.
- Excelente para dashboards.
- Moderna y limpia.
- Buena para interfaces con mucha informacion.

### Recomendacion final

Usar:

```text
IBM Plex Sans como tipografia principal.
Inter como alternativa para numeros o si se prefiere una implementacion mas simple.
```

Si solo se implementa una familia, usar IBM Plex Sans.

## 7. Jerarquia Tipografica

La jerarquia no debe depender solo del tamano. Debe usar posicion, peso, color, agrupacion, iconografia y espaciado.

Escala recomendada:

```css
Pantalla / H1: 24-28px, weight 700
Seccion / H2: 18-20px, weight 700
Bloque / H3: 15-16px, weight 700
Body: 14px, weight 400/500
Tabla: 13px, weight 400/500
Labels: 12px, weight 600
Montos importantes: 28-34px, weight 700
Badges: 11-12px, weight 700
```

Reglas:

- Montos PEN/USD deben tener jerarquia fuerte.
- Tablas deben mantenerse densas y legibles.
- No usar titulos gigantes sin funcion.
- No usar marketing copy.
- Los encabezados deben ser claros y operativos.

## 8. Personalidad Visual

La interfaz debe sentirse:

- Corporativa.
- Tecnologica.
- Segura.
- Ejecutiva.
- Ordenada.
- Confiable.
- Moderna.
- Con jerarquia.
- Diseñada para trabajo real.

No debe sentirse:

- Generica.
- Hecha por IA.
- Como fintech decorativa.
- Como ERP antiguo.
- Como landing page.
- Como dashboard de tarjetas repetidas.
- Como interfaz estatica.

## 9. Reglas Anti Diseno IA

Evitar estrictamente:

- Hero sections.
- Gradientes decorativos.
- Orbes, blobs, bokeh o fondos abstractos.
- Cards repetidas sin intencion.
- Iconos decorativos sin funcion.
- Exceso de sombras.
- Exceso de redondeo.
- Paleta morada/azul SaaS generica.
- Tipografia gigante sin proposito.
- Mucho espacio vacio que reduzca utilidad.
- Graficos falsos.
- Copys de marketing.
- Componentes con el mismo peso visual.

La interfaz debe parecer creada por alguien que entiende pagos, facturas, contratos, equipos y documentacion, no por alguien que solo aplica tendencias visuales.

## 10. Movimiento e Interaccion

El producto no debe sentirse estatico. Debe tener microinteracciones modernas, sobrias y funcionales.

Usar efectos para:

- Hover en filas de tablas.
- Focus claro en formularios.
- Apertura de detalles tipo drawer o modal.
- Transiciones suaves entre estados.
- Feedback al registrar pago.
- Indicador de carga en importacion Excel.
- Skeleton loading para contenido.
- Acciones secundarias visibles al pasar sobre filas.
- Paneles de alerta con presencia visual.

Efectos recomendados:

- Transiciones de 120-180ms.
- Elevacion sutil en elementos interactivos.
- Borde activo azul o teal.
- Cambio de fondo suave en filas.
- Drawer lateral para detalles.
- Animacion de entrada discreta para modales.

Evitar:

- Animaciones largas.
- Parallax.
- Efectos de landing.
- Pulso exagerado.
- Movimiento decorativo.
- Animaciones que distraigan de los vencimientos.

## 11. Principio Rector UX

La aplicacion debe ser primero util y luego visualmente atractiva. La estetica debe reforzar el trabajo.

Cada componente debe ayudar a responder una pregunta:

- Esta factura vence pronto?
- Esta vencida?
- Esta pagada?
- Es PEN o USD?
- Que proveedor es?
- Que contrato respalda esta factura?
- Que documento falta?
- Donde esta la carpeta?
- Que accion sigue?

Si un elemento visual no ayuda a operar mejor, debe simplificarse o eliminarse.

## 12. Layout General

Estructura recomendada:

- Sidebar oscuro corporativo.
- Logo visible de ISEM.
- Topbar clara y compacta.
- Busqueda global prominente.
- Contenido principal sobre fondo gris claro.
- Superficies blancas para lectura.
- Paneles con bordes limpios.
- Densidad controlada.

No usar una app completamente oscura como primera opcion. Para este producto conviene una base clara con estructura oscura, porque comunica seriedad y mejora la lectura.

## 13. Dashboard Operativo

El dashboard es la pantalla mas importante. Debe funcionar como bandeja de decision, no como tablero decorativo.

Debe responder:

- Que debo pagar esta semana?
- Que ya esta vencido?
- Cuanto necesito en soles?
- Cuanto necesito en dolares?
- Que proveedor requiere atencion?
- Que documento falta antes de pagar?

Estructura recomendada:

- Resumen financiero superior:
  - Pendiente PEN.
  - Pendiente USD.
  - Facturas vencidas.
  - Facturas por vencer.
- Panel principal: proximos pagos.
- Panel de urgencia: vencidas.
- Panel secundario: gasto por proveedor.
- Acciones rapidas:
  - Nuevo contrato.
  - Nueva valorizacion.
  - Nueva factura.
  - Importar Excel.

Reglas:

- PEN y USD deben estar separados visualmente.
- Vencido debe tener mayor urgencia visual.
- Por vencer debe usar advertencia ambar.
- Pagado debe transmitir cierre y control.
- Las acciones criticas deben estar visibles.

## 14. Facturas - Bandeja de Pagos

La vista de facturas debe sentirse como bandeja de trabajo, no como tabla comun.

Columnas sugeridas:

- Estado.
- Numero de factura.
- Proveedor.
- Contrato.
- Equipo.
- Vencimiento.
- Dias restantes o dias vencida.
- Moneda.
- Monto.
- Acciones.

Acciones:

- Ver detalle.
- Registrar pago.
- Registrar prorroga.
- Descargar adjunto.

Filtros:

- Proveedor.
- Estado.
- Moneda.
- Sede.
- Rango de fechas.
- Solo no pagadas.

Las facturas vencidas deben destacar con:

- Texto claro.
- Icono.
- Borde o marcador rojo.
- Dias vencidos.

No depender solo del color.

## 15. Detalle de Factura

El detalle debe sentirse como expediente financiero-documental.

Mostrar:

- Numero de factura.
- Estado.
- Proveedor.
- RUC.
- Contrato.
- Valorizacion.
- Equipo.
- Fecha de emision.
- Fecha de vencimiento.
- Moneda.
- Monto total.
- Comparacion monto valorizado vs monto facturado.
- Alerta si hay diferencia.
- Prorroga si existe.
- Fecha de pago si esta pagada.
- Observaciones.

Seccion documental:

- Factura PDF/imagen.
- Valorizacion del proveedor.
- Comprobante de pago.
- Otros documentos.
- Ruta de carpeta real.

Acciones:

- Marcar pagada.
- Subir comprobante.
- Registrar prorroga.
- Descargar documento.
- Copiar ruta.

## 16. Proveedores - Vista 360

La ficha de proveedor debe ahorrar abrir multiples Excels.

Lista:

- Razon social.
- RUC.
- Contacto.
- Estado.
- Contratos activos.
- Equipos alquilados.
- Facturas pendientes.
- Monto pendiente PEN.
- Monto pendiente USD.

Detalle:

- Datos generales.
- Cuenta bancaria.
- Condiciones de pago.
- Contacto.
- Equipos vinculados.
- Contratos historicos.
- Valorizaciones.
- Facturas.
- Adjuntos.
- Ruta de carpeta.

Debe verse como ficha de control, no como card decorativa.

## 17. Contratos

Lista:

- Numero de contrato.
- Proveedor.
- Sede.
- Equipos.
- Inicio.
- Fin.
- Modalidad hora/dia.
- Tarifa.
- Moneda.
- Estado.
- Documentos faltantes.

Detalle:

- Generar PDF.
- Contrato generado.
- Contrato firmado.
- Orden de servicio.
- Valorizaciones.
- Facturas.
- Ruta documental.

Si falta contrato firmado u orden de servicio, debe verse claramente.

## 18. Equipos y Vehiculos

La vista debe ayudar a ubicar:

- Que equipo pertenece a que proveedor.
- En que sede esta.
- Bajo que contrato opera.
- Que valorizaciones genero.
- Que documentos/fotos tiene.

Campos:

- Tipo.
- Descripcion.
- Marca.
- Modelo.
- Ano.
- Placa o codigo.
- Proveedor.
- Sede.
- Estado.

Debe sentirse tecnica, ordenada y precisa.

## 19. Valorizaciones

Mostrar:

- Numero.
- Contrato.
- Equipo.
- Periodo o fecha de corte.
- Horas o dias.
- Tarifa.
- Monto calculado.
- Moneda.
- Estado.
- Factura asociada.
- Archivo de valorizacion del proveedor.

Si no tiene factura, debe quedar claro que esta pendiente.

## 20. Reportes

Los reportes deben sentirse ejecutivos y exportables.

Reportes:

- Facturas por vencer y vencidas.
- Costo por proveedor.
- Costo por equipo.
- Valorizaciones por contrato.
- Consolidado general.

Elementos:

- Filtros visibles.
- Totales PEN y USD separados.
- Exportar Excel.
- Exportar PDF.
- Resumen superior.
- Tabla legible.

## 21. Configuracion e Importacion

Configuracion:

- Usuarios.
- Roles.
- Sedes.
- Tipos de equipo.
- Alertas.
- Plantilla de contrato.
- Importacion Excel.

Importacion Excel debe ser un flujo claro:

1. Descargar plantilla.
2. Subir archivo.
3. Previsualizar errores.
4. Importar datos.

Mostrar:

- Creados.
- Omitidos.
- Errores.
- Hoja.
- Fila.
- Mensaje.

## 22. Componentes del Design System

Crear componentes reutilizables:

- Sidebar.
- Topbar.
- Busqueda global.
- Tarjetas de metrica.
- Badges de estado.
- Bandeja de pagos.
- Tabla densa.
- Drawer o modal de detalle.
- Panel de carpeta documental.
- Panel de adjuntos.
- Filtros.
- Formularios.
- Botones primarios/secundarios.
- Alertas.
- Estados vacios.
- Skeleton loading.

## 23. Responsive

Disenar para:

- Desktop 1440px.
- Tablet 768px.
- Mobile 390px.

En mobile priorizar:

- Facturas vencidas.
- Facturas por vencer.
- Monto PEN.
- Monto USD.
- Acciones de pago.
- Busqueda.

Si la tabla no cabe, convertirla en lista operativa compacta. No ocultar acciones criticas.

## 24. Accesibilidad y Legibilidad

Requisitos:

- Alto contraste.
- Texto legible.
- Estados con texto + color + icono.
- Focus visible.
- Botones tactiles adecuados.
- Formularios claros.
- Tablas escaneables.
- No depender de color solamente.

El producto debe ser comodo para usuarios no tecnicos y usuarios administrativos.

## 25. Datos Realistas para Mockups

Usar ejemplos reales o plausibles, no lorem ipsum.

Ejemplos:

- Proveedor: Maquinarias Andinas SAC.
- Proveedor: Transportes del Sur EIRL.
- Factura: F001-004582.
- Factura: E001-000731.
- Contrato: ISEM-2026-001.
- Equipo: Excavadora CAT 320.
- Moneda: PEN / USD.
- Monto: S/ 12,240.00.
- Monto: USD 1,140.00.
- Estado: Vencida / Pendiente / Pagada / Observada.
- Ruta: E:\ISEM_ARCHIVOS\proveedores\...\contratos\...

## 26. Entregables Esperados

Crear pantallas completas:

1. Dashboard operativo desktop.
2. Bandeja de facturas desktop.
3. Detalle de factura.
4. Ficha 360 de proveedor.
5. Detalle de contrato.
6. Configuracion/importacion.
7. Dashboard mobile.
8. Facturas mobile.

No entregar solo una pantalla bonita. El diseño debe mostrar un sistema.

## 27. Criterio de Exito

El diseno sera correcto si:

- Transmite confianza.
- Transmite seguridad.
- Transmite tecnologia.
- Tiene jerarquia visual clara.
- No parece generado por IA.
- No parece una landing page.
- No se queda en un cambio de colores.
- Se entiende que es una app de pagos, contratos y documentos.
- Permite decidir que pagar en segundos.
- Las acciones criticas son visibles.
- Las carpetas y documentos son parte natural del flujo.
- La identidad de ISEM se siente propia y profesional.

El objetivo final es que la aplicacion parezca hecha especificamente para ISEM, con criterio de producto real y no con apariencia generica.
