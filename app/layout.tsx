import type { Metadata } from 'next'
import { Barlow_Semi_Condensed } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Toaster } from 'sonner'

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  style: ['normal'],
  variable: '--font-barlow',
  display: 'swap',
})

const antiFlashScript = `(function(){try{var s=localStorage.getItem('inventapro-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(d?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`

export const metadata: Metadata = {
  title: 'InventaPro — Inventory Control',
  description: 'Professional inventory control system for warehouses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={barlow.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-active)',
                  color: 'var(--text-primary)',
                },
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
