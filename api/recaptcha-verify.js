import axios from 'axios';

const SECRET = process.env.RECAPTCHA_SECRET_KEY || '';
const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  if (!SECRET) {
    res.status(500).json({ ok: false, message: 'reCAPTCHA secret belum diset di server' });
    return;
  }

  const body = parseBody(req.body);
  const token = String(body?.token || '').trim();
  const expectedAction = String(body?.action || 'login').trim();

  if (!token) {
    res.status(400).json({ ok: false, message: 'Token captcha tidak ada' });
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', SECRET);
    params.append('response', token);

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    const data = response?.data || {};
    const success = Boolean(data.success);
    const score = Number(data.score || 0);
    const action = String(data.action || '');

    if (!success) {
      res.status(403).json({ ok: false, message: 'Captcha tidak valid' });
      return;
    }

    if (expectedAction && action && action !== expectedAction) {
      res.status(403).json({ ok: false, score, action, message: 'Captcha action mismatch' });
      return;
    }

    if (!Number.isFinite(score) || score < MIN_SCORE) {
      res.status(403).json({ ok: false, score, action, message: 'Skor captcha terlalu rendah' });
      return;
    }

    res.status(200).json({ ok: true, score, action });
  } catch {
    res.status(500).json({ ok: false, message: 'Gagal verifikasi captcha' });
  }
}

