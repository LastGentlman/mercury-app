import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/index.ts';
import { Alert, AlertDescription } from './ui/index.ts';

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('beta-banner-dismissed');
    return !dismissed;
  });

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('beta-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-6">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium">🚧 Aplicación en Desarrollo</span>
          <span className="text-sm">
            Esta es una versión beta. Algunas funciones pueden no estar disponibles o presentar errores.
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}