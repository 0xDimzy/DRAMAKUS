import axios from 'axios';

const sanitizeFilename = (name = 'video.mp4') => {
  const normalized = String(name || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
  if (!normalized) return 'video.mp4';
  return normalized.toLowerCase().endsWith('.mp4') ? normalized : `${normalized}.mp4`;
};

const getContentType = (headers = {}) => {
  const value = headers['content-type'] || headers['Content-Type'] || '';
  return String(value || '').trim() || 'application/octet-stream';
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawUrl = String(req.query?.url || '').trim();
  const filename = sanitizeFilename(String(req.query?.filename || 'episode.mp4'));

  if (!rawUrl) {
    res.status(400).json({ error: 'Missing url' });
    return;
  }

  let parsed;
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

  try {
    const response = await axios.get(parsed.toString(), {
      responseType: 'stream',
      timeout: 120000,
      headers: {
        'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
        referer: parsed.origin,
      },
    });

    res.setHeader('Content-Type', getContentType(response.headers));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    response.data.pipe(res);
  } catch (error) {
    if (error?.response?.status) {
      res.status(error.response.status).json({ error: 'Failed to fetch source file' });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
