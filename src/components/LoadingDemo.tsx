import { AlertTriangle, Loader2, Play } from 'lucide-react'
import { useLoadingState } from '../hooks/useLoadingState'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ComponentLoadingSuspense, LoadingSuspense, PageLoadingSuspense } from './LoadingSuspense'

// Demo component that throws an error
function ErrorDemo() {
  const throwError = () => {
    throw new Error('Este es un error de demostración para probar el Error Boundary')
  }

  return (
    <Button onClick={throwError} variant="destructive">
      <AlertTriangle className="h-4 w-4 mr-2" />
      Lanzar Error
    </Button>
  )
}

// Demo component with async loading
function AsyncDemo() {
  const { isLoading, withLoading } = useLoadingState({ useGlobal: true })

  const simulateAsyncOperation = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return 'Operación completada'
  }

  const handleAsyncOperation = async () => {
    try {
      const result = await withLoading(simulateAsyncOperation)
      console.log('Resultado:', result)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <Button onClick={handleAsyncOperation} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Operación Asíncrona
        </>
      )}
    </Button>
  )
}

// Demo component with local loading
function LocalLoadingDemo() {
  const { isLoading, withLoading } = useLoadingState({ useGlobal: false })

  const simulateLocalOperation = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return 'Operación local completada'
  }

  const handleLocalOperation = async () => {
    try {
      const result = await withLoading(simulateLocalOperation)
      console.log('Resultado local:', result)
    } catch (error) {
      console.error('Error local:', error)
    }
  }

  return (
    <Button onClick={handleLocalOperation} disabled={isLoading} variant="outline">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Cargando local...
        </>
      ) : (
        'Operación Local'
      )}
    </Button>
  )
}

export function LoadingDemo() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Demo: Sistema de Loading y Error Boundaries
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Este demo muestra cómo usar el nuevo sistema de loading global y error boundaries implementado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Global Loading Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-600" />
              Loading Global
            </CardTitle>
            <CardDescription>
              Usa el loading global que muestra un overlay sobre toda la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncDemo />
          </CardContent>
        </Card>

        {/* Local Loading Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-green-600" />
              Loading Local
            </CardTitle>
            <CardDescription>
              Loading local que solo afecta al componente específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocalLoadingDemo />
          </CardContent>
        </Card>

        {/* Error Boundary Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Error Boundary
            </CardTitle>
            <CardDescription>
              Prueba el error boundary global lanzando un error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorDemo />
          </CardContent>
        </Card>
      </div>

      {/* Suspense Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Suspense con Loading</CardTitle>
            <CardDescription>
              Ejemplo de uso de Suspense con loading personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSuspense
              fallback={
                <div className="flex items-center justify-center p-4">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando contenido...</p>
                  </div>
                </div>
              }
            >
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">✅ Contenido cargado exitosamente</p>
                <p className="text-sm text-green-600 mt-2">
                  Este contenido se muestra después de que Suspense termine de cargar
                </p>
              </div>
            </LoadingSuspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Loading Suspense</CardTitle>
            <CardDescription>
              Suspense especializado para componentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComponentLoadingSuspense>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">✅ Componente cargado</p>
                <p className="text-sm text-blue-600 mt-2">
                  Usando ComponentLoadingSuspense
                </p>
              </div>
            </ComponentLoadingSuspense>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📚 Cómo usar el sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Loading Global</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const { isLoading, withLoading } = useLoadingState({ useGlobal: true })

// Para operaciones asíncronas
const result = await withLoading(async () => {
  // tu código asíncrono aquí
})`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Loading Local</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const { isLoading, withLoading } = useLoadingState({ useGlobal: false })

// Solo afecta al componente actual
const result = await withLoading(async () => {
  // tu código asíncrono aquí
})`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Suspense Components</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { LoadingSuspense, PageLoadingSuspense } from './LoadingSuspense'

<LoadingSuspense fallback={<CustomLoader />}>
  <YourComponent />
</LoadingSuspense>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">4. Error Boundaries</h4>
              <p className="text-gray-600">
                Los error boundaries están configurados globalmente en <code>main.tsx</code> y 
                automáticamente capturan errores en toda la aplicación.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 