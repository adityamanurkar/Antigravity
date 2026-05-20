/**
 * Resolves turf images dynamically by prepending the active backend API origin.
 * Automatically parses and heals legacy absolute URLs stored in the database with outdated IPs/domains.
 *
 * @param {string} url - The image URL or path stored in the database.
 * @returns {string} The fully qualified absolute URL for the image.
 */
export const getImageUrl = (url) => {
  if (!url) {
    // Premium unsplash placeholder
    return 'https://images.unsplash.com/photo-1518605368461-1e122b5e28cd?auto=format&fit=crop&q=80';
  }

  // If it's an external URL and not a local upload, return it as-is
  if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/uploads/')) {
    return url;
  }

  // Extract the relative upload path (/api/uploads/filename)
  let relativePath = url;
  if (url.includes('/api/uploads/')) {
    const parts = url.split('/api/uploads/');
    relativePath = `/api/uploads/${parts[parts.length - 1]}`;
  } else if (!url.startsWith('/')) {
    relativePath = `/api/uploads/${url}`;
  }

  // Get dynamic API base URL from environment config
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  
  // Extract backend server origin (e.g., "http://localhost:8080") by removing trailing "/api"
  const serverOrigin = apiBase.replace(/\/api\/?$/, '');

  return `${serverOrigin}${relativePath}`;
};
