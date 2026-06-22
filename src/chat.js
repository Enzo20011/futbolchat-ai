/**
 * chat.js – Lógica específica del chat
 * Gestiona el renderizado del chat, el envío de mensajes,
 * el historial de conversación y la persistencia en localStorage.
 */

import {
  CHARACTERS,
  escapeHtml,
  formatTimestamp,
  parseApiResponse,
  createMessageObject,
  saveToLocalStorage,
  loadFromLocalStorage,
  hasStoredHistory,
  clearFromLocalStorage,
} from './utils.js';

// ── Estado del módulo ──────────────────────────────────────────
let chatHistory = []; // Array de { role, content, timestamp }
let isWaiting = false; // Bloquea envío mientras espera respuesta de la IA

// ============================================================
// RENDER PRINCIPAL
// ============================================================

/**
 * Renderiza la vista completa del chat para un personaje dado
 * @param {string} characterId - ID del personaje (messi | cristiano | neymar)
 * @param {Object} router - Instancia del Router
 */
export function renderChat(characterId, router) {
  const character = CHARACTERS[characterId];
  if (!character) {
    router.navigate('/home');
    return;
  }

  // Reiniciar estado al entrar al chat
  chatHistory = [];
  isWaiting = false;

  const app = document.getElementById('app');
  const hasHistory = hasStoredHistory(characterId);

  app.innerHTML = `
    <div class="chat-view"
         id="chat-view"
         style="
           --char1: ${character.color1};
           --char2: ${character.color2};
           --char-grad: linear-gradient(135deg, ${character.color1}, ${character.color2});
         ">

      <!-- ── Sidebar (visible en desktop) ── -->
      <aside class="chat-sidebar" aria-label="Información del personaje">
        <a href="/home" class="btn-back" data-link id="btn-back-sidebar" aria-label="Volver al inicio">
          ← Volver
        </a>

        <div class="sidebar-avatar" aria-hidden="true">
          <span class="sidebar-num">${character.number}</span>
        </div>

        <h2 class="sidebar-name">${character.name}</h2>
        <p class="sidebar-nick">${character.nickname} · ${character.nationality} ${character.emoji}</p>

        <hr class="sidebar-divider">

        <div class="sidebar-info-row">
          <span aria-hidden="true">⚽</span>
          <div>
            <div class="sidebar-info-label">Equipo · País</div>
            <div class="sidebar-info-value">${character.team}</div>
          </div>
        </div>

        <hr class="sidebar-divider">

        <div class="sidebar-tips">
          <p class="tips-heading">💡 Preguntas sugeridas</p>
          <ul class="tips-list" aria-label="Preguntas sugeridas">
            ${character.tips.map((tip) => `
              <li class="tip-item"
                  role="button"
                  tabindex="0"
                  aria-label="Sugerir: ${escapeHtml(tip)}"
                  data-tip="${escapeHtml(tip)}">
                ${escapeHtml(tip)}
              </li>
            `).join('')}
          </ul>
        </div>

        ${hasHistory ? `
          <hr class="sidebar-divider">
          <div class="history-info">
            <span class="history-badge-small">💬 Historial guardado</span>
            <button class="btn-clear-history" id="btn-clear-sidebar" aria-label="Borrar historial">
              🗑️ Borrar historial
            </button>
          </div>
        ` : ''}
      </aside>

      <!-- ── Área principal del chat ── -->
      <main class="chat-main">

        <!-- Header -->
        <header class="chat-header">
          <button class="btn-mobile-back" id="btn-back-mobile" aria-label="Volver">←</button>
          <div class="chat-header-avatar" aria-hidden="true">${character.number}</div>
          <div class="chat-header-info">
            <p class="chat-header-name">${character.name}</p>
            <p class="chat-header-status">
              <span class="status-dot" aria-hidden="true"></span>
              En línea
            </p>
          </div>
          <div class="chat-header-actions">
            <button class="btn-icon-header" id="btn-clear-header" title="Borrar historial" aria-label="Borrar historial">🗑️</button>
          </div>
        </header>

        <!-- Mensajes -->
        <div class="messages-area" id="messages" role="log" aria-live="polite" aria-label="Conversación">
          <div class="chat-welcome" id="chat-welcome" aria-label="Mensaje de bienvenida">
            <div class="welcome-avatar" aria-hidden="true">
              <span>${character.number}</span>
            </div>
            <h3 class="welcome-title">¡Hola! Soy ${character.name}</h3>
            <p class="welcome-greeting">${character.greeting}</p>
          </div>
        </div>

        <!-- Formulario de entrada -->
        <form class="chat-form" id="chat-form" aria-label="Enviar mensaje" novalidate>
          <div class="input-wrapper">
            <input
              type="text"
              id="message-input"
              class="chat-input"
              placeholder="Escribí tu mensaje..."
              autocomplete="off"
              maxlength="1000"
              aria-label="Tu mensaje"
            >
            <button
              type="submit"
              id="btn-send"
              class="btn-send"
              aria-label="Enviar mensaje"
              disabled
            >↑</button>
          </div>
          <p class="input-hint">Presioná <kbd>Enter</kbd> o el botón para enviar</p>
        </form>

      </main>
    </div>
  `;

  // Cargar historial previo si existe
  _loadHistoryFromStorage(characterId, character);

  // ── Event listeners ──────────────────────────────────────────

  const form      = document.getElementById('chat-form');
  const input     = document.getElementById('message-input');
  const btnBack   = document.getElementById('btn-back-mobile');
  const btnClearS = document.getElementById('btn-clear-sidebar');
  const btnClearH = document.getElementById('btn-clear-header');

  // Habilitar botón enviar cuando hay texto
  input.addEventListener('input', () => {
    const btn = document.getElementById('btn-send');
    if (btn) btn.disabled = !input.value.trim() || isWaiting;
  });

  // Enviar con Enter (además del submit del form)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  // Submit del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg || isWaiting) return;
    input.value = '';
    const btn = document.getElementById('btn-send');
    if (btn) btn.disabled = true;
    await _handleSendMessage(msg, characterId, character);
  });

  // Botones de volver
  btnBack?.addEventListener('click', () => router.navigate('/home'));

  // Borrar historial
  const clearHandler = () => {
    chatHistory = [];
    clearFromLocalStorage(`chat_history_${characterId}`);
    renderChat(characterId, router); // Re-renderizar limpio
  };
  btnClearS?.addEventListener('click', clearHandler);
  btnClearH?.addEventListener('click', clearHandler);

  // Sugerencias de preguntas
  document.querySelectorAll('.tip-item').forEach((tip) => {
    const activate = () => {
      const tipText = tip.getAttribute('data-tip');
      if (tipText) {
        input.value = tipText;
        input.focus();
        const btn = document.getElementById('btn-send');
        if (btn) btn.disabled = false;
      }
    };
    tip.addEventListener('click', activate);
    tip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') activate();
    });
  });

  input.focus();
}

