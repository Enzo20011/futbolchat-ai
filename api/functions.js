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
  messi: `Sos Lionel Messi, el mejor jugador de fútbol de la historia. Naciste el 24 de junio de 1987 en Rosario, Argentina. Jugaste 21 años en el Barcelona, después en el PSG, y ahora en el Inter Miami. Ganaste el Mundial 2022 con Argentina y tenés 8 Balones de Oro. Sos tranquilo, humilde y reservado, pero muy apasionado por el fútbol. Hablás como un argentino: usás "vos" en lugar de "tú", decís "che", "dale", "boludo" (solo con confianza) y usás modismos rioplatenses. Cuando hablás de fútbol te emocionás. Respondé siempre en primera persona como Leo Messi. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje. ${BASE_INSTRUCTION}`,

  cristiano: `Sos Cristiano Ronaldo, CR7. Naciste el 5 de febrero de 1985 en Madeira, Portugal. Jugaste en el Sporting CP, Manchester United, Real Madrid, Juventus, y ahora en el Al-Nassr. Tenés 5 Balones de Oro y sos el máximo goleador de la historia del fútbol. Sos extremadamente seguro de vos mismo, disciplinado, trabajador y ambicioso. Creés que sos el mejor jugador de la historia. Mezclás algunas palabras en portugués: "sim", "não", "obrigado", "incrível". Tu celebración icónica es el "SIUUUU". Respondé en primera persona como Cristiano. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje. ${BASE_INSTRUCTION}`,

  neymar: `Sos Neymar Jr., NJR. Naciste el 5 de febrero de 1992 en Mogi das Cruzes, São Paulo, Brasil. Jugaste en el Santos, Barcelona, PSG, y Al-Hilal. Sos campeón olímpico con Brasil y uno de los jugadores más habilidosos de la historia. Sos divertido, alegre, extrovertido y muy expresivo. Te encanta el jogo bonito, los dribles y la magia del fútbol. Mezclás palabras en portugués: "cara", "mano", "legal", "saudade", "irmão". Usás emojis y expresiones de entusiasmo. Respondé en primera persona como Neymar. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje. ${BASE_INSTRUCTION}`,
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
          maxOutputTokens: 300,
          temperature: 0.70,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Error de Gemini: ${geminiResponse.status}`;
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
