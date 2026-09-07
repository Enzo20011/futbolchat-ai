/**
 * tests/chat.test.js
 * Tests unitarios para el chat (renderChat, envío de mensajes, persistencia)
 * Ejecutar con: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderChat } from '../src/chat.js';

function makeRouter() {
  return { navigate: vi.fn() };
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = `<main id="app"></main>`;
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────
// Renderizado inicial
// ─────────────────────────────────────────────
describe('renderChat', () => {
  it('redirige a /home si el personaje no existe', () => {
    const router = makeRouter();
    renderChat('jugador-inexistente', router);
    expect(router.navigate).toHaveBeenCalledWith('/home');
  });

  it('no renderiza nada en #app si el personaje no existe', () => {
    const router = makeRouter();
    renderChat('inexistente', router);
    expect(document.getElementById('app').innerHTML).toBe('');
  });

  it('renderiza el nombre y saludo del personaje', () => {
    renderChat('messi', makeRouter());
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Lionel Messi');
    expect(app.innerHTML).toContain('¡Hola! Soy Leo');
  });

  it('renderiza las preguntas sugeridas del personaje', () => {
    renderChat('cristiano', makeRouter());
    const tips = document.querySelectorAll('.tip-item');
    expect(tips.length).toBe(4);
  });

  it('no muestra el badge de historial si no hay conversación guardada', () => {
    renderChat('neymar', makeRouter());
    expect(document.querySelector('.history-info')).toBeNull();
  });

  it('el botón de enviar arranca deshabilitado', () => {
    renderChat('messi', makeRouter());
    const btn = document.getElementById('btn-send');
    expect(btn.disabled).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Sugerencias de preguntas (tips)
// ─────────────────────────────────────────────
describe('tips sugeridos', () => {
  it('al hacer click, precarga el input y habilita el botón enviar', () => {
    renderChat('messi', makeRouter());
    const tip = document.querySelector('.tip-item');
    tip.click();
    const input = document.getElementById('message-input');
    const btn = document.getElementById('btn-send');
    expect(input.value).toBe(tip.getAttribute('data-tip'));
    expect(btn.disabled).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Envío de mensajes
// ─────────────────────────────────────────────
describe('envío de mensajes', () => {
  it('agrega el mensaje del usuario y la respuesta de la IA al chat', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Dale, vamos!' }),
    });

    renderChat('messi', makeRouter());
    const input = document.getElementById('message-input');
    const form = document.getElementById('chat-form');

    input.value = 'Hola Leo';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // Esperar a que se resuelva la promesa de fetch
    const messages = document.getElementById('messages');
    await vi.waitFor(() => {
      expect(messages.textContent).toContain('Dale, vamos!');
    });

    expect(messages.textContent).toContain('Hola Leo');
    expect(fetch).toHaveBeenCalledWith('/api/functions', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('quita el mensaje de bienvenida al enviar el primer mensaje', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Hola!' }),
    });

    renderChat('messi', makeRouter());
    expect(document.getElementById('chat-welcome')).not.toBeNull();

    const input = document.getElementById('message-input');
    const form = document.getElementById('chat-form');
    input.value = 'Hola';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(document.getElementById('chat-welcome')).toBeNull();
    });
  });

  it('escapa HTML en el mensaje del usuario para prevenir XSS', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'respuesta segura' }),
    });

    renderChat('messi', makeRouter());
    const input = document.getElementById('message-input');
    const form = document.getElementById('chat-form');
    input.value = '<img src=x onerror=alert(1)>';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.msg-user').length).toBe(1);
    });

    const messages = document.getElementById('messages');
    expect(messages.querySelector('.msg-user img')).toBeNull();
    expect(messages.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('persiste el historial en localStorage tras un intercambio', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Bien, gracias!' }),
    });

    renderChat('messi', makeRouter());
    const input = document.getElementById('message-input');
    const form = document.getElementById('chat-form');
    input.value = '¿Cómo estás?';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('chat_history_messi') || '[]');
      expect(saved).toHaveLength(2);
    });

    const saved = JSON.parse(localStorage.getItem('chat_history_messi'));
    expect(saved[0]).toMatchObject({ role: 'user', content: '¿Cómo estás?' });
    expect(saved[1]).toMatchObject({ role: 'assistant', content: 'Bien, gracias!' });
  });

  it('muestra un mensaje de error si la API falla', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'La IA no está disponible' }),
    });

    renderChat('messi', makeRouter());
    const input = document.getElementById('message-input');
    const form = document.getElementById('chat-form');
    input.value = 'Hola';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => {
      expect(document.querySelector('.error-toast')).not.toBeNull();
    });

    expect(document.querySelector('.error-toast').textContent).toContain('La IA no está disponible');
  });

  it('no envía mensajes vacíos (solo espacios)', async () => {
    global.fetch = vi.fn();
    renderChat('messi', makeRouter());
    const input = document.getElementById('message-input');
    const form = document.getElementById('chat-form');
    input.value = '   ';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(fetch).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// Historial guardado
// ─────────────────────────────────────────────
describe('historial guardado', () => {
  it('carga y renderiza el historial previo desde localStorage', () => {
    localStorage.setItem('chat_history_messi', JSON.stringify([
      { role: 'user', content: 'Hola', timestamp: new Date().toISOString() },
      { role: 'assistant', content: 'Qué tal!', timestamp: new Date().toISOString() },
    ]));

    renderChat('messi', makeRouter());

    expect(document.getElementById('chat-welcome')).toBeNull();
    expect(document.querySelectorAll('.message').length).toBe(2);
  });

  it('muestra el badge de historial guardado en el sidebar', () => {
    localStorage.setItem('chat_history_messi', JSON.stringify([
      { role: 'user', content: 'Hola', timestamp: new Date().toISOString() },
    ]));

    renderChat('messi', makeRouter());
    expect(document.querySelector('.history-info')).not.toBeNull();
  });

  it('borra el historial al hacer click en "Borrar historial"', () => {
    localStorage.setItem('chat_history_messi', JSON.stringify([
      { role: 'user', content: 'Hola', timestamp: new Date().toISOString() },
    ]));

    renderChat('messi', makeRouter());
    document.getElementById('btn-clear-sidebar').click();

    expect(localStorage.getItem('chat_history_messi')).toBeNull();
    expect(document.querySelectorAll('.message').length).toBe(0);
    expect(document.getElementById('chat-welcome')).not.toBeNull();
  });
});

// ─────────────────────────────────────────────
// Navegación
// ─────────────────────────────────────────────
describe('navegación desde el chat', () => {
  it('el botón volver (mobile) navega a /home', () => {
    const router = makeRouter();
    renderChat('messi', router);
    document.getElementById('btn-back-mobile').click();
    expect(router.navigate).toHaveBeenCalledWith('/home');
  });
});
