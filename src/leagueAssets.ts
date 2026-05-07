/**
 * League Assets Utility
 * This file provides high-quality logos and metadata for the top 5 European leagues
 * and the UEFA Champions League.
 */

import { LOCAL_LEAGUE_LOGOS, LOCAL_TEAM_LOGOS } from './localLogos';

export interface LeagueAsset {
  id: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  country: string;
  color: string;
}

export const TOP_LEAGUES: LeagueAsset[] = [
  {
    id: '4328',
    nameAr: 'الدوري الإنجليزي الممتاز',
    nameEn: 'Premier League',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
    country: 'إنجلترا',
    color: '#3d195b'
  },
  {
    id: '4335',
    nameAr: 'الدوري الإسباني',
    nameEn: 'La Liga',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg',
    country: 'إسبانيا',
    color: '#ee2e24'
  },
  {
    id: '4332',
    nameAr: 'الدوري الإيطالي',
    nameEn: 'Serie A',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Serie_A_logo_2022.svg',
    country: 'إيطاليا',
    color: '#003366'
  },
  {
    id: '4331',
    nameAr: 'الدوري الألماني',
    nameEn: 'Bundesliga',
    logo: 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
    country: 'ألمانيا',
    color: '#d20515'
  },
  {
    id: '4334',
    nameAr: 'الدوري الفرنسي',
    nameEn: 'Ligue 1',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ligue_1_2024_Logo.png',
    country: 'فرنسا',
    color: '#dae025'
  },
  {
    id: '4334',
    nameAr: 'الدوري الفرنسي الممتاز',
    nameEn: 'Ligue 1',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ligue_1_2024_Logo.png',
    country: 'فرنسا',
    color: '#dae025'
  },
  {
    id: '4401',
    nameAr: 'دوري أبطال أوروبا',
    nameEn: 'UEFA Champions League',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f5/UEFA_Champions_League.svg',
    country: 'أوروبا',
    color: '#003399'
  },
  {
    id: '4401',
    nameAr: 'دوري ابطال اوروبا',
    nameEn: 'UEFA Champions League',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f5/UEFA_Champions_League.svg',
    country: 'أوروبا',
    color: '#003399'
  }
];

/**
 * Get league logo by name (Arabic or English)
 */
export const getLeagueLogo = (name: string): string | undefined => {
  // Check local mapping first
  const cleanName = name.trim();
  if (LOCAL_LEAGUE_LOGOS[cleanName]) return LOCAL_LEAGUE_LOGOS[cleanName];
  
  // Try partial match in local mapping
  const localEntries = Object.entries(LOCAL_LEAGUE_LOGOS);
  const localFound = localEntries.find(([key]) => cleanName.includes(key) || key.includes(cleanName));
  if (localFound) return localFound[1];

  const league = TOP_LEAGUES.find(
    l => l.nameAr === name || l.nameEn === name || name.includes(l.nameAr) || name.includes(l.nameEn)
  );
  return league?.logo;
};

/**
 * Get all league assets
 */
export const getAllLeagues = () => TOP_LEAGUES;

