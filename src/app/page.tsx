import { Suspense } from 'react';
import Header from '@/components/dashboard/Header';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function Dashboard() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <Header />
      <Suspense fallback={null}>
        <DashboardShell />
      </Suspense>

      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '14px 24px',
          textAlign: 'center',
          marginTop: 24,
          background: 'var(--bg-nav)',
        }}
      >
        <span
          style={{
            color: 'var(--text-faint)',
            fontSize: '11px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Iconic Founders Group · CEO Executive Dashboard
        </span>
      </footer>
    </div>
  );
}
