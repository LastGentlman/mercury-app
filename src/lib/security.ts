import DOMPurify from 'dompurify';

function decodeEntities(str: string): string {
  if (!str) return '';
  // Decodifica entidades HTML
  const txt = typeof window !== 'undefined' ? document.createElement('textarea') : null;
  if (txt) {
    txt.innerHTML = str;
    str = txt.value;
  }
  // Decodifica URL
  try {
    str = decodeURIComponent(str);
  } catch {}
  return str;
}

function isSafeHTML(text: string): boolean {
  // Detectar si el texto contiene HTML seguro (solo tags permitidos)
  const safeTags = ['p', 'strong', 'em', 'b', 'i', 'a', 'br', 'span'];
  const hasSafeTags = safeTags.some(tag => text.includes(`<${tag}`));
  const hasUnsafeTags = text.includes('<script') || text.includes('<iframe') || text.includes('<object');
  return hasSafeTags && !hasUnsafeTags;
}

// Configuración de DOMPurify para máxima seguridad
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'img'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'alt', 'src'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
};

/**
 * Sanitiza texto HTML para prevenir XSS
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Decodificar entidades primero
  const decoded = decodeEntities(html);
  
  // Bloquear strings peligrosos aunque no sean HTML
  const lower = decoded.trim().toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '[CONTENIDO BLOQUEADO]';
  }
  
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(decoded, PURIFY_CONFIG);
  }
  // Fallback para SSR
  return decoded.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Sanitiza texto plano (no HTML)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Decodificar entidades primero
  const decoded = decodeEntities(text);
  
  // Bloquear URLs peligrosas
  const lower = decoded.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:text/html') ||
    lower.includes('vbscript:')
  ) {
    return '[CONTENIDO BLOQUEADO]';
  }
  
  // Detectar y bloquear scripts completamente
  if (containsScript(decoded)) {
    return '[CONTENIDO BLOQUEADO]';
  }
  
  // Si es HTML seguro, usar sanitizeHTML
  if (isSafeHTML(decoded)) {
    return sanitizeHTML(decoded);
  }
  
  // Eliminar atributos on* y svg onload
  const sanitized = decoded.replace(/on\w+\s*=(["']).*?\1/gi, '')
                          .replace(/onload=(["']).*?\1/gi, '');
  
  return sanitized
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
    // Preservar la URL original sin agregar barra final
    return url;
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
  if (!text) return false;
  // Decodificar entidades y URL antes de buscar
  const decoded = decodeEntities(text);
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const eventPattern = /on\w+\s*=/gi;
  const javascriptPattern = /javascript:/gi;
  const dataPattern = /data:text\/html/gi;
  const vbscriptPattern = /vbscript:/gi;
  return scriptPattern.test(decoded) || 
         eventPattern.test(decoded) || 
         javascriptPattern.test(decoded) ||
         dataPattern.test(decoded) ||
         vbscriptPattern.test(decoded);
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