import { CheckCircle, Info, AlertCircle } from 'lucide-react'

interface SuccessMessageProps {
  type: 'success' | 'info' | 'warning'
  title: string
  message: string
  details?: string
  email?: string
}

export function SuccessMessage({ type, title, message, details, email }: SuccessMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getContainerClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  const getTextClasses = () => {
    switch (type) {
      case 'success':
        return 'text-green-700'
      case 'info':
        return 'text-blue-700'
      case 'warning':
        return 'text-yellow-700'
    }
  }

  return (
    <div className={`p-4 border rounded-lg ${getContainerClasses()}`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <div className={`text-sm ${getTextClasses()} mb-2`}>
            {message.split('\n').map((line, index) => (
              <p key={index} className={index > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ))}
          </div>
          {details && (
            <p className="text-sm text-gray-600 mb-2">{details}</p>
          )}
          {email && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">Email enviado a:</p>
              <p className="text-sm text-gray-700">{email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 