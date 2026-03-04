import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const DRAMABOX_API_BASE = 'https://dramabox.dramabos.my.id/api/v1';
const MELOLO_API_BASE = 'https://melolo.dramabos.my.id/api';
const NETSHORT_API_BASE = 'https://netshort.dramabos.my.id/api';
const REELIFE_API_BASE = 'https://reelife.dramabos.my.id/api/v1';
const API_KEY = process.env.DRAMABOX_API_KEY || 'A179DA133C8F05A184D12D5823D8062A';

app.use(express.json());

app.post('/api/recaptcha-verify', async (req, res) => {
  const secret = String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
  if (!secret) {
    res.status(500).json({ ok: false, message: 'reCAPTCHA secret belum diset di server' });
    return;
  }

  const token = String(req.body?.token || '').trim();
  const expectedAction = String(req.body?.action || 'login').trim();
  if (!token) {
    res.status(400).json({ ok: false, message: 'Token captcha tidak ada' });
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
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
    if (!Number.isFinite(score) || score < minScore) {
      res.status(403).json({ ok: false, score, action, message: 'Skor captcha terlalu rendah' });
      return;
    }

    res.status(200).json({ ok: true, score, action });
  } catch (error: any) {
    console.error('[reCAPTCHA Verify] Error:', error?.message || error);
    res.status(500).json({ ok: false, message: 'Gagal verifikasi captcha' });
  }
});

app.get('/api/download', async (req, res) => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    const rawFilename = String(req.query.filename || 'episode.mp4').trim();
    const filename = (rawFilename || 'episode.mp4')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ');

    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'Invalid url' });
      return;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Unsupported protocol' });
      return;
    }

    const response = await axios.get(parsed.toString(), {
      responseType: 'stream',
      timeout: 120000,
      headers: {
        'user-agent': String(req.headers['user-agent'] || 'Mozilla/5.0'),
        referer: parsed.origin,
      },
    });

    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename.toLowerCase().endsWith('.mp4') ? filename : `${filename}.mp4`}"`);
    res.setHeader('Cache-Control', 'no-store');
    response.data.pipe(res);
  } catch (error: any) {
    console.error('[Download Proxy] Error:', error?.message || error);
    if (error?.response?.status) {
      res.status(error.response.status).json({ error: 'Failed to fetch source file' });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API Proxy Routes for Dramabox
app.get('/api/proxy/*', async (req, res) => {
  try {
    const endpoint = req.params[0];
    const query = new URLSearchParams(req.query as any).toString();
    const url = `${DRAMABOX_API_BASE}/${endpoint}${query ? `?${query}` : ''}`;

    console.log(`[Proxy Dramabox] Forwarding to: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'apikey': API_KEY
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('[Proxy Dramabox] Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// API Proxy Routes for Melolo
app.get('/api/melolo/*', async (req, res) => {
  try {
    const endpoint = req.params[0];
    const params = new URLSearchParams(req.query as any);
    // Ensure code is present for Melolo
    if (!params.has('code')) {
      params.append('code', API_KEY);
    }
    const query = params.toString();
    const url = `${MELOLO_API_BASE}/${endpoint}${query ? `?${query}` : ''}`;

    console.log(`[Proxy Melolo] Forwarding to: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'apikey': API_KEY
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('[Proxy Melolo] Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// API Proxy Routes for NetShort
app.get('/api/netshort/*', async (req, res) => {
  try {
    const endpoint = req.params[0];
    const params = new URLSearchParams(req.query as any);
    // NetShort watch endpoint requires code
    if (endpoint.startsWith('watch/') && !params.has('code')) {
      params.append('code', API_KEY);
    }
    const query = params.toString();
    const url = `${NETSHORT_API_BASE}/${endpoint}${query ? `?${query}` : ''}`;

    console.log(`[Proxy NetShort] Forwarding to: ${url}`);

    // NetShort public listing endpoints work without apikey header.
    // Keep this proxy as close as possible to the original public API behavior.
    const response = await axios.get(url);

    res.json(response.data);
  } catch (error: any) {
    console.error('[Proxy NetShort] Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// API Proxy Routes for Reelife
app.get('/api/reelife/*', async (req, res) => {
  try {
    const endpoint = req.params[0];
    const params = new URLSearchParams(req.query as any);

    // Reelife play and book episode endpoints may require code param
    if ((endpoint.startsWith('play/') || endpoint.includes('/episode/')) && !params.has('code')) {
      params.append('code', API_KEY);
    }

    const query = params.toString();
    const url = `${REELIFE_API_BASE}/${endpoint}${query ? `?${query}` : ''}`;

    console.log(`[Proxy Reelife] Forwarding to: ${url}`);

    const response = await axios.get(url);

    res.json(response.data);
  } catch (error: any) {
    console.error('[Proxy Reelife] Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
