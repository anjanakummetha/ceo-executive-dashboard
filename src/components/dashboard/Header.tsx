'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RefreshCw, LogOut } from 'lucide-react';
import { DEFAULT_TIMEZONE, formatDate, formatTime } from '@/lib/time/format';

export default function Header() {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [tzLabel, setTzLabel] = useState('');

  useEffect(() => {
    const short =
      new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIMEZONE, timeZoneName: 'short' })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value ?? 'MT';
    setTzLabel(short);

    const update = () => {
      const now = new Date();
      setTime(formatTime(now, { timeZone: DEFAULT_TIMEZONE }));
      setDate(formatDate(now, { weekday: true, timeZone: DEFAULT_TIMEZONE }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header
      style={{
        background: 'var(--bg-nav)',
        borderBottom: '1px solid var(--gold-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="sticky top-0 z-50 px-6 py-3"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/ifg-logo.png"
            alt="Iconic Founders Group"
            width={44}
            height={44}
            className="rounded-lg"
            priority
          />
          <div>
            <div
              style={{
                color: 'var(--gold-primary)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Iconic Founders Group
            </div>
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.2px',
                lineHeight: 1.2,
              }}
            >
              CEO Executive Dashboard
            </div>
          </div>

          <div
            style={{
              background: 'var(--success-muted)',
              border: '1px solid rgba(45, 138, 94, 0.25)',
              borderRadius: 20,
            }}
            className="px-3 py-1 flex items-center gap-2 ml-1"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            <span style={{ color: 'var(--success)', fontSize: '10px', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        <div className="text-center hidden md:block">
          <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700 }}>Hello, Kory</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 1 }}>{date}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              style={{
                color: 'var(--text-primary)',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {time}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: 1 }}>{tzLabel}</div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/[0.04]"
              style={{ border: '1px solid var(--gold-border)', background: 'var(--bg-card)' }}
              title="Refresh page"
            >
              <RefreshCw size={13} style={{ color: 'var(--gold-primary)' }} />
            </button>
            {process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true' && (
              <button
                type="button"
                onClick={logout}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/[0.04]"
                style={{ border: '1px solid var(--gold-border)', background: 'var(--bg-card)' }}
                title="Sign out"
              >
                <LogOut size={13} style={{ color: 'var(--gold-primary)' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
