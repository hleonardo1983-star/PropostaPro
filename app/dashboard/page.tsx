'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

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
      const { data: recentProps } = await supabase.from('proposals')
        .select('id, number, title, status, created_at, clients(name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false }).limit(5)
      setRecent(recentProps || [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    draft:    { label: 'Rascunho',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    sent:     { label: 'Enviada',     color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)'   },
    viewed:   { label: 'Visualizada', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'  },
    signed:   { label: 'Assinada',    color: '#065f46', bg: 'rgba(5,150,105,0.1)'   },
    rejected: { label: 'Recusada',    color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280', fontFamily: font }}>Carregando...</div>

  return (
    <div style={{ fontFamily: font }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Olá, {tenantName} 👋</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Aqui está o resumo da sua conta</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total de propostas', value: stats.proposals, icon: '📝', color: '#0d1117' },
          { label: 'Assinadas', value: stats.signed, icon: '✅', color: '#065f46' },
          { label: 'Aguardando', value: stats.pending, icon: '⏳', color: '#2563eb' },
          { label: 'A receber', value: formatCurrency(stats.receivables), icon: '💰', color: '#1d4ed8' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(13,17,23,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Propostas recentes</h2>
          <Link href="/dashboard/proposals/new" style={{ background: '#2563eb', color: 'white', padding: '0.5rem 1.2rem', borderRadius: 100, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>+ Nova proposta</Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ marginBottom: '1rem' }}>Nenhuma proposta ainda</p>
            <Link href="/dashboard/proposals/new" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Criar primeira proposta →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(13,17,23,0.06)', background: '#fafafa' }}>
                {['Nº','Título','Cliente','Status','Data'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(p => {
                const s = statusLabel[p.status] || statusLabel.draft
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(13,17,23,0.04)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af' }}>#{p.number}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem' }}>
                      <Link href={`/dashboard/proposals/${p.id}`} style={{ color: '#0d1117', textDecoration: 'none', fontWeight: 600 }}>{p.title}</Link>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{(p.clients as any)?.name || '—'}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
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
