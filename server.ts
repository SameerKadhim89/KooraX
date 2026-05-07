console.log("Server file loaded");
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";

import yts from 'yt-search';

// Global error handlers to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

import admin from "firebase-admin";
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Firebase Admin initialized");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const firestore = admin.firestore();

async function startServer() {
  // Match Tracker for Smart Notifications
  const matchStates = new Map<string, any>();
  const espnLeagueMap: Record<string, string> = {
    'eng.1': 'الدوري الإنجليزي الممتاز',
    'esp.1': 'الدوري الإسباني',
    'ita.1': 'الدوري الإيطالي',
    'ger.1': 'الدوري الألماني',
    'fra.1': 'الدوري الفرنسي',
    'uefa.champions': 'دوري أبطال أوروبا',
    'fifa.world': 'كأس العالم',
    'ned.1': 'الدوري الهولندي',
    'por.1': 'الدوري البرتغالي',
    'bel.1': 'الدوري البلجيكي'
  };

  async function checkMatchUpdates() {
    console.log("[Notifications] Checking match updates...");
    const leagues = Object.keys(espnLeagueMap);
    
    for (const league of leagues) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?limit=50`;
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json() as any;
        if (!data || !data.events) continue;

        for (const event of data.events) {
          const matchId = event.id;
          const statusState = event.status.type.state;
          const homeTeam = event.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
          const awayTeam = event.competitions[0].competitors.find((c: any) => c.homeAway === 'away');
          const homeScore = parseInt(homeTeam.score) || 0;
          const awayScore = parseInt(awayTeam.score) || 0;
          const leagueName = espnLeagueMap[league];

          const lastState = matchStates.get(matchId);

          // 1. Match Start
          if (!lastState && statusState === 'in') {
            await sendGlobalNotification({
              title: 'بدأت المباراة ⚽',
              body: `انطلقت مباراة ${homeTeam.team.displayName} ضد ${awayTeam.team.displayName} في ${leagueName}`,
              matchId,
              type: 'start'
            });
          } else if (lastState && lastState.status !== 'in' && statusState === 'in') {
            await sendGlobalNotification({
              title: 'بدأت المباراة ⚽',
              body: `انطلقت مباراة ${homeTeam.team.displayName} ضد ${awayTeam.team.displayName} في ${leagueName}`,
              matchId,
              type: 'start'
            });
          }

          // 2. Goal
          if (lastState && (homeScore > lastState.homeScore || awayScore > lastState.awayScore)) {
            const scoringTeam = homeScore > lastState.homeScore ? homeTeam.team.displayName : awayTeam.team.displayName;
            await sendGlobalNotification({
              title: 'هدف! ⚽',
              body: `جووووووول! ${scoringTeam} يسجل في مباراة ${homeTeam.team.displayName} (${homeScore}) - (${awayScore}) ${awayTeam.team.displayName}`,
              matchId,
              type: 'goal'
            });
          }

          // 3. Match Finish
          if (lastState && lastState.status === 'in' && statusState === 'post') {
            await sendGlobalNotification({
              title: 'انتهت المباراة ✅',
              body: `نهاية المباراة: ${homeTeam.team.displayName} ${homeScore} - ${awayScore} ${awayTeam.team.displayName}`,
              matchId,
              type: 'finish'
            });
          }

          // Update state
          matchStates.set(matchId, {
            status: statusState,
            homeScore,
            awayScore
          });
        }
      } catch (err) {
        // Silent error for background task
      }
    }
  }

  async function sendGlobalNotification(notif: { title: string, body: string, matchId: string, type: string }) {
    console.log(`[Notifications] Pushing notification: ${notif.title}`);
    try {
      await firestore.collection('notifications').add({
        ...notif,
        timestamp: new Date().toISOString(),
        read: false,
        userId: 'global' // Using 'global' for all users to see match updates
      });
    } catch (err) {
      console.error("[Notifications] Error saving notification:", err);
    }
  }

  // Start polling every minute
  setInterval(checkMatchUpdates, 60000);
  // Run once immediately on start
  checkMatchUpdates();
  const PORT = 3000;
  const app = express();

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    console.log("Health check requested");
    res.json({ status: "ok" });
  });

  app.get("/api/jdwel/leagues", async (req, res) => {
    try {
      const leagues = [
        { id: 'champions-league', name: 'دوري أبطال أوروبا', logo: 'https://jdwel.com/wp-content/uploads/2023/08/UCL-Logo.png' },
        { id: 'premier-league', name: 'الدوري الإنجليزي الممتاز', logo: 'https://jdwel.com/wp-content/uploads/2023/08/Premier-League-Logo.png' },
        { id: 'la-liga', name: 'الدوري الإسباني', logo: 'https://jdwel.com/wp-content/uploads/2023/08/La-Liga-Logo.png' },
        { id: 'serie-a', name: 'الدوري الإيطالي', logo: 'https://jdwel.com/wp-content/uploads/2023/08/Serie-A-Logo.png' },
        { id: 'bundesliga', name: 'الدوري الألماني', logo: 'https://jdwel.com/wp-content/uploads/2023/08/Bundesliga-Logo.png' },
        { id: 'ligue-1', name: 'الدوري الفرنسي', logo: 'https://jdwel.com/wp-content/uploads/2023/08/Ligue-1-Logo.png' }
      ];
      res.json(leagues);
    } catch (error) {
      console.error("Error fetching jdwel leagues:", error);
      res.status(500).json({ error: "Failed to fetch jdwel leagues" });
    }
  });

  app.get("/api/jdwel/matches", async (req, res) => {
    try {
      const { leagueId } = req.query;
      const url = leagueId ? `https://jdwel.com/leagues/${leagueId}/` : 'https://jdwel.com/';
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        console.warn(`Jdwel returned ${response.status}, falling back to ESPN data`);
        // We can't easily call the other route from here, so we'll just return an empty array
        // and let the client handle it or show a message.
        return res.json([]);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const matches: any[] = [];

      $('.match-card').each((i, el) => {
        const homeTeam = $(el).find('.home-team .team-name').text().trim();
        const awayTeam = $(el).find('.away-team .team-name').text().trim();
        const homeLogo = $(el).find('.home-team img').attr('src');
        const awayLogo = $(el).find('.away-team img').attr('src');
        const time = $(el).find('.match-time').text().trim();
        const status = $(el).find('.match-status').text().trim();
        const score = $(el).find('.match-score').text().trim();
        const league = $(el).find('.league-name').text().trim();

        matches.push({
          id: `jdwel-${i}`,
          league,
          homeTeam: { name: homeTeam, logo: homeLogo },
          awayTeam: { name: awayTeam, logo: awayLogo },
          time,
          status: status.includes('انتهت') ? 'finished' : (status.includes('مباشر') ? 'live' : 'upcoming'),
          homeScore: score.split('-')[0]?.trim(),
          awayScore: score.split('-')[1]?.trim()
        });
      });

      res.json(matches);
    } catch (error) {
      console.error("Error scraping jdwel:", error);
      res.status(500).json({ error: "Failed to fetch matches from jdwel" });
    }
  });

  app.get("/api/matches/upcoming-top", async (req, res) => {
    try {
      const tsdbKey = process.env.THESPORTSDB_API_KEY || 'f874d83052794e869b7dedb5d39ee793';
      
      const tsdbLeagues = [
        { id: '4328', name: 'الدوري الإنجليزي الممتاز' },
        { id: '4335', name: 'الدوري الإسباني' },
        { id: '4332', name: 'الدوري الإيطالي' },
        { id: '4331', name: 'الدوري الألماني' },
        { id: '4334', name: 'الدوري الفرنسي' },
        { id: '4401', name: 'دوري أبطال أوروبا' },
        { id: '4399', name: 'الدوري السعودي' },
        { id: '4429', name: 'كأس العالم' },
        { id: '4481', name: 'الدوري الأوروبي' },
        { id: '4337', name: 'الدوري الهولندي' },
        { id: '4344', name: 'الدوري البرتغالي' },
        { id: '4338', name: 'الدوري البلجيكي' },
        { id: '4346', name: 'الدوري الأمريكي' },
        { id: '4351', name: 'الدوري البرازيلي' },
        { id: '4329', name: 'دوري البطولة الإنجليزية' }
      ];

      const leaguePromises = tsdbLeagues.map(async (league) => {
        try {
          const nextUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/eventsnextleague.php?id=${league.id}`;
          const response = await fetch(nextUrl);
          if (response.ok) {
            const data = await response.json();
            // Take up to 10 from each league
            return (data.events || []).slice(0, 10).map((event: any) => {
              // Convert TSDB time to Date to local 12h format
              let cleanTime = '00:00';
              try {
                if (event.strTime && event.dateEvent) {
                  const dateTimeStr = `${event.dateEvent}T${event.strTime}`;
                  cleanTime = new Date(dateTimeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                } else if (event.strTime) {
                  const [h, m] = event.strTime.split(':');
                  const date = new Date();
                  date.setHours(parseInt(h), parseInt(m));
                  cleanTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                }
              } catch (e) {
                cleanTime = event.strTime?.substring(0, 5) || '00:00';
              }

              return {
                id: event.idEvent,
                league: league.name,
                homeTeam: { id: event.idHomeTeam, name: event.strHomeTeam, logo: event.strHomeTeamBadge },
                awayTeam: { id: event.idAwayTeam, name: event.strAwayTeam, logo: event.strAwayTeamBadge },
                time: cleanTime,
                status: 'upcoming',
                date: event.dateEvent,
                stadiumName: event.strVenue || 'غير محدد',
                videoUrl: event.strVideo || undefined
              };
            });
          }
          return [];
        } catch (err) {
          console.error(`Error fetching upcoming matches for league ${league.id}:`, err);
          return [];
        }
      });

      const results = await Promise.all(leaguePromises);
      let allUpcoming = results.flat();

      // Sort by date and time
      allUpcoming.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return dateA - dateB;
      });

      res.json(allUpcoming);
    } catch (error) {
      console.error("Error fetching top upcoming matches:", error);
      res.status(500).json({ error: "Failed to fetch top upcoming matches" });
    }
  });

  app.get("/api/matches", async (req, res) => {
    console.log(`[Matches] Request received for date: ${req.query.date}`);
    try {
      const date = req.query.date as string;
      const tsdbKey = process.env.THESPORTSDB_API_KEY || 'f874d83052794e869b7dedb5d39ee793';
      
      const tsdbLeagues = [
        { id: '4328', name: 'الدوري الإنجليزي الممتاز' },
        { id: '4335', name: 'الدوري الإسباني' },
        { id: '4332', name: 'الدوري الإيطالي' },
        { id: '4331', name: 'الدوري الألماني' },
        { id: '4334', name: 'الدوري الفرنسي' },
        { id: '4401', name: 'دوري أبطال أوروبا' },
        { id: '4399', name: 'الدوري السعودي' },
        { id: '4429', name: 'كأس العالم' },
        { id: '4481', name: 'الدوري الأوروبي' },
        { id: '4337', name: 'الدوري الهولندي' },
        { id: '4344', name: 'الدوري البرتغالي' },
        { id: '4338', name: 'الدوري البلجيكي' },
        { id: '4346', name: 'الدوري الأمريكي' },
        { id: '4351', name: 'الدوري البرازيلي' },
        { id: '4329', name: 'دوري البطولة الإنجليزية' }
      ];

      const espnLeagueMap: Record<string, string> = {
        'eng.1': 'الدوري الإنجليزي الممتاز',
        'esp.1': 'الدوري الإسباني',
        'ita.1': 'الدوري الإيطالي',
        'ger.1': 'الدوري الألماني',
        'fra.1': 'الدوري الفرنسي',
        'uefa.champions': 'دوري أبطال أوروبا',
        'fifa.world': 'كأس العالم',
        'ned.1': 'الدوري الهولندي',
        'por.1': 'الدوري البرتغالي',
        'bel.1': 'الدوري البلجيكي'
      };

      let allMatches: any[] = [];

      // Fetch from ESPN (Primary source for date-based scores)
      const espnLeagues = Object.keys(espnLeagueMap);
      const dateParam = date ? `&dates=${date}` : '';
      
      const espnPromises = espnLeagues.map(async (league) => {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?limit=50${dateParam}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json() as any;
            if (data && data.events) {
              return data.events.map((event: any) => {
                const homeTeam = event.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
                const awayTeam = event.competitions[0].competitors.find((c: any) => c.homeAway === 'away');
                const statusState = event.status.type.state;
                let status = 'upcoming';
                if (statusState === 'in') status = 'live';
                if (statusState === 'post') status = 'finished';

                // Convert to 12-hour format
                const matchDate = new Date(event.date);
                const matchTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const timeStr = status === 'upcoming' ? matchTime : (event.status.type.shortDetail || matchTime);

                return {
                  id: `espn-${event.id}`,
                  league: espnLeagueMap[league] || 'دوري غير معروف',
                  homeTeam: { id: homeTeam.team.id, name: homeTeam.team.displayName, logo: homeTeam.team.logo },
                  awayTeam: { id: awayTeam.team.id, name: awayTeam.team.displayName, logo: awayTeam.team.logo },
                  homeScore: parseInt(homeTeam.score) || 0,
                  awayScore: parseInt(awayTeam.score) || 0,
                  time: timeStr,
                  status: status,
                  date: event.date.split('T')[0],
                  stadiumName: event.competitions[0].venue?.fullName || 'غير محدد'
                };
              });
            }
          }
          return [];
        } catch (err) {
          console.error(`Error fetching ESPN matches for ${league}:`, err);
          return [];
        }
      });

      const espnResults = await Promise.all(espnPromises);
      allMatches = espnResults.flat();

      // Fetch from TheSportsDB (Secondary source for extra details/matches)
      // Only do this if we don't have too many matches or for specific leagues
      if (allMatches.length < 20) {
        const leaguePromises = tsdbLeagues.map(async (league) => {
          try {
            const pastUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/eventspastleague.php?id=${league.id}`;
            const nextUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/eventsnextleague.php?id=${league.id}`;
            
            const [pastRes, nextRes] = await Promise.all([
              fetch(pastUrl),
              fetch(nextUrl)
            ]);

            const pastData = pastRes.ok ? await pastRes.json() : { events: [] };
            const nextData = nextRes.ok ? await nextRes.json() : { events: [] };
            
            const events = [...(pastData.events || []), ...(nextData.events || [])];
            
            return events.map((event: any) => {
              let status = 'upcoming';
              if (event.strStatus === 'Match Finished') status = 'finished';
              else if (event.strStatus === 'In Progress' || event.strStatus === 'Live') status = 'live';

              return {
                id: event.idEvent,
                league: league.name,
                homeTeam: { id: event.idHomeTeam, name: event.strHomeTeam, logo: event.strHomeTeamBadge },
                awayTeam: { id: event.idAwayTeam, name: event.strAwayTeam, logo: event.strAwayTeamBadge },
                homeScore: parseInt(event.intHomeScore) || 0,
                awayScore: parseInt(event.intAwayScore) || 0,
                time: event.strTime || '00:00',
                minute: event.strProgress || '',
                status: status,
                date: event.dateEvent,
                stadiumName: event.strVenue || 'غير محدد',
                videoUrl: event.strVideo || undefined
              };
            });
          } catch (err) {
            return [];
          }
        });

        const leagueResults = await Promise.all(leaguePromises);
        const tsdbMatches = leagueResults.flat();

        // Filter by date for TSDB matches if needed
        const filteredTsdb = date 
          ? tsdbMatches.filter((m: any) => {
              const dStr = date as string;
              const formattedDate = dStr.length === 8 ? `${dStr.substring(0, 4)}-${dStr.substring(4, 6)}-${dStr.substring(6, 8)}` : dStr;
              return m.date === dStr || m.date === formattedDate;
            })
          : tsdbMatches;

        // Merge, avoiding duplicates (check by team names or TSDB id)
        filteredTsdb.forEach(match => {
          const isDuplicate = allMatches.some(m => 
            (m.homeTeam.name === match.homeTeam.name && m.awayTeam.name === match.awayTeam.name && m.date === match.date)
          );
          if (!isDuplicate) {
            allMatches.push(match);
          }
        });
      }

      res.json(allMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/highlights", async (req, res) => {
    try {
      const league = req.query.league as string;
      
      // Determine the best search query based on league
      let searchQuery = 'ملخصات أهداف مباريات اليوم';
      let requireBeIN = true;
      
      const negativeQueries = '-fifa -pes -efootball -fc24 -fc25 -gameplay -"درافت" -"بكجات"';
      
      if (league && league !== 'الكل') {
        if (league === 'الدوري الهولندي' || league === 'الدوري البرتغالي' || league === 'الدوري البلجيكي') {
          searchQuery = `ملخص أهداف ${league}`;
          requireBeIN = false;
        } else if (league === 'الدوري السعودي' || league === 'دوري روشن') {
          searchQuery = `ملخص أهداف ${league} SSC`;
          requireBeIN = false;
        } else {
          searchQuery = `ملخص أهداف ${league} beIN SPORTS`;
        }
      } else {
        searchQuery = `ملخص أهداف مباريات اليوم beIN SPORTS`;
      }
      
      const r = await yts(searchQuery);
      const videos = r.videos;
      
      const highlights = videos
        .map((video: any) => {
          const title = video.title || 'بدون عنوان';
          const titleLower = title.toLowerCase();
          const channelName = video.author?.name || '';
          
          // Determine league based on title
          let leagueName = 'ملخصات أهداف';
          if (title.includes('الانجليزي') || titleLower.includes('premier') || title.includes('ليفربول') || title.includes('سيتي')) leagueName = 'الدوري الإنجليزي الممتاز';
          else if (title.includes('الاسباني') || titleLower.includes('laliga') || title.includes('مدريد') || title.includes('برشلونة')) leagueName = 'الدوري الإسباني';
          else if (title.includes('الايطالي') || titleLower.includes('serie a') || title.includes('يوفنتوس') || title.includes('ميلان')) leagueName = 'الدوري الإيطالي';
          else if (title.includes('الالماني') || titleLower.includes('bundesliga') || title.includes('بايرن') || title.includes('دورتموند')) leagueName = 'الدوري الألماني';
          else if (title.includes('الفرنسي') || titleLower.includes('ligue 1') || title.includes('باريس') || title.includes('مارسيليا')) leagueName = 'الدوري الفرنسي';
          else if (title.includes('ابطال اوروبا') || titleLower.includes('champions league') || titleLower.includes('ucl')) leagueName = 'دوري أبطال أوروبا';
          else if (title.includes('الهولندي') || titleLower.includes('eredivisie') || title.includes('اياكس') || title.includes('أياكس') || title.includes('ايندهوفن')) leagueName = 'الدوري الهولندي';
          else if (title.includes('البرتغالي') || titleLower.includes('primeira liga') || title.includes('بنفيكا') || title.includes('بورتو') || title.includes('سبورتينج')) leagueName = 'الدوري البرتغالي';
          else if (title.includes('البلجيكي') || titleLower.includes('pro league') || title.includes('كلوب بروج') || title.includes('اندرلخت')) leagueName = 'الدوري البلجيكي';
          else if (title.includes('كأس العالم') || titleLower.includes('world cup') || titleLower.includes('fifawc')) leagueName = 'كأس العالم';

          let timeAgoMinutes = 999999;
          const dateLower = video.ago ? video.ago.toLowerCase() : 'مؤخراً';
          const numMatch = dateLower.match(/\d+/);
          const num = numMatch ? parseInt(numMatch[0]) : 1;
          
          if (dateLower.includes('second') || dateLower.includes('ثانية')) timeAgoMinutes = num / 60;
          else if (dateLower.includes('minute') || dateLower.includes('دقيقة') || dateLower.includes('دقائق')) timeAgoMinutes = num;
          else if (dateLower.includes('hour') || dateLower.includes('ساعة') || dateLower.includes('ساعات')) timeAgoMinutes = num * 60;
          else if (dateLower.includes('day') || dateLower.includes('يوم') || dateLower.includes('أيام') || dateLower.includes('ايام')) timeAgoMinutes = num * 1440;
          else if (dateLower.includes('week') || dateLower.includes('أسبوع') || dateLower.includes('اسبوع') || dateLower.includes('أسابيع')) timeAgoMinutes = num * 10080;
          else if (dateLower.includes('month') || dateLower.includes('شهر') || dateLower.includes('أشهر')) timeAgoMinutes = num * 43200;
          else if (dateLower.includes('year') || dateLower.includes('سنة') || dateLower.includes('عام') || dateLower.includes('سنوات')) timeAgoMinutes = num * 525600;

          return {
            id: video.videoId,
            title: title,
            thumbnail: video.thumbnail || '',
            duration: video.timestamp || '00:00',
            views: typeof video.views === 'number' ? video.views.toLocaleString() : video.views || '0',
            viewCount: video.views || 0,
            timeAgoMinutes: timeAgoMinutes,
            date: video.ago || 'مؤخراً',
            league: leagueName,
            channel: channelName,
            videoUrl: `https://www.youtube.com/embed/${video.videoId}`
          };
        })
        .filter((h: any) => {
          // Ensure it's a summary/goals video
          const isSummary = h.title.includes('ملخص') || h.title.includes('أهداف') || h.title.includes('اهداف') || h.title.toLowerCase().includes('goals') || h.title.toLowerCase().includes('highlights');
          
          // Check channel constraint if applicable
          let isValidChannel = true;
          if (requireBeIN) {
             isValidChannel = h.channel.includes('beIN SPORTS') || h.channel.includes('SSC');
          } else {
             // Avoid random news channels if possible, but allow SSC/AbuDhabi etc.
             const suspiciousChannels = ['news', 'أخبار', 'عين', 'بث'];
             const isSuspicious = suspiciousChannels.some(c => h.channel.toLowerCase().includes(c));
             if (isSuspicious) isValidChannel = false;
          }
          
          // If searching for a specific league, require either the league to match or the search to be generic
          const leagueStr = league as string;
          const isTargetLeague = !leagueStr || leagueStr === 'الكل' || h.league === leagueStr || h.title.includes(leagueStr?.split(' ')?.[1] || leagueStr || '');

          // Filter out gaming, podcasts, and analysis
          const fakeKeywords = ['fifa', 'pes', 'efootball', 'fc 24', 'fc 25', 'fc24', 'fc25', 'gameplay', 'بيس', 'فيفا', 'لعبة', 'درافت', 'بكجات', 'مود المهنة', 'career mode', 'playstation', 'xbox', 'podcast', 'بودكاست', 'تحليل', 'توقعات'];
          const isFake = fakeKeywords.some(kw => h.title.toLowerCase().includes(kw) || h.channel.toLowerCase().includes(kw));

          return isSummary && isValidChannel && isTargetLeague && !isFake;
        })
        .sort((a: any, b: any) => {
          let scoreA = 0;
          let scoreB = 0;

          // Prioritize titles explicitly stating it's a summary or goals
          if (a.title.includes('ملخص')) scoreA += 2;
          if (a.title.includes('أهداف') || a.title.includes('اهداف')) scoreA += 1;
          
          if (b.title.includes('ملخص')) scoreB += 2;
          if (b.title.includes('أهداف') || b.title.includes('اهداف')) scoreB += 1;

          // Prioritize trusted official sports channels
          const trustedChannels = ['bein', 'ssc', 'abu dhabi', 'alkass', 'riyadiya'];
          if (trustedChannels.some(c => a.channel.toLowerCase().includes(c))) scoreA += 3;
          if (trustedChannels.some(c => b.channel.toLowerCase().includes(c))) scoreB += 3;

          // Fallback to recentness if scores are equal
          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return (a.timeAgoMinutes || 999999) - (b.timeAgoMinutes || 999999);
        })
        .slice(0, 40);

      res.json(highlights);
    } catch (error) {
      console.error("Error fetching highlights:", error);
      res.status(500).json({ error: "Failed to fetch highlights" });
    }
  });

  app.get("/api/jdwel/standings", async (req, res) => {
    try {
      const { leagueId } = req.query;
      if (!leagueId) {
        return res.status(400).json({ error: "League ID is required" });
      }
      const url = leagueId.toString().startsWith('http') ? leagueId.toString() : `https://jdwel.com/${leagueId}/`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        }
      });

      if (!response.ok) {
        console.warn(`Jdwel standings returned ${response.status} for ${leagueId}`);
        return res.json({ standings: [] });
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const standings: any[] = [];

      // Jdwel standings table structure
      $('table.standings-table tr, table tr').each((i, el) => {
        const cells = $(el).find('td');
        if (cells.length < 4) return;

        const rankText = $(cells[0]).text().trim();
        if (!rankText || isNaN(parseInt(rankText))) return;

        const teamCell = $(cells[1]);
        const teamName = teamCell.find('.team-name').text().trim() || teamCell.text().trim();
        const teamLogo = teamCell.find('img').attr('src');
        
        // Find played and points. Usually played is 3rd column, points is last.
        const played = $(cells[2]).text().trim();
        const points = $(cells[cells.length - 1]).text().trim();

        standings.push({
          team: {
            id: `jdwel-team-${i}`,
            displayName: teamName,
            logos: teamLogo ? [{ href: teamLogo }] : []
          },
          stats: [
            { name: 'gamesPlayed', value: parseInt(played) || 0 },
            { name: 'points', value: parseInt(points) || 0 }
          ]
        });
      });

      res.json({ standings });
    } catch (error) {
      console.error("Error scraping jdwel standings:", error);
      res.status(500).json({ error: "Failed to fetch standings from jdwel" });
    }
  });

  app.get("/api/standings", async (req, res) => {
    try {
      const { league } = req.query;
      if (!league) {
        return res.status(400).json({ error: "League is required" });
      }

      const tsdbKey = process.env.THESPORTSDB_API_KEY || 'f874d83052794e869b7dedb5d39ee793';
      
      // Mapping for TheSportsDB League IDs
      const tsdbLeagueMap: Record<string, string> = {
        'الدوري الإنجليزي': '4328',
        'الدوري الإنجليزي الممتاز': '4328',
        'الدوري الإسباني': '4335',
        'الدوري الإيطالي': '4332',
        'الدوري الألماني': '4331',
        'الدوري الفرنسي': '4334',
        'دوري أبطال أوروبا': '4401',
        'الدوري السعودي': '4399',
        'كأس العالم': '4429',
        'الدوري الهولندي': '4337',
        'الدوري البرتغالي': '4344',
        'الدوري البلجيكي': '4346'
      };

      const tsdbLeagueId = tsdbLeagueMap[league as string];
      
      if (tsdbLeagueId) {
        try {
          // TheSportsDB Standings
          let tableUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/lookuptable.php?l=${tsdbLeagueId}`;
          
          // Special handling for tournaments like World Cup to ensure we get data
          if (league === 'كأس العالم') {
            tableUrl += '&s=2022'; // Default to 2022 if no current data
          }

          const leagueUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/lookupleague.php?id=${tsdbLeagueId}`;
          
          const [tableRes, leagueRes] = await Promise.all([
            fetch(tableUrl),
            fetch(leagueUrl)
          ]);

          if (tableRes.ok) {
            const tableData = await tableRes.json();
            const leagueData = leagueRes.ok ? await leagueRes.json() : null;
            const leagueLogo = leagueData?.leagues?.[0]?.strBadge;

            if (tableData && tableData.table) {
              const rawStandings = tableData.table.map((team: any) => ({
                team: {
                  id: team.idTeam,
                  displayName: team.strTeam,
                  logos: [{ href: team.strTeamBadge }]
                },
                stats: [
                  { name: 'gamesPlayed', value: parseInt(team.intPlayed) || 0 },
                  { name: 'wins', value: parseInt(team.intWin) || 0 },
                  { name: 'ties', value: parseInt(team.intDraw) || 0 },
                  { name: 'losses', value: parseInt(team.intLoss) || 0 },
                  { name: 'pointDifferential', value: parseInt(team.intGoalDifference) || 0 },
                  { name: 'points', value: parseInt(team.intPoints) || 0 }
                ],
                group: team.strGroup || null
              }));

              // Check if we should group the standings
              const hasGroups = rawStandings.some((s: any) => s.group);
              if (hasGroups) {
                const grouped: Record<string, any[]> = {};
                rawStandings.forEach((s: any) => {
                  const groupName = s.group || 'غير محدد';
                  if (!grouped[groupName]) grouped[groupName] = [];
                  grouped[groupName].push(s);
                });
                return res.json({ groupedStandings: grouped, leagueLogo, isGrouped: true });
              }

              return res.json({ standings: rawStandings, leagueLogo, isGrouped: false });
            } else {
              console.log("No table data found for league:", league, "data:", tableData);
              return res.json({ standings: [], isGrouped: false });
            }
          } else {
            console.log("Table response not ok for league:", league, "status:", tableRes.status);
          }
        } catch (err) {
          console.error("TheSportsDB standings failed, falling back to ESPN:", err);
        }
      }

      // Fallback to ESPN
      const espnLeagueMap: Record<string, string> = {
        'الدوري الإنجليزي': 'eng.1',
        'الدوري الإنجليزي الممتاز': 'eng.1',
        'الدوري الإسباني': 'esp.1',
        'الدوري الإيطالي': 'ita.1',
        'الدوري الألماني': 'ger.1',
        'الدوري الفرنسي': 'fra.1',
        'دوري أبطال أوروبا': 'uefa.champions',
        'كأس العالم': 'fifa.world',
        'الدوري الهولندي': 'ned.1',
        'الدوري البرتغالي': 'por.1',
        'الدوري البلجيكي': 'bel.1'
      };
      const espnLeagueId = espnLeagueMap[league as string] || league;
      
      const url = `https://site.api.espn.com/apis/v2/sports/soccer/${espnLeagueId}/standings`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Check if ESPN returns grouped standings (using children)
        if (data.children && Array.isArray(data.children)) {
          const grouped: Record<string, any[]> = {};
          data.children.forEach((child: any) => {
            const groupName = child.name || child.abbreviation || 'غير محدد';
            let entries = child.standings?.entries || [];
            
            const groupStandings = entries.map((entry: any) => ({
              team: {
                id: entry.team?.id,
                displayName: entry.team?.displayName || entry.team?.name,
                logos: [{ href: entry.team?.logos?.[0]?.href }]
              },
              stats: entry.stats?.map((s: any) => ({
                name: s.name,
                value: s.value
              })) || []
            }));
            
            if (groupStandings.length > 0) {
              grouped[groupName] = groupStandings;
            }
          });
          
          if (Object.keys(grouped).length > 0) {
            return res.json({ groupedStandings: grouped, isGrouped: true });
          }
        }

        // Standard flat standings
        let rawStandings = data.standings || data.children?.[0]?.standings;
        if (rawStandings && !Array.isArray(rawStandings) && Array.isArray(rawStandings.entries)) {
          rawStandings = rawStandings.entries;
        }
        const standings = (Array.isArray(rawStandings) ? rawStandings : []).map((entry: any) => ({
          team: {
            id: entry.team?.id,
            displayName: entry.team?.displayName || entry.team?.name,
            logos: [{ href: entry.team?.logos?.[0]?.href }]
          },
          stats: entry.stats?.map((s: any) => ({
            name: s.name,
            value: s.value
          })) || []
        }));
        
        res.json({ standings, isGrouped: false });
      } else {
        console.log("ESPN response not ok, status:", response.status);
        res.status(500).json({ error: "Failed to fetch standings from all sources" });
      }
    } catch (error) {
      console.error("Error fetching standings:", error);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  });

  app.get("/api/matches/:id/details", async (req, res) => {
    try {
      const { id } = req.params;
      const tsdbKey = process.env.THESPORTSDB_API_KEY || 'f874d83052794e869b7dedb5d39ee793';
      
      // Fetch timeline and event details in parallel
      const timelineUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/lookuptimeline.php?id=${id}`;
      const detailUrl = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/lookupevent.php?id=${id}`;
      
      const [timelineRes, detailRes] = await Promise.all([
        fetch(timelineUrl),
        fetch(detailUrl)
      ]);
      
      const timelineData = timelineRes.ok ? await timelineRes.json() : { timeline: [] };
      const detailData = detailRes.ok ? await detailRes.json() : { events: [] };
      
      const tsdbEvent = detailData.events?.[0];
      
      // Map stats
      const stats = tsdbEvent ? {
        possession: [parseInt(tsdbEvent.intHomePossession) || 50, parseInt(tsdbEvent.intAwayPossession) || 50],
        shots: [parseInt(tsdbEvent.intHomeShots) || 0, parseInt(tsdbEvent.intAwayShots) || 0],
        shotsOnTarget: [parseInt(tsdbEvent.intHomeShotsOnTarget) || 0, parseInt(tsdbEvent.intAwayShotsOnTarget) || 0],
        fouls: [parseInt(tsdbEvent.intHomeFouls) || 0, parseInt(tsdbEvent.intAwayFouls) || 0],
        corners: [parseInt(tsdbEvent.intHomeCorners) || 0, parseInt(tsdbEvent.intAwayCorners) || 0],
        offsides: [parseInt(tsdbEvent.intHomeOffsides) || 0, parseInt(tsdbEvent.intAwayOffsides) || 0],
        yellowCards: [parseInt(tsdbEvent.intHomeYellowCards) || 0, parseInt(tsdbEvent.intAwayYellowCards) || 0],
        redCards: [parseInt(tsdbEvent.intHomeRedCards) || 0, parseInt(tsdbEvent.intAwayRedCards) || 0]
      } : undefined;

      // Map timeline events
      const events = (timelineData.timeline || []).map((item: any) => {
        let type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'commentary' = 'commentary';
        const rawType = (item.strTimeline || '').toLowerCase();
        
        if (rawType.includes('goal')) type = 'goal';
        else if (rawType.includes('yellow')) type = 'yellow_card';
        else if (rawType.includes('red')) type = 'red_card';
        else if (rawType.includes('sub')) type = 'substitution';

        return {
          id: item.idTimeline,
          minute: `${item.intMinute}'`,
          type: type,
          description: item.strCommentary || `${item.strTimeline}: ${item.strPlayer}`,
          teamId: item.idTeam,
          playerName: item.strPlayer
        };
      });

      res.json({ stats, events });
    } catch (error) {
      console.error("Error fetching match details:", error);
      res.status(500).json({ error: "Failed to fetch match details" });
    }
  });

  app.get("/api/transfers", async (req, res) => {
    console.log("[Transfers] Request received");
    try {
      const parser = new Parser();
      
      let titles = "";
      try {
        console.log("[Transfers] Fetching RSS feed...");
        const rssUrl = 'https://news.google.com/rss/search?q=%D8%A7%D9%86%D8%AA%D9%82%D8%A7%D9%84%D8%A7%D8%AA+%D9%83%D8%B1%D8%A9+%D8%A7%D9%84%D9%82%D8%AF%D9%85+%D8%B1%D8%B3%D9%85%D9%8A%D8%A7&hl=ar&gl=EG&ceid=EG:ar';
        const rssResponse = await fetch(rssUrl);
        
        if (!rssResponse.ok) {
          console.error(`[Transfers] RSS fetch failed with status: ${rssResponse.status}`);
          throw new Error(`RSS fetch failed: ${rssResponse.status}`);
        }
        
        const xml = await rssResponse.text();
        const feed = await parser.parseString(xml);
        titles = feed.items.slice(0, 15).map(item => item.title).join('\n');
        console.log(`[Transfers] Found ${feed.items.length} items in RSS`);
      } catch (rssError) {
        console.error("[Transfers] RSS error:", rssError);
        // Fallback to empty titles if RSS fails
      }
      
      if (!titles) {
        console.log("[Transfers] No titles found, returning empty array");
        return res.json([]);
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("TODO")) {
        console.warn("[Transfers] GEMINI_API_KEY is missing or placeholder");
        return res.json([]);
      }

      console.log("[Transfers] Calling Gemini API...");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract football transfer deals from the following news titles. Return a JSON array of objects. Each object should represent a transfer deal and have these exact keys:
        - id: a unique string (e.g., 't1', 't2')
        - playerName: string (the name of the player)
        - position: string (guess the position in Arabic, e.g., 'مهاجم', 'خط وسط', 'مدافع', 'حارس مرمى'. If unknown, use 'لاعب')
        - fromTeam: object with { id: string, name: string (Arabic), color: string (Tailwind bg class), textColor: 'text-white', logo: string (URL to team logo if known, else empty) }
        - toTeam: object with { id: string, name: string (Arabic), color: string (Tailwind bg class), textColor: 'text-white', logo: string (URL to team logo if known, else empty) }
        - fee: string (the transfer fee in Arabic, e.g., 'انتقال حر', 'إعارة', or the amount if mentioned. Default to 'غير معلن')
        - date: string (today's date in Arabic or date from news)
        - type: string (either 'permanent' or 'loan')
        - playerImage: string (A URL to a real image of the player from a reliable source like Wikimedia, UEFA, or FIFA if you know the exact URL. If not, use a high-quality football-related placeholder from Unsplash: https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400&h=400. Ensure the URL is valid and directly points to an image.)
        
        Only include actual player transfers mentioned in the titles. If a title is just a general news article, ignore it.
        
        Titles:
        ${titles}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                playerName: { type: Type.STRING },
                position: { type: Type.STRING },
                fromTeam: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    color: { type: Type.STRING },
                    textColor: { type: Type.STRING },
                    logo: { type: Type.STRING }
                  }
                },
                toTeam: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    color: { type: Type.STRING },
                    textColor: { type: Type.STRING },
                    logo: { type: Type.STRING }
                  }
                },
                fee: { type: Type.STRING },
                date: { type: Type.STRING },
                type: { type: Type.STRING },
                playerImage: { type: Type.STRING }
              }
            }
          }
        }
      });

      const text = response.text;
      const transfers = JSON.parse(text || '[]');
      console.log(`[Transfers] Successfully processed ${transfers.length} transfers`);
      res.json(transfers);
    } catch (error: any) {
      console.error("[Transfers] Fatal error:", error);
      // Return empty array instead of 500 to prevent client-side "Failed to fetch" errors
      res.json([]);
    }
  });

  // 404 for API routes
  app.all("/api/*", (req, res) => {
    console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Node version: ${process.version}`);
      console.log(`[Server] Global fetch available: ${typeof fetch !== 'undefined'}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();
