export const BUSINESS_TYPES = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurante/Food Service',
    icon: 'Utensils',
    color: 'from-orange-500 to-red-500',
    description: 'Restaurantes, cafeterías, comida rápida',
    satCode: '722513',
    categories: [
      { id: 'entradas', name: 'Entradas', icon: '🥗', satCode: '50202306' },
      { id: 'platos-fuertes', name: 'Platos Fuertes', icon: '🍽️', satCode: '50202306' },
      { id: 'postres', name: 'Postres', icon: '🍰', satCode: '50202306' },
      { id: 'bebidas', name: 'Bebidas', icon: '🥤', satCode: '50202401' },
      { id: 'bebidas-alcoholicas', name: 'Bebidas Alcohólicas', icon: '🍺', satCode: '50202401' },
      { id: 'desayunos', name: 'Desayunos', icon: '🥞', satCode: '50202306' },
      { id: 'combos', name: 'Combos/Paquetes', icon: '🎯', satCode: '50202306' }
    ]
  },
  cafe: {
    id: 'cafe',
    name: 'Cafetería/Bar',
    icon: 'Coffee',
    color: 'from-amber-600 to-orange-600',
    description: 'Cafeterías, bares, juguerías',
    satCode: '722515',
    categories: [
      { id: 'cafe-caliente', name: 'Café Caliente', icon: '☕', satCode: '50202401' },
      { id: 'cafe-frio', name: 'Café Frío', icon: '🧊', satCode: '50202401' },
      { id: 'te-infusiones', name: 'Té e Infusiones', icon: '🍵', satCode: '50202401' },
      { id: 'jugos-naturales', name: 'Jugos Naturales', icon: '🥤', satCode: '50202401' },
      { id: 'smoothies', name: 'Smoothies', icon: '🥛', satCode: '50202401' },
      { id: 'reposteria', name: 'Repostería', icon: '🧁', satCode: '50202306' },
      { id: 'snacks', name: 'Snacks', icon: '🥨', satCode: '50202306' }
    ]
  },
  retail: {
    id: 'retail',
    name: 'Retail/Tienda',
    icon: 'Store',
    color: 'from-blue-500 to-indigo-500',
    description: 'Tiendas de retail, conveniencia',
    satCode: '463113',
    categories: [
      { id: 'electronica', name: 'Electrónicos', icon: '📱', satCode: '52161500' },
      { id: 'ropa', name: 'Ropa y Accesorios', icon: '👕', satCode: '53102600' },
      { id: 'hogar', name: 'Hogar y Jardín', icon: '🏠', satCode: '56101500' },
      { id: 'deportes', name: 'Deportes', icon: '⚽', satCode: '49181500' },
      { id: 'libros', name: 'Libros y Medios', icon: '📚', satCode: '60141200' },
      { id: 'juguetes', name: 'Juguetes', icon: '🧸', satCode: '60104400' },
      { id: 'otros', name: 'Otros', icon: '📦', satCode: '50000000' }
    ]
  },
  floreria: {
    id: 'floreria',
    name: 'Floristería',
    icon: 'Flower',
    color: 'from-pink-500 to-rose-500',
    description: 'Floristerías, plantas, jardines',
    satCode: '463112',
    categories: [
      { id: 'arreglos-florales', name: 'Arreglos Florales', icon: '💐', satCode: '10171600' },
      { id: 'flores-naturales', name: 'Flores Naturales', icon: '🌸', satCode: '10171600' },
      { id: 'plantas-interior', name: 'Plantas de Interior', icon: '🪴', satCode: '10171700' },
      { id: 'plantas-exterior', name: 'Plantas de Exterior', icon: '🌿', satCode: '10171700' },
      { id: 'eventos-bodas', name: 'Eventos y Bodas', icon: '💒', satCode: '10171600' },
      { id: 'decoracion', name: 'Decoración', icon: '🎀', satCode: '56101800' },
      { id: 'macetas-sustratos', name: 'Macetas y Sustratos', icon: '🏺', satCode: '10191500' }
    ]
  },
  servicios: {
    id: 'servicios',
    name: 'Servicios Profesionales',
    icon: 'Wrench',
    color: 'from-purple-500 to-violet-500',
    description: 'Servicios técnicos, consultorías',
    satCode: '541',
    categories: [
      { id: 'consultoria', name: 'Consultoría', icon: '💼', satCode: '80141600' },
      { id: 'mantenimiento', name: 'Mantenimiento', icon: '🔧', satCode: '72141100' },
      { id: 'limpieza', name: 'Limpieza', icon: '🧽', satCode: '90121500' },
      { id: 'reparacion', name: 'Reparación', icon: '⚙️', satCode: '72141100' },
      { id: 'instalacion', name: 'Instalación', icon: '🔨', satCode: '72141100' },
      { id: 'capacitacion', name: 'Capacitación', icon: '📚', satCode: '86101600' },
      { id: 'otros-servicios', name: 'Otros Servicios', icon: '⚡', satCode: '80000000' }
    ]
  },
  belleza: {
    id: 'belleza',
    name: 'Belleza y Cuidado Personal',
    icon: 'Scissors',
    color: 'from-pink-400 to-purple-400',
    description: 'Salones, spas, estética',
    satCode: '812112',
    categories: [
      { id: 'corte-peinado', name: 'Corte y Peinado', icon: '✂️', satCode: '85121600' },
      { id: 'coloracion', name: 'Coloración', icon: '🎨', satCode: '85121600' },
      { id: 'tratamientos-faciales', name: 'Tratamientos Faciales', icon: '💆‍♀️', satCode: '85121600' },
      { id: 'manicure-pedicure', name: 'Manicure/Pedicure', icon: '💅', satCode: '85121600' },
      { id: 'masajes', name: 'Masajes', icon: '🙌', satCode: '85121600' },
      { id: 'depilacion', name: 'Depilación', icon: '🪒', satCode: '85121600' },
      { id: 'productos-belleza', name: 'Productos de Belleza', icon: '💄', satCode: '53131600' }
    ]
  },
  salud: {
    id: 'salud',
    name: 'Salud y Medicina',
    icon: 'Heart',
    color: 'from-green-500 to-emerald-500',
    description: 'Consultorios, clínicas, farmacias',
    satCode: '621',
    categories: [
      { id: 'consulta-general', name: 'Consulta General', icon: '🩺', satCode: '85121700' },
      { id: 'especialidades', name: 'Especialidades', icon: '👨‍⚕️', satCode: '85121700' },
      { id: 'estudios-laboratorio', name: 'Estudios de Laboratorio', icon: '🔬', satCode: '85121700' },
      { id: 'medicamentos', name: 'Medicamentos', icon: '💊', satCode: '51101800' },
      { id: 'terapias', name: 'Terapias', icon: '🏥', satCode: '85121700' },
      { id: 'vacunas', name: 'Vacunas', icon: '💉', satCode: '85121700' },
      { id: 'material-medico', name: 'Material Médico', icon: '🩹', satCode: '42142100' }
    ]
  },
  educacion: {
    id: 'educacion',
    name: 'Educación',
    icon: 'GraduationCap',
    color: 'from-indigo-500 to-blue-500',
    description: 'Escuelas, cursos, talleres',
    satCode: '611',
    categories: [
      { id: 'cursos-regulares', name: 'Cursos Regulares', icon: '📖', satCode: '86101600' },
      { id: 'talleres', name: 'Talleres', icon: '🛠️', satCode: '86101600' },
      { id: 'certificaciones', name: 'Certificaciones', icon: '🏆', satCode: '86101600' },
      { id: 'materiales-estudio', name: 'Materiales de Estudio', icon: '📚', satCode: '60141200' },
      { id: 'examenes', name: 'Exámenes', icon: '📝', satCode: '86101600' },
      { id: 'actividades-extra', name: 'Actividades Extracurriculares', icon: '🎭', satCode: '86101600' },
      { id: 'servicios-educativos', name: 'Otros Servicios Educativos', icon: '🎓', satCode: '86101600' }
    ]
  }
} as const;

