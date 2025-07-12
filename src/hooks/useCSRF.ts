import { useEffect, useState } from 'react';

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

      const response = await fetch('/api/auth/csrf/token', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const newToken = response.headers.get('X-CSRF-Token');
        if (newToken) {
          setToken(newToken);
        }
      }
    } catch (error) {
      console.error('Error obteniendo token CSRF:', error);
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
      } else {
        // Si no hay token, intentar obtener uno nuevo
        await refreshToken();
        if (token) {
          headers['X-CSRF-Token'] = token;
        }
      }
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Si el token expiró, refrescar y reintentar
    if (response.status === 403 && 
        response.headers.get('X-CSRF-Expired') === 'true') {
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