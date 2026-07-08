/**
 * app.js – Lógica principal: Router (History API), vistas Home y About, y tema
 */

import {
  CHARACTERS,
  hasStoredHistory,
} from './utils.js';
import { renderChat } from './chat.js';

// ============================================================
// ROUTER – History API
// ============================================================

export class Router {
  constructor() {
    this.routes = [];

    // Botones back/forward del navegador
    window.addEventListener('popstate', () => this._handleRoute());

    // Interceptar clics en links con data-link
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });
  }

  /**
   * Registra una ruta con un patrón y su handler
   * @param {string|RegExp} pattern
   * @param {Function} handler
   * @returns {Router} para encadenar
   */
  on(pattern, handler) {
    this.routes.push({ pattern, handler });
    return this;
  }

  /**
   * Navega a una ruta usando history.pushState y renderiza la vista
   * @param {string} path
   */
  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    this._handleRoute();
  }

  /** Evalúa la URL actual y ejecuta el handler correspondiente */
  _handleRoute() {
    const path = window.location.pathname;

    for (const route of this.routes) {
      let match = null;
      if (route.pattern instanceof RegExp) {
        match = path.match(route.pattern);
      } else if (route.pattern === path) {
        match = [path];
      }
      if (match) {
        route.handler(match);
        this._updateNavLinks(path);
        return;
      }
    }

    // Ninguna ruta encontrada → 404
    this._render404();
    this._updateNavLinks(path);
  }

  /** Actualiza la clase 'active' en los links de la navbar */
  _updateNavLinks(currentPath) {
    document.querySelectorAll('.nav-link[data-link]').forEach((link) => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '/' && href === '/home')) {
        link.classList.add('active');
      }
    });
  }

  /** Renderiza la vista 404 */
  _render404() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="not-found-view">
        <p class="not-found-emoji" aria-hidden="true">⚽</p>
        <h1 class="not-found-title">¡Fuera de juego!</h1>
        <p class="not-found-text">Esta página no existe.</p>
        <a href="/home" class="btn-primary" data-link id="btn-go-home">← Volver al inicio</a>
      </div>
    `;
  }

  /** Inicia el router evaluando la URL actual */
  start() {
    this._handleRoute();
  }
}

// ============================================================
// VISTA: HOME
// ============================================================

export function renderHome() {
  const app = document.getElementById('app');

  const cardsHTML = Object.values(CHARACTERS)
    .map((char, i) => {
      const savedHistory = hasStoredHistory(char.id);
      return `
      <article class="char-card card-${char.id}"
               style="animation-delay:${i * 0.1}s"
               aria-label="${char.name}">

        <div class="card-avatar"
             style="background: linear-gradient(135deg, ${char.color1}, ${char.color2})"
             aria-hidden="true">
          ${char.image ? `<img src="${char.image}" alt="${char.name}" class="card-photo" loading="lazy" onerror="this.style.display='none'">` : ''}
          <span class="card-num">${char.number}</span>
        </div>

        ${savedHistory
          ? '<div class="card-history-badge">💬 Historial guardado</div>'
          : ''}

        <div class="card-body">
          <h3 class="card-name">${char.name}</h3>
          <p class="card-nick">${char.nickname}</p>
          <p class="card-team">⚽ ${char.team}</p>
          <p class="card-desc">${char.description}</p>
        </div>

        <a href="/chat/${char.id}"
           class="card-cta"
           data-link
           id="btn-chat-${char.id}"
           aria-label="Chatear con ${char.name}">
          Chatear ahora <span aria-hidden="true">→</span>
        </a>
      </article>
    `;
    })
    .join('');

  app.innerHTML = `
    <div class="home-view">

      <!-- Hero -->
      <section class="hero" aria-labelledby="hero-title">
        <h1 class="hero-title" id="hero-title">
          <span class="hero-line">Chateá con</span>
          <span class="hero-gradient">las Leyendas 🏆</span>
        </h1>
      </section>

      <!-- Galería de personajes -->
      <section class="chars-section" aria-labelledby="chars-title">
        <h2 class="section-title" id="chars-title">Elegí tu estrella</h2>
        <p class="section-sub">Seleccioná un jugador para comenzar la conversación</p>
        <div class="chars-grid" id="chars-grid">
          ${cardsHTML}
        </div>
      </section>

    </div>
  `;
}

// ============================================================
// VISTA: ABOUT
// ============================================================

export function renderAbout() {
  const app = document.getElementById('app');

  const charsListHTML = Object.values(CHARACTERS)
    .map(
      (char) => `
    <div class="char-row">
      <div class="char-row-avatar"
           style="background: linear-gradient(135deg, ${char.color1}, ${char.color2})"
           aria-hidden="true">
        ${char.number}
      </div>
      <div>
        <p class="char-row-name">${char.name}</p>
        <p class="char-row-desc">${char.shortDesc}</p>
      </div>
    </div>
  `
    )
    .join('');

  app.innerHTML = `
    <div class="about-view">

      <section class="about-hero" aria-labelledby="about-title">
        <h1 class="about-title" id="about-title">
          Acerca del <span class="text-accent">Proyecto</span>
        </h1>
        <p class="about-sub">
          FutbolChat AI es una Single Page Application donde podés chatear con
          Messi, Cristiano Ronaldo y Neymar usando inteligencia artificial real.
        </p>
      </section>

      <div class="about-grid">
        <article class="about-card">

          <h2 class="about-card-title">Inteligencia Artificial</h2>
          <p class="about-card-text">
            Usamos la API de Google Gemini para generar respuestas precisas y naturales
            que simulan la personalidad de cada jugador con system prompts únicos.
          </p>
        </article>
        <article class="about-card">

          <h2 class="about-card-title">Seguridad</h2>
          <p class="about-card-text">
            Las llamadas a la API se realizan desde una Vercel Serverless Function.
            La API key vive en variables de entorno y nunca se expone al cliente.
          </p>
        </article>
        <article class="about-card">

          <h2 class="about-card-title">SPA con History API</h2>
          <p class="about-card-text">
            Navegación sin recargas implementada con <code>pushState</code> / <code>popstate</code>.
            Las URLs reflejan la vista actual y el botón Atrás del navegador funciona correctamente.
          </p>
        </article>
        <article class="about-card">

          <h2 class="about-card-title">Mobile-First</h2>
          <p class="about-card-text">
            Diseño responsive con CSS puro: Flexbox, Grid y media queries.
            Usable en celulares, tablets y desktop.
          </p>
        </article>
        <article class="about-card">
          <div class="about-icon" aria-hidden="true">💾</div>
          <h2 class="about-card-title">Persistencia</h2>
          <p class="about-card-text">
            El historial de cada personaje se guarda en <code>localStorage</code>.
            Podés cerrar el navegador y retomar la conversación después.
          </p>
        </article>
        <article class="about-card">
          <div class="about-icon" aria-hidden="true">🧪</div>
          <h2 class="about-card-title">Tests Unitarios</h2>
          <p class="about-card-text">
            La lógica de negocio en <code>utils.js</code> y el Router de <code>app.js</code>
            están cubiertos con tests usando Vitest + jsdom.
          </p>
        </article>
      </div>

      <div class="tech-box">
        <h2 class="tech-box-title">🛠️ Stack Tecnológico</h2>
        <div class="tech-tags">
          <span class="tech-tag">🌐 HTML5 Semántico</span>
          <span class="tech-tag">🎨 CSS3 Vanilla</span>
          <span class="tech-tag">⚡ JavaScript ES Modules</span>
          <span class="tech-tag">🔀 History API</span>
          <span class="tech-tag">🤖 Google Gemini 2.5</span>
          <span class="tech-tag">☁️ Vercel Functions</span>
          <span class="tech-tag">📡 Fetch API</span>
          <span class="tech-tag">💾 localStorage</span>
          <span class="tech-tag">🧪 Vitest</span>
          <span class="tech-tag">🚀 Vercel Deploy</span>
        </div>
      </div>

      <div class="tech-box">
        <h2 class="tech-box-title">⚽ Los Personajes</h2>
        <div class="chars-list-about">
          ${charsListHTML}
        </div>
      </div>

    </div>
  `;
}

// ============================================================
// TEMA OSCURO / CLARO
// ============================================================

/** Inicializa el tema desde localStorage o usa 'dark' por defecto */
export function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  _updateThemeIcon(saved);
}

/** Alterna entre dark y light y persiste la preferencia */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  _updateThemeIcon(next);
}

function _updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? 'NOCHE' : 'DÍA';
}

// ============================================================
// BOOTSTRAP (solo en el navegador, no durante tests)
// ============================================================

function _bootstrap() {
  initTheme();

  document.getElementById('theme-toggle')
    ?.addEventListener('click', toggleTheme);

  const router = new Router();

  router
    .on('/', () => renderHome())
    .on('/home', () => renderHome())
    .on(/^\/chat\/([a-z]+)$/, (match) => renderChat(match[1], router))
    .on('/about', () => renderAbout());

  router.start();
}

// import.meta.env.VITEST es true cuando corre Vitest → no bootstrappear
if (!import.meta.env?.VITEST) {
  _bootstrap();
}
