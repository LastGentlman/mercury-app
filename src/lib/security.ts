import DOMPurify from 'dompurify';

// Configuración de DOMPurify para máxima seguridad
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  KEEP_CONTENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

/**
 * Sanitiza texto HTML para prevenir XSS
 */
export function sanitizeHTML(html: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, PURIFY_CONFIG);
  }
  // Fallback para SSR
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Sanitiza texto plano (no HTML)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida y sanitiza URLs
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Solo permitir protocolos seguros
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitiza datos de entrada de formularios
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Valida que un string no contenga scripts
 */
export function containsScript(text: string): boolean {
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const eventPattern = /on\w+\s*=/gi;
  const javascriptPattern = /javascript:/gi;
  
  return scriptPattern.test(text) || 
         eventPattern.test(text) || 
         javascriptPattern.test(text);
}

/**
 * Sanitiza contenido para mostrar en React
 */
export function safeContent(content: string, allowHTML: boolean = false): string {
  if (!content) return '';
  
  if (allowHTML) {
    return sanitizeHTML(content);
  }
  
  return sanitizeText(content);
} 