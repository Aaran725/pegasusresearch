import { Router } from 'express';
import { runResearch } from '../services/researchOrchestrator.js';

const router = Router();

const CODE_TO_STATUS = {
  no_evidence: 404,
  search_failed: 502,
  synthesis_failed: 502,
};

router.post('/research', async (req, res) => {
  const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
  if (!company) {
    return res.status(400).json({ error: 'invalid_request', message: 'company is required' });
  }

  try {
    const { memo, researchTrace } = await runResearch(company);
    return res.json({ memo, researchTrace });
  } catch (err) {
    const status = CODE_TO_STATUS[err.code] ?? 500;
    console.error(`[research] ${company}:`, err.message);
    return res.status(status).json({
      error: err.code ?? 'unknown_error',
      message: err.message,
      researchTrace: err.researchTrace ?? [],
    });
  }
});

export default router;
