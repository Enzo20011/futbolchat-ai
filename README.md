# ⚽ FutbolChat AI

> Chateá con Messi, Cristiano Ronaldo y Neymar usando inteligencia artificial real.

SPA desarrollada para el **Proyecto Integrador – PIM3 Full Stack**.

---

## 🌐 Link a la aplicación desplegada

👉 **[https://futbolchat-ai.vercel.app](https://futbolchat-ai.vercel.app)**

---

## 👥 Los Personajes

| Jugador | Apodo | País | Descripción |
|---|---|---|---|
| **Lionel Messi** | La Pulga 🐐 | 🇦🇷 Argentina | 8 Balones de Oro, Campeón del Mundo 2022. Habla con modismos rioplatenses. |
| **Cristiano Ronaldo** | CR7 💪 | 🇵🇹 Portugal | 5 Balones de Oro, máximo goleador de la historia. Seguro de sí mismo, dice SIUUUU. |
| **Neymar Jr.** | NJR ⚡ | 🇧🇷 Brasil | Campeón Olímpico, el jogo bonito. Alegre, mezcla palabras en portugués. |

Cada personaje tiene un **system prompt único** que define su personalidad, forma de hablar y conocimiento. Los prompts solo viven en el servidor (Vercel Function) y nunca se exponen al cliente.

---

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5 semántico · CSS3 Vanilla (mobile-first) · JavaScript ES Modules
- **Routing:** History API (`pushState` / `popstate`)
- **IA:** [Groq API](https://console.groq.com) — modelo `llama-3.1-8b-instant`
- **Backend seguro:** Vercel Serverless Functions (`/api/functions.js`)
- **Persistencia:** `localStorage` para historial de conversación
- **Tests:** Vitest + jsdom
- **Deploy:** Vercel

---

## 📁 Estructura del Proyecto

```
/
├── api/
│   └── functions.js        ← Vercel Serverless Function (proxy seguro a Groq)
├── src/
│   ├── index.html          → está en raíz (ver abajo)
│   ├── styles.css          ← diseño completo, dark/light mode, mobile-first
│   ├── app.js              ← Router (History API) + vistas Home y About + tema
│   ├── chat.js             ← lógica del chat, fetch, localStorage
│   └── utils.js            ← funciones puras de transformación de datos + CHARACTERS
├── tests/
│   ├── utils.test.js       ← tests para utils.js
│   └── app.test.js         ← tests para Router, renderHome, renderAbout, theme
├── index.html              ← shell de la SPA
├── .env.example            ← plantilla de variables de entorno
├── vercel.json             ← rewrites para SPA routing
├── vitest.config.js        ← configuración de Vitest
├── package.json
└── README.md
```

---

## ⚙️ Requisitos Previos

- [Node.js](https://nodejs.org) ≥ 18
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- Una API key de [Groq](https://console.groq.com) (gratuita)

---

## 🚀 Ejecutar Localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/futbolchat-ai.git
cd futbolchat-ai
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiá el archivo de ejemplo
cp .env.example .env.local

# Abrí .env.local y pegá tu API key de Groq
# GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

### 4. Iniciar el servidor de desarrollo

```bash
vercel dev
```

La aplicación estará disponible en `http://localhost:3000`.

> **¿Por qué `vercel dev` y no un simple servidor HTTP?**  
> Porque necesitamos que las Serverless Functions de `/api/` también corran localmente.
> `vercel dev` levanta tanto los archivos estáticos como las functions en un solo comando.

---

## 🧪 Ejecutar Tests

```bash
# Correr todos los tests una sola vez
npm test

# Modo watch (re-corre al guardar cambios)
npm run test:watch
```

Los tests se encuentran en `/tests/` y usan **Vitest** con entorno **jsdom**.

- `utils.test.js` — +30 tests para: `escapeHtml`, `formatTimestamp`, `parseApiResponse`, `createMessageObject`, utilidades de localStorage, `truncateText` y datos de `CHARACTERS`
- `app.test.js` — +20 tests para: `Router` (navegación, RegExp, 404, links activos), `renderHome`, `renderAbout`, `initTheme` y `toggleTheme`

---

## ☁️ Desplegar en Vercel

### 1. Instalar Vercel CLI (si no lo tenés)

```bash
npm install -g vercel
```

### 2. Login en Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel --prod
```

### 4. Agregar la variable de entorno en Vercel

En el **Dashboard de Vercel** → tu proyecto → **Settings** → **Environment Variables**:

| Variable | Valor |
|---|---|
| `GROQ_API_KEY` | tu API key de Groq |

O por CLI:
```bash
vercel env add GROQ_API_KEY
```

---

## ✨ Funcionalidades

### Mínimo requerido ✅
- [x] SPA con 3 vistas: `/home`, `/chat/:personaje`, `/about`
- [x] History API: URLs reales, back/forward del navegador
- [x] Chat con diferenciación visual usuario vs personaje
- [x] Indicador animado "escribiendo..." mientras responde la IA
- [x] Manejo de errores si la API falla
- [x] Historial durante la sesión
- [x] Scroll automático al último mensaje
- [x] Diseño mobile-first responsive (3 breakpoints)
- [x] API key protegida en Vercel Function (nunca expuesta al cliente)
- [x] Al menos 4 tests unitarios con Vitest

### Extra Credit ✅
- [x] **Extra 1:** Historial persistente en `localStorage` + botón "Borrar historial" + indicador visual
- [x] **Extra 2:** Galería con 3 personajes distintos, cada uno con su propio system prompt
- [x] **Extra 3:** Timestamps en mensajes · Botón copiar respuesta · Enter para enviar · Toggle dark/light mode

---

## 🤖 Registro del Uso de IA en el Proyecto

| Tarea | Herramienta usada |
|---|---|
| Scaffolding inicial del proyecto | Antigravity IDE (AI coding assistant) |
| System prompts de los personajes | Iteraciones propias + ajustes con IA |
| CSS design system completo | Generado y refinado con asistencia de IA |
| Lógica del Router (History API) | Desarrollada con guía de IA |
| Tests unitarios | Generados con asistencia de IA, revisados manualmente |
| README | Escrito con asistencia de IA |

---

## 📸 Capturas de Pantalla

> _[Agregar capturas de pantalla aquí después del deploy]_

---

## 📄 Licencia

MIT – Proyecto académico PIM3 Full Stack.
