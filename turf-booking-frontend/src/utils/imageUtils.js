export const FALLBACK_TURF_IMAGE_URL = 'https://images.unsplash.com/photo-1518605368461-1e122b5e28cd?auto=format&fit=crop&q=80';

const getServerOrigin = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  return apiBase.replace(/\/api\/?$/, '');
};

export const getImageUrl = (url) => {
  if (!url) {
    return FALLBACK_TURF_IMAGE_URL;
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.includes('/api/uploads/')) {
    const parts = trimmedUrl.split('/api/uploads/');
    const filename = parts[parts.length - 1];
    return `${getServerOrigin()}/api/uploads/${filename}`;
  }

  if (trimmedUrl.startsWith('api/uploads/') || trimmedUrl.startsWith('uploads/')) {
    const filename = trimmedUrl.replace(/^api\/uploads\//, '').replace(/^uploads\//, '');
    return `${getServerOrigin()}/api/uploads/${filename}`;
  }

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('/')) {
    return `${getServerOrigin()}${trimmedUrl}`;
  }

  return trimmedUrl;
};

export const handleImageError = (event) => {
  if (event.currentTarget.src !== FALLBACK_TURF_IMAGE_URL) {
    event.currentTarget.src = FALLBACK_TURF_IMAGE_URL;
  }
};
