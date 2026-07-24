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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const done = () => setRefreshing(false);
    window.addEventListener('dashboard:refresh-done', done);
    return () => window.removeEventListener('dashboard:refresh-done', done);
  }, []);

  function refreshAll() {
    if (refreshing) return;
    setRefreshing(true);
    window.dispatchEvent(new Event('dashboard:refresh-request'));
    // Safety net in case a fetch hangs — never leave the spinner stuck.
    window.setTimeout(() => setRefreshing(false), 60_000);
  }

  useEffect(() => {
    const short =
      new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIMEZONE, timeZoneName: 'short' })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value ?? 'MT';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only init, must run after mount (SSR-safe)
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
        background: 'linear-gradient(180deg, rgba(255,255,255,0.74), rgba(246,243,236,0.56))',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 6px 24px rgba(44,40,36,0.10)',
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
            className="rounded-lg lift press"
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
              className="float-title"
              style={{
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 800,
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
              onClick={refreshAll}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/[0.04]"
              style={{ border: '1px solid var(--gold-border)', background: 'var(--bg-card)', cursor: refreshing ? 'progress' : 'pointer' }}
              title={refreshing ? 'Refreshing all data…' : 'Refresh all data (live + AI)'}
            >
              <RefreshCw
                size={13}
                className={refreshing ? 'animate-spin' : ''}
                style={{ color: 'var(--gold-primary)' }}
              />
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