export const TEAM_LOGOS: Record<string, string> = {
  // Premier League
  'مانشستر سيتي': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'أرسنال': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'ليفربول': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'أستون فيلا': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
  'Aston Villa': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
  'توتنهام': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'تشيلسي': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'نيوكاسل يونايتد': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  'Newcastle': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  'مانشستر يونايتد': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'وست هام': 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
  'West Ham': 'https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg',
  'برايتون': 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
  'Brighton': 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
  'وولفرهامبتون': 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg',
  'Wolves': 'https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg',
  'فولهام': 'https://upload.wikimedia.org/wikipedia/en/7/70/Fulham_FC_%28shield%29.svg',
  'Fulham': 'https://upload.wikimedia.org/wikipedia/en/7/70/Fulham_FC_%28shield%29.svg',
  'كريستال بالاس': 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg',
  'Crystal Palace': 'https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg',
  'برينتفورد': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
  'Brentford': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
  'إيفرتون': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
  'Everton': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
  'نوتينغهام فورست': 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
  'Nottingham Forest': 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
  'بورنموث': 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg',
  'Bournemouth': 'https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg',
  'إيبسويتش تاون': 'https://upload.wikimedia.org/wikipedia/en/4/43/Ipswich_Town.svg',
  'Ipswich Town': 'https://upload.wikimedia.org/wikipedia/en/4/43/Ipswich_Town.svg',
  'ليستر سيتي': 'https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg',
  'Leicester City': 'https://upload.wikimedia.org/wikipedia/en/2/2d/Leicester_City_crest.svg',
  'ساوثهامبتون': 'https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg',
  'Southampton': 'https://upload.wikimedia.org/wikipedia/en/c/c9/FC_Southampton.svg',

  // La Liga
  'ريال مدريد': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'برشلونة': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'جيرونا': 'https://upload.wikimedia.org/wikipedia/en/9/93/Girona_FC_logo.svg',
  'Girona': 'https://upload.wikimedia.org/wikipedia/en/9/93/Girona_FC_logo.svg',
  'أتلتيكو مدريد': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'أتلتيك بيلباو': 'https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg',
  'Athletic Club': 'https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg',
  'ريال سوسيداد': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
  'Real Sociedad': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
  'ريال بيتيس': 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg',
  'Real Betis': 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg',
  'فالنسيا': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
  'Valencia': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
  'فياريال': 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg',
  'Villarreal': 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg',
  'خيتافي': 'https://upload.wikimedia.org/wikipedia/en/7/7f/Getafe_logo.svg',
  'Getafe': 'https://upload.wikimedia.org/wikipedia/en/7/7f/Getafe_logo.svg',
  'إشبيلية': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  'Sevilla': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  'أوساسونا': 'https://upload.wikimedia.org/wikipedia/en/d/db/Osasuna_logo.svg',
  'Osasuna': 'https://upload.wikimedia.org/wikipedia/en/d/db/Osasuna_logo.svg',
  'لاس بالماس': 'https://upload.wikimedia.org/wikipedia/en/2/20/UD_Las_Palmas_logo.svg',
  'Las Palmas': 'https://upload.wikimedia.org/wikipedia/en/2/20/UD_Las_Palmas_logo.svg',
  'مايوركا': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Rcd_mallorca.svg',
  'Mallorca': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Rcd_mallorca.svg',
  'ألافيس': 'https://upload.wikimedia.org/wikipedia/en/f/f8/Deportivo_Alaves_logo_2020.svg',
  'Alaves': 'https://upload.wikimedia.org/wikipedia/en/f/f8/Deportivo_Alaves_logo_2020.svg',
  'سيلتا فيغو': 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
  'Celta Vigo': 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
  'رايو فاليكانو': 'https://upload.wikimedia.org/wikipedia/en/1/1e/Rayo_Vallecano_logo.svg',
  'Rayo Vallecano': 'https://upload.wikimedia.org/wikipedia/en/1/1e/Rayo_Vallecano_logo.svg',
  'ليغانيس': 'https://upload.wikimedia.org/wikipedia/en/0/02/Club_Deportivo_Legan%C3%A9s_logo.svg',
  'Leganes': 'https://upload.wikimedia.org/wikipedia/en/0/02/Club_Deportivo_Legan%C3%A9s_logo.svg',
  'بلد الوليد': 'https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_Logo.svg',
  'Real Valladolid': 'https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_Logo.svg',
  'إسبانيول': 'https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg',
  'Espanyol': 'https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg',

  // Serie A
  'إنتر ميلان': 'https://upload.wikimedia.org/wikipedia/en/0/05/FC_Internazionale_Milano_2021.svg',
  'Inter': 'https://upload.wikimedia.org/wikipedia/en/0/05/FC_Internazionale_Milano_2021.svg',
  'ميلان': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'يوفنتوس': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg',
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg',
  'أتالانتا': 'https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC.svg',
  'Atalanta': 'https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC.svg',
  'روما': 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg',
  'AS Roma': 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg',
  'لاتسيو': 'https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg',
  'Lazio': 'https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg',
  'نابولي': 'https://upload.wikimedia.org/wikipedia/commons/b/ba/SSC_Napoli_2024.svg',
  'Napoli': 'https://upload.wikimedia.org/wikipedia/commons/b/ba/SSC_Napoli_2024.svg',
  'فيورنتينا': 'https://upload.wikimedia.org/wikipedia/commons/7/79/ACF_Fiorentina_2022_logo.svg',
  'Fiorentina': 'https://upload.wikimedia.org/wikipedia/commons/7/79/ACF_Fiorentina_2022_logo.svg',
  'بولونيا': 'https://upload.wikimedia.org/wikipedia/en/5/5b/Bologna_F.C._1909_logo.svg',
  'Bologna': 'https://upload.wikimedia.org/wikipedia/en/5/5b/Bologna_F.C._1909_logo.svg',
  'تورينو': 'https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_Logo.svg',
  'Torino': 'https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_Logo.svg',
  'مونزا': 'https://upload.wikimedia.org/wikipedia/en/d/d6/AC_Monza_logo.svg',
  'Monza': 'https://upload.wikimedia.org/wikipedia/en/d/d6/AC_Monza_logo.svg',
  'جنوى': 'https://upload.wikimedia.org/wikipedia/en/6/6c/Genoa_C.F.C._logo.svg',
  'Genoa': 'https://upload.wikimedia.org/wikipedia/en/6/6c/Genoa_C.F.C._logo.svg',
  'أودينيزي': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Udinese_Calcio_logo.svg',
  'Udinese': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Udinese_Calcio_logo.svg',
  'كالياري': 'https://upload.wikimedia.org/wikipedia/en/6/61/Cagliari_Calcio_1920.svg',
  'Cagliari': 'https://upload.wikimedia.org/wikipedia/en/6/61/Cagliari_Calcio_1920.svg',
  'إمبولي': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Empoli_F.C._logo.svg',
  'Empoli': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Empoli_F.C._logo.svg',
  'فيرونا': 'https://upload.wikimedia.org/wikipedia/en/9/92/Hellas_Verona_FC_logo_%282020%29.svg',
  'Verona': 'https://upload.wikimedia.org/wikipedia/en/9/92/Hellas_Verona_FC_logo_%282020%29.svg',
  'ليتشي': 'https://upload.wikimedia.org/wikipedia/en/4/41/U.S._Lecce_logo.svg',
  'Lecce': 'https://upload.wikimedia.org/wikipedia/en/4/41/U.S._Lecce_logo.svg',
  'بارما': 'https://upload.wikimedia.org/wikipedia/en/d/d2/Parma_Calcio_1913_logo.svg',
  'Parma': 'https://upload.wikimedia.org/wikipedia/en/d/d2/Parma_Calcio_1913_logo.svg',
  'كومو': 'https://upload.wikimedia.org/wikipedia/en/3/3d/Como_1907_logo.svg',
  'Como': 'https://upload.wikimedia.org/wikipedia/en/3/3d/Como_1907_logo.svg',
  'فينيسيا': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Venezia_FC_logo_2022.svg',
  'Venezia': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Venezia_FC_logo_2022.svg',

  // Bundesliga
  'باير ليفركوزن': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'Bayer Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'بايرن ميونخ': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'شتوتغارت': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg',
  'VfB Stuttgart': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg',
  'لايبزيج': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  'RB Leipzig': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  'بوروسيا دورتموند': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'آينتراخت فرانكفورت': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg',
  'Eintracht Frankfurt': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg',
  'هوفنهايم': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_TSG_Hoffenheim.svg',
  'Hoffenheim': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_TSG_Hoffenheim.svg',
  'فرايبورغ': 'https://upload.wikimedia.org/wikipedia/en/6/6d/SC_Freiburg_logo.svg',
  'SC Freiburg': 'https://upload.wikimedia.org/wikipedia/en/6/6d/SC_Freiburg_logo.svg',
  'فيردر بريمن': 'https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg',
  'Werder Bremen': 'https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg',
  'أوغسبورغ': 'https://upload.wikimedia.org/wikipedia/en/c/c5/FC_Augsburg_logo.svg',
  'Augsburg': 'https://upload.wikimedia.org/wikipedia/en/c/c5/FC_Augsburg_logo.svg',
  'هايدنهايم': 'https://upload.wikimedia.org/wikipedia/en/0/0b/1._FC_Heidenheim_1846.svg',
  'Heidenheim': 'https://upload.wikimedia.org/wikipedia/en/0/0b/1._FC_Heidenheim_1846.svg',
  'بوروسيا مونشنغلادباخ': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg',
  'Gladbach': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg',
  'فولفسبورغ': 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg',
  'Wolfsburg': 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg',
  'ماينز': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/FSV_Mainz_05_Logo.svg',
  'Mainz': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/FSV_Mainz_05_Logo.svg',
  'بوخوم': 'https://upload.wikimedia.org/wikipedia/commons/7/72/VfL_Bochum_logo.svg',
  'Bochum': 'https://upload.wikimedia.org/wikipedia/commons/7/72/VfL_Bochum_logo.svg',
  'سانت باولي': 'https://upload.wikimedia.org/wikipedia/en/e/ee/FC_St._Pauli_logo.svg',
  'St. Pauli': 'https://upload.wikimedia.org/wikipedia/en/e/ee/FC_St._Pauli_logo.svg',
  'هولشتاين كيل': 'https://upload.wikimedia.org/wikipedia/en/2/23/Holstein_Kiel_logo.svg',
  'Holstein Kiel': 'https://upload.wikimedia.org/wikipedia/en/2/23/Holstein_Kiel_logo.svg',

  // Ligue 1
  'باريس سان جيرمان': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'موناكو': 'https://upload.wikimedia.org/wikipedia/en/4/4c/AS_Monaco_FC.svg',
  'AS Monaco': 'https://upload.wikimedia.org/wikipedia/en/4/4c/AS_Monaco_FC.svg',
  'ليل': 'https://upload.wikimedia.org/wikipedia/en/3/3f/Lille_OSC_2017_logo.svg',
  'Lille': 'https://upload.wikimedia.org/wikipedia/en/3/3f/Lille_OSC_2017_logo.svg',
  'بريست': 'https://upload.wikimedia.org/wikipedia/en/0/05/Stade_Brestois_29_logo.svg',
  'Brest': 'https://upload.wikimedia.org/wikipedia/en/0/05/Stade_Brestois_29_logo.svg',
  'نيس': 'https://upload.wikimedia.org/wikipedia/en/2/2e/OGC_Nice_logo.svg',
  'Nice': 'https://upload.wikimedia.org/wikipedia/en/2/2e/OGC_Nice_logo.svg',
  'ليون': 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg',
  'Lyon': 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg',
  'لانس': 'https://upload.wikimedia.org/wikipedia/en/c/cc/RC_Lens_logo.svg',
  'Lens': 'https://upload.wikimedia.org/wikipedia/en/c/cc/RC_Lens_logo.svg',
  'مارسيليا': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
  'Marseille': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
  'رين': 'https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg',
  'Rennes': 'https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg',
  'ريمس': 'https://upload.wikimedia.org/wikipedia/en/0/02/Stade_de_Reims_logo.svg',
  'Reims': 'https://upload.wikimedia.org/wikipedia/en/0/02/Stade_de_Reims_logo.svg',
  'تولوز': 'https://upload.wikimedia.org/wikipedia/en/8/8b/Toulouse_FC_logo_2018.svg',
  'Toulouse': 'https://upload.wikimedia.org/wikipedia/en/8/8b/Toulouse_FC_logo_2018.svg',
  'مونبلييه': 'https://upload.wikimedia.org/wikipedia/en/a/a8/Montpellier_HSC_logo.svg',
  'Montpellier': 'https://upload.wikimedia.org/wikipedia/en/a/a8/Montpellier_HSC_logo.svg',
  'ستراسبورغ': 'https://upload.wikimedia.org/wikipedia/en/8/80/Racing_Club_de_Strasbourg_logo.svg',
  'Strasbourg': 'https://upload.wikimedia.org/wikipedia/en/8/80/Racing_Club_de_Strasbourg_logo.svg',
  'نانت': 'https://upload.wikimedia.org/wikipedia/en/f/f0/FC_Nantes_logo_2019.svg',
  'Nantes': 'https://upload.wikimedia.org/wikipedia/en/f/f0/FC_Nantes_logo_2019.svg',
  'لو هافر': 'https://upload.wikimedia.org/wikipedia/en/9/9a/Le_Havre_AC_logo.svg',
  'Le Havre': 'https://upload.wikimedia.org/wikipedia/en/9/9a/Le_Havre_AC_logo.svg',
  'أوكسير': 'https://upload.wikimedia.org/wikipedia/en/6/60/AJ_Auxerre_logo.svg',
  'Auxerre': 'https://upload.wikimedia.org/wikipedia/en/6/60/AJ_Auxerre_logo.svg',
  'أنجيه': 'https://upload.wikimedia.org/wikipedia/en/d/d4/Angers_SCO_logo.svg',
  'Angers': 'https://upload.wikimedia.org/wikipedia/en/d/d4/Angers_SCO_logo.svg',
  'سانت إيتيان': 'https://upload.wikimedia.org/wikipedia/en/2/2c/AS_Saint-%C3%89tienne_logo.svg',
  'Saint-Etienne': 'https://upload.wikimedia.org/wikipedia/en/2/2c/AS_Saint-%C3%89tienne_logo.svg',

  // Other UCL
  'بنفيكا': 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg',
  'Benfica': 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg',
  'بورتو': 'https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg',
  'Porto': 'https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg',
  'سبورتينغ لشبونة': 'https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_CP.svg',
  'Sporting CP': 'https://upload.wikimedia.org/wikipedia/en/3/3e/Sporting_CP.svg',
  'أياكس': 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
  'Ajax': 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
  'فينورد': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Feyenoord_logo.svg',
  'Feyenoord': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Feyenoord_logo.svg',
  'بي إس في آيندهوفن': 'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',
  'PSV': 'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',
  'سلتيك': 'https://upload.wikimedia.org/wikipedia/en/3/3e/Celtic_FC_crest.svg',
  'Celtic': 'https://upload.wikimedia.org/wikipedia/en/3/3e/Celtic_FC_crest.svg',
  'رينجرز': 'https://upload.wikimedia.org/wikipedia/en/4/43/Rangers_FC.svg',
  'Rangers': 'https://upload.wikimedia.org/wikipedia/en/4/43/Rangers_FC.svg',
  'شاختار دونيتسك': 'https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg',
  'Shakhtar': 'https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg',
  'ريد بول سالزبورغ': 'https://upload.wikimedia.org/wikipedia/en/7/77/FC_Red_Bull_Salzburg_logo.svg',
  'Salzburg': 'https://upload.wikimedia.org/wikipedia/en/7/77/FC_Red_Bull_Salzburg_logo.svg',
  'دينامو زغرب': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/GNK_Dinamo_Zagreb_logo.svg',
  'Dinamo Zagreb': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/GNK_Dinamo_Zagreb_logo.svg',
  'النجم الأحمر': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/FK_Crvena_zvezda_logo.svg',
  'Red Star Belgrade': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/FK_Crvena_zvezda_logo.svg',
};

/**
 * Get team logo by name
 */
export const getTeamLogo = (name: string): string | undefined => {
  const cleanName = name.trim();
  
  // Check local mapping first
  if (LOCAL_TEAM_LOGOS[cleanName]) return LOCAL_TEAM_LOGOS[cleanName];
  
  // Try partial match in local mapping
  const localEntries = Object.entries(LOCAL_TEAM_LOGOS);
  const localFound = localEntries.find(([key]) => cleanName.includes(key) || key.includes(cleanName));
  if (localFound) return localFound[1];

  if (TEAM_LOGOS[cleanName]) return TEAM_LOGOS[cleanName];

  // Try removing common suffixes
  const suffixes = [' FC', ' CF', ' F.C.', ' C.F.', ' Club', ' de Fútbol', ' de Futbol'];
  for (const suffix of suffixes) {
    if (cleanName.endsWith(suffix)) {
      const baseName = cleanName.slice(0, -suffix.length).trim();
      if (TEAM_LOGOS[baseName]) return TEAM_LOGOS[baseName];
    }
  }

  // Try partial match
  const entries = Object.entries(TEAM_LOGOS);
  const found = entries.find(([key]) => cleanName.includes(key) || key.includes(cleanName));
  return found?.[1];
};
