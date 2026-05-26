import Header from '@/components/dashboard/Header';
import TopPriorities from '@/components/dashboard/TopPriorities';
import DailyBriefing from '@/components/dashboard/DailyBriefing';
import EmailPanel from '@/components/dashboard/EmailPanel';
import MeetingsPanel from '@/components/dashboard/MeetingsPanel';
import CallsPanel from '@/components/dashboard/CallsPanel';
import AsanaPanel from '@/components/dashboard/AsanaPanel';
import HubSpotPanel from '@/components/dashboard/HubSpotPanel';
import LinkedInPanel from '@/components/dashboard/LinkedInPanel';
import HealthPanel from '@/components/dashboard/HealthPanel';

export default function Dashboard() {
  return (
    <div style={{ background: '#2e2e2e', minHeight: '100vh' }}>
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 py-5 space-y-5">
        {/* ── Daily Briefing (full width) ── */}
        <DailyBriefing />

        {/* ── Top Priorities banner (full width) ── */}
        <TopPriorities />

        {/* ── Main grid: 3 columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Meetings + Calls */}
          <div className="space-y-5">
            <MeetingsPanel />
            <CallsPanel />
          </div>

          {/* Column 2: Email + LinkedIn */}
          <div className="space-y-5">
            <EmailPanel />
            <LinkedInPanel />
          </div>

          {/* Column 3: Asana + HubSpot + Health */}
          <div className="space-y-5">
            <AsanaPanel />
            <HubSpotPanel />
            <HealthPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(201,160,68,0.15)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
        className="mt-6"
      >
        <div
          style={{ background: 'linear-gradient(135deg, #c9a044, #d4af60)' }}
          className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-[#2a2a2a]"
        >
          IF
        </div>
        <span style={{ color: '#555', fontSize: '11px', letterSpacing: '0.5px' }}>
          ICONIC FOUNDERS · CEO Command Center · Preserving Legacy
        </span>
      </footer>
    </div>
  );
}
