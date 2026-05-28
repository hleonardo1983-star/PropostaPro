'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTenantData } from '@/lib/supabase/cache'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [receivables, setReceivables] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [period, setPeriod] = useState('6')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const tenant = await getTenantData(supabase)
      if (!tenant) return
      const profile = { tenant_id: tenant.tenantId }
      const since = new Date()
      since.setMonth(since.getMonth() - parseInt(period))
      const { data: recv } = await supabase.from('receivables').select('*, clients(name)').eq('tenant_id', tenant.tenantId).gte('created_at', since.toISOString()).order('created_at', { ascending: false })
      const { data: props } = await supabase.from('proposals').select('id, status, created_at').eq('tenant_id', tenant.tenantId).gte('created_at', since.toISOString())
      setReceivables(recv || [])
      setProposals(props || [])
      setLoading(false)
    }
    load()
  }, [period])

  const totalReceived = receivables.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = receivables.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)
  const totalOverdue = receivables.filter(r => r.status === 'overdue').reduce((s, r) => s + Number(r.amount), 0)
  const totalAll = totalReceived + totalPending + totalOverdue
  const signed = proposals.filter(p => p.status === 'signed').length
  const conversionRate = proposals.length > 0 ? Math.round((signed / proposals.length) * 100) : 0

  const byMonth: Record<string, { received: number; pending: number; overdue: number }> = {}
  receivables.forEach(r => {
    const month = r.created_at.substring(0, 7)
    if (!byMonth[month]) byMonth[month] = { received: 0, pending: 0, overdue: 0 }
    if (r.status === 'paid') byMonth[month].received += Number(r.amount)
    else if (r.status === 'pending') byMonth[month].pending += Number(r.amount)
    else if (r.status === 'overdue') byMonth[month].overdue += Number(r.amount)
  })
  const months = Object.keys(byMonth).sort()
  const maxBar = Math.max(...months.map(m => byMonth[m].received + byMonth[m].pending + byMonth[m].overdue), 1)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280', fontFamily: font }}>Carregando...</div>

  return (
    <div style={{ fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Relatório Financeiro</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Visão geral das suas finanças</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.875rem', fontFamily: font, outline: 'none', background: 'white', cursor: 'pointer' }}>
          <option value="1">Último mês</option>
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Último ano</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Faturado', value: formatCurrency(totalAll), icon: '💼', color: '#0d1117', bg: 'white' },
          { label: 'Recebido', value: formatCurrency(totalReceived), icon: '✅', color: '#065f46', bg: 'rgba(5,150,105,0.06)' },
          { label: 'A Receber', value: formatCurrency(totalPending), icon: '⏳', color: '#2563eb', bg: 'rgba(37,99,235,0.06)' },
          { label: 'Vencido', value: formatCurrency(totalOverdue), icon: '⚠️', color: '#991b1b', bg: 'rgba(153,27,27,0.06)' },
          { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: '📊', color: '#1d4ed8', bg: 'rgba(29,78,216,0.06)' },
          { label: 'Propostas', value: String(proposals.length), icon: '📝', color: '#7c3aed', bg: 'rgba(124,58,237,0.06)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.4rem', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {months.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#0d1117' }}>Receita por mês</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 200, paddingBottom: '0.5rem', overflowX: 'auto' }}>
            {months.map(m => {
              const data = byMonth[m]
              const total = data.received + data.pending + data.overdue
              const height = Math.round((total / maxBar) * 180)
              const receivedH = Math.round((data.received / Math.max(total, 1)) * height)
              const pendingH = Math.round((data.pending / Math.max(total, 1)) * height)
              const overdueH = height - receivedH - pendingH
              return (
                <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: 64 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0d1117', textAlign: 'center' }}>{formatCurrency(total).replace('R$\u00a0', 'R$')}</div>
                  <div style={{ width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 180 }}>
                    <div style={{ width: '100%', height: overdueH, background: '#fca5a5', borderRadius: overdueH > 0 ? '4px 4px 0 0' : 0 }}></div>
                    <div style={{ width: '100%', height: pendingH, background: '#fdba74' }}></div>
                    <div style={{ width: '100%', height: receivedH, background: '#059669', borderRadius: receivedH > 0 && pendingH === 0 && overdueH === 0 ? '4px 4px 0 0' : 0 }}></div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                    {new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'short' })}<br />{m.substring(0, 4)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[{ color: '#059669', label: 'Recebido' }, { color: '#fdba74', label: 'Pendente' }, { color: '#fca5a5', label: 'Vencido' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }}></div>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(13,17,23,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0d1117' }}>Detalhamento</h2>
        </div>
        {receivables.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
            <p style={{ fontWeight: 500 }}>Nenhum registro no período selecionado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid rgba(13,17,23,0.08)' }}>
                {['Descrição', 'Cliente', 'Valor', 'Vencimento', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receivables.map(r => {
                const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                  paid:      { label: 'Pago',      color: '#065f46', bg: 'rgba(5,150,105,0.1)'   },
                  pending:   { label: 'Pendente',  color: '#2563eb', bg: 'rgba(37,99,235,0.1)'   },
                  overdue:   { label: 'Vencido',   color: '#991b1b', bg: 'rgba(153,27,27,0.1)'   },
                  cancelled: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
                }
                const s = statusMap[r.status] || statusMap.pending
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(13,17,23,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#0d1117' }}>{r.description}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{r.clients?.name || '—'}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#0d1117' }}>{formatCurrency(r.amount)}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{r.due_date ? new Date(r.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0d1117' }}>
                <td colSpan={2} style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Total do período</td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>{formatCurrency(totalAll)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
