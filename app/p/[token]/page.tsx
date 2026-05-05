'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { formatCurrency, generateSignatureHash } from '@/lib/utils'

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
      const { data: p } = await supabase.from('proposals')
        .select('*, clients(*)')
        .eq('public_token', params.token).single()
      if (!p) { setLoading(false); return }
      setProposal(p)
      if (p.status === 'signed') setSigned(true)

      const { data: its } = await supabase.from('proposal_items')
        .select('*').eq('proposal_id', p.id).order('sort_order')
      setItems(its || [])

      const { data: t } = await supabase.from('tenants').select('*').eq('id', p.tenant_id).single()
      setTenant(t)

      // mark as viewed
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
      const hash = generateSignatureHash({ name: signerName, ip: 'web', timestamp, proposalId: proposal.id })
      const { error } = await supabase.from('proposals').update({
        status: 'signed',
        signed_at: timestamp,
        signer_name: signerName,
        signer_ip: 'web-client',
        signature_hash: hash,
      }).eq('id', proposal.id)
      if (error) throw error
      setSigned(true)
    } catch (err: any) {
      alert('Erro ao assinar. Tente novamente.')
    }
    setSigning(false)
  }

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f0e8"}}>
      <p style={{color:"#7a7368"}}>Carregando proposta...</p>
    </div>
  )

  if (!proposal) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f0e8",flexDirection:"column",gap:"1rem",padding:"2rem",textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}>🔍</div>
      <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.75rem"}}>Proposta não encontrada</h1>
      <p style={{color:"#7a7368"}}>Este link pode ter expirado ou ser inválido.</p>
    </div>
  )

  return (
    <div style={{minHeight:"100vh",background:"#f5f0e8",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{background:"white",borderBottom:"1px solid rgba(15,14,12,0.1)",padding:"1rem 2rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.25rem",letterSpacing:"-0.02em"}}>
          {tenant?.name || 'PropostaFácil'}
        </span>
        {signed && <span style={{background:"rgba(45,106,79,0.1)",color:"#2d6a4f",padding:"0.3rem 0.8rem",borderRadius:100,fontSize:"0.8rem",fontWeight:600}}>✅ Assinada</span>}
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"2rem 1.5rem"}}>
        {/* Title */}
        <div style={{marginBottom:"2rem"}}>
          <p style={{fontSize:"0.8rem",color:"#7a7368",marginBottom:"0.25rem"}}>Proposta #{proposal.number}</p>
          <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"0.5rem"}}>{proposal.title}</h1>
          <div style={{display:"flex",gap:"1.5rem",fontSize:"0.85rem",color:"#7a7368",flexWrap:"wrap"}}>
            <span>📅 {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
            {proposal.valid_until && <span>⏰ Válida até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>}
            {proposal.clients?.name && <span>👤 Para: {proposal.clients.name}</span>}
          </div>
        </div>

        {/* Items */}
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",overflow:"hidden",marginBottom:"1.5rem"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid rgba(15,14,12,0.08)",background:"#f5f0e8"}}>
                {['Descrição','Qtd','Valor unit.','Total'].map(h => (
                  <th key={h} style={{padding:"0.85rem 1.25rem",textAlign:h==='Descrição'?"left":"right",fontSize:"0.78rem",fontWeight:600,color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{borderBottom:"1px solid rgba(15,14,12,0.05)"}}>
                  <td style={{padding:"0.9rem 1.25rem",fontSize:"0.9rem"}}>{item.description}</td>
                  <td style={{padding:"0.9rem 1.25rem",fontSize:"0.875rem",textAlign:"right",color:"#7a7368"}}>{item.quantity}</td>
                  <td style={{padding:"0.9rem 1.25rem",fontSize:"0.875rem",textAlign:"right",color:"#7a7368"}}>{formatCurrency(item.unit_price)}</td>
                  <td style={{padding:"0.9rem 1.25rem",fontSize:"0.875rem",textAlign:"right",fontWeight:600}}>{formatCurrency(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:"2px solid rgba(15,14,12,0.1)",background:"#f5f0e8"}}>
                <td colSpan={3} style={{padding:"1rem 1.25rem",fontSize:"0.9rem",fontWeight:600,textAlign:"right"}}>Total</td>
                <td style={{padding:"1rem 1.25rem",fontSize:"1.25rem",fontWeight:700,textAlign:"right",color:"#c8511a",fontFamily:"'Instrument Serif',serif"}}>{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
          {proposal.notes && (
            <div style={{padding:"1.25rem",borderTop:"1px solid rgba(15,14,12,0.08)"}}>
              <p style={{fontSize:"0.78rem",fontWeight:600,color:"#7a7368",marginBottom:"0.35rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>Observações</p>
              <p style={{fontSize:"0.875rem",lineHeight:1.65,color:"#0f0e0c"}}>{proposal.notes}</p>
            </div>
          )}
        </div>

        {/* Signature */}
        {!signed ? (
          <div style={{background:"white",borderRadius:16,border:"1.5px solid rgba(15,14,12,0.15)",padding:"2rem"}}>
            <h3 style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.25rem",marginBottom:"0.5rem"}}>Assinar proposta</h3>
            <p style={{fontSize:"0.875rem",color:"#7a7368",marginBottom:"1.5rem",lineHeight:1.6}}>
              Ao assinar, você concorda com os termos e valores apresentados acima. A assinatura será registrada com seu nome, data e hora.
            </p>
            <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.5rem"}}>Nome completo *</label>
            <input value={signerName} onChange={e=>setSignerName(e.target.value)}
              style={{width:"100%",padding:"0.75rem 1rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.95rem",outline:"none",marginBottom:"1rem"}}
              placeholder="Digite seu nome completo" />
            <button onClick={handleSign} disabled={signing || !signerName.trim()}
              style={{width:"100%",background:"#2d6a4f",color:"white",padding:"0.95rem",borderRadius:100,border:"none",fontWeight:700,fontSize:"1rem",cursor:signing||!signerName.trim()?"not-allowed":"pointer",opacity:signing||!signerName.trim()?0.6:1}}>
              {signing ? 'Assinando...' : '✍️ Assinar e aceitar proposta'}
            </button>
            <p style={{fontSize:"0.75rem",color:"#7a7368",marginTop:"0.75rem",textAlign:"center"}}>
              🔒 Assinatura registrada com timestamp e hash de verificação
            </p>
          </div>
        ) : (
          <div style={{background:"rgba(45,106,79,0.08)",border:"1.5px solid rgba(45,106,79,0.25)",borderRadius:16,padding:"2rem",textAlign:"center"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>✅</div>
            <h3 style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.5rem",color:"#2d6a4f",marginBottom:"0.5rem"}}>Proposta aceita!</h3>
            <p style={{color:"#2d6a4f",fontSize:"0.875rem",lineHeight:1.6}}>
              Assinado por <strong>{proposal.signer_name}</strong><br/>
              {proposal.signed_at && new Date(proposal.signed_at).toLocaleString('pt-BR')}
            </p>
            {proposal.signature_hash && (
              <p style={{fontSize:"0.75rem",color:"rgba(45,106,79,0.6)",marginTop:"0.75rem"}}>Hash: {proposal.signature_hash}</p>
            )}
          </div>
        )}

        <p style={{textAlign:"center",marginTop:"2rem",fontSize:"0.78rem",color:"rgba(15,14,12,0.3)"}}>
          Powered by PropostaFácil
        </p>
      </div>
    </div>
  )
}
