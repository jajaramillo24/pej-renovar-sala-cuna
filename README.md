# Renovar · PEJ

Invitaciones para renovar la sala cuna Pico Picotero, sábado 7/11/2026, de 15 a 20 h, Sarmiento esquina Alvear (T3).

155 contactos de la tabla original más reciente. Las celdas vacías de encargado continúan el bloque anterior: Guille, Mili, Lauti, Nai, Emi y Jey tienen 22 personas cada uno; Manuel, 23. Se conservaron nombre, teléfono y rol. Se excluyeron CUIT, domicilio, fecha de nacimiento, edad y correo.

## Funcionamiento

Cada navegador mantiene una sesión privada mediante cookie HttpOnly, SameSite=Strict y Secure en producción. Los QR, cuentas, tandas e historiales están aislados por navegador y encargado. Un usuario escanea con su propio WhatsApp, revisa destinatarios y textos y presiona Enviar todos los mensajes. El servidor envía la tanda secuencialmente; no hay que abrir chats individuales. Se puede detener y revisar resultados inciertos antes de reintentar. Las marcas de enviados se conservan también en el navegador.

Los teléfonos inválidos se excluyen de la tanda; pueden corregirse en la agenda. Los duplicados se señalan y se omiten dentro de la tanda. Un envío aceptado por WhatsApp no implica lectura ni entrega al destinatario. No se enviaron mensajes reales durante las verificaciones.

## Despliegue

GitHub Pages sirve la agenda y enlaza al servidor online configurado en online.json. Render ejecuta esta misma app con Node 22 y Baileys, sin Chromium. El plan Free tiene sistema de archivos efímero: reinicios, nuevas publicaciones o suspensión por inactividad pueden perder la vinculación y el historial del servidor. La interfaz conserva el seguimiento del navegador y requiere volver a escanear cuando corresponde. Para retención duradera de sesiones entre reinicios se necesita almacenamiento persistente. No se promete uso permanente de la sesión en el plan gratuito.

La integración usa Baileys, un cliente no oficial de WhatsApp. No garantiza evitar restricciones de WhatsApp. Las sesiones y credenciales de app-data/ están excluidas del repositorio. No compartas cookies, QR ni la carpeta de sesiones.

## Desarrollo

`npm ci`, `npm test`, `npm start`. El servidor local escucha en http://127.0.0.1:3488/. En Render usa PORT, RENDER y RENDER_EXTERNAL_URL. El health check es /healthz. El archivo render.yaml describe la configuración gratuita.

## API

GET /api/state?owner=Emi devuelve conexión, QR, cuenta, progreso y token de la sesión del navegador. Cada POST requiere JSON, cookie, Origin de la app y encabezado X-App-Token. La autorización de un navegador no sirve en otro.

| Ruta POST | Datos además de owner | Resultado |
| --- | --- | --- |
| /api/connect | ninguno | Genera QR o restaura sesión |
| /api/preview | sender, template, ids, overrides | Plan con textos exactos y exclusiones, válido 15 minutos |
| /api/send | planId, confirmed | Inicia la tanda revisada |
| /api/stop | ninguno | Cancela pendientes tras finalizar el envío actual |
| /api/resolve | key, status | Resuelve un resultado incierto revisado en el chat |
| /api/disconnect | ninguno | Desvincula la cuenta |
