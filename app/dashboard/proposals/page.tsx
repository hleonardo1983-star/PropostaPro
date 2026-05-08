'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    draft:    { label: 'Rascunho',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    sent:     { label: 'Enviada',     color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)'   },
    viewed:   { label: 'Visualizada', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'  },
    signed:   { label: 'Assinada',    color: '#065f46', bg: 'rgba(5,150,105,0.1)'   },
    rejected: { label: 'Recusada',    color: '#c8511a', bg: 'rgba(200,81,26,0.1)'   },
  }

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

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('proposal_items').delete().eq('proposal_id', id)
    await supabase.from('receivables').delete().eq('proposal_id', id)
    await supabase.from('proposals').delete().eq('id', id)
    setConfirmId(null)
    setDeletingId(null)
    load()
  }

  function getTotal(items: any[]) {
    return items?.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0) || 0
  }

  return (
    <div style={{ fontFamily: font }}>

      {/* Modal confirmação exclusão */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(220,38,38,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>🗑</div>
            <h3 style={{ fontFamily: font, fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0d1117' }}>Excluir proposta?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Esta ação é permanente. A proposta, itens e conta a receber vinculada serão removidos.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmId(null)}
                style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: font }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmId)} disabled={!!deletingId}
                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: font, opacity: deletingId ? 0.7 : 1 }}>
                {deletingId ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: font, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Propostas</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>{proposals.length} proposta{proposals.length !== 1 ? 's' : ''} no total</p>
        </div>
        <Link href="/dashboard/proposals/new" style={{ background: '#c8511a', color: 'white', padding: '0.7rem 1.5rem', borderRadius: 100, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
          + Nova proposta
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
        ) : proposals.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <p style={{ marginBottom: '1rem', fontWeight: 500 }}>Nenhuma proposta ainda</p>
            <Link href="/dashboard/proposals/new" style={{ color: '#c8511a', fontWeight: 700, textDecoration: 'none' }}>Criar primeira proposta →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(13,17,23,0.08)', background: '#fafafa' }}>
                {['Nº', 'Título', 'Cliente', 'Valor', 'Status', 'Data', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposals.map(p => {
                const s = statusLabel[p.status] || statusLabel.draft
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(13,17,23,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af' }}>#{p.number}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#0d1117' }}>{p.title}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>{(p.clients as any)?.name || '—'}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#0d1117' }}>{formatCurrency(getTotal(p.proposal_items))}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '0.3rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Link href={`/dashboard/proposals/${p.id}`} style={{ color: '#c8511a', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          Ver →
                        </Link>
                        <button onClick={() => setConfirmId(p.id)}
                          style={{ background: 'transparent', border: '1px solid rgba(13,17,23,0.12)', color: '#9ca3af', padding: '0.3rem 0.75rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: font, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(13,17,23,0.12)' }}>
                          Excluir
                        </button>
                      </div>
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
