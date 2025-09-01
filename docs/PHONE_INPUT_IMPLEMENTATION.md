# PhoneInput Component Implementation

## Overview

Se ha implementado un nuevo componente `PhoneInput` que reemplaza todos los campos de entrada de teléfono en la aplicación. Este componente incluye:

- **Selector de país con banderas**: Permite seleccionar el país con su bandera y código de marcación
- **México como predeterminado**: El país predeterminado es México (+52)
- **Validación automática**: Maneja automáticamente el formato del número de teléfono
- **Interfaz consistente**: Mantiene la consistencia visual con el resto de la aplicación

## Características

### Países Soportados
El componente incluye 30 países con sus respectivos códigos de marcación:

- **América Latina**: México (+52), Argentina (+54), Colombia (+57), Perú (+51), Chile (+56), Brasil (+55), Venezuela (+58), Ecuador (+593), Bolivia (+591), Paraguay (+595), Uruguay (+598), Guatemala (+502), El Salvador (+503), Honduras (+504), Nicaragua (+505), Costa Rica (+506), Panamá (+507), Cuba (+53), República Dominicana (+1), Puerto Rico (+1)

- **América del Norte**: Estados Unidos (+1), Canadá (+1)

- **Europa**: España (+34), Francia (+33), Alemania (+49), Italia (+39), Reino Unido (+44)

- **Asia**: Japón (+81), China (+86), India (+91)

- **Oceanía**: Australia (+61), Nueva Zelanda (+64)

### Funcionalidades

1. **Selección de País**: Dropdown con banderas y códigos de marcación
2. **Formato Automático**: Aplica automáticamente el prefijo del país seleccionado
3. **Validación**: Maneja números de teléfono con o sin prefijo
4. **Responsive**: Se adapta a diferentes tamaños de pantalla
5. **Accesibilidad**: Compatible con lectores de pantalla

## Uso

### Importación
```tsx
import { PhoneInput } from '../components/ui/index.ts';
```

### Implementación Básica
```tsx
<PhoneInput
  label="Teléfono"
  value={phone}
  onChange={(value) => setPhone(value)}
  placeholder="123 456 7890"
  required
/>
```

### Con Validación de Errores
```tsx
<PhoneInput
  label="Teléfono"
  value={formData.phone}
  onChange={(value) => handleInputChange('phone', value)}
  placeholder="123 456 7890"
  error={errors.phone}
  required
/>
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `value` | `string \| undefined` | Sí | Valor actual del teléfono |
| `onChange` | `(value: string) => void` | Sí | Función que se ejecuta al cambiar el valor |
| `placeholder` | `string` | No | Texto de placeholder (default: "123 456 7890") |
| `label` | `string` | No | Etiqueta del campo |
| `required` | `boolean` | No | Indica si el campo es requerido (default: false) |
| `error` | `string \| undefined` | No | Mensaje de error a mostrar |
| `className` | `string` | No | Clases CSS adicionales |
| `disabled` | `boolean` | No | Indica si el campo está deshabilitado (default: false) |

## Componentes Actualizados

Los siguientes componentes han sido actualizados para usar el nuevo `PhoneInput`:

1. **BusinessSetup.tsx** - Configuración de negocio
2. **CreateOrderDialog.tsx** - Creación de pedidos
3. **EditClientModal.tsx** - Edición de clientes
4. **CreateClientModal.tsx** - Creación de clientes
5. **profile.tsx** - Perfil de usuario

## Formato de Salida

El componente siempre devuelve el número de teléfono en el formato:
```
+[código_país] [número]
```

Ejemplos:
- México: `+52 123 456 7890`
- Estados Unidos: `+1 555 123 4567`
- España: `+34 666 777 888`

## Beneficios

1. **Experiencia de Usuario Mejorada**: Los usuarios pueden seleccionar fácilmente su país
2. **Consistencia**: Todos los campos de teléfono tienen la misma interfaz
3. **Internacionalización**: Soporte para múltiples países desde el inicio
4. **Validación Automática**: Reduce errores de formato de teléfono
5. **Accesibilidad**: Mejor experiencia para usuarios con discapacidades

## Consideraciones Técnicas

- El componente usa el sistema de diseño existente (shadcn/ui)
- Es completamente tipado con TypeScript
- Maneja automáticamente los casos edge (valores undefined, etc.)
- Es compatible con el sistema de validación existente
- No requiere cambios en la base de datos o API

## Próximos Pasos

1. **Testing**: Agregar pruebas unitarias para el componente
2. **Validación Avanzada**: Implementar validación específica por país
3. **Búsqueda**: Agregar funcionalidad de búsqueda en el dropdown de países
4. **Más Países**: Expandir la lista de países según necesidades
5. **Formato Local**: Permitir diferentes formatos de visualización por país 