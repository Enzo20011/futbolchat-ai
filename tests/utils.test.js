/**
 * tests/utils.test.js
 * Tests unitarios para las funciones de utils.js
 * Ejecutar con: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  escapeHtml,
  formatTimestamp,
  parseApiResponse,
  createMessageObject,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearFromLocalStorage,
  hasStoredHistory,
  truncateText,
  CHARACTERS,
} from '../src/utils.js';

// ─────────────────────────────────────────────
// escapeHtml
// ─────────────────────────────────────────────
describe('escapeHtml', () => {
  it('escapa los caracteres < y > para prevenir XSS', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapa el caracter &', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('retorna string vacío para entradas que no son string', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('');
  });

  it('no modifica texto plano sin caracteres especiales', () => {
    expect(escapeHtml('Hola Messi!')).toBe('Hola Messi!');
  });

  it('escapa comillas simples', () => {
    expect(escapeHtml("it's")).toContain('&#039;');
  });
});

// ─────────────────────────────────────────────
// formatTimestamp
// ─────────────────────────────────────────────
describe('formatTimestamp', () => {
  it('formatea un objeto Date a HH:MM', () => {
    const result = formatTimestamp(new Date());
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formatea un ISO string correctamente', () => {
    const result = formatTimestamp('2024-06-15T14:35:00.000Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('retorna string vacío para fecha inválida', () => {
    // 'fecha-invalida' genera Invalid Date → debe retornar ''
    expect(formatTimestamp('fecha-invalida')).toBe('');
    // undefined también genera Invalid Date → debe retornar ''
    expect(formatTimestamp(undefined)).toBe('');
  });

  it('el resultado tiene exactamente 5 caracteres (HH:MM)', () => {
    const result = formatTimestamp(new Date());
    expect(result.length).toBe(5);
  });
});

// ─────────────────────────────────────────────
// parseApiResponse
// ─────────────────────────────────────────────
describe('parseApiResponse', () => {
  it('extrae el campo message de una respuesta válida', () => {
    expect(parseApiResponse({ message: 'Hola, che!' })).toBe('Hola, che!');
  });

  it('aplica trim al mensaje', () => {
    expect(parseApiResponse({ message: '  Dale, vamos  ' })).toBe('Dale, vamos');
  });

  it('lanza error si la respuesta es null o no es objeto', () => {
    expect(() => parseApiResponse(null)).toThrow('Respuesta inválida de la API');
    expect(() => parseApiResponse('texto')).toThrow('Respuesta inválida de la API');
  });

  it('lanza error si la respuesta contiene campo error', () => {
    expect(() => parseApiResponse({ error: 'Rate limit exceeded' })).toThrow('Rate limit exceeded');
  });

  it('lanza error si falta el campo message', () => {
    expect(() => parseApiResponse({ data: 'algo' })).toThrow();
  });

  it('lanza error si message está vacío', () => {
    expect(() => parseApiResponse({ message: '   ' })).toThrow();
  });
});

// ─────────────────────────────────────────────
// createMessageObject
// ─────────────────────────────────────────────
describe('createMessageObject', () => {
  it('crea un objeto de mensaje de usuario válido', () => {
    const msg = createMessageObject('user', 'Hola Messi');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hola Messi');
    expect(typeof msg.timestamp).toBe('string');
  });

  it('crea un objeto de mensaje de asistente válido', () => {
    const msg = createMessageObject('assistant', '¡Hola che!');
    expect(msg.role).toBe('assistant');
    expect(msg.content).toBe('¡Hola che!');
  });

  it('aplica trim al contenido', () => {
    const msg = createMessageObject('user', '  mensaje  ');
    expect(msg.content).toBe('mensaje');
  });

  it('el timestamp es un ISO string válido', () => {
    const msg = createMessageObject('user', 'test');
    expect(new Date(msg.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('lanza error para rol inválido', () => {
    expect(() => createMessageObject('admin', 'test')).toThrow('Rol inválido');
    expect(() => createMessageObject('system', 'test')).toThrow();
  });

  it('lanza error si el contenido está vacío o no es string', () => {
    expect(() => createMessageObject('user', '')).toThrow();
    expect(() => createMessageObject('user', null)).toThrow();
    expect(() => createMessageObject('user', '   ')).toThrow();
  });
});

// ─────────────────────────────────────────────
// localStorage utilities
// ─────────────────────────────────────────────
describe('Utilidades de localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda y carga datos correctamente (round-trip)', () => {
    const data = [{ role: 'user', content: 'hola' }];
    saveToLocalStorage('test_key', data);
    expect(loadFromLocalStorage('test_key')).toEqual(data);
  });

  it('retorna null si la clave no existe', () => {
    expect(loadFromLocalStorage('clave_inexistente')).toBeNull();
  });

  it('elimina datos de localStorage', () => {
    saveToLocalStorage('borrar_key', { val: 1 });
    clearFromLocalStorage('borrar_key');
    expect(loadFromLocalStorage('borrar_key')).toBeNull();
  });

  it('saveToLocalStorage retorna true en éxito', () => {
    expect(saveToLocalStorage('k', 'v')).toBe(true);
  });

  it('hasStoredHistory devuelve true si hay historial no vacío', () => {
    saveToLocalStorage('chat_history_messi', [{ role: 'user', content: 'hola' }]);
    expect(hasStoredHistory('messi')).toBe(true);
  });

  it('hasStoredHistory devuelve false si no hay historial', () => {
    expect(hasStoredHistory('cristiano')).toBe(false);
  });

  it('hasStoredHistory devuelve false si el historial es un array vacío', () => {
    saveToLocalStorage('chat_history_neymar', []);
    expect(hasStoredHistory('neymar')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// truncateText
// ─────────────────────────────────────────────
describe('truncateText', () => {
  it('trunca texto largo y agrega "..."', () => {
    const long = 'a'.repeat(150);
    const result = truncateText(long, 100);
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(103);
  });

  it('no trunca texto corto', () => {
    expect(truncateText('Hola', 100)).toBe('Hola');
  });

  it('retorna string vacío para entrada no-string', () => {
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
  });

  it('usa maxLength 100 por defecto', () => {
    const exact = 'x'.repeat(100);
    expect(truncateText(exact)).toBe(exact);
    const over = 'x'.repeat(101);
    expect(truncateText(over).endsWith('...')).toBe(true);
  });
});

// ─────────────────────────────────────────────
// CHARACTERS data
// ─────────────────────────────────────────────
describe('CHARACTERS', () => {
  it('contiene exactamente 3 personajes', () => {
    expect(Object.keys(CHARACTERS)).toHaveLength(3);
  });

  it('incluye messi, cristiano y neymar', () => {
    expect(CHARACTERS).toHaveProperty('messi');
    expect(CHARACTERS).toHaveProperty('cristiano');
    expect(CHARACTERS).toHaveProperty('neymar');
  });

  it('cada personaje tiene los campos requeridos', () => {
    const requiredFields = ['id', 'name', 'nickname', 'number', 'team', 'color1', 'color2', 'greeting', 'emoji', 'tips'];
    Object.values(CHARACTERS).forEach((char) => {
      requiredFields.forEach((field) => {
        expect(char, `El personaje debe tener el campo "${field}"`).toHaveProperty(field);
      });
    });
  });

  it('cada personaje tiene al menos 2 tips', () => {
    Object.values(CHARACTERS).forEach((char) => {
      expect(Array.isArray(char.tips)).toBe(true);
      expect(char.tips.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('los colores son strings hexadecimales', () => {
    Object.values(CHARACTERS).forEach((char) => {
      expect(char.color1).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(char.color2).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
