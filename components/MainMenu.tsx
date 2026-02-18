
import React, { useState } from 'react';
import { PlayerConfig, DeviceMode } from '../types.ts';

interface MainMenuProps {
  onStart: (players: PlayerConfig[], theme: 'CITY' | 'DESERT', deviceMode: DeviceMode) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
  const [p1Name, setP1Name] = useState('Racer One');
  const [p1Color, setP1Color] = useState('#3b82f6');
  const [p2Name, setP2Name] = useState('Racer Two');
  const [p2Color, setP2Color] = useState('#f97316');
  const [theme, setTheme] = useState<'CITY' | 'DESERT'>('CITY');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('COMPUTER');

  const handleStart = () => {
    const players: PlayerConfig[] = [
      { name: p1Name, color: p1Color }
    ];
    if (numPlayers === 2) {
      players.push({ name: p2Name, color: p2Color });
    }
    onStart(players, theme, deviceMode);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-purple-900/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />

      <div className="z-10 text-center mb-6">
        <h1 className="text-6xl md:text-8xl font-black font-orbitron tracking-tighter mb-2 italic">
          TURBO <span className="text-blue-500">NITRO</span>
        </h1>
        <p className="text-slate-400 font-medium tracking-widest uppercase italic">Arcade Highway Racing</p>
      </div>

      <div className="z-10 bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setNumPlayers(1)}
              className={`p-4 rounded-2xl border-2 transition-all ${numPlayers === 1 ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
            >
              <div className="font-bold text-lg mb-1">Solo Run</div>
              <div className="text-xs text-slate-400">Personal Best</div>
            </button>
            <button 
              onClick={() => setNumPlayers(2)}
              className={`p-4 rounded-2xl border-2 transition-all ${numPlayers === 2 ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
            >
              <div className="font-bold text-lg mb-1">Local PvP</div>
              <div className="text-xs text-slate-400">Split Screen</div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 bg-black/40 rounded-2xl border border-white/5">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Player 1 Config</label>
              <div className="space-y-3">
                <input 
                  value={p1Name}
                  onChange={e => setP1Name(e.target.value)}
                  placeholder="Player 1 Name"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-orbitron text-blue-400 text-sm"
                />
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-white/20 overflow-hidden relative"
                    style={{ backgroundColor: p1Color }}
                  >
                    <input 
                      type="color" 
                      value={p1Color}
                      onChange={e => setP1Color(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <span className="text-xs font-bold uppercase text-slate-400">Paint Job</span>
                </div>
              </div>
            </div>

            {numPlayers === 2 && (
              <div className="space-y-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Player 2 Config</label>
                <div className="space-y-3">
                  <input 
                    value={p2Name}
                    onChange={e => setP2Name(e.target.value)}
                    placeholder="Player 2 Name"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-orbitron text-orange-400 text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-white/20 overflow-hidden relative"
                      style={{ backgroundColor: p2Color }}
                    >
                      <input 
                        type="color" 
                        value={p2Color}
                        onChange={e => setP2Color(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="text-xs font-bold uppercase text-slate-400">Paint Job</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-4 items-center justify-between bg-black/40 p-2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold uppercase text-slate-500 ml-4">Device</span>
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setDeviceMode('COMPUTER')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${deviceMode === 'COMPUTER' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                >
                  <span>⌨️</span> PC
                </button>
                <button 
                  onClick={() => setDeviceMode('MOBILE')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 ${deviceMode === 'MOBILE' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  <span>📱</span> Mobile
                </button>
              </div>
            </div>

            <div className="flex gap-4 items-center justify-between bg-black/40 p-2 rounded-2xl border border-white/5">
              <span className="text-xs font-bold uppercase text-slate-500 ml-4">Tracks</span>
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setTheme('CITY')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${theme === 'CITY' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                >
                  Neon
                </button>
                <button 
                  onClick={() => setTheme('DESERT')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${theme === 'DESERT' ? 'bg-amber-700 text-white' : 'text-slate-400'}`}
                >
                  Badlands
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-5 rounded-2xl font-orbitron font-black text-2xl tracking-tight shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            START ENGINE
          </button>
        </div>
      </div>
    </div>
  );
};
