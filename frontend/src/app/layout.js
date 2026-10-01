import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import '../styles/main.scss';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../components/Toast';
import { LangProvider } from '../lib/i18n';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-head' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono' });

export const metadata = {
  title: 'FrameFlow — Production Control Center',
  description: 'Manage your productions from pre-production to final delivery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
        <LangProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}