export type BusinessTypeId = keyof typeof BUSINESS_TYPES;

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
  satCode: string;
}

export interface BusinessType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  satCode: string;
  categories: readonly BusinessCategory[];
}

// Helper functions
export const getBusinessType = (typeId: BusinessTypeId): BusinessType => {
  return BUSINESS_TYPES[typeId];
};

export const getAllBusinessTypes = (): BusinessType[] => {
  return Object.values(BUSINESS_TYPES);
};

export const getBusinessTypesByCategory = (searchTerm: string): BusinessType[] => {
  const term = searchTerm.toLowerCase();
  return getAllBusinessTypes().filter(type => 
    type.name.toLowerCase().includes(term) ||
    type.description.toLowerCase().includes(term)
  );
};

export const getCategoriesForBusinessType = (typeId: BusinessTypeId): readonly BusinessCategory[] => {
  return BUSINESS_TYPES[typeId]?.categories || [];
};

// Tax rates for different categories (Mexico)
export const TAX_RATES = {
  IVA_GENERAL: 0.16,      // 16% IVA general
  IVA_ALIMENTOS: 0.00,    // 0% alimentos básicos
  IVA_MEDICINA: 0.00,     // 0% medicinas
  IVA_FRONTERA: 0.08,     // 8% zona fronteriza
  IEPS_BEBIDAS: 0.25,     // 25% IEPS bebidas azucaradas
  IEPS_ALCOHOL: 0.53,     // 53% IEPS bebidas alcohólicas
} as const;

// SAT tax regime codes (Mexico)
export const SAT_TAX_REGIMES = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
  '606': 'Arrendamiento',
  '607': 'Régimen de Enajenación o Adquisición de Bienes',
  '608': 'Demás ingresos',
  '609': 'Consolidación',
  '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
  '611': 'Ingresos por Dividendos (socios y accionistas)',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '614': 'Ingresos por intereses',
  '615': 'Régimen de los ingresos por obtención de premios',
  '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
  '621': 'Incorporación Fiscal',
  '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
  '623': 'Opcional para Grupos de Sociedades',
  '624': 'Coordinados',
  '625': 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626': 'Régimen Simplificado de Confianza'
} as const; 