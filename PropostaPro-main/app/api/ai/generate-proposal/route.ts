import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()
    if (!description) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 503 })
    }

    const validUntil = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Você é especialista em propostas comerciais profissionais brasileiras.
Com base na descrição abaixo, gere um JSON com os dados da proposta.

Descrição: "${description}"

Retorne APENAS um JSON válido, sem markdown, sem texto extra, neste formato exato:
{"title":"título profissional da proposta","notes":"condições comerciais, prazo e pagamento sugeridos","valid_until":"${validUntil}","client_name":"nome do cliente ou vazio","client_email":"email ou vazio","client_phone":"telefone ou vazio","services":[{"description":"serviço detalhado","quantity":1,"unit_price":0,"type":"service"}],"products":[]}

Regras:
- services: apenas serviços prestados (consultoria, manutenção, desenvolvimento, etc)
- products: apenas produtos físicos ou licenças. Se não houver, retorne []
- unit_price como número sem formatação (ex: 4800.00)
- Título objetivo e profissional
- notes com condições de pagamento e prazo sugeridos`
        }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'Erro na API de IA' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('Generate proposal error:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
