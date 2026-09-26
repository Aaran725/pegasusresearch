import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import researchRouter from './routes/research.js';
import portfolioRouter from './routes/portfolio.js';
import trendsRouter from './routes/trends.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    groqKeysConfigured: [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(
      Boolean
    ).length,
    tavilyConfigured: Boolean(process.env.TAVILY_API_KEY),
  });
});

app.use('/api', researchRouter);
app.use('/api', portfolioRouter);
app.use('/api', trendsRouter);

// In production, this server also serves the built frontend so there's a
// single process to deploy. In dev, Vite's own server handles the frontend
// and proxies /api/* here instead (see vite.config.js).
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist');
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Pegasus Analyst AI API server listening on http://localhost:${PORT}`);
});
