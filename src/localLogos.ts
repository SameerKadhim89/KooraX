/**
 * Local Logos Mapping
 * Use this file to map leagues or teams to local images uploaded to the /public directory.
 * 
 * Instructions:
 * 1. Upload your image to the /public folder (e.g., /public/my-logo.png)
 * 2. Add the mapping below: 'Name': '/my-logo.png'
 * 3. You can also use base64 strings directly here.
 */

export const LOCAL_LEAGUE_LOGOS: Record<string, string> = {
  'الدوري الإنجليزي الممتاز': '/premier-league.png',
  'Premier League': '/premier-league.png',
  'الدوري الإسباني': '/laliga.png',
  'La Liga': '/laliga.png',
  'الدوري الإيطالي': '/seriea.png',
  'Serie A': '/seriea.png',
  'الدوري الألماني': '/bundesliga.png',
  'Bundesliga': '/bundesliga.png',
};

export const LOCAL_TEAM_LOGOS: Record<string, string> = {
  'ريال مدريد': '/real-madrid.png',
  'Real Madrid': '/real-madrid.png',
  'برشلونة': '/barcelona.png',
  'Barcelona': '/barcelona.png',
  'ليفربول': '/liverpool.png',
  'Liverpool': '/liverpool.png',
  'مانشستر سيتي': '/man-city.png',
  'Manchester City': '/man-city.png',
  'باريس سان جيرمان': '/psg.png',
  'Paris Saint-Germain': '/psg.png',
};
