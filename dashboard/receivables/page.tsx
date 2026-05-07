'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return
    const { data } = await supabase.from('receivables')
      .select('*, clients(name), proposals(number, title)')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
    setReceivables(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function markPaid(id: string) {
    await supabase.from('receivables').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const total = receivables.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)
  const totalPaid = receivables.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendente', color: '#c8511a', bg: 'rgba(200,81,26,0.1)' },
    paid: { label: 'Pago', color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)' },
    overdue: { label: 'Vencido', color: '#991b1b', bg: 'rgba(153,27,27,0.1)' },
    cancelled: { label: 'Cancelado', color: '#7a7368', bg: 'rgba(122,115,104,0.1)' },
  }

  return (
    <div>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={{fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif",fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"0.25rem"}}>Contas a receber</h1>
        <p style={{color:"#7a7368",fontSize:"0.9rem"}}>Geradas automaticamente ao assinar propostas</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1rem",marginBottom:"2rem"}}>
        <div style={{background:"white",borderRadius:16,padding:"1.5rem",border:"1px solid rgba(15,14,12,0.1)"}}>
          <div style={{fontSize:"1.25rem",marginBottom:"0.5rem"}}>⏳</div>
          <div style={{fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif",fontSize:"1.75rem",color:"#c8511a",letterSpacing:"-0.02em"}}>{formatCurrency(total)}</div>
          <div style={{fontSize:"0.8rem",color:"#7a7368",marginTop:"0.25rem"}}>Pendente a receber</div>
        </div>
        <div style={{background:"white",borderRadius:16,padding:"1.5rem",border:"1px solid rgba(15,14,12,0.1)"}}>
          <div style={{fontSize:"1.25rem",marginBottom:"0.5rem"}}>✅</div>
          <div style={{fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif",fontSize:"1.75rem",color:"#2d6a4f",letterSpacing:"-0.02em"}}>{formatCurrency(totalPaid)}</div>
          <div style={{fontSize:"0.8rem",color:"#7a7368",marginTop:"0.25rem"}}>Total recebido</div>
        </div>
      </div>

      <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",overflow:"hidden"}}>
        {loading ? <div style={{padding:"3rem",textAlign:"center",color:"#7a7368"}}>Carregando...</div>
        : receivables.length === 0 ? (
          <div style={{padding:"4rem",textAlign:"center",color:"#7a7368"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>💰</div>
            <p>Nenhuma conta a receber ainda.</p>
            <p style={{fontSize:"0.875rem",marginTop:"0.5rem"}}>Elas aparecem automaticamente quando propostas são assinadas.</p>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid rgba(15,14,12,0.08)"}}>
                {['Descrição','Cliente','Valor','Vencimento','Status',''].map(h => (
                  <th key={h} style={{padding:"0.85rem 1.25rem",textAlign:"left",fontSize:"0.78rem",fontWeight:600,color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receivables.map(r => {
                const s = statusLabel[r.status] || statusLabel.pending
                return (
                  <tr key={r.id} style={{borderBottom:"1px solid rgba(15,14,12,0.06)"}}>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",maxWidth:280}}>{r.description}</td>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",color:"#7a7368"}}>{(r.clients as any)?.name || '—'}</td>
                    <td style={{padding:"1rem 1.25rem",fontWeight:600,fontSize:"0.875rem"}}>{formatCurrency(r.amount)}</td>
                    <td style={{padding:"1rem 1.25rem",fontSize:"0.875rem",color:"#7a7368"}}>{r.due_date ? new Date(r.due_date).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{padding:"1rem 1.25rem"}}>
                      <span style={{background:s.bg,color:s.color,padding:"0.25rem 0.65rem",borderRadius:100,fontSize:"0.75rem",fontWeight:600}}>{s.label}</span>
                    </td>
                    <td style={{padding:"1rem 1.25rem"}}>
                      {r.status === 'pending' && (
                        <button onClick={()=>markPaid(r.id)}
                          style={{background:"rgba(45,106,79,0.1)",color:"#2d6a4f",border:"none",padding:"0.3rem 0.8rem",borderRadius:100,cursor:"pointer",fontSize:"0.78rem",fontWeight:600}}>
                          Marcar pago
                        </button>
                      )}
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
