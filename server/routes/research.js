import { Router } from 'express';
import { runResearch } from '../services/researchOrchestrator.js';
import { getTavilyUsage } from '../services/tavilyClient.js';
import { applyEdits, saveEdits, EDITABLE_FIELDS } from '../services/editsStore.js';

const router = Router();

const CODE_TO_STATUS = {
  no_evidence: 404,
  search_failed: 502,
  synthesis_failed: 502,
  quota_exhausted: 429,
};

const VALID_DEPTHS = new Set(['standard', 'deep']);

router.post('/research', async (req, res) => {
  const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
  const forceRefresh = Boolean(req.body?.forceRefresh);
  const depth = VALID_DEPTHS.has(req.body?.depth) ? req.body.depth : 'standard';
  if (!company) {
    return res.status(400).json({ error: 'invalid_request', message: 'company is required' });
  }

  try {
    const { memo, researchTrace, cached, fetchedAt, stale } = await runResearch(company, { forceRefresh, depth });
    const { memo: finalMemo, editedFields } = applyEdits(company, memo);
    return res.json({ memo: finalMemo, editedFields, researchTrace, cached, fetchedAt, stale: Boolean(stale), depth });
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

// Human-in-the-loop: an analyst overrides/corrects specific fields on an
// already-researched memo. Edits persist independently of the research
// cache, so a later Refresh re-runs search without discarding them.
router.patch('/research/edits', (req, res) => {
  const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
  const edits = req.body?.edits;
  if (!company || typeof edits !== 'object' || edits === null) {
    return res.status(400).json({ error: 'invalid_request', message: 'company and edits are required' });
  }

  const invalidKeys = Object.keys(edits).filter((k) => !EDITABLE_FIELDS.has(k));
  if (invalidKeys.length > 0) {
    return res.status(400).json({
      error: 'invalid_request',
      message: `Field(s) not editable: ${invalidKeys.join(', ')}`,
    });
  }

  const merged = saveEdits(company, edits);
  return res.json({ edits: merged });
});

router.get('/quota', (_req, res) => {
  res.json(getTavilyUsage());
});

export default router;
