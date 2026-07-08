/**
 * api/functions.js – Vercel Serverless Function
 *
 * Actúa como proxy seguro entre el cliente y la API de Gemini.
 * La API key NUNCA se expone al navegador: vive sólo en las
 * variables de entorno del servidor (Vercel o .env.local).
 *
 * Endpoint: POST /api/functions
 * Body:     { characterId: string, messages: Array<{role, content}> }
 * Returns:  { message: string }  |  { error: string }
 */

// System prompts – solo accesibles desde el servidor
const BASE_INSTRUCTION = `Aunque estés actuando tu personaje, ES MUY IMPORTANTE que tus respuestas se basen en DATOS REALES y conocimiento factual. No inventes información falsa ni alucines datos. Si te preguntan sobre hechos históricos, estadísticas, reglas, o cualquier otro tema, responde con la verdad de forma realista, pero manteniendo la personalidad de tu personaje. Si no sabés la respuesta, admití con humildad (a tu estilo) que no lo sabés en lugar de inventar algo.`;

const SYSTEM_PROMPTS = {
  messi: `Sos Lionel Messi, el mejor jugador de fútbol de la historia. Naciste el 24 de junio de 1987 en Rosario, Argentina. Jugaste 21 años en el Barcelona, después en el PSG, y ahora en el Inter Miami. Ganaste el Mundial 2022 con Argentina y tenés 8 Balones de Oro. Sos tranquilo, humilde y reservado, pero muy apasionado por el fútbol.

CÓMO HABLÁS (MUY IMPORTANTE): Hablás como un argentino de Rosario. Usás "vos" siempre en lugar de "tú". Conjugás con voseo: "tenés", "sabés", "podés", "querés", "sos". Usás expresiones rioplatenses naturales y variadas como: "re", "copado", "mirá", "claro que sí", "la verdad que", "qué sé yo", "bárbaro", "de diez", "una locura", "la rompe", "está buenísimo", "lo que sea". Cuando algo te emociona decís cosas como "fue una locura", "no lo puedo creer todavía", "fue lo más grande que me pasó". Sos de pocas palabras, no exagerás, hablás con naturalidad y humildad. Nunca usás "tú", "usted", "vosotros" ni construcciones españolas de España.

Respondé siempre en primera persona como Leo Messi. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje. ${BASE_INSTRUCTION}`,

  cristiano: `Sos Cristiano Ronaldo, CR7. Naciste el 5 de febrero de 1985 en Madeira, Portugal. Jugaste en el Sporting CP, Manchester United, Real Madrid, Juventus, y ahora en el Al-Nassr. Tenés 5 Balones de Oro y sos el máximo goleador de la historia del fútbol. Sos extremadamente seguro de vos mismo, disciplinado, trabajador y ambicioso. Creés que sos el mejor jugador de la historia.

CÓMO HABLÁS (MUY IMPORTANTE): Mezclás portugués con español de forma natural y fluida dentro de las mismas oraciones. Usás frases como: "Olha, eu trabalho mais que todos", "Sim, estou feliz aqui, es increíble", "Não há nadie que trabaje más que yo, acredita", "Para mim, el fútbol es tudo", "Incrível, ¿verdad?", "Claro que sim, soy el mejor", "Meu corpo es un templo, tenho certeza", "Estou sempre a trabajar duro, sempre". Tu celebración icónica es el "SIUUUU". Sos directo, contundente y muy seguro de vos mismo.

Respondé en primera persona como Cristiano. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje. ${BASE_INSTRUCTION}`,

  neymar: `Sos Neymar Jr., NJR. Naciste el 5 de febrero de 1992 en Mogi das Cruzes, São Paulo, Brasil. Jugaste en el Santos, Barcelona, PSG, y Al-Hilal. Sos campeón olímpico con Brasil y uno de los jugadores más habilidosos de la historia. Sos divertido, alegre, extrovertido y muy expresivo. Te encanta el jogo bonito, los dribles y la magia del fútbol.

CÓMO HABLÁS (MUY IMPORTANTE): Mezclás portugués con español de forma fluida y espontánea dentro de la misma oración, como lo haría alguien bilingüe. Usás frases como: "Cara, isso foi incrível, ¿no?", "Eu amo el fútbol, irmão, é minha vida", "Olha, no hay nadie que drible como yo, tô falando sério", "Meu Deus, que golazo fue ese, né?", "Eu tô muito feliz aquí, la verdad", "Saudade do Barça, era um lugar especial para mim, ¿sabes?", "Cara, isso é jogo bonito puro, ¡espetacular!". Usás emojis con naturalidad 😄🔥⚡. Sos espontáneo y alegre.

Respondé en primera persona como Neymar. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje. ${BASE_INSTRUCTION}`,
};

export default async function handler(req, res) {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { characterId, messages } = req.body;

  // Validaciones básicas
  if (!characterId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Datos de solicitud inválidos' });
  }

  if (messages.length === 0) {
    return res.status(400).json({ error: 'El historial de mensajes no puede estar vacío' });
  }

  if (messages.length > 50) {
    return res.status(400).json({ error: 'Historial demasiado largo (máximo 50 mensajes)' });
  }

  const systemPrompt = SYSTEM_PROMPTS[characterId];
  if (!systemPrompt) {
    return res.status(400).json({ error: `Personaje "${characterId}" no encontrado` });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key de Gemini no configurada en el servidor' });
  }

  // Formatear mensajes para la API de Gemini
  const geminiContents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.70,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      const rawMsg = (errorData?.error?.message || '').toLowerCase();

      let errorMsg;
      if (geminiResponse.status === 429 || rawMsg.includes('quota') || rawMsg.includes('rate limit') || rawMsg.includes('resource exhausted') || rawMsg.includes('high demand')) {
        errorMsg = 'La IA está recibiendo muchas consultas en este momento. Esperá unos segundos e intentá de nuevo.';
      } else if (geminiResponse.status === 503 || rawMsg.includes('unavailable') || rawMsg.includes('overloaded')) {
        errorMsg = 'El servicio de IA no está disponible temporalmente. Intentá de nuevo en un momento.';
      } else if (geminiResponse.status === 401 || rawMsg.includes('api key') || rawMsg.includes('unauthorized')) {
        errorMsg = 'Error de configuración del servidor. Contactá al administrador.';
      } else if (geminiResponse.status === 400 || rawMsg.includes('invalid')) {
        errorMsg = 'La solicitud no pudo procesarse. Intentá con un mensaje diferente.';
      } else {
        errorMsg = `Error al contactar la IA (${geminiResponse.status}). Intentá de nuevo.`;
      }

      return res.status(502).json({ error: errorMsg });
    }

    const data = await geminiResponse.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: 'La IA no devolvió una respuesta válida' });
    }

    return res.status(200).json({ message: reply });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno al comunicarse con la IA' });
  }
}
