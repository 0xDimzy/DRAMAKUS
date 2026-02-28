import axios from 'axios';

const API_BASE = 'https://dramabox.dramabos.my.id/api/v1';
const API_KEY = process.env.DRAMABOX_API_KEY || 'A179DA133C8F05A184D12D5823D8062A';

const toPath = (rawPath) => {
  if (Array.isArray(rawPath)) return rawPath.join('/');
  if (typeof rawPath === 'string') return rawPath;
  return '';
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const endpoint = toPath(req.query.path);
    if (!endpoint) {
      res.status(400).json({ error: 'Missing endpoint path' });
      return;
    }

    const params = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key === 'path') return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else if (value !== undefined) params.append(key, String(value));
    });

    const query = params.toString();
    const url = `${API_BASE}/${endpoint}${query ? `?${query}` : ''}`;

    const response = await axios.get(url, {
      timeout: 30000,
      headers: { apikey: API_KEY },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error?.response) {
      res.status(error.response.status).json(error.response.data);
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