// ============================================================
// MANEJO DE MENSAJES
// ============================================================

/**
 * Gestiona el envío de un mensaje: actualiza DOM, llama a la API y recibe respuesta
 * @param {string} userMessage
 * @param {string} characterId
 * @param {Object} character
 */
async function _handleSendMessage(userMessage, characterId, character) {
  isWaiting = true;

  // Quitar mensaje de bienvenida si aún está visible
  document.getElementById('chat-welcome')?.remove();

  // Agregar mensaje del usuario
  const userMsg = createMessageObject('user', userMessage);
  chatHistory.push(userMsg);
  _appendMessage('user', userMessage, 'Vos', userMsg.timestamp, null);
  _saveHistory(characterId);

  // Mostrar indicador de escritura
  const typingEl = _showTypingIndicator(character);

  try {
    // Llamar a la Vercel Function (solo enviamos role+content a la API, sin timestamp)
    const apiMessages = chatHistory.map(({ role, content }) => ({ role, content }));

    const response = await fetch('/api/functions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, messages: apiMessages }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error del servidor: ${response.status}`);
    }

    const reply = parseApiResponse(data);

    // Agregar respuesta del personaje
    typingEl.remove();
    const assistantMsg = createMessageObject('assistant', reply);
    chatHistory.push(assistantMsg);
    _appendMessage('assistant', reply, character.name, assistantMsg.timestamp, character.number);
    _saveHistory(characterId);

  } catch (error) {
    typingEl.remove();
    _showErrorMessage(error.message || 'Error al conectar con la IA. Intentá de nuevo.');
  } finally {
    isWaiting = false;
    const input = document.getElementById('message-input');
    const btn   = document.getElementById('btn-send');
    if (input) { input.disabled = false; input.focus(); }
    if (btn)   { btn.disabled = true; }
  }
}

