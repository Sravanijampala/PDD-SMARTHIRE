import './globals.css';
import React from 'react';
import { AuthProvider } from '../components/AuthProvider';

import { CapacitorBackButton } from '../components/CapacitorBackButton';

export const metadata = {
  title: 'SmartHire - AI-Powered Interviewing',
  description: 'Master your interviews with AI performance analysis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, width: '100%' }}>
      <body style={{ margin: 0, padding: 0, width: '100%' }}>
        <AuthProvider>
          <CapacitorBackButton />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
