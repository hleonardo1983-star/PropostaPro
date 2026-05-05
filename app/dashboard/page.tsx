'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({ proposals: 0, signed: 0, pending: 0, receivables: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantName, setTenantName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('tenant_id, full_name, tenants(name)').eq('id', user.id).single()
      if (!profile) return
      setTenantName((profile.tenants as any)?.name || '')

      const [{ count: total }, { count: signed }, { count: pending }] = await Promise.all([
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id),
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id).eq('status', 'signed'),
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id).eq('status', 'sent'),
      ])
      const { data: recv } = await supabase.from('receivables').select('amount').eq('tenant_id', profile.tenant_id).eq('status', 'pending')
      const totalRecv = recv?.reduce((s, r) => s + Number(r.amount), 0) || 0
      setStats({ proposals: total || 0, signed: signed || 0, pending: pending || 0, receivables: totalRecv })

      const { data: recentProposals } = await supabase.from('proposals')
        .select('id, number, title, status, created_at, clients(name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false }).limit(5)
      setRecent(recentProposals || [])
      setLoading(false)
    }
    load()
  }, [])

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Rascunho', color: '#7a7368', bg: 'rgba(122,115,104,0.1)' },
    sent: { label: 'Enviada', color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)' },
    viewed: { label: 'Visualizada', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    signed: { label: 'Assinada', color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)' },
    rejected: { label: 'Recusada', color: '#c8511a', bg: 'rgba(200,81,26,0.1)' },
  }

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"50vh",color:"#7a7368"}}>Carregando...</div>

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"0.25rem"}}>
          Olá, {tenantName} 👋
        </h1>
        <p style={{color:"#7a7368",fontSize:"0.9rem"}}>Aqui está o resumo da sua conta</p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"1rem",marginBottom:"2.5rem"}}>
        {[
          { label: 'Total de propostas', value: stats.proposals, icon: '📝', color: '#0f0e0c' },
          { label: 'Assinadas', value: stats.signed, icon: '✅', color: '#2d6a4f' },
          { label: 'Aguardando', value: stats.pending, icon: '⏳', color: '#c8511a' },
          { label: 'A receber', value: formatCurrency(stats.receivables), icon: '💰', color: '#1d4ed8' },
        ].map(s => (
          <div key={s.label} style={{background:"white",borderRadius:16,padding:"1.5rem",border:"1px solid rgba(15,14,12,0.1)"}}>
            <div style={{fontSize:"1.5rem",marginBottom:"0.75rem"}}>{s.icon}</div>
            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.75rem",color:s.color,letterSpacing:"-0.02em"}}>{s.value}</div>
            <div style={{fontSize:"0.8rem",color:"#7a7368",marginTop:"0.25rem"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent proposals */}
      <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",overflow:"hidden"}}>
        <div style={{padding:"1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(15,14,12,0.08)"}}>
          <h2 style={{fontWeight:600,fontSize:"1rem"}}>Propostas recentes</h2>
          <Link href="/dashboard/proposals/new" style={{background:"#c8511a",color:"white",padding:"0.5rem 1.2rem",borderRadius:100,textDecoration:"none",fontSize:"0.85rem",fontWeight:600}}>
            + Nova proposta
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{padding:"3rem",textAlign:"center",color:"#7a7368"}}>
            <p style={{fontSize:"1rem",marginBottom:"1rem"}}>Nenhuma proposta ainda</p>
            <Link href="/dashboard/proposals/new" style={{color:"#c8511a",fontWeight:600,textDecoration:"none"}}>Criar primeira proposta →</Link>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid rgba(15,14,12,0.08)"}}>
                {['Nº','Título','Cliente','Status','Data'].map(h => (
                  <th key={h} style={{padding:"0.85rem 1.5rem",textAlign:"left",fontSize:"0.78rem",fontWeight:600,color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(p => {
                const s = statusLabel[p.status] || statusLabel.draft
                return (
                  <tr key={p.id} style={{borderBottom:"1px solid rgba(15,14,12,0.06)"}}>
                    <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem",fontWeight:600,color:"#7a7368"}}>#{p.number}</td>
                    <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem"}}>
                      <Link href={`/dashboard/proposals/${p.id}`} style={{color:"#0f0e0c",textDecoration:"none",fontWeight:500}}>{p.title}</Link>
                    </td>
                    <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem",color:"#7a7368"}}>{(p.clients as any)?.name || '—'}</td>
                    <td style={{padding:"1rem 1.5rem"}}>
                      <span style={{background:s.bg,color:s.color,padding:"0.25rem 0.65rem",borderRadius:100,fontSize:"0.75rem",fontWeight:600}}>{s.label}</span>
                    </td>
                    <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem",color:"#7a7368"}}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
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
