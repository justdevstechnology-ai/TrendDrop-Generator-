import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Central State Matrix Architecture
export const CoreState = {
  authMode: 'signUp',
  pendingStorePayload: null,
  authRunning: false,
  creatingStore: false
};

/**
 * Validates product parameters to prevent numeric inversion attacks
 */
export function validateProductCatalog() {
  const products = [];
  const names = document.querySelectorAll('.prod-name');
  const prices = document.querySelectorAll('.prod-price');
  
  names.forEach((el, i) => {
    const pName = el.value.trim();
    if (pName) {
      const pPrice = Number(prices[i].value.trim());
      if (Number.isNaN(pPrice) || pPrice <= 0 || pPrice > 10000000) {
        throw new Error(`Invalid price for "${pName}". Must be a positive number under 10,000,000.`);
      }
      products.push({ name: pName, price: pPrice });
    }
  });
  return products;
}

/**
 * Validates metadata strings, social media links, and hardware contacts
 */
export function validateStoreMetadata() {
  const businessName = document.getElementById('bizName').value.trim();
  if (businessName.length < 3 || businessName.length > 100) {
    throw new Error('Business name must be between 3 and 100 characters.');
  }

  const whatsapp = document.getElementById('bizWhatsapp').value.replace(/\D/g, '');
  if (whatsapp.length < 10 || whatsapp.length > 15) {
    throw new Error('Please enter a valid WhatsApp number (10-15 digits).');
  }

  const videoUrl = document.getElementById('bizVideoUrl').value.trim();
  if (videoUrl) {
    try { new URL(videoUrl); } catch (_) { throw new Error('Cinematic Video field must be a valid, fully-formed URL.'); }
  }

  const fbUrl = document.getElementById('bizFacebook').value.trim();
  if (fbUrl) {
    try { new URL(fbUrl); } catch (_) { throw new Error('Facebook Link must be a valid, fully-formed URL.'); }
  }

  return { businessName, whatsapp, videoUrl, fbUrl };
}

/**
 * Password validation rule engine
 */
export function checkPasswordStrength(password) {
  if (password.length < 10) return "Password must be at least 10 characters long.";
  if (!/[A-Z]/.test(password)) return "Password requires at least one uppercase letter (A-Z).";
  if (!/[a-z]/.test(password)) return "Password requires at least one lowercase letter (a-z).";
  if (!/[0-9]/.test(password)) return "Password requires at least one number (0-9).";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password requires at least one special symbol character.";
  return null;
}

/**
 * Secure Native Client Fallback Router
 */
export const supabaseAuthProxy = {
  getUser: async () => {
    if (window.supabase) return await window.supabase.auth.getUser();
    return { data: { user: null } };
  },
  
  signUp: async (email, password) => {
    if (window.supabase) return await window.supabase.auth.signUp({ email, password });
    return await executeNativeFetch('signup', { email, password });
  },
  
  signIn: async (email, password) => {
    if (window.supabase) return await window.supabase.auth.signInWithPassword({ email, password });
    return await executeNativeFetch('token?grant_type=password', { email, password });
  },
  
  resetPassword: async (email) => {
    if (window.supabase) return await window.supabase.auth.resetPasswordForEmail(email);
    // Explicit recovery structure pointing to cloud authentication schemas
    return await executeNativeFetch('recover', { email });
  }
};

async function executeNativeFetch(endpoint, bodyData) {
  try {

    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(bodyData)
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        data: {
          user: null,
          session: null
        },
        error: data
      };
    }

    return {
      data: {
        user: data.user || null,
        session: data
      },
      error: null
    };

  } catch (err) {

    return {
      data: {
        user: null,
        session: null
      },
      error: err
    };

  }
}

/**
 * Dispatches verified schema objects to Supabase storage networks
 */
export async function deployStoreNode(payload) {
  if (CoreState.creatingStore) return;
  CoreState.creatingStore = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {

    let accessToken = "";

    if (window.supabase) {
      const {
        data: { session }
      } = await window.supabase.auth.getSession();

      accessToken = session?.access_token || "";
    }

    const headers = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Prefer": "return=representation"
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/merchant_stores`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || result.error || "Failed to create store.");
    }

    CoreState.pendingStorePayload = null;

    return result[0];

  } finally {
    clearTimeout(timeoutId);
    CoreState.creatingStore = false;
  }
}

/**
 * Warns user if optimized image exceeds the baseline threshold architecture 
 */
export function showSizeWarning(originalSize, optimizedSize) {
  if (optimizedSize > 5 * 1024 * 1024) {
    alert(
`⚠️ Optimization Complete

Original:
${(originalSize / 1024 / 1024).toFixed(2)} MB

Optimized:
${(optimizedSize / 1024 / 1024).toFixed(2)} MB

Your image was successfully optimized but remains above our recommended 5 MB limit.

Store creation can continue.`
    );
  }
}

/**
 * Image Processor Pipeline - Normalizes source assets into memory-efficient WebP blobs
 */
export async function optimizeImage(file) {
  const canvas = document.createElement('canvas');
  const img = new Image();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = e => {
      img.onload = () => {
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
        blob => {
        if (!blob) {
        reject(new Error('Image optimization failed.'));
        return;
        }
        resolve(blob);
          
        },
        'image/webp',
        0.8
        );
      };
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
