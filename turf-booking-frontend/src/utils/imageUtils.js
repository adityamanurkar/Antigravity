export const FALLBACK_TURF_IMAGE_URL = 'https://images.unsplash.com/photo-1518605368461-1e122b5e28cd?auto=format&fit=crop&q=80';

const getServerOrigin = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  return apiBase.replace(/\/api\/?$/, '');
};

/**
 * Resolves any image URL format from the backend into a fully-qualified URL.
 *
 * Handles:
 *  - Full Cloudinary / external https:// URLs  → returned as-is
 *  - /api/uploads/filename paths               → prefixed with backend origin
 *  - api/uploads/filename (no leading slash)   → prefixed with backend origin
 *  - uploads/filename                          → prefixed with backend origin
 *  - null / undefined / empty string           → fallback image
 *  - JSON-stringified arrays e.g. '["url"]'   → first element extracted
 */
export const getImageUrl = (url) => {
  if (!url) return FALLBACK_TURF_IMAGE_URL;

  let trimmed = typeof url === 'string' ? url.trim() : String(url).trim();

  // Handle JSON-stringified arrays stored as a string (e.g. '["http://..."]')
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        trimmed = String(parsed[0]).trim();
      } else {
        return FALLBACK_TURF_IMAGE_URL;
      }
    } catch {
      return FALLBACK_TURF_IMAGE_URL;
    }
  }

  if (!trimmed) return FALLBACK_TURF_IMAGE_URL;

  // Already a fully-qualified URL (Cloudinary, S3, external, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const origin = getServerOrigin();

  // /api/uploads/... or any absolute path
  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }

  // api/uploads/... or uploads/... (no leading slash)
  if (trimmed.startsWith('api/uploads/') || trimmed.startsWith('uploads/')) {
    const filename = trimmed.replace(/^api\/uploads\//, '').replace(/^uploads\//, '');
    return `${origin}/api/uploads/${filename}`;
  }

  // Bare filename — assume uploads folder
  return `${origin}/api/uploads/${trimmed}`;
};

export const handleImageError = (event) => {
  if (event.currentTarget.src !== FALLBACK_TURF_IMAGE_URL) {
    event.currentTarget.src = FALLBACK_TURF_IMAGE_URL;
  }
};
