/**
 * Funciones de validación de teléfono mejoradas para México e internacional
 */

export interface PhoneValidationResult {
  isValid: boolean;
  reason?: string;
  cleanNumber?: string;
  suggestedFormat?: string;
  countryCode?: string;
  isInternational?: boolean;
}

/**
 * Valida un número de teléfono mexicano e internacional con mejor manejo de errores
 */
export function validatePhone(phone: string): boolean {
  const result = validatePhoneWithDetails(phone);
  return result.isValid;
}

/**
 * Valida un número de teléfono mexicano e internacional con detalles del error
 */
export function validatePhoneWithDetails(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, reason: 'Número vacío o inválido' };
  }

  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 0) {
    return { isValid: false, reason: 'Número vacío' };
  }
  
  // ===== VALIDACIÓN DE NÚMEROS MEXICANOS =====
  
  // Número local mexicano (10 dígitos)
  if (/^[1-9][0-9]{9}$/.test(cleanPhone)) {
    return { 
      isValid: true, 
      cleanNumber: cleanPhone,
      suggestedFormat: `+52 ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`,
      countryCode: 'MX',
      isInternational: false
    };
  }
  
  // Número con prefijo 55 (México - 12 dígitos: 55 + 10)
  if (/^55[1-9][0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2); // Remover prefijo 55
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+52 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'MX',
      isInternational: false
    };
  }
  
  // Número con prefijo 52 (México - 12 dígitos: 52 + 10)
  if (/^52[1-9][0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2); // Remover prefijo 52
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+52 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'MX',
      isInternational: false
    };
  }
  
  // ===== VALIDACIÓN DE NÚMEROS INTERNACIONALES =====
  
  // Estados Unidos/Canadá (10 dígitos con prefijo 1)
  if (/^1[0-9]{9}$/.test(cleanPhone)) {
    return { 
      isValid: true, 
      cleanNumber: cleanPhone,
      suggestedFormat: `+1 ${cleanPhone.slice(1, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`,
      countryCode: 'US',
      isInternational: true
    };
  }
  
  // Estados Unidos/Canadá (11 dígitos con prefijo 1)
  if (/^1[0-9]{10}$/.test(cleanPhone)) {
    return { 
      isValid: true, 
      cleanNumber: cleanPhone,
      suggestedFormat: `+1 ${cleanPhone.slice(1, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`,
      countryCode: 'US',
      isInternational: true
    };
  }
  
  // ===== LATINOAMÉRICA =====
  
  // Ecuador (8 dígitos con prefijo 593)
  if (/^593[0-9]{8}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+593 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'EC',
      isInternational: true
    };
  }
  
  // Bolivia (7 dígitos con prefijo 591)
  if (/^591[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+591 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'BO',
      isInternational: true
    };
  }
  
  // Paraguay (8 dígitos con prefijo 595)
  if (/^595[0-9]{8}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+595 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'PY',
      isInternational: true
    };
  }
  
  // Uruguay (7 dígitos con prefijo 598)
  if (/^598[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+598 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'UY',
      isInternational: true
    };
  }
  
  // Guatemala (7 dígitos con prefijo 502)
  if (/^502[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+502 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'GT',
      isInternational: true
    };
  }
  
  // El Salvador (7 dígitos con prefijo 503)
  if (/^503[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+503 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'SV',
      isInternational: true
    };
  }
  
  // Honduras (7 dígitos con prefijo 504)
  if (/^504[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+504 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'HN',
      isInternational: true
    };
  }
  
  // Nicaragua (7 dígitos con prefijo 505)
  if (/^505[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+505 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'NI',
      isInternational: true
    };
  }
  
  // Costa Rica (7 dígitos con prefijo 506)
  if (/^506[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+506 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'CR',
      isInternational: true
    };
  }
  
  // Panamá (7 dígitos con prefijo 507)
  if (/^507[0-9]{7}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(3);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+507 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'PA',
      isInternational: true
    };
  }
  
  // Argentina (9 dígitos con prefijo 54)
  if (/^54[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+54 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'AR',
      isInternational: true
    };
  }
  
  // Colombia (9 dígitos con prefijo 57)
  if (/^57[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+57 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'CO',
      isInternational: true
    };
  }
  
  // Perú (9 dígitos con prefijo 51)
  if (/^51[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+51 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'PE',
      isInternational: true
    };
  }
  
  // Chile (9 dígitos con prefijo 56)
  if (/^56[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+56 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'CL',
      isInternational: true
    };
  }
  
  // Brasil (9 dígitos con prefijo 55)
  if (/^55[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+55 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'BR',
      isInternational: true
    };
  }
  
  // Venezuela (9 dígitos con prefijo 58)
  if (/^58[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+58 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'VE',
      isInternational: true
    };
  }
  
  // Cuba (8 dígitos con prefijo 53)
  if (/^53[0-9]{8}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+53 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`,
      countryCode: 'CU',
      isInternational: true
    };
  }
  
  // ===== EUROPA =====
  
  // España (9 dígitos con prefijo 34)
  if (/^34[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+34 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'ES',
      isInternational: true
    };
  }
  
  // Francia (10 dígitos con prefijo 33)
  if (/^33[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+33 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'FR',
      isInternational: true
    };
  }
  
  // Alemania (10 dígitos con prefijo 49)
  if (/^49[0-9]{9}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+49 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`,
      countryCode: 'DE',
      isInternational: true
    };
  }
  
  // Reino Unido (10 dígitos con prefijo 44)
  if (/^44[0-9]{10}$/.test(cleanPhone)) {
    const localNumber = cleanPhone.slice(2);
    return { 
      isValid: true, 
      cleanNumber: localNumber,
      suggestedFormat: `+44 ${localNumber.slice(0, 4)} ${localNumber.slice(4, 7)} ${localNumber.slice(7)}`,
      countryCode: 'GB',
      isInternational: true
    };
  }
  
  // ===== VALIDACIÓN FLEXIBLE PARA EXPANSIÓN =====
  
  // Verificar que no empiece con 0 antes de la validación flexible
  if (cleanPhone.startsWith('0')) {
    return { 
      isValid: false, 
      reason: 'No puede empezar con 0', 
      cleanNumber: cleanPhone 
    };
  }
  
  // Si tiene entre 10 y 15 dígitos, intentar extraer un número válido
  // SOLO si no coincide con ninguna validación específica anterior
  // Y solo para números que no empiecen con códigos de país conocidos
  if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
    // No aplicar validación flexible si empieza con códigos de país conocidos
    // Pero permitir números que ya han sido validados por las reglas específicas
    const knownPrefixes = ['52', '55', '54', '57', '51', '56', '58', '593', '591', '595', '598', '502', '503', '504', '505', '506', '507', '53', '34', '33', '49', '44'];
    const hasKnownPrefix = knownPrefixes.some(prefix => cleanPhone.startsWith(prefix));
    
    if (!hasKnownPrefix) {
      // Intentar extraer los últimos 10 dígitos para México
      const last10Digits = cleanPhone.slice(-10);
      if (/^[1-9][0-9]{9}$/.test(last10Digits)) {
        return { 
          isValid: true, 
          cleanNumber: last10Digits,
          suggestedFormat: `+52 ${last10Digits.slice(0, 3)} ${last10Digits.slice(3, 6)} ${last10Digits.slice(6)}`,
          countryCode: 'MX',
          isInternational: true
        };
      }
      
      // Intentar extraer los últimos 9 dígitos para España
      const last9Digits = cleanPhone.slice(-9);
      if (/^[0-9]{9}$/.test(last9Digits)) {
        return { 
          isValid: true, 
          cleanNumber: last9Digits,
          suggestedFormat: `+34 ${last9Digits.slice(0, 3)} ${last9Digits.slice(3, 6)} ${last9Digits.slice(6)}`,
          countryCode: 'ES',
          isInternational: true
        };
      }
    }
  }
  
  // ===== MANEJO DE ERRORES =====
  
  if (cleanPhone.length < 9) {
    return { 
      isValid: false, 
      reason: `Muy corto (${cleanPhone.length} dígitos, mínimo 9)`, 
      cleanNumber: cleanPhone 
    };
  }
  
  if (cleanPhone.length > 15) {
    return { 
      isValid: false, 
      reason: `Muy largo (${cleanPhone.length} dígitos, máximo 15)`, 
      cleanNumber: cleanPhone 
    };
  }
  
  return { 
    isValid: false, 
    reason: 'Formato inválido para los países soportados', 
    cleanNumber: cleanPhone 
  };
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatPhoneForDisplay(phone: string): string {
  const result = validatePhoneWithDetails(phone);
  if (result.isValid && result.suggestedFormat) {
    return result.suggestedFormat;
  }
  return phone;
}

/**
 * Obtiene solo el número local sin prefijos de país
 */
export function getLocalPhoneNumber(phone: string): string {
  const result = validatePhoneWithDetails(phone);
  return result.cleanNumber || phone.replace(/\D/g, '');
} 