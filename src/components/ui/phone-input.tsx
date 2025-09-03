import { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '../../lib/utils';
import { validatePhoneWithDetails } from '../../lib/validation/phone';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  // ===== MÉXICO Y LATINOAMÉRICA =====
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'DO', name: 'República Dominicana', dialCode: '+1', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1', flag: '🇵🇷' },
  
  // ===== AMÉRICA DEL NORTE =====
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  
  // ===== EUROPA =====
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
];

interface PhoneInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string | undefined;
  className?: string;
  disabled?: boolean;
  validateOnChange?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "4567890",
  label,
  required = false,
  error,
  className,
  disabled = false,
  validateOnChange = false
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]!); // México por defecto

  // Estado para validación local
  const [localError, setLocalError] = useState<string | undefined>(error);

  // Map de longitudes máximas locales por país (sin prefijo, solo dígitos)
  const getMaxLocalLength = (code: string): number => {
    switch (code) {
      case 'MX': return 10;
      case 'US':
      case 'CA':
      case 'DO':
      case 'PR': return 10;
      case 'GB': return 10;
      case 'ES':
      case 'FR':
      case 'DE':
      case 'AR':
      case 'CO':
      case 'PE':
      case 'CL':
      case 'BR':
      case 'VE': return 9;
      case 'EC': return 8;
      case 'BO':
      case 'UY':
      case 'GT':
      case 'SV':
      case 'HN':
      case 'NI':
      case 'CR':
      case 'PA': return 7;
      default: return 10;
    }
  };

  // Extraer el número del teléfono completo (sin prefijo)
  const getPhoneNumber = (fullPhone: string | undefined) => {
    if (!fullPhone) return '';
    const country = countries.find(c => fullPhone.startsWith(c.dialCode));
    if (country) {
      return fullPhone.substring(country.dialCode.length).trim();
    }
    return fullPhone;
  };

  // Obtener el prefijo del país seleccionado
  const getFullPhone = (phoneNumber: string | undefined) => {
    if (!phoneNumber) return '';
    return `${selectedCountry.dialCode} ${phoneNumber}`;
  };

  // Manejar cambio en el número de teléfono
  const handlePhoneChange = (inputValue: string) => {
    // Permitir solo dígitos y limitar por longitud local del país
    const digitsOnly = inputValue.replace(/\D/g, '');
    const maxLen = getMaxLocalLength(selectedCountry.code);
    const limited = digitsOnly.slice(0, maxLen);

    const fullPhone = getFullPhone(limited);
    onChange(fullPhone);
    
    // Validación en tiempo real si está habilitada
    if (validateOnChange) {
      if (digitsOnly.length > maxLen) {
        setLocalError(`Muy largo (${digitsOnly.length} dígitos, máximo ${maxLen})`);
        return;
      }
      if (limited) {
        const validationResult = validatePhoneWithDetails(limited);
        if (!validationResult.isValid) {
          setLocalError(validationResult.reason || 'Formato inválido');
        } else {
          setLocalError(undefined);
        }
      } else {
        setLocalError(required ? 'Número vacío' : undefined);
      }
    }
  };

  // Manejar cambio de país
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const currentNumber = getPhoneNumber(value);
      const maxLen = getMaxLocalLength(country.code);
      const sanitized = currentNumber.replace(/\D/g, '').slice(0, maxLen);
      const newFullPhone = getFullPhone(sanitized);
      onChange(newFullPhone);

      // Re-validar al cambiar país
      if (validateOnChange && sanitized) {
        const validationResult = validatePhoneWithDetails(sanitized);
        setLocalError(validationResult.isValid ? undefined : validationResult.reason || 'Formato inválido');
      }
    }
  };

  // Inicializar el país basado en el valor actual
  useEffect(() => {
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [value]);

  // Actualizar error local cuando cambia el error externo
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const phoneNumber = getPhoneNumber(value || '');
  const maxLocalLength = getMaxLocalLength(selectedCountry.code);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        {/* Selector de país como parte del input */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-transparent focus:bg-transparent">
              <SelectValue>
                <div className="flex items-center gap-1">
                  <span className="text-base">{selectedCountry.flag}</span>
                  <span className="text-sm text-gray-500">{selectedCountry.dialCode}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium">{country.name}</div>
                      <div className="text-sm text-gray-500">{country.dialCode}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input del número de teléfono */}
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "pl-20", // Espacio para el selector de país
            (localError || error) && "border-red-500 focus:border-red-500"
          )}
          disabled={disabled}
          maxLength={maxLocalLength}
          aria-invalid={!!(localError || error)}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>
      
      {(localError || error) && (
        <p className="text-sm text-red-500">{localError || error}</p>
      )}
    </div>
  );
} 