import { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '../../lib/utils';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
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
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nueva Zelanda', dialCode: '+64', flag: '🇳🇿' },
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
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "123 456 7890",
  label,
  required = false,
  error,
  className,
  disabled = false
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]!); // México por defecto

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
  const handlePhoneChange = (phoneNumber: string) => {
    const fullPhone = getFullPhone(phoneNumber);
    onChange(fullPhone);
  };

  // Manejar cambio de país
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const currentNumber = getPhoneNumber(value);
      const newFullPhone = getFullPhone(currentNumber);
      onChange(newFullPhone);
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

  const phoneNumber = getPhoneNumber(value || '');

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        {/* Selector de país */}
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
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

        {/* Input del número de teléfono */}
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-1",
            error && "border-red-500 focus:border-red-500"
          )}
          disabled={disabled}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 