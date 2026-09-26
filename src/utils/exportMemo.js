import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 pt

function ensureRoom(doc, y, needed = 60) {
  if (y > 780 - needed) {
    doc.addPage();
    return 40;
  }
  return y;
}

function drawSectionTitle(doc, y, text) {
  y = ensureRoom(doc, y, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(text.toUpperCase(), MARGIN, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y + 4, PAGE_WIDTH - MARGIN, y + 4);
  return y + 20;
}

function drawParagraph(doc, y, text, { size = 9.5, color = [60, 60, 60] } = {}) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, PAGE_WIDTH - MARGIN * 2);
  for (const line of lines) {
    y = ensureRoom(doc, y, 16);
    doc.text(line, MARGIN, y);
    y += 13;
  }
  return y + 6;
}

/**
 * Builds a jsPDF document for the given memo data (same shape whether it
 * came from live research or the mock fallback) and triggers a browser
 * download. Every source URL is printed as plain text (not just a hyperlink)
 * so it survives printing to paper, which is still how a lot of memos get
 * read in an IC meeting.
 */
export function downloadMemoPdf(data, { source } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 15, 15);
  doc.text(data.name ?? 'Untitled Company', MARGIN, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${data.sector ?? ''}${data.sector && data.stage ? ' · ' : ''}${data.stage ?? ''}`, MARGIN, y);
  y += 18;

  if (data.pitch) {
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    y = drawParagraph(doc, y, data.pitch, { size: 11, color: [40, 40, 40] });
  }

  const generatedLine =
    source === 'groq+tavily'
      ? `Synthesized from live web search on ${new Date(data.fetchedAt ?? Date.now()).toLocaleString()} — verify figures against the linked sources before acting on them.`
      : 'Illustrative / directional data — not verified research.';
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  y = drawParagraph(doc, y, generatedLine, { size: 8, color: [140, 140, 140] });

  // --- Deal snapshot ---
  if (data.dealSnapshot) {
    const snap = [
      ['Founded', data.dealSnapshot.founded],
      ['HQ', data.dealSnapshot.hq],
      ['Employees', data.dealSnapshot.employees],
      ['Website', data.dealSnapshot.website],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  ·  ');
    if (snap) y = drawParagraph(doc, y, snap, { size: 8.5, color: [110, 110, 110] });
  }

  // --- Investment recommendation ---
  if (data.investmentRecommendation?.verdict) {
    y = drawSectionTitle(doc, y, 'Investment Recommendation');
    y = drawParagraph(
      doc,
      y,
      `${data.investmentRecommendation.verdict.toUpperCase()}${
        data.investmentRecommendation.rationale ? ` — ${data.investmentRecommendation.rationale}` : ''
      }`
    );
  }

  // --- Executive summary ---
  if (data.executiveSummary && data.executiveSummary.length > 0) {
    y = drawSectionTitle(doc, y, 'Executive Summary');
    for (const b of data.executiveSummary) {
      y = drawParagraph(doc, y, `•  ${b}`);
    }
  }

  // --- Key metrics ---
  y = drawSectionTitle(doc, y, 'Key Metrics');
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 4 },
    body: [
      ['Estimated Valuation', data.valuation ?? 'Not found'],
      ['Total Funding Raised', data.totalRaised ?? 'Not found'],
      ['Lead Investors', data.leadInvestors ?? 'Not found'],
      ['Target Market (TAM)', data.tam ?? 'Not found'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 160 } },
  });
  y = doc.lastAutoTable.finalY + 20;

  // --- AI Verdict ---
  y = drawSectionTitle(doc, y, 'AI Verdict');
  y = drawParagraph(doc, y, data.aiVerdict ?? 'No verdict available.');

  if (data.confidence) {
    const confLine = Object.entries(data.confidence)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  ·  ');
    y = drawParagraph(doc, y, `Confidence — ${confLine}`, { size: 8, color: [140, 140, 140] });
  }

  // --- SWOT ---
  const swotSections = data.swot
    ? [
        ['Strengths', data.swot.strengths],
        ['Weaknesses', data.swot.weaknesses],
        ['Opportunities', data.swot.opportunities],
        ['Threats', data.swot.threats],
      ].filter(([, items]) => items && items.length > 0)
    : [];
  if (swotSections.length > 0) {
    y = drawSectionTitle(doc, y, 'SWOT Analysis');
    for (const [label, items] of swotSections) {
      y = drawParagraph(doc, y, `${label}:`, { size: 9.5, color: [40, 40, 40] });
      for (const item of items) {
        y = drawParagraph(doc, y, `  •  ${item}`, { size: 8.5 });
      }
    }
  }

  // --- Competitive moat ---
  if (data.competitiveMoat && data.competitiveMoat.length > 0) {
    y = drawSectionTitle(doc, y, 'Competitive Moat');
    for (const m of data.competitiveMoat) {
      y = drawParagraph(doc, y, `${m.factor} [${(m.strength ?? '').toUpperCase()}]${m.note ? ` — ${m.note}` : ''}`);
    }
  }

  // --- Risk flags ---
  if (data.riskFlags && data.riskFlags.length > 0) {
    y = drawSectionTitle(doc, y, 'Risk Signals');
    for (const f of data.riskFlags) {
      y = drawParagraph(doc, y, `[${(f.severity ?? 'low').toUpperCase()}] ${f.description}${f.url ? ` (${f.url})` : ''}`);
    }
  }

  // --- Funding history ---
  if (data.fundingHistory && data.fundingHistory.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Funding History');
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Round', 'Year', 'Valuation ($B)', 'Raised ($B)']],
      body: data.fundingHistory.map((r) => [r.round, r.year, r.valuation ?? '—', r.raised ?? '—']),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // --- Market sizing ---
  if (data.marketSizing && data.marketSizing.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Market Sizing (TAM / SAM / SOM)');
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Segment', 'Value ($M)']],
      body: data.marketSizing.map((m) => [m.label ?? m.name, m.value]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // --- Unit economics ---
  const econEntries = data.unitEconomics
    ? Object.entries({
        'Gross Margin': data.unitEconomics.grossMargin,
        'Burn Rate': data.unitEconomics.burnRate,
        Runway: data.unitEconomics.runway,
        CAC: data.unitEconomics.cac,
        LTV: data.unitEconomics.ltv,
      }).filter(([, v]) => v)
    : [];
  if (econEntries.length > 0) {
    y = ensureRoom(doc, y, 60);
    y = drawSectionTitle(doc, y, 'Unit Economics');
    y = drawParagraph(doc, y, econEntries.map(([k, v]) => `${k}: ${v}`).join('  ·  '));
  }

  // --- Market trends ---
  if (data.marketTrends && ((data.marketTrends.tailwinds?.length ?? 0) > 0 || (data.marketTrends.headwinds?.length ?? 0) > 0)) {
    y = ensureRoom(doc, y, 60);
    y = drawSectionTitle(doc, y, 'Market Trends');
    for (const t of data.marketTrends.tailwinds ?? []) {
      y = drawParagraph(doc, y, `[Tailwind] ${t}`);
    }
    for (const h of data.marketTrends.headwinds ?? []) {
      y = drawParagraph(doc, y, `[Headwind] ${h}`);
    }
  }

  // --- Comps ---
  if (data.comps && data.comps.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Comparable Companies');
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Company', 'Valuation', 'Revenue', 'EV/Rev', 'Growth', 'Differentiator']],
      body: data.comps.map((c) => [
        c.name,
        c.valuation ?? '—',
        c.revenue ?? '—',
        c.evRev ?? '—',
        c.growth ?? '—',
        c.differentiator ?? '',
      ]),
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 5: { cellWidth: 160 } },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // --- Exit landscape ---
  if (data.exitLandscape && data.exitLandscape.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Exit Landscape');
    for (const e of data.exitLandscape) {
      y = drawParagraph(doc, y, `${e.company} — ${e.outcome}${e.note ? `. ${e.note}` : ''}`);
    }
  }

  // --- Founding team ---
  if (data.team && data.team.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Founding Team');
    for (const m of data.team) {
      y = drawParagraph(doc, y, `${m.name}${m.role ? ` — ${m.role}` : ''}${m.background ? `. ${m.background}` : ''}`);
    }
  }

  // --- Follow-on funding outlook ---
  if (data.followOnOutlook) {
    y = drawSectionTitle(doc, y, 'Follow-on Funding Outlook');
    y = drawParagraph(doc, y, data.followOnOutlook);
  }

  // --- News timeline ---
  if (data.newsTimeline && data.newsTimeline.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Recent Signals');
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Date', 'Type', 'Headline']],
      body: data.newsTimeline.map((e) => [e.date ?? '', e.type ?? '', e.headline]),
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // --- Pegasus Fit scorecard ---
  const fitLabels = {
    team: 'Team & Market Vision',
    techInnovation: 'Technology Innovation',
    financials: 'Financial Trajectory',
    vcaasFit: 'VCaaS / Global-Expansion Fit',
  };
  const fitEntries = data.pegasusFit
    ? Object.entries(fitLabels).filter(([key]) => data.pegasusFit[key])
    : [];
  if (fitEntries.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Pegasus Fit');
    for (const [key, label] of fitEntries) {
      const { score, note } = data.pegasusFit[key];
      y = drawParagraph(doc, y, `${label}: ${score}/100${note ? ` — ${note}` : ''}`);
    }
  }

  // --- Due diligence notes (deep-research-only fields) ---
  const ddFields = [
    ['Business Model & Pricing', data.businessModel],
    ['Tech / IP', data.techDifferentiation],
    ['Team & Hiring', data.teamScale],
    ['Customers & Partnerships', data.customers],
    ['Product Roadmap', data.productRoadmap],
  ].filter(([, value]) => value);
  if (ddFields.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Due Diligence Notes (Deep Research)');
    for (const [label, value] of ddFields) {
      y = drawParagraph(doc, y, `${label}: ${value}`);
    }
  }

  // --- Sources ---
  if (data.sources && data.sources.length > 0) {
    y = ensureRoom(doc, y, 100);
    y = drawSectionTitle(doc, y, 'Sources');
    data.sources.forEach((s, i) => {
      y = drawParagraph(doc, y, `[${i + 1}] ${s.title ?? s.url}\n${s.url}${s.usedFor ? ` — ${s.usedFor}` : ''}`, {
        size: 8.5,
      });
    });
  }

  const filename = `${(data.name ?? 'memo').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-investment-memo.pdf`;
  doc.save(filename);
}
