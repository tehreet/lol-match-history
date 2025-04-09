import { NextResponse } from 'next/server';
import axios from 'axios';

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION_API_BASE = 'https.na1.api.riotgames.com'; // e.g., na1, euw1, kr
const ROUTING_VALUE_API_BASE = 'https.americas.api.riotgames.com'; // e.g., americas, europe, asia

// Helper function to make Riot API requests
const riotApiRequest = async (url: string) => {
  try {
    const response = await axios.get(url, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Riot API Error (${error.response?.status}): ${error.message}`, error.response?.data);
    throw new Error(`Riot API request failed: ${error.response?.statusText || error.message}`);
  }
};

export async function GET(request: Request) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: 'API key is not configured.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const summonerName = searchParams.get('summonerName');

  if (!summonerName) {
    return NextResponse.json({ error: 'Summoner name is required.' }, { status: 400 });
  }

  try {
    // 1. Get Summoner PUUID
    const summonerUrl = `${REGION_API_BASE}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
    const summonerData = await riotApiRequest(summonerUrl);
    const puuid = summonerData.puuid;

    if (!puuid) {
      return NextResponse.json({ error: 'Could not find summoner PUUID.' }, { status: 404 });
    }

    // 2. Get Match IDs (last 5 games)
    const matchIdsUrl = `${ROUTING_VALUE_API_BASE}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=5`;
    const matchIds: string[] = await riotApiRequest(matchIdsUrl);

    if (!matchIds || matchIds.length === 0) {
      return NextResponse.json({ matches: [], message: 'No recent matches found.' });
    }

    // 3. Get Match Details for each Match ID
    const matchDetailsPromises = matchIds.map(matchId => {
      const matchDetailUrl = `${ROUTING_VALUE_API_BASE}/lol/match/v5/matches/${matchId}`;
      return riotApiRequest(matchDetailUrl);
    });

    const matchDetailsResults = await Promise.all(matchDetailsPromises);

    // 4. Process and filter match details (simplified example)
    const processedMatches = matchDetailsResults.map(match => {
        const participant = match.info.participants.find((p: any) => p.puuid === puuid);
        return {
            matchId: match.metadata.matchId,
            gameMode: match.info.gameMode,
            win: participant?.win,
            championName: participant?.championName,
            kills: participant?.kills,
            deaths: participant?.deaths,
            assists: participant?.assists,
            // Add more data as needed
        };
    });

    return NextResponse.json({ matches: processedMatches });

  } catch (error: any) {
    console.error('Error fetching match history:', error);
    // Provide more specific error messages based on Riot API errors if possible
    if (error.message.includes('404')) {
        return NextResponse.json({ error: `Summoner '${summonerName}' not found.` }, { status: 404 });
    }
     if (error.message.includes('403')) {
        return NextResponse.json({ error: 'Riot API Key forbidden. Check if it expired or is invalid.' }, { status: 403 });
    }
    return NextResponse.json({ error: `Failed to fetch match history: ${error.message}` }, { status: 500 });
  }
}
