'use client';

import { useState, useEffect } from 'react';
import { Bell, Settings, RefreshCw } from 'lucide-react';

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
        background: '#252525',
        borderBottom: '1px solid rgba(201, 160, 68, 0.2)',
      }}
      className="sticky top-0 z-50 px-6 py-3"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left — Brand */}
        <div className="flex items-center gap-4">
          <div style={{ width: 1, height: 32, background: 'rgba(201,160,68,0.3)', display: 'none' }} />
          <div>
            <div style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Iconic Founders Group
            </div>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '0.2px', lineHeight: 1.2 }}>
              CEO Executive Dashboard
            </div>
          </div>

          <div
            style={{ background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.2)', borderRadius: 20 }}
            className="px-3 py-1 flex items-center gap-2 ml-1"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4caf82' }} />
            <span style={{ color: '#777', fontSize: '10px', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        {/* Center */}
        <div className="text-center hidden md:block">
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>Hello, Kory</div>
          <div style={{ color: '#666', fontSize: '11px', marginTop: 1 }}>{date}</div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {time}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ border: '1px solid rgba(201,160,68,0.2)', background: 'rgba(255,255,255,0.03)' }}
              title="Refresh"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <RefreshCw size={13} style={{ color: '#c9a044' }} />
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all relative"
              style={{ border: '1px solid rgba(201,160,68,0.2)', background: 'rgba(255,255,255,0.03)' }}
              title="Notifications"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <Bell size={13} style={{ color: '#c9a044' }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center font-bold" style={{ fontSize: 9 }}>
                7
              </span>
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ border: '1px solid rgba(201,160,68,0.2)', background: 'rgba(255,255,255,0.03)' }}
              title="Settings"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <Settings size={13} style={{ color: '#c9a044' }} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
