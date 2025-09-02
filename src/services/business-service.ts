import { supabase } from '../utils/supabase.ts';

export interface BusinessFormData {
  name: string;
  type: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  closingHours: string;
  currency: string;
}

export interface CreateBusinessRequest {
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  billingName: string;
  billingAddress?: string;
  taxId?: string;
  taxRegime: string;
  currency: string;
  paymentMethod?: {
    type: 'card';
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
  };
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  settings: {
    currency: string;
    taxRegime: {
      code: string;
      name: string;
      type: string;
    };
    notifications: {
      email: boolean;
      push: boolean;
    };
    timezone: string;
  };
  trial_ends_at?: string;
  subscription_status: string;
}

export class BusinessService {
  /**
   * Crear un nuevo negocio
   */
  static async createBusiness(data: CreateBusinessRequest, authToken?: string): Promise<Business> {
    if (!supabase) {
      throw new Error('Cliente Supabase no inicializado');
    }
    
    // Obtener token de autenticación
    let token = authToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }
      token = session.access_token;
    }

    const response = await fetch('/api/business/activate-trial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el negocio');
    }

    const result = await response.json();
    return result.business;
  }

  /**
   * Obtener el negocio actual del usuario
   */
  static async getCurrentBusiness(authToken?: string): Promise<Business | null> {
    if (!supabase) {
      throw new Error('Cliente Supabase no inicializado');
    }
    
    // Obtener token de autenticación
    let token = authToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return null;
      }
      token = session.access_token;
    }

    // Decodificar el token para obtener el user ID
    try {
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }
      const tokenString = token as string;
      const parts = tokenString.split('.');
      if (parts.length < 2 || !parts[1]) throw new Error('Token inválido');

      const payload = JSON.parse(atob(parts[1]));
      const userId = payload.sub;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_business_id')
        .eq('id', userId)
        .single();

      if (!profile?.current_business_id) {
        return null;
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.current_business_id)
        .single();

      return business;
    } catch (error) {
      console.error('Error decoding token or fetching business:', error);
      return null;
    }
  }

  /**
   * Unirse a un negocio existente usando código de invitación
   */
  static async joinBusiness(businessCode: string, authToken?: string): Promise<Business> {
    if (!supabase) {
      throw new Error('Cliente Supabase no inicializado');
    }
    
    // Obtener token de autenticación
    let token = authToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }
      token = session.access_token;
    }

    const response = await fetch('/api/business/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ businessCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al unirse al negocio');
    }

    const result = await response.json();
    return result.business;
  }

  /**
   * Actualizar el perfil del usuario con el businessId
   */
  static async updateUserBusiness(businessId: string, authToken?: string): Promise<void> {
    if (!supabase) {
      throw new Error('Cliente Supabase no inicializado');
    }
    
    // Obtener token de autenticación
    let token = authToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }
      token = session.access_token;
    }

    // Decodificar el token para obtener el user ID
    try {
      if (!token) {
        throw new Error('Token de autenticación requerido');
      }
      const tokenString = token as string;
      const parts = tokenString.split('.');
      if (parts.length < 2 || !parts[1]) throw new Error('Token inválido');

      const payload = JSON.parse(atob(parts[1]));
      const userId = payload.sub;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          current_business_id: businessId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error('Error al actualizar el perfil del usuario');
      }
    } catch (error) {
      console.error('Error decoding token or updating profile:', error);
      throw new Error('Error al actualizar el perfil del usuario');
    }
  }

  /**
   * Convertir datos del formulario a formato de API
   */
  static convertFormDataToAPI(formData: BusinessFormData): CreateBusinessRequest {
    const result: CreateBusinessRequest = {
      businessName: formData.name,
      businessEmail: formData.email,
      billingName: formData.name, // Usar el nombre del negocio como facturación
      taxRegime: '605', // Régimen fiscal por defecto
      currency: formData.currency,
    };

    if (formData.phone) {
      result.businessPhone = formData.phone;
    }
    if (formData.address) {
      result.businessAddress = formData.address;
      result.billingAddress = formData.address;
    }

    return result;
  }
} 