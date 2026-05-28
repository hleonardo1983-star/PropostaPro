'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTenantData } from '@/lib/supabase/cache'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const supabase = createClient()

  async function load() {
    const tenant = await getTenantData(supabase)
    if (!tenant) return
    setTenantId(tenant.tenantId)
    const { data } = await supabase.from('clients').select('*, proposals(count)').eq('tenant_id', tenant.tenantId).order('name')
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditClient(null); setForm({ name: '', email: '', phone: '', document: '', notes: '' }); setShowModal(true) }
  function openEdit(c: any) { setEditClient(c); setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', document: c.document || '', notes: c.notes || '' }); setShowModal(true) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (editClient) {
      await supabase.from('clients').update(form).eq('id', editClient.id)
    } else {
      await supabase.from('clients').insert({ ...form, tenant_id: tenantId })
    }
    setSaving(false); setShowModal(false); load()
  }

  async function deleteClient(id: string) {
    await supabase.from('clients').delete().eq('id', id)
    setConfirmDelete(null); load()
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.875rem', outline: 'none', background: 'white', fontFamily: font, color: '#0d1117' }

  return (
    <div style={{ fontFamily: font }}>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: font, fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>{editClient ? 'Editar cliente' : 'Novo cliente'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {[['Nome *', 'name', 'text', 'Nome completo ou empresa'], ['E-mail', 'email', 'email', 'email@cliente.com'], ['Telefone', 'phone', 'text', '(44) 99999-9999'], ['CPF/CNPJ', 'document', 'text', '000.000.000-00']].map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={key === 'name'} style={inputStyle} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>Observações</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.65rem 1.25rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: font }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.65rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, fontFamily: font, opacity: saving ? 0.7 : 1 }}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗑</div>
            <h3 style={{ fontFamily: font, fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Excluir {confirmDelete.name}?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.65rem 1.25rem', borderRadius: 100, cursor: 'pointer', fontFamily: font, fontWeight: 600, fontSize: '0.875rem' }}>Cancelar</button>
              <button onClick={() => deleteClient(confirmDelete.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.65rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontFamily: font, fontWeight: 700, fontSize: '0.875rem' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Clientes</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} style={{ background: '#2563eb', color: 'white', padding: '0.7rem 1.5rem', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: font }}>+ Novo cliente</button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
        : clients.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ marginBottom: '1rem', fontWeight: 500 }}>Nenhum cliente ainda</p>
            <button onClick={openNew} style={{ color: '#2563eb', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: font }}>Adicionar primeiro cliente →</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(13,17,23,0.08)', background: '#fafafa' }}>
                {['Nome', 'E-mail', 'Telefone', 'Propostas', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(13,17,23,0.05)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, fontSize: '0.875rem' }}>{c.name}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{c.email || '—'}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{(c.proposals as any)?.[0]?.count || 0}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(c)} style={{ background: 'transparent', border: '1px solid rgba(13,17,23,0.12)', color: '#6b7280', padding: '0.3rem 0.75rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: font }}>Editar</button>
                      <button onClick={() => setConfirmDelete(c)} style={{ background: 'transparent', border: '1px solid rgba(13,17,23,0.12)', color: '#9ca3af', padding: '0.3rem 0.75rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: font }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(13,17,23,0.12)' }}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
