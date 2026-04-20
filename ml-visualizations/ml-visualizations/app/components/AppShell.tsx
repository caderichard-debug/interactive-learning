import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

/**
 * STYLE-GUIDE: Sidebar (220px) + main (flex:1, overflowY:auto). Single scroll container in main.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
