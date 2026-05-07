import { API_BASE } from '../App';
import { Match, MatchStats, MatchEvent, Highlight } from '../data';

export const fetchLiveMatches = async (date: string): Promise<Match[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/matches?date=${date}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching live matches:", error);
    throw error;
  }
};

export const fetchLiveStandings = async (league: string) => {
  try {
    const response = await fetch(`${API_BASE}/api/standings?league=${encodeURIComponent(league)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching live standings:", error);
    throw error;
  }
};

export const fetchLiveHighlights = async (league: string): Promise<Highlight[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/highlights?league=${encodeURIComponent(league)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching live highlights:", error);
    throw error;
  }
};

export const fetchLiveMatchDetails = async (matchId: string): Promise<{stats?: MatchStats, events: MatchEvent[]}> => {
  try {
    const response = await fetch(`${API_BASE}/api/matches/${matchId}/details`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching match details:", error);
    return { events: [] };
  }
};
