'use client';

import { useState, useEffect } from 'react';
import { Bell, Settings, RefreshCw, Cloud } from 'lucide-react';

export default function Header() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #2a2a2a 0%, #323232 100%)',
        borderBottom: '1px solid rgba(201, 160, 68, 0.3)',
      }}
      className="sticky top-0 z-50 px-6 py-3"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left — Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{ background: 'linear-gradient(135deg, #c9a044, #d4af60)' }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-[#2a2a2a]"
            >
              IF
            </div>
            <div>
              <div className="text-[10px] tracking-[2px] uppercase font-semibold" style={{ color: '#c9a044' }}>
                Iconic Founders
              </div>
              <div className="text-white font-bold text-sm leading-none">CEO Command Center</div>
            </div>
          </div>

          <div
            style={{ background: 'rgba(201, 160, 68, 0.1)', borderColor: 'rgba(201, 160, 68, 0.25)' }}
            className="border rounded-full px-3 py-1 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 pulse-gold" />
            <span className="text-xs text-gray-300">Live</span>
          </div>
        </div>

        {/* Center — Kory's greeting */}
        <div className="text-center hidden md:block">
          <div className="text-white font-semibold text-base">Good morning, Kory</div>
          <div className="text-gray-400 text-xs">{date}</div>
        </div>

        {/* Right — clock, weather, actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-gray-400 text-xs">
            <Cloud size={14} style={{ color: '#c9a044' }} />
            <span>72°F — Partly Cloudy</span>
          </div>

          <div className="text-right">
            <div className="text-white font-bold text-lg leading-none tabular-nums">{time}</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: '#c9a044' }}>
              Local Time
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(201,160,68,0.3)' }}
              title="Refresh"
            >
              <RefreshCw size={14} style={{ color: '#c9a044' }} />
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 relative"
              style={{ border: '1px solid rgba(201,160,68,0.3)' }}
              title="Notifications"
            >
              <Bell size={14} style={{ color: '#c9a044' }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                7
              </span>
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(201,160,68,0.3)' }}
              title="Settings"
            >
              <Settings size={14} style={{ color: '#c9a044' }} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
