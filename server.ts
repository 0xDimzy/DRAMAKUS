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
