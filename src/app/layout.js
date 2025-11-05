import Script from 'next/script';
import ErrorLogger from '@/components/ErrorLogger';
import { SkeletonTheme } from 'react-loading-skeleton';

import './globals.css';
import "react-loading-skeleton/dist/skeleton.css";

export const metadata = {
  title: 'PyVoteBot',
  description: 'Create and manage giveaways',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js?59" strategy="beforeInteractive" />
      </head>
      <body cz-shortcut-listen="true">
        <ErrorLogger />
        <SkeletonTheme baseColor="#737575" highlightColor="#8B8989">
          {children}
        </SkeletonTheme>
      </body>
    </html>
  );
}