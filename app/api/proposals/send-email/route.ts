import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { proposalId, email, link, title } = await request.json()
    if (!email || !link) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PropostaPro <noreply@propostapro.com.br>',
        to: email,
        subject: `Proposta: ${title}`,
        html: `
          <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;padding:2rem">
            <h2 style="color:#0d1117;margin-bottom:1rem">Você recebeu uma proposta</h2>
            <p style="color:#6b7280;margin-bottom:2rem">Clique no botão abaixo para visualizar e assinar a proposta <strong>${title}</strong>.</p>
            <a href="${link}" style="background:#2563eb;color:white;padding:0.9rem 2rem;border-radius:100px;text-decoration:none;font-weight:700;display:inline-block">
              Ver proposta →
            </a>
            <p style="margin-top:2rem;color:#9ca3af;font-size:0.85rem">Ou acesse: <a href="${link}" style="color:#2563eb">${link}</a></p>
            <hr style="margin:2rem 0;border:none;border-top:1px solid #e5e7eb" />
            <p style="color:#9ca3af;font-size:0.75rem">Enviado via PropostaPro</p>
          </div>
        `
      })
    })
    if (!res.ok) throw new Error('Erro ao enviar e-mail')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
