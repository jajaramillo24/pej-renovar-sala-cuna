export const owners = ['Guille','Mili','Lauti','Nai','Emi','Jey','Manuel'];
export const defaultTemplate = `Hola, {nombre}. ¿Cómo estás?

Soy {remitente}, de Punto de Encuentro Juvenil. Quisiera invitarte a participar de una jornada para renovar la sala cuna “Pico Picotero”.

Vamos a pintar, restaurar y colaborar con la sala cuna, y nos encantaría contar con tu ayuda. ¡Sumate a dar una mano! 🙌

📅 Fecha: sábado 7 de noviembre de 2026
🕒 Horario: de 15 a 20 h
📍 Lugar: calle Sarmiento, esquina Alvear (T3)

¿Te interesa participar? Con gusto puedo enviarte más información y coordinar los detalles.

Muchas gracias por tu tiempo, {nombre}.
Un saludo,
{remitente}`;
export function normalizePhone(value) {let n=String(value).replace(/\D/g,''); if(n.length===10)n='549'+n;else if(n.length===12&&n.startsWith('54'))n='549'+n.slice(2);return n;}
export function validPhone(value){return /^549\d{10}$/.test(normalizePhone(value));}
export function message(template,name,sender){return template.replace(/\{nombre\}/g,()=>name.trim()).replace(/\{remitente\}/g,()=>sender.trim());}
export function whatsappUrl(phone,text){if(!validPhone(phone))throw new Error('Revisá el teléfono antes de abrir WhatsApp.');return 'https://wa.me/'+normalizePhone(phone)+'?text='+encodeURIComponent(text);}
