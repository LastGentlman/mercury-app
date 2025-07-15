

// Configuración de logging de XSS
const XSS_LOGGING_CONFIG = {
  enabled: true,
  maxPayloadLength: 200,
  logToConsole: true,
  logToServer: false, // Deshabilitado temporalmente para evitar 403 errors
  serverEndpoint: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030'}/api/monitoring/security/log`
};

/**
 * Log de intentos de XSS en el frontend
 */
function logXSSAttempt(
  payload: string, 
  source: string, 
  context: string,
  userAgent?: string
) {
  if (!XSS_LOGGING_CONFIG.enabled) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'XSS_ATTEMPT_FRONTEND',
    payload: payload.substring(0, XSS_LOGGING_CONFIG.maxPayloadLength),
    source,
    context,
    userAgent: userAgent || navigator.userAgent,
    url: window.location.href,
    severity: 'HIGH'
  };
  
  // Log estructurado para debugging
  if (XSS_LOGGING_CONFIG.logToConsole) {
    console.error(`🚨 XSS ATTEMPT DETECTED (Frontend):`, JSON.stringify(logEntry, null, 2));
    console.error(`🔒 XSS Blocked - Source: ${source}, Context: ${context}`);
    console.error(`📝 Payload: ${payload.substring(0, 100)}${payload.length > 100 ? '...' : ''}`);
  }
  
  // Opcional: Enviar log al servidor
  if (XSS_LOGGING_CONFIG.logToServer) {
    fetch(XSS_LOGGING_CONFIG.serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    }).catch(error => {
      console.error('Failed to send XSS log to server:', error);
    });
  }
}

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




function stripHTMLTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitiza texto HTML para prevenir XSS
 */
export function sanitizeHTML(html: string, context: string = 'unknown', source: string = 'unknown'): string {
  if (!html || typeof html !== 'string') return '';
  
  // Decodificar entidades primero
  const decoded = decodeEntities(html);
  
  // XSS detection and logging (as before)
  const lower = decoded.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:text/html') ||
    lower.includes('vbscript:') ||
    containsScript(decoded)
  ) {
    logXSSAttempt(html, source, context);
    return '[CONTENIDO BLOQUEADO]';
  }
  
  // Remove all HTML tags
  const noTags = stripHTMLTags(decoded);
  // Escape any remaining special chars
  return noTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza texto plano (no HTML)
 */
export function sanitizeText(text: string, context: string = 'unknown', source: string = 'unknown'): string {
  if (!text || typeof text !== 'string') return '';
  
  // Decodificar entidades primero
  const decoded = decodeEntities(text);
  
  // XSS detection and logging (as before)
  const lower = decoded.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:text/html') ||
    lower.includes('vbscript:') ||
    containsScript(decoded)
  ) {
    logXSSAttempt(text, source, context);
    return '[CONTENIDO BLOQUEADO]';
  }
  
  // Remove all HTML tags
  const noTags = stripHTMLTags(decoded);
  // Escape any remaining special chars
  return noTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza URLs de forma segura
 */
export function sanitizeURL(url: string, context: string = 'unknown', source: string = 'unknown'): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Bloquear protocolos peligrosos
    if (['javascript:', 'data:', 'vbscript:', 'file:'].includes(parsed.protocol)) {
      logXSSAttempt(url, source, context);
      return '';
    }
    
    return parsed.toString();
  } catch {
    // Si no es una URL válida, verificar si contiene contenido peligroso
    if (containsScript(url)) {
      logXSSAttempt(url, source, context);
      return '';
    }
    return '';
  }
}

/**
 * Sanitiza datos de entrada de formularios
 */
export function sanitizeFormData(data: Record<string, any>, context: string = 'form'): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value, context, `form_field_${key}`);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value, `${context}_${key}`);
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
export function safeContent(content: string, allowHTML: boolean = false, context: string = 'react_component'): string {
  if (!content) return '';
  if (allowHTML) {
    return sanitizeHTML(content, context, 'react_safe_html');
  }
  return sanitizeText(content, context, 'react_safe_text');
}

/**
 * Configuración de CSP para el frontend
 */
export function getCSPNonce(): string {
  // Generar nonce único para cada request
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Configurar CSP dinámicamente (solo para casos especiales)
 */
export function setCSPHeader(nonce: string): void {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'; style-src 'self' 'unsafe-inline';`;
    document.head.appendChild(meta);
  }
} 