import { Router } from 'express';
import { listPortfolio, addToPortfolio, removeFromPortfolio } from '../services/portfolioStore.js';

const router = Router();

router.get('/portfolio', (_req, res) => {
  res.json({ items: listPortfolio() });
});

router.post('/portfolio', (req, res) => {
  const { name, sector, stage, valuation, tam, logoInitial } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'name is required' });
  }
  const items = addToPortfolio({
    name: name.trim(),
    sector: sector ?? null,
    stage: stage ?? null,
    valuation: valuation ?? null,
    tam: tam ?? null,
    logoInitial: logoInitial ?? name.trim()[0]?.toUpperCase(),
  });
  res.json({ items });
});

router.delete('/portfolio/:name', (req, res) => {
  const items = removeFromPortfolio(decodeURIComponent(req.params.name));
  res.json({ items });
});

export default router;
