import type { Metadata } from 'next'
import './globals.css'
import { FreePlanBanner } from '@/components/FreePlanBanner'

export const metadata: Metadata = {
  title: 'PropostaPro — Orçamentos que fecham negócios',
  description: 'Crie propostas, envie por WhatsApp ou e-mail, receba assinatura e gere cobrança automaticamente.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <FreePlanBanner />
        {children}
      </body>
    </html>
  )
}
