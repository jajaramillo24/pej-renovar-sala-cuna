# Renovar · PEJ

Invitaciones para la sala cuna Pico Picotero, sábado 7/11/2026, de 15 a 20 h.

155 contactos de la tabla original más reciente (29/10/2026, 20:34 UTC). Las celdas vacías de encargado continúan el bloque anterior: Guille, Mili, Lauti, Nai, Emi y Jey tienen 22 personas cada uno; Manuel tiene 23. No se incorporaron los nueve directores de la campaña anterior porque corresponden a otra lista.

La página tiene pestañas por encargado, firma editable por pestaña, plantilla con `{nombre}` y `{remitente}`, saludo editable por contacto, vista previa, copia y apertura de WhatsApp, corrección de teléfono, advertencias de teléfonos duplicados, estados manuales y exportación CSV. Abrir un chat no marca un mensaje como enviado. No realiza envíos automáticos ni conecta con una API de WhatsApp. La sesión se vincula exclusivamente en WhatsApp Web mediante su QR oficial.

Los nombres del listado conservan apellido y nombre. El saludo usa el primer nombre de pila y permite editarlo antes de enviar. Cuatro teléfonos de origen tienen longitud inválida y requieren corrección: Casas Chiara Delfina, Martinez Mia Nicole, Roldan Ileana y Lopez Marchese, Tomas Agustin. No se adivinaron números. Los teléfonos compartidos muestran una advertencia antes del envío.

Los cambios se guardan por navegador en localStorage, no se sincronizan entre dispositivos o personas. Los contactos iniciales están incluidos en la página pública; no publicar datos adicionales. Se excluyeron fechas de nacimiento, edades, CUIT, domicilios y correos del archivo original.

## Desarrollo

`npm test` valida asignaciones, teléfonos y enlaces personalizados. `npm start` sirve la página en http://localhost:4173. No necesita dependencias ni compilación.

## Publicación

GitHub Pages usa el workflow `.github/workflows/pages.yml` y publica solamente cinco archivos del sitio. Seleccionar GitHub Actions como origen de Pages en el repositorio. Cada push a main ejecuta las verificaciones y actualiza la página.
