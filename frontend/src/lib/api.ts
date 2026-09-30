import { auth } from './firebase';
import * as mocks from './mocks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // If USE_MOCKS is true, we intercept and return mock data
  if (USE_MOCKS) {
    console.log(`[MOCK] Intercepted request to ${endpoint}`, options);
    return mocks.handleMockRequest(endpoint, options);
  }

  const user = auth.currentUser;
  let token = '';
  if (user) {
    token = await user.getIdToken();
  } else if (!USE_MOCKS) {
    const role = localStorage.getItem('mock_role') || 'citizen';
    token = `dev-${role}-token`;
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const devUser = localStorage.getItem('mock_dev_user');
  if (devUser) {
    headers.set('X-Dev-User', devUser);
  }

  // Set default content type if not provided and not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!navigator.onLine) {
    if (options.method && options.method !== 'GET') {
      console.log(`[OFFLINE] Queuing request to ${endpoint}`);
      const { enqueueRequest } = await import('./offlineQueue');
      await enqueueRequest(endpoint, options);
      return { success: true, _queued: true, message: 'Request queued for when online' };
    }
    throw new Error('You are offline. Cannot fetch data.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // Not JSON
    }
    throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
