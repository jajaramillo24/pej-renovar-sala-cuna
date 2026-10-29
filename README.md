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

## Envío por QR desde la app

Ejecutar `npm install` y `npm start`, y abrir http://127.0.0.1:3488/ en esta computadora. Cada encargado genera su QR, lo escanea desde Dispositivos vinculados en WhatsApp, revisa su tanda e inicia el envío desde el panel. No requiere abrir chats individuales. Los mensajes se envían secuencialmente; se puede detener la tanda. Un error incierto detiene el envío y requiere revisar el chat antes de reintentar. Se excluyen teléfonos inválidos, repetidos en la tanda y ya enviados por ese encargado.

GitHub Pages publica la agenda y el acceso al panel local; no ejecuta el servidor de WhatsApp. La modalidad online con QR para usuarios remotos todavía no está desplegada. El servidor solo acepta conexiones de 127.0.0.1, verifica Host y Origin y exige un token en cada POST. No exponer este servidor directamente a Internet: un despliegue remoto requiere autenticación por encargado y disco persistente. `app-data/`, que contiene sesiones y registros, está excluido de Git.

El cliente whatsapp-web.js es no oficial. No se garantiza evitar restricciones de WhatsApp. El estado Enviado indica que se completó la operación de envío, no que se leyó el mensaje.

### API local

GET `/api/state?owner=Emi` devuelve conexión, QR, progreso y token. Los POST requieren JSON, Origin del panel y X-App-Token.

| Ruta POST | Datos además de owner | Resultado |
| --- | --- | --- |
| /api/connect | ninguno | Genera QR |
| /api/preview | sender, template, ids, overrides | Mensajes exactos, exclusiones y plan de 15 minutos |
| /api/send | planId, confirmed | Inicia la tanda revisada |
| /api/stop | ninguno | Detiene pendientes |
| /api/resolve | key, status | Resuelve un envío incierto |
| /api/disconnect | ninguno | Desvincula WhatsApp |
