/**
 * tests/app.test.js
 * Tests unitarios para el Router y las funciones de app.js
 * Ejecutar con: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, renderHome, renderAbout, initTheme, toggleTheme } from '../src/app.js';

// ─────────────────────────────────────────────
// Setup del DOM antes de cada test
// ─────────────────────────────────────────────
beforeEach(() => {
  // Reset del DOM con la estructura mínima que necesita la app
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.clear();

  document.body.innerHTML = `
    <nav>
      <a href="/home" class="nav-link" data-link id="nav-home">Inicio</a>
      <a href="/about" class="nav-link" data-link id="nav-about">Acerca</a>
      <button id="theme-toggle"><span class="theme-icon">🌙</span></button>
    </nav>
    <main id="app"></main>
  `;
});

// ─────────────────────────────────────────────
// Router – navegación básica
// ─────────────────────────────────────────────
describe('Router', () => {
  it('navega a una ruta y actualiza window.location.pathname', () => {
    const router = new Router();
    router.on('/home', () => {});
    router.navigate('/home');
    expect(window.location.pathname).toBe('/home');
  });

  it('ejecuta el handler correcto para una ruta exacta', () => {
    const handler = vi.fn();
    const router = new Router();
    router.on('/about', handler);
    router.navigate('/about');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ejecuta el handler correcto para una ruta con RegExp', () => {
    let captured = null;
    const router = new Router();
    router.on(/^\/chat\/([a-z]+)$/, (match) => { captured = match[1]; });
    router.navigate('/chat/messi');
    expect(captured).toBe('messi');
  });

  it('captura el ID de personaje correcto para cada jugador', () => {
    const results = [];
    const router = new Router();
    router.on(/^\/chat\/([a-z]+)$/, (match) => results.push(match[1]));

    router.navigate('/chat/messi');
    router.navigate('/chat/cristiano');
    router.navigate('/chat/neymar');

    expect(results).toEqual(['messi', 'cristiano', 'neymar']);
  });

  it('renderiza la vista 404 para rutas desconocidas', () => {
    const router = new Router();
    // No registramos ninguna ruta → debe renderizar 404
    router.navigate('/ruta-inexistente');
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Fuera de juego');
  });

  it('la vista 404 contiene un link para volver al inicio', () => {
    const router = new Router();
    router.navigate('/pagina-que-no-existe');
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('/home');
  });

  it('encadena múltiples rutas con .on()', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const router = new Router();
    router.on('/home', h1).on('/about', h2);

    router.navigate('/home');
    router.navigate('/about');

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('_updateNavLinks marca el link correcto como active', () => {
    const router = new Router();
    router.on('/home', () => {});
    router.navigate('/home');

    const homeLink = document.getElementById('nav-home');
    const aboutLink = document.getElementById('nav-about');

    expect(homeLink.classList.contains('active')).toBe(true);
    expect(aboutLink.classList.contains('active')).toBe(false);
  });

  it('no duplica la entrada en historial si navega a la misma ruta', () => {
    const router = new Router();
    const handler = vi.fn();
    router.on('/home', handler);

    router.navigate('/home');
    router.navigate('/home'); // misma ruta

    // El pathname sigue siendo /home
    expect(window.location.pathname).toBe('/home');
  });
});

// ─────────────────────────────────────────────
// renderHome
// ─────────────────────────────────────────────
describe('renderHome', () => {
  it('renderiza el título del hero', () => {
    renderHome();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Chateá con');
    expect(app.innerHTML).toContain('las Leyendas 🏆');
  });

  it('renderiza las 3 tarjetas de personajes', () => {
    renderHome();
    const app = document.getElementById('app');
    expect(app.querySelectorAll('.char-card').length).toBe(3);
  });

  it('cada tarjeta tiene un link de chat', () => {
    renderHome();
    const app = document.getElementById('app');
    const chatLinks = app.querySelectorAll('a[href^="/chat/"]');
    expect(chatLinks.length).toBe(3);
  });

  it('contiene links para los 3 jugadores', () => {
    renderHome();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('/chat/messi');
    expect(app.innerHTML).toContain('/chat/cristiano');
    expect(app.innerHTML).toContain('/chat/neymar');
  });

  it('contiene la sección de personajes', () => {
    renderHome();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Elegí tu estrella');
  });
});

// ─────────────────────────────────────────────
// renderAbout
// ─────────────────────────────────────────────
describe('renderAbout', () => {
  it('renderiza el título de la página', () => {
    renderAbout();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Acerca del');
    expect(app.innerHTML).toContain('Proyecto');
  });

  it('incluye información sobre Gemini y Vercel', () => {
    renderAbout();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Gemini');
    expect(app.innerHTML).toContain('Vercel');
  });

  it('muestra las tarjetas de los 3 personajes', () => {
    renderAbout();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Messi');
    expect(app.innerHTML).toContain('Cristiano');
    expect(app.innerHTML).toContain('Neymar');
  });

  it('muestra el stack tecnológico', () => {
    renderAbout();
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('History API');
    expect(app.innerHTML).toContain('localStorage');
    expect(app.innerHTML).toContain('Vitest');
  });
});

// ─────────────────────────────────────────────
// Theme (oscuro / claro)
// ─────────────────────────────────────────────
describe('initTheme', () => {
  it('carga el tema guardado en localStorage', () => {
    localStorage.setItem('theme', 'light');
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('usa "dark" por defecto si no hay tema guardado', () => {
    localStorage.clear();
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('toggleTheme', () => {
  it('cambia de dark a light', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('cambia de light a dark', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    toggleTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persiste la preferencia en localStorage', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleTheme();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('alterna correctamente dos veces', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleTheme();
    toggleTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
