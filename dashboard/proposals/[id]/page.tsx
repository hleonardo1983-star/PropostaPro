'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, generateWhatsAppLink } from '@/lib/utils'
import Link from 'next/link'

export default function ProposalDetailPage() {
  const [proposal, setProposal] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  async function load() {
    const { data: p } = await supabase.from('proposals')
      .select('*, clients(*)')
      .eq('id', params.id).single()
    if (!p) { router.push('/dashboard/proposals'); return }
    setProposal(p)
    setClientPhone((p.clients as any)?.phone || '')
    setClientEmail((p.clients as any)?.email || '')
    const { data: its } = await supabase.from('proposal_items')
      .select('*').eq('proposal_id', params.id).order('sort_order')
    setItems(its || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [params.id])

  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const proposalLink = `${appUrl}/p/${proposal?.public_token}`

  async function markAsSent() {
    await supabase.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', params.id)
    await load()
  }

  function sendWhatsApp() {
    const phone = clientPhone.replace(/\D/g, '')
    if (!phone) { alert('Informe o telefone do cliente'); return }
    const msg = `Olá! Segue a proposta *${proposal.title}* para sua análise:\n\n${proposalLink}\n\nQualquer dúvida, estou à disposição!`
    window.open(generateWhatsAppLink(phone, msg), '_blank')
    markAsSent()
    setShowSendModal(false)
  }

  async function sendEmail() {
    if (!clientEmail) { alert('Informe o e-mail do cliente'); return }
    setSending(true)
    try {
      const res = await fetch('/api/proposals/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: params.id, email: clientEmail, link: proposalLink, title: proposal.title })
      })
      if (!res.ok) throw new Error()
      await markAsSent()
      setShowSendModal(false)
      alert('E-mail enviado com sucesso!')
    } catch {
      alert('Erro ao enviar e-mail. Verifique a configuração do Resend.')
    }
    setSending(false)
  }

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Rascunho', color: '#7a7368', bg: 'rgba(122,115,104,0.1)' },
    sent: { label: 'Enviada', color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)' },
    viewed: { label: 'Visualizada', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    signed: { label: 'Assinada ✓', color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)' },
    rejected: { label: 'Recusada', color: '#c8511a', bg: 'rgba(200,81,26,0.1)' },
  }

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"50vh",color:"#7a7368"}}>Carregando...</div>
  if (!proposal) return null

  const s = statusLabel[proposal.status] || statusLabel.draft

  return (
    <div style={{maxWidth:760}}>
      {/* Modal de envio */}
      {showSendModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"white",borderRadius:20,padding:"2.5rem",width:"100%",maxWidth:440}}>
            <h3 style={{fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif",fontSize:"1.5rem",marginBottom:"0.5rem"}}>Enviar proposta</h3>
            <p style={{color:"#7a7368",fontSize:"0.875rem",marginBottom:"2rem"}}>Escolha como enviar para o cliente</p>

            <div style={{marginBottom:"1.5rem"}}>
              <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.4rem"}}>WhatsApp (telefone com DDI)</label>
              <input value={clientPhone} onChange={e=>setClientPhone(e.target.value)}
                style={{width:"100%",padding:"0.7rem 0.9rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.9rem",outline:"none"}}
                placeholder="5544988278844" />
              <button onClick={sendWhatsApp}
                style={{width:"100%",marginTop:"0.75rem",background:"#25d366",color:"white",padding:"0.8rem",borderRadius:100,border:"none",fontWeight:600,cursor:"pointer",fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"}}>
                📱 Enviar pelo WhatsApp
              </button>
            </div>

            <div style={{borderTop:"1px solid rgba(15,14,12,0.08)",paddingTop:"1.5rem"}}>
              <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.4rem"}}>E-mail</label>
              <input value={clientEmail} onChange={e=>setClientEmail(e.target.value)}
                style={{width:"100%",padding:"0.7rem 0.9rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.9rem",outline:"none"}}
                placeholder="cliente@email.com" />
              <button onClick={sendEmail} disabled={sending}
                style={{width:"100%",marginTop:"0.75rem",background:"#0f0e0c",color:"white",padding:"0.8rem",borderRadius:100,border:"none",fontWeight:600,cursor:"pointer",fontSize:"0.9rem",opacity:sending?0.7:1}}>
                {sending ? 'Enviando...' : '✉️ Enviar por E-mail'}
              </button>
            </div>

            <div style={{marginTop:"1.5rem",background:"#f5f0e8",borderRadius:10,padding:"1rem"}}>
              <p style={{fontSize:"0.8rem",color:"#7a7368",marginBottom:"0.5rem",fontWeight:500}}>Link direto da proposta:</p>
              <p style={{fontSize:"0.78rem",wordBreak:"break-all",color:"#c8511a"}}>{proposalLink}</p>
            </div>

            <button onClick={()=>setShowSendModal(false)}
              style={{width:"100%",marginTop:"1rem",background:"transparent",border:"1.5px solid rgba(15,14,12,0.15)",padding:"0.7rem",borderRadius:100,cursor:"pointer",fontSize:"0.9rem",fontWeight:500}}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"2rem",flexWrap:"wrap",gap:"1rem"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.5rem"}}>
            <Link href="/dashboard/proposals" style={{color:"#7a7368",textDecoration:"none",fontSize:"0.875rem"}}>← Propostas</Link>
          </div>
          <h1 style={{fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif",fontSize:"1.75rem",letterSpacing:"-0.02em",marginBottom:"0.5rem"}}>{proposal.title}</h1>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <span style={{color:"#7a7368",fontSize:"0.875rem"}}>#{proposal.number}</span>
            <span style={{background:s.bg,color:s.color,padding:"0.25rem 0.65rem",borderRadius:100,fontSize:"0.75rem",fontWeight:600}}>{s.label}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
          {proposal.status === 'signed' ? null : (
            <button onClick={()=>setShowSendModal(true)}
              style={{background:"#c8511a",color:"white",padding:"0.65rem 1.5rem",borderRadius:100,border:"none",cursor:"pointer",fontWeight:600,fontSize:"0.875rem"}}>
              📤 Enviar proposta
            </button>
          )}
          <a href={proposalLink} target="_blank" rel="noreferrer"
            style={{background:"transparent",border:"1.5px solid rgba(15,14,12,0.15)",color:"#0f0e0c",padding:"0.65rem 1.5rem",borderRadius:100,textDecoration:"none",fontWeight:500,fontSize:"0.875rem"}}>
            👁 Visualizar
          </a>
        </div>
      </div>

      {/* Signed alert */}
      {proposal.status === 'signed' && (
        <div style={{background:"rgba(45,106,79,0.1)",border:"1px solid rgba(45,106,79,0.25)",borderRadius:12,padding:"1.25rem",marginBottom:"1.5rem"}}>
          <p style={{color:"#2d6a4f",fontWeight:600,marginBottom:"0.25rem"}}>✅ Proposta assinada!</p>
          <p style={{color:"#2d6a4f",fontSize:"0.85rem"}}>Assinado por <strong>{proposal.signer_name}</strong> em {new Date(proposal.signed_at).toLocaleString('pt-BR')}. Uma conta a receber foi gerada automaticamente.</p>
          {proposal.signature_hash && <p style={{color:"#2d6a4f",fontSize:"0.78rem",marginTop:"0.5rem",opacity:0.7}}>Hash: {proposal.signature_hash}</p>}
        </div>
      )}

      {/* Client + details */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1.5rem"}}>
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",padding:"1.5rem"}}>
          <h3 style={{fontWeight:600,fontSize:"0.875rem",marginBottom:"1rem",color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>Cliente</h3>
          {proposal.clients ? (
            <>
              <p style={{fontWeight:600,marginBottom:"0.25rem"}}>{proposal.clients.name}</p>
              {proposal.clients.email && <p style={{fontSize:"0.875rem",color:"#7a7368"}}>{proposal.clients.email}</p>}
              {proposal.clients.phone && <p style={{fontSize:"0.875rem",color:"#7a7368"}}>{proposal.clients.phone}</p>}
            </>
          ) : <p style={{color:"#7a7368",fontSize:"0.875rem"}}>Nenhum cliente associado</p>}
        </div>
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",padding:"1.5rem"}}>
          <h3 style={{fontWeight:600,fontSize:"0.875rem",marginBottom:"1rem",color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>Detalhes</h3>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem"}}>
              <span style={{color:"#7a7368"}}>Criada em</span>
              <span>{new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            {proposal.valid_until && <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem"}}>
              <span style={{color:"#7a7368"}}>Válida até</span>
              <span>{new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>
            </div>}
            {proposal.sent_at && <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.875rem"}}>
              <span style={{color:"#7a7368"}}>Enviada em</span>
              <span>{new Date(proposal.sent_at).toLocaleDateString('pt-BR')}</span>
            </div>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",overflow:"hidden",marginBottom:"1.5rem"}}>
        <div style={{padding:"1.25rem 1.5rem",borderBottom:"1px solid rgba(15,14,12,0.08)"}}>
          <h3 style={{fontWeight:600,fontSize:"0.875rem"}}>Itens do orçamento</h3>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid rgba(15,14,12,0.06)"}}>
              {['Descrição','Qtd','Valor unit.','Total'].map(h => (
                <th key={h} style={{padding:"0.75rem 1.5rem",textAlign:h==='Descrição'?"left":"right",fontSize:"0.78rem",fontWeight:600,color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{borderBottom:"1px solid rgba(15,14,12,0.04)"}}>
                <td style={{padding:"0.9rem 1.5rem",fontSize:"0.875rem"}}>{item.description}</td>
                <td style={{padding:"0.9rem 1.5rem",fontSize:"0.875rem",textAlign:"right",color:"#7a7368"}}>{item.quantity}</td>
                <td style={{padding:"0.9rem 1.5rem",fontSize:"0.875rem",textAlign:"right",color:"#7a7368"}}>{formatCurrency(item.unit_price)}</td>
                <td style={{padding:"0.9rem 1.5rem",fontSize:"0.875rem",textAlign:"right",fontWeight:600}}>{formatCurrency(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{borderTop:"2px solid rgba(15,14,12,0.1)"}}>
              <td colSpan={3} style={{padding:"1rem 1.5rem",fontSize:"0.9rem",fontWeight:600,textAlign:"right"}}>Total</td>
              <td style={{padding:"1rem 1.5rem",fontSize:"1.1rem",fontWeight:700,textAlign:"right",color:"#c8511a",fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif"}}>{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
        {proposal.notes && (
          <div style={{padding:"1.25rem 1.5rem",borderTop:"1px solid rgba(15,14,12,0.08)",background:"#f5f0e8"}}>
            <p style={{fontSize:"0.8rem",fontWeight:600,color:"#7a7368",marginBottom:"0.35rem"}}>OBSERVAÇÕES</p>
            <p style={{fontSize:"0.875rem",lineHeight:1.6}}>{proposal.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
