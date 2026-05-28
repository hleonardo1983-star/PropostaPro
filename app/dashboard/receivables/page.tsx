'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTenantData } from '@/lib/supabase/cache'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ status: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return
    const { data } = await supabase.from('receivables')
      .select('*, clients(name), proposals(number, title)')
      .eq('tenant_id', tenant.tenantId)
      .order('due_date', { ascending: true, nullsFirst: false })
    setReceivables(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markPaid(id: string) {
    await supabase.from('receivables').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  function openEdit(r: any) {
    setEditingId(r.id)
    setEditForm({ status: r.status, due_date: r.due_date ? r.due_date.split('T')[0] : '' })
  }

  async function saveEdit() {
    setSaving(true)
    const updates: any = { status: editForm.status, due_date: editForm.due_date || null }
    if (editForm.status === 'paid') updates.paid_at = new Date().toISOString()
    else updates.paid_at = null
    await supabase.from('receivables').update(updates).eq('id', editingId)
    setEditingId(null); setSaving(false); load()
  }

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'Pendente',  color: '#2563eb', bg: 'rgba(37,99,235,0.1)'    },
    paid:      { label: 'Pago',      color: '#065f46', bg: 'rgba(5,150,105,0.1)'    },
    overdue:   { label: 'Vencido',   color: '#991b1b', bg: 'rgba(153,27,27,0.1)'    },
    cancelled: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.1)'  },
  }

  const totalPending = receivables.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)
  const totalPaid = receivables.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 10, border: '1.5px solid rgba(17,24,39,0.15)', fontSize: '0.875rem', outline: 'none', background: 'white', fontFamily: font, color: '#0d1117' }

  return (
    <div style={{ fontFamily: font }}>
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: font, fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0d1117' }}>Editar conta a receber</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>Data prevista de recebimento</label>
                <input type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1.5px solid rgba(17,24,39,0.15)', padding: '0.65rem 1.25rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: font }}>Cancelar</button>
              <button onClick={saveEdit} disabled={saving} style={{ background: '#0d1117', color: 'white', border: 'none', padding: '0.65rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, fontFamily: font, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: font, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Contas a receber</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Ordenadas por data de vencimento</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontFamily: font, fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.03em' }}>{formatCurrency(totalPending)}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>Pendente a receber</div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontFamily: font, fontSize: '1.6rem', fontWeight: 800, color: '#065f46', letterSpacing: '-0.03em' }}>{formatCurrency(totalPaid)}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>Total recebido</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
        : receivables.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <p style={{ fontWeight: 500 }}>Nenhuma conta a receber ainda.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Aparecem automaticamente quando propostas são assinadas.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(13,17,23,0.08)', background: '#fafafa' }}>
                {['Descrição', 'Cliente', 'Valor', 'Vencimento', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receivables.map(r => {
                const s = statusLabel[r.status] || statusLabel.pending
                const dueDateFixed = r.due_date ? r.due_date.split('T')[0] : null
                const isOverdue = r.status === 'pending' && dueDateFixed && dueDateFixed < new Date().toISOString().split('T')[0]
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(13,17,23,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#0d1117', maxWidth: 260 }}>{r.description}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{(r.clients as any)?.name || '—'}</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(r.amount)}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: isOverdue ? '#991b1b' : '#0d1117' }}>
                      {dueDateFixed ? new Date(dueDateFixed + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      {isOverdue && <span style={{ display: 'block', fontSize: '0.72rem', color: '#991b1b', fontWeight: 700 }}>Vencida</span>}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '0.3rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {r.status === 'pending' && (
                          <button onClick={() => markPaid(r.id)} style={{ background: 'rgba(5,150,105,0.1)', color: '#065f46', border: 'none', padding: '0.35rem 0.8rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: font, whiteSpace: 'nowrap' }}>Marcar pago</button>
                        )}
                        <button onClick={() => openEdit(r)} style={{ background: 'transparent', border: '1px solid rgba(13,17,23,0.15)', color: '#6b7280', padding: '0.35rem 0.8rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: font }}>Editar</button>
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
