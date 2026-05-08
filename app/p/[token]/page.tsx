'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

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
    window.print()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', fontFamily: font }}>
      <p style={{ color: '#6b7280' }}>Carregando proposta...</p>
    </div>
  )

  if (!proposal) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center', fontFamily: font }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Proposta não encontrada</h1>
      <p style={{ color: '#6b7280' }}>Este link pode ter expirado ou ser inválido.</p>
    </div>
  )

  const clientName = proposal.clients?.name || 'Cliente'
  const fileName = `${tenant?.name || 'Proposta'} - Proposta #${proposal.number} - ${clientName}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        @media print {
          .no-print { display: none !important; }
          @page {
            margin: 20mm;
            size: A4;
          }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
        @media screen {
          .print-header-logo { display: none; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: font }}>

        {/* Top bar — não aparece no PDF */}
        <div className="no-print" style={{ background: 'white', borderBottom: '1px solid rgba(17,24,39,0.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {tenant?.name || 'PropostaPro'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {signed && <span style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', padding: '0.3rem 0.8rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700 }}>✅ Assinada</span>}
            <button onClick={handlePrint}
              style={{ background: '#0d1117', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: font, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⬇️ Baixar PDF
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Cabeçalho profissional — aparece no PDF */}
          <div className="print-card" style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(17,24,39,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #c8511a' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0d1117', marginBottom: '0.25rem' }}>
                  {tenant?.name || 'Empresa'}
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Proposta Comercial</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: '#c8511a', color: 'white', padding: '0.4rem 1rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'inline-block' }}>
                  Proposta #{proposal.number}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0d1117', marginBottom: '1rem' }}>{proposal.title}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Cliente</p>
                <p style={{ fontWeight: 700, color: '#0d1117' }}>{clientName}</p>
                {proposal.clients?.email && <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{proposal.clients.email}</p>}
                {proposal.clients?.phone && <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{proposal.clients.phone}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {proposal.valid_until && (
                  <>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Válida até</p>
                    <p style={{ fontWeight: 700, color: '#0d1117' }}>{new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="print-card" style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(17,24,39,0.08)', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1117' }}>
                  {['Descrição', 'Qtd', 'Valor unit.', 'Total'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(17,24,39,0.05)', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.9rem', color: '#0d1117', fontWeight: 500 }}>{item.description}</td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{item.quantity}</td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: 700, color: '#0d1117' }}>{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0d1117' }}>
                  <td colSpan={3} style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, textAlign: 'right', color: 'white' }}>Total</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '1.25rem', fontWeight: 800, textAlign: 'right', color: '#c8511a' }}>{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
            {proposal.notes && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(17,24,39,0.06)', background: '#f9fafb' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observações</p>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: '#374151' }}>{proposal.notes}</p>
              </div>
            )}
          </div>

          {/* Assinatura */}
          {!signed ? (
            <div className="no-print print-card" style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(17,24,39,0.12)', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0d1117' }}>Assinar proposta</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Ao assinar, você concorda com os termos e valores apresentados acima.
              </p>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: '#374151' }}>Nome completo *</label>
              <input value={signerName} onChange={e => setSignerName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(17,24,39,0.15)', fontSize: '0.95rem', outline: 'none', marginBottom: '1rem', fontFamily: font }}
                placeholder="Digite seu nome completo" />
              <button onClick={handleSign} disabled={signing || !signerName.trim()}
                style={{ width: '100%', background: '#065f46', color: 'white', padding: '0.95rem', borderRadius: 100, border: 'none', fontWeight: 800, fontSize: '1rem', cursor: signing || !signerName.trim() ? 'not-allowed' : 'pointer', opacity: signing || !signerName.trim() ? 0.6 : 1, fontFamily: font }}>
                {signing ? 'Assinando...' : '✍️ Assinar e aceitar proposta'}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem', textAlign: 'center' }}>
                🔒 Assinatura registrada com timestamp e hash de verificação
              </p>
            </div>
          ) : (
            <div className="print-card" style={{ background: 'rgba(5,150,105,0.06)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginBottom: '0.5rem' }}>Proposta aceita!</h3>
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
