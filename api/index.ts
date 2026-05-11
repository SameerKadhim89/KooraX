import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import yts from 'yt-search';
import admin from 'firebase-admin';

// ─── Firebase Init ───────────────────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    admin.initializeApp({ projectId: 'studio-2208415401-71227' });
  } catch (e) { console.error('Firebase init error:', e); }
}

// ─── League Map ─────────────────────────────────────────────────────────────
const LEAGUES: Record<string, string> = {
  'eng.1':         'الدوري الإنجليزي الممتاز',
  'esp.1':         'الدوري الإسباني',
  'ita.1':         'الدوري الإيطالي',
  'ger.1':         'الدوري الألماني',
  'fra.1':         'الدوري الفرنسي',
  'uefa.champions':'دوري أبطال أوروبا',
  'uefa.europa':   'الدوري الأوروبي',
  'ksa.1':         'دوري روشن السعودي',
  'ned.1':         'الدوري الهولندي',
  'por.1':         'الدوري البرتغالي',
};

const LEAGUES_REV: Record<string, string> = Object.fromEntries(
  Object.entries(LEAGUES).map(([k, v]) => [v, k])
);

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Matches: Live from ESPN ──────────────────────────────────────────────────
app.get('/api/matches', async (req, res) => {
  try {
    const { date } = req.query;
    const dateParam = date ? `&dates=${date}` : '';

    const results = await Promise.allSettled(
      Object.keys(LEAGUES).map(async (leagueId) => {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard?limit=100${dateParam}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) return [];
        const data: any = await r.json();
        return (data.events || []).map((event: any) => {
          const comp   = event.competitions?.[0];
          const home   = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          const away   = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          if (!home || !away) return null;
          const state  = event.status?.type?.state;
          return {
            id:        event.id,
            league:    LEAGUES[leagueId],
            homeTeam:  { id: home.team.id, name: home.team.displayName, logo: home.team.logo, color: 'bg-white' },
            awayTeam:  { id: away.team.id, name: away.team.displayName, logo: away.team.logo, color: 'bg-white' },
            homeScore: parseInt(home.score) || 0,
            awayScore: parseInt(away.score) || 0,
            status:    state === 'in' ? 'live' : state === 'post' ? 'finished' : 'upcoming',
            time:      event.status?.type?.shortDetail || '',
            date:      event.date?.split('T')[0] || '',
            venue:     comp?.venue?.fullName || '',
          };
        }).filter(Boolean);
      })
    );

    const matches = results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    res.json(matches);
  } catch (err) {
    console.error('[/api/matches]', err);
    res.status(500).json([]);
  }
});

// ─── Match Details ────────────────────────────────────────────────────────────
app.get('/api/matches/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1/events/${id}/competitions/${id}/statistics`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.json({ events: [] });
    const data: any = await r.json();

    const getStat = (arr: any[], name: string) =>
      parseInt(arr?.find((s: any) => s.name === name)?.displayValue) || 0;

    const home = data.splits?.categories?.[0]?.stats || [];
    const away = data.splits?.categories?.[1]?.stats || [];

    const stats = {
      possession:    [getStat(home, 'possessionPct'), getStat(away, 'possessionPct')],
      shots:         [getStat(home, 'shots'), getStat(away, 'shots')],
      shotsOnTarget: [getStat(home, 'shotsOnTarget'), getStat(away, 'shotsOnTarget')],
      fouls:         [getStat(home, 'fouls'), getStat(away, 'fouls')],
      corners:       [getStat(home, 'cornerKicks'), getStat(away, 'cornerKicks')],
      yellowCards:   [getStat(home, 'yellowCards'), getStat(away, 'yellowCards')],
      redCards:      [getStat(home, 'redCards'), getStat(away, 'redCards')],
    };

    res.json({ stats, events: [] });
  } catch {
    res.json({ events: [] });
  }
});

// ─── Standings ────────────────────────────────────────────────────────────────
app.get('/api/standings', async (req, res) => {
  try {
    const { league } = req.query;
    const leagueId = LEAGUES_REV[league as string] || 'eng.1';
    const url = `https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.json({ standings: [] });
    const data: any = await r.json();

    const entries = data.standings?.entries || data.children?.[0]?.standings?.entries || [];
    const standings = entries.map((e: any) => ({
      team:  { displayName: e.team.displayName, logos: e.team.logos },
      stats: (e.stats || []).map((s: any) => ({ name: s.name, value: s.value, displayValue: s.displayValue })),
    }));
    res.json({ standings });
  } catch {
    res.json({ standings: [] });
  }
});

// ─── Highlights ────────────────────────────────────────────────────────────────
app.get('/api/highlights', async (req, res) => {
  try {
    const { league } = req.query;
    const query = `ملخص أهداف ${league || 'كرة القدم اليوم'} beIN SPORTS 2025`;
    const r = await yts(query);
    const videos = r.videos.slice(0, 15).map(v => ({
      id:        v.videoId,
      title:     v.title,
      thumbnail: v.thumbnail,
      duration:  v.timestamp,
      views:     v.views?.toLocaleString('ar') || '0',
      videoUrl:  `https://www.youtube.com/embed/${v.videoId}`,
      channel:   v.author?.name || '',
    }));
    res.json(videos);
  } catch {
    res.json([]);
  }
});

// ─── Transfers (AI-Powered from RSS) ─────────────────────────────────────────
app.get('/api/transfers', async (req, res) => {
  try {
    const parser = new Parser();
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent('انتقالات كرة القدم 2025')}&hl=ar&gl=EG&ceid=EG:ar`;
    const rssRes = await fetch(rssUrl, { signal: AbortSignal.timeout(8000) });
    const xml    = await rssRes.text();
    const feed   = await parser.parseString(xml);
    const titles = feed.items.slice(0, 10).map(i => i.title).join('\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json([]);

    const ai     = new GoogleGenerativeAI(apiKey);
    const model  = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      من هذه العناوين الإخبارية، استخرج معلومات الانتقالات الرياضية.
      أعد JSON فقط (بدون أي نص إضافي) بهذا الشكل:
      [{"playerName":"...","fromTeam":"...","toTeam":"...","fee":"...","date":"..."}]
      العناوين:
      ${titles}
    `;
    const result = await model.generateContent(prompt);
    const text   = result.response.text().replace(/```json|```/g, '').trim();
    res.json(JSON.parse(text));
  } catch (err) {
    console.error('[/api/transfers]', err);
    res.json([]);
  }
});

// ─── Vercel Export ────────────────────────────────────────────────────────────
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
