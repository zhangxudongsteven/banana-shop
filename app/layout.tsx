import React from 'react'
import { LanguageProvider } from '../i18n/context'
import { ThemeProvider } from '../theme/context'
import './globals.css'

export const metadata = {
  title: '🍌 Banana Shop',
  description: 'AI Image Editor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
