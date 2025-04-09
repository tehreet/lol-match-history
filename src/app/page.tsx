import Image from "next/image";
import { useState } from 'react';

// Define an interface for the match data structure
interface Match {
  matchId: string;
  gameMode: string;
  win: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
}

export default function Home() {
  const [summonerName, setSummonerName] = useState('');
  const [matches, setMatches] = useState<Match[]>([]); // State for match data
  const [loading, setLoading] = useState(false);      // State for loading indicator
  const [error, setError] = useState<string | null>(null); // State for error messages

  const handleSearch = async () => {
    if (!summonerName) return;
    setLoading(true);
    setError(null);
    setMatches([]); // Clear previous results

    try {
      const response = await fetch(`/api/match-history?summonerName=${encodeURIComponent(summonerName)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      if (data.matches && data.matches.length > 0) {
        setMatches(data.matches);
      } else if (data.message) {
        setError(data.message); // Handle cases like 'No recent matches found.'
      } else {
         setMatches([]); // Ensure matches are cleared if API returns empty success
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch match history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-12 bg-gray-900 text-white">
      <main className="flex flex-col items-center w-full flex-1 px-4 sm:px-20">
        <h1 className="text-4xl sm:text-6xl font-bold mb-8 text-center">
          LoL Match History
        </h1>

        {/* Search Input and Button */} 
        <div className="flex flex-col sm:flex-row items-center mb-8 w-full max-w-md">
          <input
            type="text"
            value={summonerName}
            onChange={(e) => setSummonerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // Allow search on Enter key
            placeholder="Enter Summoner Name (e.g., Doublelift)"
            className="flex-grow px-4 py-2 mb-4 sm:mb-0 sm:mr-4 border border-gray-700 rounded bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            aria-label="Summoner Name Input"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !summonerName} // Disable button when loading or input is empty
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            aria-label="Search Summoner Button"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results Area */} 
        <div id="results" className="mt-8 w-full max-w-4xl">
          {/* Loading Indicator */}
          {loading && <p className="text-center text-gray-400">Loading matches...</p>}

          {/* Error Message */}
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {/* Match List */}
          {!loading && !error && matches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4 text-center">Last 5 Games</h2>
              {matches.map((match) => (
                <div key={match.matchId} className={`p-4 rounded shadow-md ${match.win ? 'bg-green-800 bg-opacity-30 border-l-4 border-green-500' : 'bg-red-800 bg-opacity-30 border-l-4 border-red-500'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-lg font-semibold">{match.championName}</p>
                      <p className="text-sm text-gray-400">{match.gameMode.replace(/_/g, ' ').replace('CLASSIC', 'Summoner\'s Rift')}</p>
                    </div>
                    <div className={`text-lg font-bold ${match.win ? 'text-green-400' : 'text-red-400'}`}>
                      {match.win ? 'Victory' : 'Defeat'}
                    </div>
                    <div className="text-right">
                       <p className="text-md">{match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}</p>
                       <p className="text-sm text-gray-500">KDA</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

           {/* Initial Prompt/No Matches Found (after search) */}
           {!loading && !error && matches.length === 0 && summonerName !== '' && (
              <p className="text-center text-gray-400">No recent matches found for this summoner or initial state.</p>
           )}
            {/* Initial Prompt (before search) */}
           {!loading && !error && matches.length === 0 && summonerName === '' && (
             <p className="text-center text-gray-400">Enter a summoner name to see their last 5 games.</p>
           )}
        </div>
      </main>

      <footer className="w-full h-20 flex justify-center items-center border-t border-gray-700 mt-12">
        <p className="text-gray-500">Powered by Next.js & Riot API</p>
      </footer>
    </div>
  );
}
