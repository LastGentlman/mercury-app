import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.ts';
import { generateUUID } from '../lib/utils.ts';
import { supabase } from '../utils/supabase.ts';

interface CSRFConfig {
  sessionId: string;
  token: string | null;
  refreshToken: () => Promise<string | null>;
}

/**
 * Hook para manejar tokens CSRF
 */
export function useCSRF(): CSRFConfig {
  const [sessionId] = useState(() => {
    // Generar ID de sesión único
    return localStorage.getItem('sessionId') || 
           generateUUID();
  });
  
  const [token, setToken] = useState<string | null>(null);

  // Guardar sessionId en localStorage
  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  // Obtener token CSRF del servidor
  const refreshToken = async (): Promise<string | null> => {
    try {
      let authToken = localStorage.getItem('authToken');
      
      // Si no hay token en localStorage, intentar obtener de Supabase (OAuth users)
      if (!authToken && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting Supabase session for CSRF:', error);
          } else if (session?.access_token) {
            authToken = session.access_token;
            console.log('✅ Using Supabase session token for CSRF request');
          }
        } catch (error) {
          console.error('Error accessing Supabase session for CSRF:', error);
        }
      }
      
      const headers: Record<string, string> = {
        'X-Session-ID': sessionId,
      };
      
      // Solo incluir Authorization si hay un token de autenticación
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('🔄 Fetching CSRF token from:', `${BACKEND_URL}/api/auth/csrf/token`)
      console.log('📋 CSRF request headers:', headers)

      const response = await fetch(`${BACKEND_URL}/api/auth/csrf/token`, {
        method: 'GET',
        headers
      });

      console.log('📡 CSRF response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const newToken = response.headers.get('X-CSRF-Token');
        if (newToken) {
          console.log('✅ CSRF token received:', newToken.substring(0, 8) + '...')
          setToken(newToken);
          return newToken;
        } else {
          console.warn('⚠️ No CSRF token in response headers')
          return null;
        }
      } else {
        console.error('❌ CSRF token request failed:', response.status, response.statusText)
        return null;
      }
    } catch (error) {
      console.error('❌ Error obteniendo token CSRF:', error);
      return null;
    }
  };

  // Obtener token inicial
  useEffect(() => {
    refreshToken();
  }, []);

  return {
    sessionId,
    token,
    refreshToken
  };
}

/**
 * Hook para hacer peticiones con CSRF
 */
export function useCSRFRequest() {
  const { sessionId, token, refreshToken } = useCSRF();

  const csrfRequest = async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const authToken = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      ...(options.headers as Record<string, string>)
    };
    
    // Solo incluir Authorization si hay un token de autenticación
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Agregar token CSRF para métodos que modifican datos
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
      if (token) {
        headers['X-CSRF-Token'] = token;
        console.log('🔒 Using existing CSRF token for', options.method, url)
      } else {
        // Si no hay token, intentar obtener uno nuevo
        console.log('🔄 No CSRF token available, fetching new one...')
        const newToken = await refreshToken();
        if (newToken) {
          headers['X-CSRF-Token'] = newToken;
          console.log('✅ Using new CSRF token for', options.method, url)
        } else {
          console.warn('⚠️ Still no CSRF token available after refresh')
        }
      }
    }

    console.log('📤 Making request to:', url)
    console.log('📋 Request headers:', headers)

    const response = await fetch(url, {
      ...options,
      headers
    });

    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    // Si el token expiró, refrescar y reintentar
    if (response.status === 403 && 
        response.headers.get('X-CSRF-Expired') === 'true') {
      console.log('🔄 CSRF token expired, refreshing and retrying...')
      const newToken = await refreshToken();
      
      // Reintentar con nuevo token
      if (newToken) {
        headers['X-CSRF-Token'] = newToken;
        console.log('🔄 Retrying request with new CSRF token...');
        return fetch(url, {
          ...options,
          headers
        });
      }
    }

    return response;
  };

  return { csrfRequest, token, refreshToken };
} 