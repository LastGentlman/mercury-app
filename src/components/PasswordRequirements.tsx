import { Check, X, AlertCircle } from 'lucide-react'

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
  required: boolean
}

interface PasswordRequirementsProps {
  password: string
  className?: string
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Al menos 12 caracteres',
    test: (password: string) => password.length >= 12,
    required: true
  },
  {
    id: 'lowercase',
    label: 'Al menos una minúscula (a-z)',
    test: (password: string) => /[a-z]/.test(password),
    required: true
  },
  {
    id: 'uppercase',
    label: 'Al menos una mayúscula (A-Z)',
    test: (password: string) => /[A-Z]/.test(password),
    required: true
  },
  {
    id: 'number',
    label: 'Al menos un número (0-9)',
    test: (password: string) => /\d/.test(password),
    required: true
  },
  {
    id: 'symbol',
    label: 'Al menos un símbolo especial (@$!%*?&)',
    test: (password: string) => /[@$!%*?&]/.test(password),
    required: true
  },
  {
    id: 'no-repetition',
    label: 'Sin caracteres repetidos consecutivos',
    test: (password: string) => !/(.)\1{3,}/.test(password),
    required: true
  }
]

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  const getRequirementStatus = (requirement: PasswordRequirement) => {
    if (password.length === 0) return 'pending'
    return requirement.test(password) ? 'met' : 'not-met'
  }

  const getRequirementIcon = (status: 'pending' | 'met' | 'not-met') => {
    switch (status) {
      case 'met':
        return <Check className="h-4 w-4 text-green-500" />
      case 'not-met':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getRequirementTextColor = (status: 'pending' | 'met' | 'not-met') => {
    switch (status) {
      case 'met':
        return 'text-green-700'
      case 'not-met':
        return 'text-red-700'
      default:
        return 'text-gray-500'
    }
  }

  const metRequirements = passwordRequirements.filter(req => req.test(password)).length
  const totalRequirements = passwordRequirements.length

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header con progreso */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Requisitos de seguridad</h4>
        <span className="text-xs text-gray-500">
          {metRequirements}/{totalRequirements} cumplidos
        </span>
      </div>

      {/* Lista de requisitos */}
      <div className="space-y-2">
        {passwordRequirements.map((requirement) => {
          const status = getRequirementStatus(requirement)
          return (
            <div 
              key={requirement.id}
              className={`flex items-center space-x-2 text-sm transition-colors duration-200 ${getRequirementTextColor(status)}`}
            >
              {getRequirementIcon(status)}
              <span className={status === 'pending' ? 'text-gray-500' : ''}>
                {requirement.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mensaje de estado */}
      {password.length > 0 && (
        <div className={`text-sm p-2 rounded-md ${
          metRequirements === totalRequirements 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {metRequirements === totalRequirements 
            ? '✅ Tu contraseña cumple con todos los requisitos de seguridad'
            : `⚠️ Tu contraseña necesita cumplir ${totalRequirements - metRequirements} requisitos más`
          }
        </div>
      )}
    </div>
  )
} 