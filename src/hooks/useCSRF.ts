import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config';

interface CSRFConfig {
  sessionId: string;
  token: string | null;
  refreshToken: () => Promise<void>;
}

/**
 * Hook para manejar tokens CSRF
 */
export function useCSRF(): CSRFConfig {
  const [sessionId] = useState(() => {
    // Generar ID de sesión único
    return localStorage.getItem('sessionId') || 
           crypto.randomUUID();
  });
  
  const [token, setToken] = useState<string | null>(null);

  // Guardar sessionId en localStorage
  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  // Obtener token CSRF del servidor
  const refreshToken = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
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
        } else {
          console.warn('⚠️ No CSRF token in response headers')
        }
      } else {
        console.error('❌ CSRF token request failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error obteniendo token CSRF:', error);
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
        await refreshToken();
        if (token) {
          headers['X-CSRF-Token'] = token;
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
      await refreshToken();
      
      // Reintentar con nuevo token
      if (token) {
        headers['X-CSRF-Token'] = token;
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