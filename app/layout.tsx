import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PropostaFácil — Orçamentos que fecham negócios',
  description: 'Crie propostas, envie por WhatsApp ou e-mail, receba assinatura e gere cobrança automaticamente.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
