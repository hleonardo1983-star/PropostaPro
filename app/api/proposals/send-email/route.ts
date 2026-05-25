import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, link, title } = await request.json()
    if (!email || !link) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_placeholder') {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:2rem auto;background:white;border-radius:16px;overflow:hidden;border:1px solid rgba(15,14,12,0.1);">
    <div style="background:#0f0e0c;padding:1.5rem 2rem;">
      <span style="font-size:1.25rem;color:#f5f0e8;">PropostaFácil</span>
    </div>
    <div style="padding:2.5rem;">
      <h2 style="font-size:1.5rem;margin:0 0 0.75rem;color:#0f0e0c;">Você recebeu uma proposta!</h2>
      <p style="color:#7a7368;line-height:1.6;margin:0 0 2rem;">A proposta <strong style="color:#0f0e0c;">${title}</strong> está aguardando sua análise e assinatura.</p>
      <a href="${link}" style="display:inline-block;background:#0f766e;color:white;padding:0.9rem 2rem;border-radius:100px;text-decoration:none;font-weight:600;font-size:1rem;">Ver e assinar proposta</a>
      <p style="color:#7a7368;font-size:0.8rem;margin-top:2rem;">Ou acesse: <a href="${link}" style="color:#0f766e;">${link}</a></p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: [email],
        subject: `Proposta: ${title}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
