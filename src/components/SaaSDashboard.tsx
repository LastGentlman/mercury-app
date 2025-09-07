import React, { useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Settings, EyeOff, Smartphone, Monitor, Tablet, Percent, Clock } from 'lucide-react';

const SaaSDashboard = () => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [hiddenCards, setHiddenCards] = useState(new Set());
  const [deviceView, setDeviceView] = useState('desktop');
  
  // Datos del documento
  const kpis = {
    usuarios: 300,
    ingresos: 82500,
    ganancia: 57630,
    margen: 69.9,
    arr: 990000,
    churnRate: 5,
    revenuePerUser: 275,
    cac: 335,
    ltv: 6100
  };
  
  const costosData = [
    { nombre: 'CAC', valor: 10050, porcentaje: 12.2, color: '#ef4444' },
    { nombre: 'AI Stack', valor: 1870, porcentaje: 2.3, color: '#3b82f6' },
    { nombre: 'Tech Infra', valor: 850, porcentaje: 1.0, color: '#10b981' },
    { nombre: 'Personal', valor: 8000, porcentaje: 9.7, color: '#f59e0b' },
    { nombre: 'Marketing', valor: 550, porcentaje: 0.7, color: '#8b5cf6' },
    { nombre: 'Operaciones', valor: 3550, porcentaje: 4.3, color: '#06b6d4' }
  ];
  
  const tendenciaData = [
    { mes: 'Ene', usuarios: 250, ingresos: 68750, ganancia: 45000 },
    { mes: 'Feb', usuarios: 275, ingresos: 75625, ganancia: 50000 },
    { mes: 'Mar', usuarios: 300, ingresos: 82500, ganancia: 57630 }
  ];

  const toggleCard = (cardId: string) => {
    const newHidden = new Set(hiddenCards);
    if (newHidden.has(cardId)) {
      newHidden.delete(cardId);
    } else {
      newHidden.add(cardId);
    }
    setHiddenCards(newHidden);
  };

  const getDeviceClass = () => {
    switch(deviceView) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-4xl mx-auto';
      default:
        return 'max-w-7xl mx-auto';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const KPICard = ({ id, title, value, subtitle, icon: Icon, trend, color = "blue", className = "" }: {
    id: string;
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    color?: string;
    className?: string;
  }) => {
    if (hiddenCards.has(id)) return null;
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-100 rounded-lg`}>
                <Icon className={`h-5 w-5 text-${color}-600`} />
              </div>
              {isCustomizing && (
                <button
                  onClick={() => toggleCard(id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <EyeOff className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-3">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">{trend}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${getDeviceClass()}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard SaaS</h1>
            <p className="text-sm text-gray-600">300 usuarios activos • Margen 69.9%</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Selector de dispositivo */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDeviceView('mobile')}
                className={`p-2 rounded ${deviceView === 'mobile' ? 'bg-white shadow-sm' : ''}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeviceView('tablet')}
                className={`p-2 rounded ${deviceView === 'tablet' ? 'bg-white shadow-sm' : ''}`}
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeviceView('desktop')}
                className={`p-2 rounded ${deviceView === 'desktop' ? 'bg-white shadow-sm' : ''}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                isCustomizing 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4 w-4" />
              {isCustomizing ? 'Guardar' : 'Personalizar'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPIs Principales - Fila 1 */}
        <div className={`grid ${deviceView === 'mobile' ? 'grid-cols-1' : deviceView === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'} gap-6 mb-6`}>
          <KPICard
            id="usuarios"
            title="Usuarios Activos"
            value={kpis.usuarios.toLocaleString()}
            subtitle="Meta: +10/mes (25 nuevos - 15 churn)"
            icon={Users}
            trend="+8.3% vs mes anterior"
            color="blue"
          />
          
          <KPICard
            id="ingresos"
            title="Ingresos Mensuales"
            value={formatCurrency(kpis.ingresos)}
            subtitle={`ARR: ${formatCurrency(kpis.arr)}`}
            icon={DollarSign}
            trend="+12.5% vs mes anterior"
            color="green"
          />
          
          <KPICard
            id="ganancia"
            title="Ganancia Neta"
            value={formatCurrency(kpis.ganancia)}
            subtitle={`Margen: ${kpis.margen}% | ${formatCurrency(kpis.ganancia/kpis.usuarios)}/usuario`}
            icon={TrendingUp}
            trend="Benchmark: 40-60% es bueno"
            color="emerald"
          />
        </div>

        {/* KPIs Adicionales - Solo Desktop */}
        {deviceView === 'desktop' && (
          <div className="grid grid-cols-4 gap-6 mb-6">
            <KPICard
              id="cac-ltv"
              title="CAC vs LTV"
              value="1:18.2"
              subtitle={`CAC: ${formatCurrency(kpis.cac)} | LTV: ${formatCurrency(kpis.ltv)}`}
              icon={Target}
              trend="Ratio saludable >3:1"
              color="indigo"
            />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Percent className="h-5 w-5 text-orange-600" />
                </div>
                {isCustomizing && (
                  <button onClick={() => toggleCard('churn')} className="p-1 hover:bg-gray-100 rounded">
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.churnRate}%</p>
              <p className="text-xs text-gray-500 mt-1">15 usuarios/mes se van</p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-green-600">Excelente: &lt;10% es bueno</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                {isCustomizing && (
                  <button onClick={() => toggleCard('arpu')} className="p-1 hover:bg-gray-100 rounded">
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600">Revenue per Usuario</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.revenuePerUser)}</p>
              <p className="text-xs text-gray-500 mt-1">MXN/mes por usuario</p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-blue-600">Evaluar aumento 10-15%</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                {isCustomizing && (
                  <button onClick={() => toggleCard('tiempo-1k')} className="p-1 hover:bg-gray-100 rounded">
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600">Tiempo a 1K usuarios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">28 meses</p>
              <p className="text-xs text-gray-500 mt-1">A ritmo actual (+10/mes)</p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-blue-600">Acelerar a +25/mes = 14 meses</span>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos - Layout optimizado para Desktop */}
        <div className={`grid ${deviceView === 'mobile' ? 'grid-cols-1' : deviceView === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'} gap-6 mb-6`}>
          {!hiddenCards.has('tendencia') && (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${deviceView === 'desktop' ? 'col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tendencia de Crecimiento</h3>
                {isCustomizing && (
                  <button onClick={() => toggleCard('tendencia')} className="p-1 hover:bg-gray-100 rounded">
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <ResponsiveContainer width="100%" height={deviceView === 'desktop' ? 320 : 250}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'usuarios' ? value : formatCurrency(Number(value)), 
                    name === 'usuarios' ? 'Usuarios' : name === 'ingresos' ? 'Ingresos' : 'Ganancia'
                  ]} />
                  <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={3} />
                  <Line type="monotone" dataKey="ganancia" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!hiddenCards.has('costos') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Distribución de Costos</h3>
                {isCustomizing && (
                  <button onClick={() => toggleCard('costos')} className="p-1 hover:bg-gray-100 rounded">
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <ResponsiveContainer width="100%" height={deviceView === 'desktop' ? 320 : 250}>
                <PieChart>
                  <Pie
                    data={costosData}
                    cx="50%"
                    cy="50%"
                    outerRadius={deviceView === 'desktop' ? 100 : 80}
                    dataKey="valor"
                    label={({nombre, porcentaje}) => `${nombre} ${porcentaje}%`}
                  >
                    {costosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabla de Costos Detallada */}
        {!hiddenCards.has('tabla-costos') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Desglose de Costos Mensuales</h3>
              {isCustomizing && (
                <button onClick={() => toggleCard('tabla-costos')} className="p-1 hover:bg-gray-100 rounded">
                  <EyeOff className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {costosData.map((costo, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: costo.color }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900">{costo.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(costo.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {costo.porcentaje}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Rápidos */}
        {!hiddenCards.has('insights') && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">🎯 Insights Clave</h3>
              {isCustomizing && (
                <button onClick={() => toggleCard('insights')} className="p-1 hover:bg-gray-100 rounded">
                  <EyeOff className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className={`grid ${deviceView === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-green-700">✅ CAC Ultra Eficiente</p>
                <p className="text-xs text-gray-600 mt-1">Ratio 18:1 vs benchmark 3:1</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700">🤖 Churn Excelente</p>
                <p className="text-xs text-gray-600 mt-1">5% vs 10-15% promedio SaaS</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-purple-700">🚀 Margen Premium</p>
                <p className="text-xs text-gray-600 mt-1">69.9% vs 40-60% típico</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaaSDashboard;
