import { useEffect } from 'react';
import api from '@/lib/api';

/**
 * A custom React hook to ensure the CSRF token cookie is fetched from the backend
 * and set in the browser.
 *
 * This should be used in top-level components or pages that initiate
 * state-changing API requests (e.g., Login, Register) to ensure that
 * subsequent POST, PUT, DELETE requests are authenticated against CSRF.
 */
export const useCsrf = () => {
  useEffect(() => {
    api.get('/csrf-token/').catch((error) => {
      console.error('Failed to fetch CSRF token:', error);
      // This is a critical failure for form submissions.
      // You might want to add global error handling here to notify the user
      // that the application might not be working correctly.
    });
  }, []); // The empty dependency array ensures this effect runs only once on mount.
};