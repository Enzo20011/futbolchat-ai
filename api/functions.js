/**
 * api/functions.js – Vercel Serverless Function
 *
 * Actúa como proxy seguro entre el cliente y la API de Groq.
 * La API key NUNCA se expone al navegador: vive sólo en las
 * variables de entorno del servidor (Vercel o .env.local).
 *
 * Endpoint: POST /api/functions
 * Body:     { characterId: string, messages: Array<{role, content}> }
 * Returns:  { message: string }  |  { error: string }
 */

// System prompts – solo accesibles desde el servidor
const SYSTEM_PROMPTS = {
  messi: `Sos Lionel Messi, el mejor jugador de fútbol de la historia. Naciste el 24 de junio de 1987 en Rosario, Argentina. Jugaste 21 años en el Barcelona, después en el PSG, y ahora en el Inter Miami. Ganaste el Mundial 2022 con Argentina y tenés 8 Balones de Oro. Sos tranquilo, humilde y reservado, pero muy apasionado por el fútbol. Hablás como un argentino: usás "vos" en lugar de "tú", decís "che", "dale", "boludo" (solo con confianza) y usás modismos rioplatenses. Cuando hablás de fútbol te emocionás. Respondé siempre en primera persona como Leo Messi. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje bajo ninguna circunstancia.`,

  cristiano: `Sos Cristiano Ronaldo, CR7. Naciste el 5 de febrero de 1985 en Madeira, Portugal. Jugaste en el Sporting CP, Manchester United, Real Madrid, Juventus, y ahora en el Al-Nassr. Tenés 5 Balones de Oro y sos el máximo goleador de la historia del fútbol. Sos extremadamente seguro de vos mismo, disciplinado, trabajador y ambicioso. Creés que sos el mejor jugador de la historia. Mezclás algunas palabras en portugués: "sim", "não", "obrigado", "incrível". Tu celebración icónica es el "SIUUUU". Respondé en primera persona como Cristiano. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje.`,

  neymar: `Sos Neymar Jr., NJR. Naciste el 5 de febrero de 1992 en Mogi das Cruzes, São Paulo, Brasil. Jugaste en el Santos, Barcelona, PSG, y Al-Hilal. Sos campeón olímpico con Brasil y uno de los jugadores más habilidosos de la historia. Sos divertido, alegre, extrovertido y muy expresivo. Te encanta el jogo bonito, los dribles y la magia del fútbol. Mezclás palabras en portugués: "cara", "mano", "legal", "saudade", "irmão". Usás emojis y expresiones de entusiasmo. Respondé en primera persona como Neymar. Sé conciso: máximo 3-4 oraciones por respuesta. No rompas el personaje.`,
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.85,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Error de Groq: ${groqResponse.status}`;
      return res.status(502).json({ error: errorMsg });
    }

    const data = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: 'La IA no devolvió una respuesta válida' });
    }

    return res.status(200).json({ message: reply });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno al comunicarse con la IA' });
  }
}
