const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() || '';

type RecaptchaVerifyResult = {
  ok: boolean;
  score?: number;
  action?: string;
  message?: string;
};

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<boolean> | null = null;

export const isRecaptchaConfigured = () => Boolean(RECAPTCHA_SITE_KEY);

const loadRecaptchaScript = async () => {
  if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined') return false;
  if (window.grecaptcha) return true;
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    const existing = document.querySelector(`script[data-recaptcha-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.grecaptcha)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaSrc = src;
    script.addEventListener('load', () => resolve(Boolean(window.grecaptcha)));
    script.addEventListener('error', () => resolve(false));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

export const executeRecaptcha = async (action = 'login'): Promise<string | null> => {
  if (!RECAPTCHA_SITE_KEY) return null;
  const ready = await loadRecaptchaScript();
  if (!ready || !window.grecaptcha) return null;

  return new Promise<string | null>((resolve) => {
    try {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action });
          resolve(token || null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
};

export const verifyRecaptchaToken = async (token: string, action = 'login'): Promise<RecaptchaVerifyResult> => {
  if (!token) {
    return { ok: false, message: 'Missing token' };
  }

  try {
    const response = await fetch('/api/recaptcha-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    const data = (await response.json().catch(() => ({}))) as RecaptchaVerifyResult;
    if (!response.ok) {
      return { ok: false, message: data?.message || 'Captcha verification failed' };
    }
    return { ok: Boolean(data.ok), score: data.score, action: data.action, message: data.message };
  } catch {
    return { ok: false, message: 'Captcha verification request failed' };
  }
};

