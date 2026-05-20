/**
 * Resolves turf image URLs.
 * - Cloudinary URLs (https://res.cloudinary.com/...) are returned as-is.
 * - Legacy relative paths (/api/uploads/...) are prefixed with the backend origin.
 * - Legacy absolute URLs with old IPs are healed by extracting the path and prefixing.
 * - Null/undefined returns a placeholder.
 *
 * @param {string} url - The image URL stored in the database.
 * @returns {string} A fully resolved image URL.
 */
export const getImageUrl = (url) => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1518605368461-1e122b5e28cd?auto=format&fit=crop&q=80';
  }

  // Cloudinary or any external HTTPS URL that is NOT a local upload — return as-is
  if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/uploads/')) {
    return url;
  }

  // Legacy: absolute URL pointing to old backend IP with /api/uploads/
  // Extract the relative path and prefix with current backend origin
  if (url.includes('/api/uploads/')) {
    const parts = url.split('/api/uploads/');
    const filename = parts[parts.length - 1];

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const serverOrigin = apiBase.replace(/\/api\/?$/, '');
    return `${serverOrigin}/api/uploads/${filename}`;
  }

  // Relative path without /api/uploads prefix
  if (url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const serverOrigin = apiBase.replace(/\/api\/?$/, '');
    return `${serverOrigin}${url}`;
  }

  return url;
};
