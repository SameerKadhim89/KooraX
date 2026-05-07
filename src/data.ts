export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Team {
  id: string;
  name: string;
  color: string;
  textColor?: string;
  logo?: string;
}

export interface MatchStats {
  possession: [number, number]; // [home, away]
  shots: [number, number];
  shotsOnTarget: [number, number];
  fouls: [number, number];
  corners: [number, number];
  offsides: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface Match {
  id: string;
  league: string;
  leagueLogo?: string;
  homeTeam: Team;
  awayTeam: Team;
  time: string;
  date?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: string;
  stadiumName?: string;
  location?: string;
  events?: MatchEvent[];
  stats?: MatchStats;
  videoUrl?: string;
}

export interface Highlight {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  date: string;
  viewCount?: number;
  timeAgoMinutes?: number;
  views: string;
  league: string;
  videoUrl: string;
  scorers?: string[];
  channel?: string;
}

export interface Transfer {
  id: string;
  playerName: string;
  position: string;
  fromTeam: Team;
  toTeam: Team;
  fee: string;
  date: string;
  type: 'permanent' | 'loan';
  playerImage?: string;
}

export interface MatchEvent {
  id: string;
  minute: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'commentary';
  description: string;
  teamId?: string;
  playerName?: string;
}

import { API_BASE } from './App';
import { fetchLiveMatchDetails } from './services/api';

export const fetchMatchDetails = async (matchId: string): Promise<{stats?: MatchStats, events: MatchEvent[]}> => {
  return await fetchLiveMatchDetails(matchId);
};

import { leagueLogos, teamLogos, leagueLinks } from './logos';
export { leagueLogos, teamLogos, leagueLinks };

export const matchesData: Match[] = [
  {
    id: '1',
    league: 'دوري أبطال أوروبا',
    homeTeam: { id: 'rm', name: 'ريال مدريد', color: 'bg-white', textColor: 'text-slate-900', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
    awayTeam: { id: 'mc', name: 'مانشستر سيتي', color: 'bg-sky-300', textColor: 'text-slate-900', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    time: '22:00',
    status: 'upcoming',
    stadiumName: 'ملعب سانتياغو برنابيو',
    location: 'مدريد، إسبانيا'
  },
  {
    id: '9',
    league: 'دوري أبطال أوروبا',
    homeTeam: { id: 'liv', name: 'ليفربول', color: 'bg-red-700', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
    awayTeam: { id: 'bar', name: 'برشلونة', color: 'bg-blue-800', textColor: 'text-red-500', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
    time: '22:00',
    status: 'upcoming',
    stadiumName: 'ملعب أنفيلد',
    location: 'ليفربول، إنجلترا'
  },
  {
    id: '10',
    league: 'دوري أبطال أوروبا',
    homeTeam: { id: 'int', name: 'إنتر ميلان', color: 'bg-blue-900', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/0/05/FC_Internazionale_Milano_2021.svg' },
    awayTeam: { id: 'atm', name: 'أتلتيكو مدريد', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
    time: '22:00',
    status: 'live',
    homeScore: 1,
    awayScore: 1,
    minute: "78'",
    stadiumName: 'سان سيرو',
    location: 'ميلانو، إيطاليا',
    stats: {
      possession: [48, 52],
      shots: [12, 14],
      shotsOnTarget: [4, 5],
      fouls: [10, 12],
      corners: [5, 6],
      offsides: [2, 1],
      yellowCards: [2, 3],
      redCards: [0, 0]
    }
  },
  {
    id: '2',
    league: 'دوري أبطال أوروبا',
    homeTeam: { id: 'bm', name: 'بايرن ميونخ', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
    awayTeam: { id: 'psg', name: 'باريس سان جيرمان', color: 'bg-blue-900', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
    time: '22:00',
    status: 'live',
    homeScore: 1,
    awayScore: 0,
    minute: "42'",
    stadiumName: 'أليانز أرينا',
    location: 'ميونخ، ألمانيا',
    stats: {
      possession: [55, 45],
      shots: [8, 5],
      shotsOnTarget: [3, 1],
      fouls: [6, 8],
      corners: [4, 2],
      offsides: [1, 3],
      yellowCards: [1, 1],
      redCards: [0, 0]
    }
  },
  {
    id: '3',
    league: 'الدوري الإنجليزي الممتاز',
    homeTeam: { id: 'ars', name: 'أرسنال', color: 'bg-red-500', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
    awayTeam: { id: 'liv', name: 'ليفربول', color: 'bg-red-700', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
    time: '19:30',
    status: 'finished',
    homeScore: 3,
    awayScore: 1,
    stadiumName: 'ملعب الإمارات',
    location: 'لندن، إنجلترا',
    stats: {
      possession: [42, 58],
      shots: [15, 12],
      shotsOnTarget: [7, 4],
      fouls: [11, 9],
      corners: [3, 8],
      offsides: [4, 2],
      yellowCards: [2, 1],
      redCards: [0, 1]
    }
  },
  {
    id: '4',
    league: 'الدوري الإسباني',
    homeTeam: { id: 'bar', name: 'برشلونة', color: 'bg-blue-800', textColor: 'text-red-500', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
    awayTeam: { id: 'atm', name: 'أتلتيكو مدريد', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
    time: '18:00',
    status: 'finished',
    homeScore: 2,
    awayScore: 2,
    stadiumName: 'ملعب لويس كومبانيس الأولمبي',
    location: 'برشلونة، إسبانيا'
  },
  {
    id: '6',
    league: 'الدوري الألماني',
    homeTeam: { id: 'bvb', name: 'بوروسيا دورتموند', color: 'bg-yellow-400', textColor: 'text-black', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg' },
    awayTeam: { id: 'lev', name: 'باير ليفركوزن', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
    time: '16:30',
    status: 'live',
    homeScore: 2,
    awayScore: 1,
    minute: "65'",
    stadiumName: 'سيغنال إيدونا بارك',
    location: 'دورتموند، ألمانيا'
  },
  {
    id: '7',
    league: 'الدوري الفرنسي',
    homeTeam: { id: 'mar', name: 'مارسيليا', color: 'bg-sky-400', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg' },
    awayTeam: { id: 'lyo', name: 'ليون', color: 'bg-white', textColor: 'text-blue-800', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg' },
    time: '22:45',
    status: 'upcoming',
    stadiumName: 'فيلودروم',
    location: 'مارسيليا، فرنسا'
  },
  {
    id: '8',
    league: 'الدوري الإيطالي',
    homeTeam: { id: 'juv', name: 'يوفنتوس', color: 'bg-black', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg' },
    awayTeam: { id: 'mil', name: 'ميلان', color: 'bg-red-600', textColor: 'text-black', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg' },
    time: '19:45',
    status: 'finished',
    homeScore: 0,
    awayScore: 0,
    stadiumName: 'ملعب يوفنتوس',
    location: 'تورينو، إيطاليا'
  }
];

export const highlightsData: Highlight[] = [
  {
    id: '1',
    title: 'ملخص أهداف مباراة أرسنال وليفربول (3-1) - قمة الدوري الإنجليزي',
    thumbnail: 'https://images.unsplash.com/photo-1518605368461-1ee7e161728c?auto=format&fit=crop&q=80&w=800',
    duration: '12:45',
    date: 'منذ ساعتين',
    timeAgoMinutes: 120,
    views: '1.2M',
    league: 'الدوري الإنجليزي',
    videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
    scorers: ['أوديجارد', 'ساكا', 'تروسارد', 'دياز']
  },
  {
    id: '2',
    title: 'أهداف مباراة برشلونة وأتلتيكو مدريد (2-2) - جنون الليغا',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbb1925536?auto=format&fit=crop&q=80&w=800',
    duration: '08:20',
    date: 'منذ 5 ساعات',
    timeAgoMinutes: 300,
    views: '850K',
    league: 'الدوري الإسباني',
    videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
    scorers: ['ليفاندوفسكي', 'رافينيا', 'غريزمان', 'كوريا']
  },
  {
    id: '3',
    title: 'أجمل 10 أهداف في دور المجموعات - دوري أبطال أوروبا',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    duration: '15:30',
    date: 'منذ يومين',
    timeAgoMinutes: 2880,
    views: '3.4M',
    league: 'دوري أبطال أوروبا',
    videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE'
  }
];

export const transfersData: Transfer[] = [
  {
    id: '1',
    playerName: 'كيليان مبابي',
    position: 'مهاجم',
    fromTeam: { id: 'psg', name: 'باريس سان جيرمان', color: 'bg-blue-900', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
    toTeam: { id: 'rm', name: 'ريال مدريد', color: 'bg-white', textColor: 'text-slate-900', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
    fee: 'انتقال حر',
    date: '1 يوليو 2024',
    type: 'permanent',
    playerImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Kylian_Mbapp%C3%A9_2022.jpg/400px-Kylian_Mbapp%C3%A9_2022.jpg'
  },
  {
    id: '2',
    playerName: 'جوليان ألفاريز',
    position: 'مهاجم',
    fromTeam: { id: 'mc', name: 'مانشستر سيتي', color: 'bg-sky-300', textColor: 'text-slate-900', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
    toTeam: { id: 'atm', name: 'أتلتيكو مدريد', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
    fee: '75 مليون يورو',
    date: '12 أغسطس 2024',
    type: 'permanent',
    playerImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Juli%C3%A1n_%C3%81lvarez_2022.jpg/400px-Juli%C3%A1n_%C3%81lvarez_2022.jpg'
  },
  {
    id: '3',
    playerName: 'داني أولمو',
    position: 'خط وسط هجومي',
    fromTeam: { id: 'rbl', name: 'لايبزيج', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg' },
    toTeam: { id: 'bar', name: 'برشلونة', color: 'bg-blue-800', textColor: 'text-red-500', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
    fee: '55 مليون يورو',
    date: '9 أغسطس 2024',
    type: 'permanent',
    playerImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Dani_Olmo_2021.jpg/400px-Dani_Olmo_2021.jpg'
  },
  {
    id: '4',
    playerName: 'ماتيس دي ليخت',
    position: 'مدافع',
    fromTeam: { id: 'bm', name: 'بايرن ميونخ', color: 'bg-red-600', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
    toTeam: { id: 'mutd', name: 'مانشستر يونايتد', color: 'bg-red-700', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
    fee: '45 مليون يورو',
    date: '13 أغسطس 2024',
    type: 'permanent',
    playerImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Matthijs_de_Ligt_2019.jpg/400px-Matthijs_de_Ligt_2019.jpg'
  },
  {
    id: '5',
    playerName: 'ريكاردو كالافيوري',
    position: 'مدافع',
    fromTeam: { id: 'bol', name: 'بولونيا', color: 'bg-blue-900', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Bologna_F.C._1909_logo.svg' },
    toTeam: { id: 'ars', name: 'أرسنال', color: 'bg-red-500', textColor: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
    fee: '45 مليون يورو',
    date: '29 يوليو 2024',
    type: 'permanent',
    playerImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Riccardo_Calafiori_2024.jpg/400px-Riccardo_Calafiori_2024.jpg'
  }
];
