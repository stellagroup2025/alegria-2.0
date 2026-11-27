// Contenido de Alegría 2.0. Las cinco son EXPERIENCIAS, no noches fijas: no se promete qué día toca
// cada una (solo está confirmado el horario). Orden del carrusel = orden de YAAS (la central es la 3.ª).
// Días de DJ: aún sin confirmar con el cliente. Cuando los diga, ponlos aquí (p. ej. "Viernes y sábados")
// y el texto de la experiencia DJ y la pregunta frecuente se adaptan solos.
export const DJ_DIAS = null;
// Horario del karaoke (la clienta dio «por ejemplo de 8 a 11»: confirmar). Lunes cerrado, como el local.
export const KARAOKE = "de 20:00 a 23:00";

export const NOCHES = [
  {
    id: "viejoteca", liquid: "#bfe07a", title: "VIEJOTECA", name: "Viejoteca", glass: "highball", color: "#39ff88", dark: "#0d6b3c",
    cocktail: "Mojito",
    when: "Vuelven las Viejotecas · fechas en el canal",
    description: "Vuelve la gran fiesta latino-colombiana: vallenato, música popular, artistas invitados, empanadas, chorizo con arepa y rifas. Bailar como antes, con la gente de siempre.",
  },
  {
    id: "dj", liquid: "#1fa3e8", title: "DJ EN CABINA", name: "DJ en cabina", glass: "balon", color: "#19e6ff", dark: "#0a5d78",
    cocktail: "Gin-tonic azul",
    when: DJ_DIAS ? `${DJ_DIAS} · DJ en cabina` : "Noches de DJ · avisos en el canal",
    description: DJ_DIAS
      ? `No hay DJ todas las noches, y por eso se notan. ${DJ_DIAS} la pista cambia de marcha: pides tu tema, te lo pone y nadie se sienta hasta el cierre.`
      : "No hay DJ todas las noches, y por eso se notan: cuando está en cabina la pista cambia de marcha. Pides tu tema, te lo pone y nadie se sienta hasta el cierre. Las noches de DJ las avisamos en el canal de WhatsApp.",
  },
  {
    id: "karaoke", liquid: "#d4145a", title: "KARAOKE", name: "Karaoke", glass: "martini", color: "#ff2fb3", dark: "#8a0f5c",
    cocktail: "Cosmopolitan",
    when: `Martes a domingo · ${KARAOKE}`,
    description: `Ha vuelto el micro: de martes a domingo, ${KARAOKE}. Pantallas, letras y un público que corea contigo, aunque desafines un poquito. Después, la pista sigue hasta el cierre.`,
  },
  {
    id: "salsa", liquid: "#d81e2c", title: "PISTA LATINA", name: "Pista latina", glass: "margarita", color: "#ff3d3d", dark: "#8c1414",
    cocktail: "Daiquiri de fresa",
    when: "Vallenato · cumbia · música popular",
    description: "Luces de colores, la música de casa y una pista que se llena sola. Vallenato, cumbia y lo que pida la gente: aquí nadie se queda sentado mucho rato.",
  },
  {
    id: "cumple", liquid: "#f0c24a", title: "CUMPLEAÑOS", name: "Cumpleaños", glass: "coupe", color: "#ffd23f", dark: "#8a6a00",
    cocktail: "Copa de cava",
    when: "Vuelve a celebrarlo aquí",
    description: "Ahora que hemos vuelto, tu cumpleaños vuelve a tener sitio. Dinos el día y cuántos sois, te guardamos sitio para el grupo y hacemos que el final de la noche sea perfecto.",
  },
];
export const DEFAULT_INDEX = 2;

