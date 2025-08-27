import { useState, useEffect } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
  required: boolean
}

interface PasswordStrengthMeterProps {
  password: string
  showRequirements?: boolean
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
    test: (password: string) => !/(.)\1/.test(password),
    required: true
  }
]

export function PasswordStrengthMeter({ 
  password, 
  showRequirements = true, 
  className = '' 
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0)
  const [strengthLabel, setStrengthLabel] = useState('')
  const [strengthColor, setStrengthColor] = useState('')
  const [completedRequirements, setCompletedRequirements] = useState<Set<string>>(new Set())
  const [celebratingRequirements, setCelebratingRequirements] = useState<Set<string>>(new Set())

  useEffect(() => {
    calculateStrength()
    checkAchievements()
  }, [password])

  const calculateStrength = () => {
    let score = 0
    const totalRequirements = passwordRequirements.length

    // Calcular puntuación basada en requisitos cumplidos
    passwordRequirements.forEach(requirement => {
      if (requirement.test(password)) {
        score += 1
      }
    })

    const percentage = (score / totalRequirements) * 100
    setStrength(percentage)

    // Determinar etiqueta y color
    if (percentage === 0) {
      setStrengthLabel('Muy débil')
      setStrengthColor('bg-red-500')
    } else if (percentage < 50) {
      setStrengthLabel('Débil')
      setStrengthColor('bg-orange-500')
    } else if (percentage < 80) {
      setStrengthLabel('Media')
      setStrengthColor('bg-yellow-500')
    } else if (percentage < 100) {
      setStrengthLabel('Fuerte')
      setStrengthColor('bg-blue-500')
    } else {
      setStrengthLabel('Muy fuerte')
      setStrengthColor('bg-green-500')
    }
  }

  const checkAchievements = () => {
    const newCompleted = new Set<string>()
    const newAchievements: string[] = []
    
    passwordRequirements.forEach((requirement) => {
      if (requirement.test(password)) {
        newCompleted.add(requirement.id)
        
        // Si es un nuevo logro, marcar para celebración
        if (!completedRequirements.has(requirement.id)) {
          newAchievements.push(requirement.label)
        }
      }
    })
    
    // Si hay nuevos logros, celebrar antes de marcar como completado
    if (newAchievements.length > 0) {
      // Marcar como celebrando inmediatamente
      setCelebratingRequirements(new Set(newAchievements))
      
      // Esperar 2 segundos antes de marcar como completado
      setTimeout(() => {
        setCompletedRequirements(newCompleted)
        setCelebratingRequirements(new Set())
      }, 2000)
    } else {
      setCompletedRequirements(newCompleted)
    }
  }

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

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barra de fortaleza */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Fortaleza de la contraseña</span>
          <span className={`text-sm font-medium px-2 py-1 rounded ${strengthColor.replace('bg-', 'text-')} bg-opacity-10`}>
            {strengthLabel}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${strength}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>{Math.round(strength)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Lista de requisitos con animación de achievement */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Requisitos de seguridad:</h4>
          <div className="space-y-1">
            {passwordRequirements.map((requirement) => {
              const status = getRequirementStatus(requirement)
              const isCompleted = completedRequirements.has(requirement.id)
              const isCelebrating = celebratingRequirements.has(requirement.label)
              
              return (
                <div 
                  key={requirement.id}
                  className={`flex items-center space-x-2 text-sm transition-all duration-1000 ease-in-out ${
                    isCompleted 
                      ? 'opacity-0 transform -translate-x-full scale-95' 
                      : isCelebrating
                      ? 'text-green-600 font-semibold animate-pulse'
                      : getRequirementTextColor(status)
                  }`}
                  style={{
                    maxHeight: isCompleted ? '0px' : '24px',
                    overflow: 'hidden',
                    marginBottom: isCompleted ? '0px' : '4px',
                    transitionDelay: isCompleted ? '0ms' : '0ms'
                  }}
                >
                  {isCelebrating ? (
                    <span className="text-green-500 animate-bounce">🎉</span>
                  ) : (
                    getRequirementIcon(status)
                  )}
                  <span className={status === 'pending' ? 'text-gray-500' : ''}>
                    {requirement.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}



      {/* Mensaje de estado */}
      {password.length > 0 && (
        <div className={`text-sm p-2 rounded-md ${
          strength === 100 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {strength === 100 
            ? '✅ Tu contraseña cumple con todos los requisitos de seguridad'
            : `⚠️ Tu contraseña necesita cumplir ${passwordRequirements.length - Math.round((strength / 100) * passwordRequirements.length)} requisitos más`
          }
        </div>
      )}
    </div>
  )
} 