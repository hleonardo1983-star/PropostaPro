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

  const services = items.filter(i => (i.item_type || 'service') === 'service')
  const products = items.filter(i => i.item_type === 'product')
  const totalServices = services.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const totalProducts = products.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const total = totalServices + totalProducts
  const accent = tenant?.primary_color || '#c8511a'

  function handlePrint() {
    const originalTitle = document.title
    document.title = ' '
    setTimeout(() => {
      window.print()
      document.title = originalTitle
    }, 100)
  }

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

  // Componente de tabela de itens
  function ItemSection({ list, title, subtotal, icon }: { list: any[]; title: string; subtotal: number; icon: string }) {
    if (list.length === 0) return null
    return (
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Header da seção */}
        <div style={{ background: '#0d1117', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{icon}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
        </div>
        {/* Cabeçalho das colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 130px', borderBottom: '1px solid rgba(13,17,23,0.08)', background: '#f9fafb' }}>
          <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descrição</div>
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', borderLeft: '1px solid rgba(13,17,23,0.06)' }}>Qtd</div>
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', borderLeft: '1px solid rgba(13,17,23,0.06)' }}>Valor unit.</div>
          <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', borderLeft: '1px solid rgba(13,17,23,0.06)' }}>Total</div>
        </div>
        {/* Itens */}
        {list.map((item, idx) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 130px', borderBottom: '1px solid rgba(13,17,23,0.04)', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
            <div style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', color: '#0d1117', fontWeight: 500 }}>{item.description}</div>
            <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280', borderLeft: '1px solid rgba(13,17,23,0.04)' }}>{item.quantity}</div>
            <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.875rem', textAlign: 'right', color: '#6b7280', borderLeft: '1px solid rgba(13,17,23,0.04)' }}>{formatCurrency(item.unit_price)}</div>
            <div style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: 700, color: '#0d1117', borderLeft: '1px solid rgba(13,17,23,0.04)' }}>{formatCurrency(item.quantity * item.unit_price)}</div>
          </div>
        ))}
        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', padding: '0.6rem 1.25rem', background: '#f9fafb', borderTop: '2px solid rgba(13,17,23,0.08)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>Subtotal {title}</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: accent, minWidth: 120, textAlign: 'right' }}>{formatCurrency(subtotal)}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          @page { 
            margin: 15mm; 
            size: A4;
            margin-header: 0;
            margin-footer: 0;
          }
          head title { display: none; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: font }}>
        {/* Top bar */}
        <div className="no-print" style={{ background: 'white', borderBottom: '1px solid rgba(17,24,39,0.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {tenant?.logo_url && <img src={tenant.logo_url} alt="Logo" style={{ height: 36, objectFit: 'contain' }} />}
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{tenant?.name || 'PropostaPro'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {signed && <span style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', padding: '0.3rem 0.8rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700 }}>✅ Assinada</span>}
            <button onClick={handlePrint}
              style={{ background: '#0d1117', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: font }}>
              ⬇️ Baixar PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Cabeçalho profissional */}
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: `3px solid ${accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {tenant?.logo_url && <img src={tenant.logo_url} alt="Logo" style={{ height: 56, objectFit: 'contain', maxWidth: 140 }} />}
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0d1117', marginBottom: '0.15rem' }}>{tenant?.name}</h1>
                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 500 }}>Proposta Comercial</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: accent, color: 'white', padding: '0.4rem 1rem', borderRadius: 100, fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'inline-block' }}>
                  Proposta #{proposal.number}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0d1117', marginBottom: '1rem' }}>{proposal.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Cliente</p>
                <p style={{ fontWeight: 700, color: '#0d1117' }}>{clientName}</p>
                {proposal.clients?.email && <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{proposal.clients.email}</p>}
                {proposal.clients?.phone && <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{proposal.clients.phone}</p>}
              </div>
              {proposal.valid_until && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Válida até</p>
                  <p style={{ fontWeight: 700, color: '#0d1117' }}>{new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quadro de Serviços */}
          <ItemSection list={services} title="Serviços" subtotal={totalServices} icon="🛠️" />

          {/* Quadro de Produtos */}
          <ItemSection list={products} title="Produtos" subtotal={totalProducts} icon="📦" />

          {/* Total Geral */}
          {(services.length > 0 || products.length > 0) && (
            <div style={{ background: '#0d1117', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total Geral da Proposta</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: accent }}>{formatCurrency(total)}</span>
            </div>
          )}

          {/* Observações */}
          {proposal.notes && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observações</p>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#374151' }}>{proposal.notes}</p>
            </div>
          )}

          {/* Assinatura */}
          {!signed ? (
            <div className="no-print" style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(13,17,23,0.12)', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0d1117' }}>Assinar proposta</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>Ao assinar, você concorda com os termos e valores apresentados acima.</p>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: '#374151' }}>Nome completo *</label>
              <input value={signerName} onChange={e => setSignerName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.95rem', outline: 'none', marginBottom: '1rem', fontFamily: font }}
                placeholder="Digite seu nome completo" />
              <button onClick={handleSign} disabled={signing || !signerName.trim()}
                style={{ width: '100%', background: '#065f46', color: 'white', padding: '0.95rem', borderRadius: 100, border: 'none', fontWeight: 800, fontSize: '1rem', cursor: signing || !signerName.trim() ? 'not-allowed' : 'pointer', opacity: signing || !signerName.trim() ? 0.6 : 1, fontFamily: font }}>
                {signing ? 'Assinando...' : '✍️ Assinar e aceitar proposta'}
              </button>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem', textAlign: 'center' }}>🔒 Assinatura registrada com timestamp e hash de verificação</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(5,150,105,0.06)', border: '1.5px solid rgba(5,150,105,0.2)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginBottom: '0.5rem' }}>Proposta aceita!</h3>
              <p style={{ color: '#065f46', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Assinado por <strong>{proposal.signer_name || signerName}</strong><br />
                {proposal.signed_at && new Date(proposal.signed_at).toLocaleString('pt-BR')}
              </p>
              {proposal.signature_hash && <p style={{ fontSize: '0.72rem', color: 'rgba(6,95,70,0.5)', marginTop: '0.75rem' }}>Hash: {proposal.signature_hash}</p>}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(17,24,39,0.2)' }}>Powered by PropostaPro</p>
        </div>
      </div>
    </>
  )
}
