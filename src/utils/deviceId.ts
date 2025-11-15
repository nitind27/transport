/**
 * Generate a unique device identifier based on browser fingerprinting
 * Since we can't access MAC address in browser, we use a combination of:
 * - User Agent
 * - Screen resolution
 * - Timezone
 * - Language
 * - Hardware concurrency
 * - Local storage availability
 */

export const getDeviceId = (): string => {
  // Check if we already have a device ID stored
  if (typeof window !== 'undefined') {
    const storedDeviceId = localStorage.getItem('device_id');
    if (storedDeviceId) {
      return storedDeviceId;
    }
  }

  // Generate a new device ID
  const deviceFingerprint = generateDeviceFingerprint();
  
  // Store it in localStorage for future use
  if (typeof window !== 'undefined') {
    localStorage.setItem('device_id', deviceFingerprint);
  }
  
  return deviceFingerprint;
};

const generateDeviceFingerprint = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: generate a random ID
    return `server-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  const components: string[] = [];

  // User Agent
  components.push(navigator.userAgent || 'unknown');

  // Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth || 24}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown');

  // Language
  components.push(navigator.language || 'unknown');

  // Hardware concurrency (CPU cores)
  components.push(`${navigator.hardwareConcurrency || 0}`);

  // Platform
  components.push(navigator.platform || 'unknown');

  // Canvas fingerprint (simple version)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      components.push(canvas.toDataURL().substring(0, 50));
    }
  } catch{
    // Canvas not available
  }

  // Combine all components and create a hash
  const combined = components.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string and add timestamp for uniqueness
  const hexHash = Math.abs(hash).toString(16);
  const timestamp = Date.now().toString(36);
  
  return `device-${hexHash}-${timestamp}`;
};

/**
 * Get device ID from localStorage or generate new one
 */
export const getOrCreateDeviceId = (): string => {
  return getDeviceId();
};

