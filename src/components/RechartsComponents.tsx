import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface RechartsComponentsProps {
  costosData: Array<{
    nombre: string;
    valor: number;
    porcentaje: number;
    color: string;
  }>;
  tendenciaData: Array<{
    mes: string;
    usuarios: number;
    ingresos: number;
    ganancia: number;
  }>;
}

export default function RechartsComponents({ costosData, tendenciaData }: RechartsComponentsProps) {
  return (
    <div className="space-y-6">
      {/* Gráfico de tendencias */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencias de Crecimiento</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendenciaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} name="Usuarios" />
            <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="ganancia" stroke="#f59e0b" strokeWidth={2} name="Ganancia" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de distribución de costos */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Distribución de Costos</h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costosData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {costosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