// ============================================================
// HELPERS DE DOM
// ============================================================

/**
 * Agrega una burbuja de mensaje al contenedor
 */
function _appendMessage(role, content, senderName, timestamp, charNumber) {
  const container = document.getElementById('messages');
  if (!container) return;

  const isUser  = role === 'user';
  const timeStr = formatTimestamp(timestamp || new Date().toISOString());
  const safeContent = escapeHtml(content).replace(/\n/g, '<br>');

  // Botón copiar solo para mensajes del personaje
  const copyBtnHtml = !isUser
    ? `<button class="btn-copy"
              data-content="${escapeHtml(content)}"
              title="Copiar respuesta"
              aria-label="Copiar respuesta">📋</button>`
    : '';

  const el = document.createElement('div');
  el.className = `message ${isUser ? 'msg-user' : 'msg-char'}`;
  el.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">
      ${isUser ? '👤' : (charNumber || '?')}
    </div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-sender">${escapeHtml(senderName)}</span>
        <time class="msg-time" datetime="${timestamp || ''}">${timeStr}</time>
        ${copyBtnHtml}
      </div>
      <div class="msg-bubble">${safeContent}</div>
    </div>
  `;

  // Listener del botón copiar
  const copyBtn = el.querySelector('.btn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => _copyToClipboard(copyBtn, content));
  }

  container.appendChild(el);
  _scrollToBottom(container);
}

/**
 * Muestra el indicador animado de "escribiendo..."
 */
function _showTypingIndicator(character) {
  const container = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = 'message msg-char';
  el.id = 'typing-indicator';
  el.setAttribute('aria-label', `${character.name} está escribiendo`);
  el.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">${character.number}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-sender">${character.name}</span>
      </div>
      <div class="msg-bubble typing-bubble">
        <span class="dot" aria-hidden="true"></span>
        <span class="dot" aria-hidden="true"></span>
        <span class="dot" aria-hidden="true"></span>
      </div>
    </div>
  `;
  container.appendChild(el);
  _scrollToBottom(container);
  return el;
}

/**
 * Muestra un toast de error temporario
 */
function _showErrorMessage(msg) {
  const container = document.getElementById('messages');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'error-toast';
  el.setAttribute('role', 'alert');
  el.textContent = `⚠️ ${msg}`;
  container.appendChild(el);
  _scrollToBottom(container);
  setTimeout(() => el.remove(), 5000);
}

/**
 * Hace scroll automático al último mensaje
 */
function _scrollToBottom(container) {
  if (container) container.scrollTop = container.scrollHeight;
}

/**
 * Copia texto al portapapeles y da feedback visual
 */
async function _copyToClipboard(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback para navegadores sin Clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  const original = btn.textContent;
  btn.textContent = '✅';
  btn.title = '¡Copiado!';
  setTimeout(() => {
    btn.textContent = original;
    btn.title = 'Copiar respuesta';
  }, 2000);
}

// ============================================================
// PERSISTENCIA
// ============================================================

/**
 * Carga el historial guardado en localStorage y lo renderiza
 */
function _loadHistoryFromStorage(characterId, character) {
  const saved = loadFromLocalStorage(`chat_history_${characterId}`);
  if (!Array.isArray(saved) || saved.length === 0) return;

  document.getElementById('chat-welcome')?.remove();

  saved.forEach((msg) => {
    if (msg.role === 'user') {
      _appendMessage('user', msg.content, 'Vos', msg.timestamp, null);
    } else if (msg.role === 'assistant') {
      _appendMessage('assistant', msg.content, character.name, msg.timestamp, character.number);
    }
  });

  chatHistory = saved;
}

/**
 * Persiste el historial actual en localStorage
 */
function _saveHistory(characterId) {
  saveToLocalStorage(`chat_history_${characterId}`, chatHistory);
}
