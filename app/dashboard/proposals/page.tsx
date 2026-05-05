'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Rascunho', color: '#7a7368', bg: 'rgba(122,115,104,0.1)' },
    sent: { label: 'Enviada', color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)' },
    viewed: { label: 'Visualizada', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    signed: { label: 'Assinada', color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)' },
    rejected: { label: 'Recusada', color: '#c8511a', bg: 'rgba(200,81,26,0.1)' },
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
      if (!profile) return
      const { data } = await supabase.from('proposals')
        .select('id, number, title, status, created_at, clients(name), proposal_items(quantity, unit_price)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
      setProposals(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function getTotal(items: any[]) {
    return items?.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0) || 0
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem"}}>
        <div>
          <h1 style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"0.25rem"}}>Propostas</h1>
          <p style={{color:"#7a7368",fontSize:"0.9rem"}}>{proposals.length} proposta{proposals.length !== 1 ? 's' : ''} no total</p>
        </div>
        <Link href="/dashboard/proposals/new" style={{background:"#c8511a",color:"white",padding:"0.7rem 1.5rem",borderRadius:100,textDecoration:"none",fontSize:"0.9rem",fontWeight:600}}>
          + Nova proposta
        </Link>
      </div>

      <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",overflow:"hidden"}}>
        {loading ? <div style={{padding:"3rem",textAlign:"center",color:"#7a7368"}}>Carregando...</div>
        : proposals.length === 0 ? (
          <div style={{padding:"4rem",textAlign:"center",color:"#7a7368"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>📝</div>
            <p style={{fontSize:"1rem",marginBottom:"1rem"}}>Nenhuma proposta ainda</p>
            <Link href="/dashboard/proposals/new" style={{color:"#c8511a",fontWeight:600,textDecoration:"none"}}>Criar primeira proposta →</Link>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid rgba(15,14,12,0.08)"}}>
                {['Nº','Título','Cliente','Valor','Status','Data',''].map(h => (
                  <th key={h} style={{padding:"0.85rem 1.25rem",textAlign:"left",fontSize:"0.78rem",fontWeight:600,color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposals.map(p => {
                const s = statusLabel[p.status] || statusLabel.draft
                return (
                  <tr key={p.id} style={{borderBottom:"1px solid rgba(15,14,12,0.06)"}}>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",fontWeight:600,color:"#7a7368"}}>#{p.number}</td>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",fontWeight:500}}>{p.title}</td>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",color:"#7a7368"}}>{(p.clients as any)?.name || '—'}</td>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",fontWeight:600}}>{formatCurrency(getTotal(p.proposal_items))}</td>
                    <td style={{padding:"1rem 1.25rem"}}>
                      <span style={{background:s.bg,color:s.color,padding:"0.25rem 0.65rem",borderRadius:100,fontSize:"0.75rem",fontWeight:600}}>{s.label}</span>
                    </td>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",color:"#7a7368"}}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{padding:"1rem 1.25rem"}}>
                      <Link href={`/dashboard/proposals/${p.id}`} style={{color:"#c8511a",textDecoration:"none",fontSize:"0.85rem",fontWeight:600}}>Ver →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
