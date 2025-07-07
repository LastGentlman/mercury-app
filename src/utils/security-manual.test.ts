// Test manual de las funciones de seguridad
import { describe, expect, it } from 'vitest';
import { containsScript, sanitizeHTML, sanitizeText } from '@/lib/security';

describe('Security Manual Tests', () => {
  it('should handle encoded HTML entities', () => {
    console.log('🔒 Testing Security Functions...\n');

    // Test 1: Entidades HTML codificadas
    console.log('Test 1: Entidades HTML codificadas');
    const encoded1 = '&#60;script&#62;alert("XSS")&#60;/script&#62;';
    const encoded2 = '%3Cscript%3Ealert("XSS")%3C/script%3E';

    console.log('Original 1:', encoded1);
    console.log('Sanitized 1:', sanitizeHTML(encoded1));
    console.log('Contains script 1:', containsScript(encoded1));

    console.log('Original 2:', encoded2);
    console.log('Sanitized 2:', sanitizeHTML(encoded2));
    console.log('Contains script 2:', containsScript(encoded2));

    // Verificar que las entidades codificadas son detectadas
    expect(containsScript(encoded1)).toBe(true);
    expect(containsScript(encoded2)).toBe(true);
    
    // Verificar que la sanitización funciona
    const sanitized1 = sanitizeHTML(encoded1);
    const sanitized2 = sanitizeHTML(encoded2);
    expect(sanitized1).not.toContain('<script>');
    expect(sanitized2).not.toContain('<script>');
  });

  it('should handle safe HTML correctly', () => {
    // Test 2: HTML seguro
    console.log('\nTest 2: HTML seguro');
    const safeHTML = '<p>This is safe HTML</p>';
    console.log('Original:', safeHTML);
    console.log('Sanitized:', sanitizeText(safeHTML));

    // Verificar que el HTML seguro se preserva
    const sanitized = sanitizeText(safeHTML);
    expect(sanitized).toContain('<p>');
    expect(sanitized).toContain('</p>');
    expect(sanitized).toContain('This is safe HTML');
  });

  it('should block dangerous scripts', () => {
    // Test 3: Scripts peligrosos
    console.log('\nTest 3: Scripts peligrosos');
    const dangerous = '<script>alert("XSS")</script>';
    console.log('Original:', dangerous);
    console.log('Sanitized:', sanitizeText(dangerous));
    console.log('Contains script:', containsScript(dangerous));

    // Verificar que los scripts peligrosos son detectados y bloqueados
    expect(containsScript(dangerous)).toBe(true);
    const sanitized = sanitizeText(dangerous);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert("XSS")');
  });
});

 