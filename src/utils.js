/**
 * utils.js – Funciones de utilidad puras y datos de personajes
 * Estas funciones están separadas del DOM para facilitar los tests unitarios
 */

// ============================================================
// DATOS DE PERSONAJES
// ============================================================

export const CHARACTERS = {
  messi: {
    id: 'messi',
    name: 'Lionel Messi',
    nickname: 'La Pulga',
    number: '10',
    team: 'Inter Miami · Argentina',
    nationality: '🇦🇷',
    color1: '#4facfe',
    color2: '#00f2fe',
    image: '/assets/img/messi-fc26.png',
    description: 'El mejor jugador de la historia. Campeón del mundo en Qatar 2022. Rosarino con alma de campeón.',
    shortDesc: '8 Balones de Oro · Campeón del Mundo 2022',
    greeting: '¡Hola! Soy Leo. ¿De qué querés hablar?',
    emoji: '🐐',
    tips: [
      '¿Cómo fue ganar el Mundial?',
      '¿Cuál fue tu mejor gol?',
      '¿Messi o Cristiano?',
      '¿Cómo te sentís en Miami?',
    ],
  },
  cristiano: {
    id: 'cristiano',
    name: 'Cristiano Ronaldo',
    nickname: 'CR7',
    number: '7',
    team: 'Al-Nassr · Portugal',
    nationality: '🇵🇹',
    color1: '#ff416c',
    color2: '#ff4b2b',
    image: '/assets/img/cristiano-fc26.png',
    description: 'Récords, goles y máxima dedicación. El atleta más completo que el fútbol jamás vio.',
    shortDesc: '5 Balones de Oro · Máximo goleador de la historia',
    greeting: '¡Hola! Soy Cristiano. SIUUUU! ¿En qué puedo ayudarte?',
    emoji: '💪',
    tips: [
      '¿Cuál es tu récord favorito?',
      '¿CR7 o Messi?',
      '¿Cómo entrenás cada día?',
      '¿Cuál fue tu mejor temporada?',
    ],
  },
  neymar: {
    id: 'neymar',
    name: 'Neymar Jr.',
    nickname: 'NJR',
    number: '10',
    team: 'Al-Hilal · Brasil',
    nationality: '🇧🇷',
    color1: '#43e97b',
    color2: '#f9d423',
    image: '/assets/img/neymar-fc26.png',
    description: 'Magia, creatividad y el jogo bonito en estado puro. El dribblador más espectacular del mundo.',
    shortDesc: 'Campeón Olímpico · Crack del jogo bonito',
    greeting: '¡Oi, cara! Soy Ney. ¡Vamos a hablar! 😄',
    emoji: '⚡',
    tips: [
      '¿Cuál es tu drible favorito?',
      '¿Cómo viviste tus lesiones?',
      '¿Qué significó el Barça para vos?',
      '¿El jogo bonito existe hoy?',
    ],
  },
};

// ============================================================
// FUNCIONES DE TRANSFORMACIÓN DE DATOS
// ============================================================

/**
 * Escapa caracteres HTML especiales para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string} Texto con caracteres HTML escapados
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formatea un valor de fecha/hora en formato HH:MM
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} Hora formateada (ej: "14:35") o '' si la fecha es inválida
 */
export function formatTimestamp(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Parsea la respuesta JSON de la API y extrae el campo 'message'
 * @param {Object} data - Objeto de respuesta de la API
 * @returns {string} Mensaje extraído y con trim aplicado
 * @throws {Error} Si la respuesta es inválida o contiene un error
 */
export function parseApiResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Respuesta inválida de la API');
  }
  if (data.error) {
    throw new Error(data.error);
  }
  if (typeof data.message !== 'string' || data.message.trim() === '') {
    throw new Error('La respuesta de la API no contiene un mensaje válido');
  }
  return data.message.trim();
}

/**
 * Crea un objeto de mensaje estandarizado con timestamp
 * @param {'user'|'assistant'} role - Rol del emisor
 * @param {string} content - Contenido del mensaje
 * @returns {{ role: string, content: string, timestamp: string }}
 * @throws {Error} Si el rol o el contenido son inválidos
 */
export function createMessageObject(role, content) {
  if (!['user', 'assistant'].includes(role)) {
    throw new Error('Rol inválido: debe ser "user" o "assistant"');
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new Error('El contenido del mensaje no puede estar vacío');
  }
  return {
    role,
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Guarda datos en localStorage serializándolos a JSON
 * @param {string} key - Clave de almacenamiento
 * @param {any} data - Datos a persistir
 * @returns {boolean} true si se guardó correctamente, false si falló
 */
export function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Carga y parsea datos desde localStorage
 * @param {string} key - Clave de almacenamiento
 * @returns {any|null} Datos parseados o null si no existe o falla el parse
 */
export function loadFromLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Elimina una entrada de localStorage
 * @param {string} key - Clave a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
export function clearFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica si existe historial de conversación guardado para un personaje
 * @param {string} characterId - ID del personaje
 * @returns {boolean}
 */
export function hasStoredHistory(characterId) {
  const history = loadFromLocalStorage(`chat_history_${characterId}`);
  return Array.isArray(history) && history.length > 0;
}

/**
 * Trunca un texto a una longitud máxima agregando '...'
 * @param {string} text - Texto a truncar
 * @param {number} [maxLength=100] - Longitud máxima
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
