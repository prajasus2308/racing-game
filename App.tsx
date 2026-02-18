
import React, { useState } from 'react';
import { GameMode, PlayerConfig, RaceResult, DeviceMode } from './types.ts';
import { MainMenu } from './components/MainMenu.tsx';
import { GameCanvas } from './components/GameCanvas.tsx';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [players, setPlayers] = useState<PlayerConfig[]>([]);
  const [theme, setTheme] = useState<'CITY' | 'DESERT'>('CITY');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('COMPUTER');
  const [results, setResults] = useState<RaceResult[]>([]);

  const startGame = (p: PlayerConfig[], t: 'CITY' | 'DESERT', d: DeviceMode) => {
    setPlayers(p);
    setTheme(t);
    setDeviceMode(d);
    setMode(GameMode.RACING);
  };

  const handleFinish = (raceResults: RaceResult[]) => {
    setResults(raceResults);
    setMode(GameMode.RESULTS);
  };

  const reset = () => {
    setMode(GameMode.MENU);
    setResults([]);
  };

  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden">
      {mode === GameMode.MENU && (
        <MainMenu onStart={startGame} />
      )}

      {mode === GameMode.RACING && (
        <GameCanvas 
          players={players} 
          theme={theme} 
          deviceMode={deviceMode}
          onFinish={handleFinish}
          onLeave={reset}
        />
      )}

      {mode === GameMode.RESULTS && (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-orbitron font-black text-white italic mb-4 uppercase">Chase Summary</h2>
              <div className="h-1 w-32 bg-blue-600 mx-auto rounded-full" />
            </div>

            <div className="space-y-4 mb-12">
              {[...results].sort((a,b) => b.distance - a.distance).map((res, i) => (
                <div 
                  key={res.playerName}
                  className={`flex items-center justify-between p-6 rounded-2xl border-2 ${i === 0 ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-800/50 border-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${i === 0 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-xl font-orbitron font-bold text-white uppercase">{res.playerName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        LAPS: {res.laps} | DISTANCE: {res.distance} KM | TOP SPEED: {res.topSpeed} KM/H
                      </div>
                    </div>
                  </div>
                  {i === 0 && <span className="text-2xl">⚡</span>}
                </div>
              ))}
            </div>

            <button 
              onClick={reset}
              className="w-full py-5 bg-white text-black font-orbitron font-black text-xl rounded-2xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
            >
              RETURN TO GARAGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
