'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function generateSignatureHash(data: { name: string; timestamp: string; proposalId: string }): string {
  const str = `${data.name}|${data.timestamp}|${data.proposalId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase() + '-' + Date.now().toString(16).toUpperCase()
}

export default function PublicProposalPage() {
  const [proposal, setProposal] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signerName, setSignerName] = useState('')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [printing, setPrinting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('proposals').select('*, clients(*)').eq('public_token', params.token).single()
      if (!p) { setLoading(false); return }
      setProposal(p)
      if (p.status === 'signed') setSigned(true)
      const { data: its } = await supabase.from('proposal_items').select('*').eq('proposal_id', p.id).order('sort_order')
      setItems(its || [])
      const { data: t } = await supabase.from('tenants').select('*').eq('id', p.tenant_id).single()
      setTenant(t)
      if (p.status === 'sent') {
        await supabase.from('proposals').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', p.id)
      }
      setLoading(false)
    }
    load()
  }, [params.token])

  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)

  async function handleSign() {
    if (!signerName.trim()) { alert('Digite seu nome completo para assinar'); return }
    setSigning(true)
    try {
      const timestamp = new Date().toISOString()
      const hash = generateSignatureHash({ name: signerName, timestamp, proposalId: proposal.id })
      const { error } = await supabase.from('proposals').update({
        status: 'signed', signed_at: timestamp, signer_name: signerName,
        signer_ip: 'web-client', signature_hash: hash,
      }).eq('id', proposal.id)
      if (error) throw error
      setSigned(true)
    } catch { alert('Erro ao assinar. Tente novamente.') }
    setSigning(false)
  }

  function handlePrint() {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 300)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
      <p style={{ color: '#6b7280' }}>Carregando proposta...</p>
    </div>
  )

  if (!proposal) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.75rem', fontWeight: 700 }}>Proposta não encontrada</h1>
      <p style={{ color: '#6b7280' }}>Este link pode ter expirado ou ser inválido.</p>
    </div>
  )

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'Outfit',system-ui,sans-serif" }}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit&family=Outfit&display=swap" rel="stylesheet" />

        {/* Header */}
        <div className="no-print" style={{ background: 'white', borderBottom: '1px solid rgba(17,24,39,0.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            {tenant?.name || 'PropostaPro'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {signed && <span style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', padding: '0.3rem 0.8rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600 }}>✅ Assinada</span>}
            <button onClick={handlePrint} disabled={printing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#111827', color: 'white', border: 'none', padding: '0.55rem 1.1rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
              {printing ? '⏳' : '⬇️'} {printing ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={printRef} className="print-area" style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Print header (só aparece no PDF) */}
          <div style={{ display: 'none' }} className="print-only">
            <h2 style={{ fontFamily: "'Outfit',sans-serif", marginBottom: '0.25rem' }}>{tenant?.name}</h2>
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          </div>

          {/* Title */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Proposta #{proposal.number}</p>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.75rem', color: '#111827' }}>{proposal.title}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#6b7280', flexWrap: 'wrap' }}>
              <span>📅 {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
              {proposal.valid_until && <span>⏰ Válida até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>}
              {proposal.clients?.name && <span>👤 {proposal.clients.name}</span>}
            </div>
          </div>

          {/* Items */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(17,24,39,0.08)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(17,24,39,0.06)', background: '#f9fafb' }}>
                  {['Descrição', 'Qtd', 'Valor unit.', 'Total'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(17,24,39,0.04)' }}>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.9rem', color: '#111827' }}>{item.description}</td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{item.quantity}</td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(17,24,39,0.08)', background: '#f9fafb' }}>
                  <td colSpan={3} style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, textAlign: 'right', color: '#111827' }}>Total</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '1.25rem', fontWeight: 700, textAlign: 'right', color: '#c8511a', fontFamily: "'Outfit',sans-serif" }}>{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
            {proposal.notes && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(17,24,39,0.06)', background: '#f9fafb' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</p>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: '#374151' }}>{proposal.notes}</p>
              </div>
            )}
          </div>

          {/* Signature */}
          {!signed ? (
            <div className="no-print" style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(17,24,39,0.12)', padding: '2rem' }}>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Assinar proposta</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Ao assinar, você concorda com os termos e valores apresentados acima.
              </p>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: '#374151' }}>Nome completo *</label>
              <input value={signerName} onChange={e => setSignerName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(17,24,39,0.15)', fontSize: '0.95rem', outline: 'none', marginBottom: '1rem', fontFamily: 'inherit' }}
                placeholder="Digite seu nome completo" />
              <button onClick={handleSign} disabled={signing || !signerName.trim()}
                style={{ width: '100%', background: '#065f46', color: 'white', padding: '0.95rem', borderRadius: 100, border: 'none', fontWeight: 700, fontSize: '1rem', cursor: signing || !signerName.trim() ? 'not-allowed' : 'pointer', opacity: signing || !signerName.trim() ? 0.6 : 1, fontFamily: 'inherit' }}>
                {signing ? 'Assinando...' : '✍️ Assinar e aceitar proposta'}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem', textAlign: 'center' }}>
                🔒 Assinatura registrada com timestamp e hash de verificação
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(5,150,105,0.06)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>Proposta aceita!</h3>
              <p style={{ color: '#065f46', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Assinado por <strong>{proposal.signer_name}</strong><br />
                {proposal.signed_at && new Date(proposal.signed_at).toLocaleString('pt-BR')}
              </p>
              {proposal.signature_hash && <p style={{ fontSize: '0.72rem', color: 'rgba(6,95,70,0.5)', marginTop: '0.75rem' }}>Hash: {proposal.signature_hash}</p>}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(17,24,39,0.2)' }}>
            Powered by PropostaPro
          </p>
        </div>
      </div>
    </>
  )
}
