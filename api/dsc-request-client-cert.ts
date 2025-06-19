import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.json({
    message: 'Client certificate authentication endpoint',
    requestsCert: true,
    timestamp: new Date().toISOString()
  });
}
