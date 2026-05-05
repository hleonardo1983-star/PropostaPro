'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return
    setTenantId(profile.tenant_id)
    const { data } = await supabase.from('clients').select('*').eq('tenant_id', profile.tenant_id).order('name')
    setClients(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function saveClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('clients').insert({ ...form, tenant_id: tenantId })
    setForm({ name: '', email: '', phone: '', document: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const inputStyle = {width:"100%",padding:"0.65rem 0.9rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.875rem",outline:"none",background:"white",fontFamily:"inherit"}

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem"}}>
        <div>
          <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"0.25rem"}}>Clientes</h1>
          <p style={{color:"#7a7368",fontSize:"0.9rem"}}>{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          style={{background:"#c8511a",color:"white",padding:"0.65rem 1.5rem",borderRadius:100,border:"none",cursor:"pointer",fontWeight:600,fontSize:"0.875rem"}}>
          + Novo cliente
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveClient} style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",padding:"2rem",marginBottom:"1.5rem"}}>
          <h3 style={{fontWeight:600,marginBottom:"1.25rem"}}>Novo cliente</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.35rem"}}>Nome *</label>
              <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inputStyle} placeholder="Nome do cliente" />
            </div>
            <div>
              <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.35rem"}}>E-mail</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inputStyle} placeholder="cliente@email.com" />
            </div>
            <div>
              <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.35rem"}}>WhatsApp</label>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} placeholder="5544988278844" />
            </div>
            <div>
              <label style={{fontSize:"0.82rem",fontWeight:600,display:"block",marginBottom:"0.35rem"}}>CPF / CNPJ</label>
              <input value={form.document} onChange={e=>setForm(f=>({...f,document:e.target.value}))} style={inputStyle} placeholder="000.000.000-00" />
            </div>
          </div>
          <div style={{display:"flex",gap:"0.75rem",marginTop:"1.25rem",justifyContent:"flex-end"}}>
            <button type="button" onClick={()=>setShowForm(false)}
              style={{background:"transparent",border:"1.5px solid rgba(15,14,12,0.15)",padding:"0.6rem 1.25rem",borderRadius:100,cursor:"pointer",fontSize:"0.875rem"}}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{background:"#c8511a",color:"white",padding:"0.6rem 1.5rem",borderRadius:100,border:"none",cursor:"pointer",fontSize:"0.875rem",fontWeight:600}}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",overflow:"hidden"}}>
        {loading ? <div style={{padding:"3rem",textAlign:"center",color:"#7a7368"}}>Carregando...</div>
        : clients.length === 0 ? (
          <div style={{padding:"4rem",textAlign:"center",color:"#7a7368"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>👥</div>
            <p>Nenhum cliente cadastrado ainda</p>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid rgba(15,14,12,0.08)"}}>
                {['Nome','E-mail','WhatsApp','CPF/CNPJ'].map(h => (
                  <th key={h} style={{padding:"0.85rem 1.5rem",textAlign:"left",fontSize:"0.78rem",fontWeight:600,color:"#7a7368",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} style={{borderBottom:"1px solid rgba(15,14,12,0.06)"}}>
                  <td style={{padding:"1rem 1.5rem",fontWeight:500,fontSize:"0.875rem"}}>{c.name}</td>
                  <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem",color:"#7a7368"}}>{c.email || '—'}</td>
                  <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem",color:"#7a7368"}}>{c.phone || '—'}</td>
                  <td style={{padding:"1rem 1.5rem",fontSize:"0.875rem",color:"#7a7368"}}>{c.document || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
