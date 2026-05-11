console.log("Server file loaded");
import express from "express";
import cors from "cors";
import path from "path";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import yts from 'yt-search';
import admin from "firebase-admin";
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
try {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: firebaseConfig.projectId });
  }
} catch (error) { console.error("Firebase Admin Error:", error); }

const firestore = admin.firestore();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Expanded League Map for better coverage
const LEAGUE_MAP: Record<string, string> = {
  'eng.1': 'الدوري الإنجليزي الممتاز',
  'esp.1': 'الدوري الإسباني',
  'ita.1': 'الدوري الإيطالي',
  'ger.1': 'الدوري الألماني',
  'fra.1': 'الدوري الفرنسي',
  'uefa.champions': 'دوري أبطال أوروبا',
  'uefa.europa': 'الدوري الأوروبي',
  'ksa.1': 'دوري روشن السعودي',
  'afc.champions': 'دوري أبطال آسيا',
  'fifa.world': 'كأس العالم',
  'ned.1': 'الدوري الهولندي',
  'por.1': 'الدوري البرتغالي',
  'usa.1': 'الدوري الأمريكي'
};

// --- API Endpoints ---

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// 1. Matches Endpoint (Real-time from ESPN)
app.get("/api/matches", async (req, res) => {
  try {
    const { date } = req.query;
    const dateParam = date ? `&dates=${date}` : '';
    const leagues = Object.keys(LEAGUE_MAP);
    
    const promises = leagues.map(async (league) => {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?limit=100${dateParam}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json() as any;
        
        return (data.events || []).map((event: any) => {
          const comp = event.competitions[0];
          const home = comp.competitors.find((c: any) => c.homeAway === 'home');
          const away = comp.competitors.find((c: any) => c.homeAway === 'away');
          
          return {
            id: event.id,
            league: LEAGUE_MAP[league],
            homeTeam: { id: home.team.id, name: home.team.displayName, logo: home.team.logo, color: 'bg-white' },
            awayTeam: { id: away.team.id, name: away.team.displayName, logo: away.team.logo, color: 'bg-white' },
            homeScore: parseInt(home.score) || 0,
            awayScore: parseInt(away.score) || 0,
            status: event.status.type.state === 'in' ? 'live' : (event.status.type.state === 'post' ? 'finished' : 'upcoming'),
            time: event.status.type.shortDetail,
            date: event.date.split('T')[0],
            venue: comp.venue?.fullName
          };
        });
      } catch { return []; }
    });

    const results = await Promise.all(promises);
    res.json(results.flat());
  } catch (error) { res.status(500).json([]); }
});

// 2. Match Details (Lineups, Stats, Timeline)
app.get("/api/matches/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    // We try to find the league for this match by checking scoreboard or just using a generic soccer summary
    // ESPN summary usually works with just the event ID
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${id}`;
    const response = await fetch(url);
    const data = await response.json() as any;

    const comp = data.header?.competitions?.[0];
    const statsRaw = data.statistics || [];
    
    // Extract Stats
    const stats = {
      possession: [50, 50],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      fouls: [0, 0],
      corners: [0, 0]
    };

    if (statsRaw.length > 0) {
        const homeStats = statsRaw[0].statistics;
        const awayStats = statsRaw[1].statistics;
        const findStat = (list: any[], name: string) => parseInt(list.find((s: any) => s.name === name)?.displayValue) || 0;
        
        stats.possession = [findStat(homeStats, 'possessionPercentage'), findStat(awayStats, 'possessionPercentage')];
        stats.shots = [findStat(homeStats, 'totalShots'), findStat(awayStats, 'totalShots')];
        stats.shotsOnTarget = [findStat(homeStats, 'shotsOnTarget'), findStat(awayStats, 'shotsOnTarget')];
        stats.fouls = [findStat(homeStats, 'foulsCommitted'), findStat(awayStats, 'foulsCommitted')];
        stats.corners = [findStat(homeStats, 'cornerKicks'), findStat(awayStats, 'cornerKicks')];
    }

    // Extract Events
    const events = (data.keyEvents || []).map((e: any) => ({
      id: e.id,
      minute: e.clock?.displayValue,
      type: e.type?.text?.toLowerCase().includes('goal') ? 'goal' : 'commentary',
      description: e.text,
      playerName: e.participants?.[0]?.athlete?.displayName
    }));

    res.json({ stats, events });
  } catch (error) { res.json({ events: [] }); }
});

// 3. Standings
app.get("/api/standings", async (req, res) => {
  try {
    const { league } = req.query;
    const revMap: Record<string, string> = Object.fromEntries(Object.entries(LEAGUE_MAP).map(([k, v]) => [v, k]));
    const leagueId = revMap[league as string] || 'eng.1';
    
    const response = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings`);
    const data = await response.json() as any;
    const entries = data.standings?.entries || data.children?.[0]?.standings?.entries || [];
    
    const standings = entries.map((e: any) => ({
      team: { displayName: e.team.displayName, logos: e.team.logos },
      stats: e.stats.map((s: any) => ({ name: s.name, value: s.value }))
    }));
    
    res.json({ standings, isGrouped: false });
  } catch { res.json({ standings: [] }); }
});

// 4. Highlights (Real Search)
app.get("/api/highlights", async (req, res) => {
  try {
    const { league } = req.query;
    const query = `ملخص أهداف ${league || 'مباريات اليوم'} beIN SPORTS`;
    const r = await yts(query);
    res.json(r.videos.slice(0, 15).map(v => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.timestamp,
      views: v.views.toLocaleString(),
      videoUrl: `https://www.youtube.com/embed/${v.videoId}`,
      channel: v.author.name
    })));
  } catch { res.json([]); }
});

// 5. Transfers (AI Powered)
app.get("/api/transfers", async (req, res) => {
    try {
      const parser = new Parser();
      const rssUrl = 'https://news.google.com/rss/search?q=%D8%A7%D9%86%D8%AA%D9%82%D8%A7%D9%84%D8%A7%D8%AA+%D9%83%D8%B1%D8%A9+%D8%A7%D9%84%D9%82%D8%AF%D9%85+%D8%B1%D8%B3%D9%85%D9%8A%D8%A7&hl=ar&gl=EG&ceid=EG:ar';
      const rssRes = await fetch(rssUrl);
      const xml = await rssRes.text();
      const feed = await parser.parseString(xml);
      const titles = feed.items.slice(0, 10).map(i => i.title).join('\n');

      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extract football transfers as JSON array. Return only the JSON. Items: {playerName, fromTeam, toTeam, fee, date}. News: ${titles}`;
      const result = await model.generateContent(prompt);
      res.json(JSON.parse(result.response.text().replace(/```json|```/g, '') || '[]'));
    } catch { res.json([]); }
});

export default app;
