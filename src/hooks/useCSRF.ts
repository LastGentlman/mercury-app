import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.ts';
import { generateUUID } from '../lib/utils.ts';
import { supabase } from '../utils/supabase.ts';

interface CSRFConfig {
  sessionId: string;
  token: string | null;
  refreshToken: () => Promise<string | null>;
}

// =========================
// Shared CSRF Manager (Singleton)
// =========================
let sharedSessionId: string | null = null;
let sharedToken: string | null = null;
let sharedIsRefreshing = false;
let sharedLastRefreshTime = 0;
let sharedPendingPromise: Promise<string | null> | null = null;
const CSRF_REFRESH_THROTTLE_MS = 5000;

function getSharedSessionId(): string {
  if (sharedSessionId) return sharedSessionId;
  const existing = (typeof window !== 'undefined') ? localStorage.getItem('sessionId') : null;
  sharedSessionId = existing || generateUUID();
  if (typeof window !== 'undefined') {
    localStorage.setItem('sessionId', sharedSessionId);
  }
  return sharedSessionId;
}

async function refreshCSRFTokenSingleton(): Promise<string | null> {
  const now = Date.now();

  // Global throttle and concurrent call coalescing
  if (sharedIsRefreshing || (now - sharedLastRefreshTime < CSRF_REFRESH_THROTTLE_MS)) {
    if (sharedPendingPromise) {
      console.log('⏳ CSRF token refresh coalesced to pending promise');
      return sharedPendingPromise;
    }
    console.log('⏳ CSRF token refresh throttled (singleton)');
    return sharedToken;
  }

  sharedIsRefreshing = true;
  sharedLastRefreshTime = now;

  sharedPendingPromise = (async () => {
    try {
      let authToken = (typeof window !== 'undefined') ? localStorage.getItem('authToken') : null;

      if (!authToken && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting Supabase session for CSRF (singleton):', error);
            return sharedToken; // keep previous if any
          } else if (session?.access_token) {
            authToken = session.access_token;
            console.log('✅ Using Supabase session token for CSRF request');
          } else {
            console.log('⚠️ No valid Supabase session found for CSRF request');
            return sharedToken; // no change
          }
        } catch (error) {
          console.error('Error accessing Supabase session for CSRF (singleton):', error);
          return sharedToken;
        }
      }

      if (!authToken) {
        console.log('⚠️ No auth token available for CSRF request (singleton)');
        return sharedToken;
      }

      const headers: Record<string, string> = { 'X-Session-ID': getSharedSessionId() };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      console.log('🔄 Fetching CSRF token from:', `${BACKEND_URL}/api/auth/csrf/token`);
      console.log('📋 CSRF request headers:', headers);

      const response = await fetch(`${BACKEND_URL}/api/auth/csrf/token`, {
        method: 'GET',
        headers
      });

      console.log('📡 CSRF response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        console.error('❌ CSRF token request failed:', response.status, response.statusText);
        return sharedToken;
      }

      const newToken = response.headers.get('X-CSRF-Token');
      if (newToken) {
        console.log('✅ CSRF token received:', newToken.substring(0, 8) + '...');
        sharedToken = newToken;
      } else {
        console.warn('⚠️ No CSRF token in response headers');
      }

      return sharedToken;
    } catch (error) {
      console.error('❌ Error obteniendo token CSRF (singleton):', error);
      return sharedToken;
    } finally {
      sharedIsRefreshing = false;
      sharedPendingPromise = null;
    }
  })();

  return sharedPendingPromise;
}

/**
 * Hook para manejar tokens CSRF
 */
export function useCSRF(): CSRFConfig {
  const [sessionId] = useState(() => getSharedSessionId());
  
  const [token, setToken] = useState<string | null>(sharedToken);

  // Guardar sessionId en localStorage
  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  // Obtener token CSRF del servidor con throttling
  const refreshToken = async (): Promise<string | null> => {
    const newToken = await refreshCSRFTokenSingleton();
    if (newToken && newToken !== token) setToken(newToken);
    return newToken || null;
  };

  // ✅ Lazy strategy: Do NOT prefetch CSRF on mount; only fetch on demand for mutating requests
  useEffect(() => {
    // Keep local state in sync if another instance refreshed the token
    if (sharedToken && sharedToken !== token) {
      setToken(sharedToken);
    }
  }, [token]);

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
    let authToken = localStorage.getItem('authToken');
    
    // ✅ FIX: If no auth token in localStorage, try to get from Supabase session
    if (!authToken && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.access_token) {
          authToken = session.access_token;
          console.log('✅ Using Supabase session token for request');
        }
      } catch (error) {
        console.error('Error getting Supabase session for request:', error);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
      ...(options.headers as Record<string, string>)
    };
    
    // ✅ FIX: Only include Authorization if we have a valid token
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      console.log('⚠️ No auth token available for request to:', url);
      // Return a mock 401 response to prevent the request from being made
      return new Response(JSON.stringify({ error: 'No authentication token available' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agregar token CSRF SOLO para métodos que modifican datos
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