export const WHATSAPP = "https://wa.me/34625924429?text=" + encodeURIComponent("¡Hola Alegría 2.0! Quería reservar sitio para…");
// Canal de WhatsApp del bar (PENDIENTE: pegar aquí el enlace «https://whatsapp.com/channel/…»).
// Mientras esté vacío, los botones del canal abren un chat con el mensaje «quiero unirme al canal».
export const CANAL_URL = "";
export const CANAL = CANAL_URL || "https://wa.me/34625924429?text=" + encodeURIComponent("¡Hola Alegría 2.0! Quiero unirme a vuestro canal de WhatsApp para enterarme de las fiestas.");
export const TEL = "tel:+34625924429";
export const MAPS = "https://www.google.com/maps/search/?api=1&query=Alegria+2.0+Calle+del+Puerto+de+Pajares+3+Madrid";
export const INSTAGRAM = "https://www.instagram.com/laalegria_2.0/";

// Horario por día (0 = domingo, como Date#getDay). null = cerrado.
export const HOURS = [["Domingo", "20:00", "05:30"], ["Lunes", null], ["Martes", "20:00", "05:00"], ["Miércoles", "20:00", "05:00"], ["Jueves", "20:00", "05:00"], ["Viernes", "20:00", "05:30"], ["Sábado", "20:00", "05:30"]];

export const FAQ = [
  ["¿Ya estáis abiertos?", "¡Sí, hemos vuelto! Abrimos de martes a domingo desde las 20:00. Los lunes descansamos. Para no perderte nada de la vuelta, únete a nuestro canal de WhatsApp."],
  ["¿A qué hora es el karaoke?", `De martes a domingo, ${KARAOKE}. Después sigue la música latina hasta el cierre.`],
  ["¿Qué horario tenéis?", "De martes a domingo desde las 20:00. De martes a jueves cerramos a las 5:00 y de viernes a domingo a las 5:30. Los lunes descansamos."],
  ["¿Puedo celebrar mi cumpleaños?", "¡Claro! Escríbenos por WhatsApp al 625 92 44 29 con el día y cuántos sois, y os preparamos sitio para el grupo."],
  ["¿Hay que reservar?", "Para venir no hace falta. Para grupos, cumpleaños o fiestas especiales, mejor avísanos antes y te guardamos sitio."],
  ["¿Qué música ponéis?", "Latina, sobre todo: vallenato, cumbia, música popular y lo que pida la pista. Y karaoke para quien se anime."],
  ["¿Qué días hay DJ?", DJ_DIAS ? `${DJ_DIAS}. Pide tu tema y te lo pone.` : "Depende de la semana. Lo avisamos en nuestro canal de WhatsApp: únete y te enteras el primero."],
  ["¿Hay edad mínima?", "Sí. Solo mayores de 18 años, sin excepciones."],
  ["¿Dónde estáis?", "En la calle del Puerto de Pajares, 3, en Puente de Vallecas (28053 Madrid)."],
  ["¿Hacéis eventos especiales?", "Sí: Viejotecas con artistas invitados, Halloween y fiestas temáticas. Las anunciamos antes que en ningún sitio en nuestro canal de WhatsApp, y también en Instagram, @laalegria_2.0."],
];

export const wa = (text) => "https://wa.me/34625924429?text=" + encodeURIComponent(text);

// Fotos de escenas y gente: hay versiones de 800 y 1400 px además de la original de 2000
// (assets/img/*/x-800.jpg, x-1400.jpg). En móvil se ven a 200–400 px; con la original de 2000 la
// memoria de imágenes pasaba de 300 MB y Chrome/Safari cerraban la pestaña al bajar.
export const pic = (src, sizes) => {
  const b = src.replace(/\.jpg$/, "");
  return `src="${b}-800.jpg" srcset="${b}-800.jpg 800w, ${b}-1400.jpg 1400w, ${src} 2000w" sizes="${sizes}"`;
};

// Base de datos común de clientes (Supabase). La clave publicable puede ir en la web: las tablas están cerradas
// y desde fuera solo se puede llamar a las funciones de apuntarse y de registrar una petición de reserva.
export const SUPABASE = { url: "https://zbcjhcvjnpigesvfyibe.supabase.co", key: "sb_publishable_QKlh63AKSawSyepIhJy_Ng_8tqDXrwd", negocio: "alegria-2-0" };
