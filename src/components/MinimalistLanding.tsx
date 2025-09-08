import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Zap, Shield, Infinity, Smartphone, Globe, Navigation } from 'lucide-react'
import { Button } from './ui/index'

interface MinimalistLandingProps {
  isPWA?: boolean
  isAuthenticated?: boolean
  debugInfo?: any
}

export default function MinimalistLanding({ isPWA, isAuthenticated, debugInfo }: MinimalistLandingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate features every 4 seconds
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Zap,
      title: "Instantáneo",
      description: "Sin esperas. Sin configuración compleja. Comienza en segundos."
    },
    {
      icon: Shield,
      title: "Confiable", 
      description: "Funciona offline. Sincroniza automáticamente. Tus datos seguros."
    },
    {
      icon: Infinity,
      title: "Escalable",
      description: "Crece contigo. Desde 1 hasta 10,000+ órdenes sin límites."
    }
  ]

  const pwaFeatures = [
    {
      icon: Smartphone,
      title: "Progressive Web App",
      description: "Instala como app nativa. Funciona offline y sincroniza automáticamente."
    },
    {
      icon: Globe,
      title: "Acceso Universal",
      description: "Funciona en cualquier navegador moderno. No requiere app stores."
    },
    {
      icon: Navigation,
      title: "Mobile-First",
      description: "Diseño optimizado para móviles con navegación intuitiva."
    }
  ]

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle geometric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-50/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-50/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Hero section - Ultra minimal */}
        <section className="px-6 pt-32 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 tracking-tight mb-8 leading-none">
                Órdenes
                <br />
                <span className="text-gray-400">sin fricción</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                La forma más simple de gestionar pedidos. 
                Sin complejidad. Sin curva de aprendizaje.
                {isPWA && (
                  <span className="block text-sm text-blue-600 mt-3 font-medium">
                    ✨ Ejecutándose como aplicación nativa
                  </span>
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/auth">
                  <Button className="group bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center gap-2">
                    Empezar gratis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <div className="text-sm text-gray-500">
                  Sin tarjeta de crédito
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive features section */}
        <section className="px-6 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Feature showcase */}
              <div className="order-2 lg:order-1">
                <div className="bg-gray-50 rounded-3xl p-8 h-96 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-50" />
                  
                  {/* Animated feature display */}
                  <div className="relative z-10 text-center">
                    {features.map((feature, index) => {
                      const Icon = feature.icon
                      return (
                        <div
                          key={index}
                          className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
                            index === activeFeature ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                          }`}
                        >
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <Icon className="w-8 h-8 text-gray-700" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                          <p className="text-gray-600 max-w-xs">{feature.description}</p>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Feature dots */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === activeFeature ? 'bg-gray-700 w-6' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature list */}
              <div className="order-1 lg:order-2">
                <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
                  Todo lo que necesitas.
                  <br />
                  <span className="text-gray-400">Nada que no.</span>
                </h2>
                
                <div className="space-y-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={`w-full text-left p-4 rounded-2xl transition-all group ${
                          index === activeFeature 
                            ? 'bg-gray-50 border-2 border-gray-200' 
                            : 'hover:bg-gray-25 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            index === activeFeature ? 'bg-white shadow-sm' : 'bg-gray-100'
                          }`}>
                            <Icon className="w-6 h-6 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                              {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Features section */}
        <section className="px-6 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tecnología Moderna
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Construido con las últimas tecnologías web para ofrecerte la mejor experiencia
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {pwaFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Social proof section - minimal */}
        <section className="px-6 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-8">
              <div className="flex items-center gap-8 opacity-60">
                <div className="text-sm font-medium text-gray-500">Confiado por equipos en</div>
              </div>
              
              <div className="flex items-center gap-12 opacity-40">
                <div className="text-lg font-bold text-gray-400">EMPRESA</div>
                <div className="text-lg font-bold text-gray-400">STARTUP</div>
                <div className="text-lg font-bold text-gray-400">EQUIPO</div>
                <div className="text-lg font-bold text-gray-400">PROYECTO</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - Ultra minimal */}
        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gray-900 rounded-3xl p-16 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Listo para empezar?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Únete a los equipos que ya simplificaron su gestión de órdenes
                </p>
                
                <Link to="/auth">
                  <Button className="bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-all transform hover:scale-105 inline-flex items-center gap-2">
                    Comenzar ahora
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* Debug info in development */}
        {debugInfo && import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs">
            <div className="font-bold mb-1">🔧 Debug Mode</div>
            <div>PWA: {isPWA ? 'Yes' : 'No'}</div>
            <div>Auth: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>Launch: {debugInfo.launchSource || 'Unknown'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
