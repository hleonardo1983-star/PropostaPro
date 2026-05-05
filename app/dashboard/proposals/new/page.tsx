'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Item { id: string; description: string; quantity: number; unit_price: number }

export default function NewProposalPage() {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [items, setItems] = useState<Item[]>([{ id: '1', description: '', quantity: 1, unit_price: 0 }])
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [proposalCount, setProposalCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('id, tenant_id').eq('id', user.id).single()
      if (!profile) return
      setTenantId(profile.tenant_id)
      setProfileId(profile.id)
      const { data: cls } = await supabase.from('clients').select('id, name').eq('tenant_id', profile.tenant_id).order('name')
      setClients(cls || [])
      const { count } = await supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id)
      setProposalCount((count || 0) + 1)
    }
    load()
  }, [])

  function addItem() {
    setItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0 }])
  }
  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }
  function updateItem(id: string, field: keyof Item, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || items.some(i => !i.description)) { alert('Preencha título e descrição dos itens'); return }
    setLoading(true)
    try {
      const { data: proposal, error } = await supabase.from('proposals').insert({
        tenant_id: tenantId,
        client_id: clientId || null,
        created_by: profileId,
        number: proposalCount,
        title,
        notes: notes || null,
        valid_until: validUntil || null,
        status: 'draft',
      }).select().single()
      if (error) throw error

      const itemsToInsert = items.map((item, idx) => ({
        proposal_id: proposal.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        sort_order: idx,
      }))
      const { error: itemsError } = await supabase.from('proposal_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      router.push(`/dashboard/proposals/${proposal.id}`)
    } catch (err: any) {
      alert(err.message || 'Erro ao criar proposta')
      setLoading(false)
    }
  }

  const inputStyle = {width:"100%",padding:"0.7rem 0.9rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.9rem",outline:"none",background:"white",fontFamily:"inherit"}
  const labelStyle = {fontSize:"0.82rem",fontWeight:600 as const,display:"block" as const,marginBottom:"0.4rem",color:"#0f0e0c"}

  return (
    <div style={{maxWidth:760}}>
      <div style={{marginBottom:"2rem"}}>
        <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"0.25rem"}}>Nova proposta</h1>
        <p style={{color:"#7a7368",fontSize:"0.9rem"}}>Proposta #{proposalCount}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",padding:"2rem",marginBottom:"1.5rem"}}>
          <h2 style={{fontWeight:600,fontSize:"1rem",marginBottom:"1.5rem"}}>Informações gerais</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={labelStyle}>Título da proposta *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} required style={inputStyle} placeholder="Ex: Desenvolvimento de site institucional" />
            </div>
            <div>
              <label style={labelStyle}>Cliente</label>
              <select value={clientId} onChange={e=>setClientId(e.target.value)} style={inputStyle}>
                <option value="">Selecionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Válida até</label>
              <input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)} style={inputStyle} />
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={labelStyle}>Observações / Condições</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                style={{...inputStyle,resize:"vertical" as const}} placeholder="Ex: Pagamento em 3x, prazo de entrega 30 dias..." />
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(15,14,12,0.1)",padding:"2rem",marginBottom:"1.5rem"}}>
          <h2 style={{fontWeight:600,fontSize:"1rem",marginBottom:"1.5rem"}}>Itens do orçamento</h2>
          <div style={{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"1.25rem"}}>
            {items.map((item, idx) => (
              <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 140px 36px",gap:"0.75rem",alignItems:"end"}}>
                <div>
                  {idx === 0 && <label style={labelStyle}>Descrição *</label>}
                  <input value={item.description} onChange={e=>updateItem(item.id,'description',e.target.value)} required
                    style={inputStyle} placeholder="Descrição do serviço ou produto" />
                </div>
                <div>
                  {idx === 0 && <label style={labelStyle}>Qtd</label>}
                  <input type="number" value={item.quantity} min={1} step={0.01}
                    onChange={e=>updateItem(item.id,'quantity',e.target.value)} style={inputStyle} />
                </div>
                <div>
                  {idx === 0 && <label style={labelStyle}>Valor unitário</label>}
                  <input type="number" value={item.unit_price} min={0} step={0.01}
                    onChange={e=>updateItem(item.id,'unit_price',e.target.value)} style={inputStyle} placeholder="0,00" />
                </div>
                <div>
                  {idx === 0 && <label style={labelStyle}>&nbsp;</label>}
                  <button type="button" onClick={()=>removeItem(item.id)} disabled={items.length===1}
                    style={{width:36,height:38,borderRadius:8,border:"1px solid rgba(15,14,12,0.15)",background:"white",cursor:"pointer",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem}
            style={{background:"transparent",border:"1.5px dashed rgba(15,14,12,0.2)",color:"#7a7368",padding:"0.6rem 1.2rem",borderRadius:10,cursor:"pointer",fontSize:"0.875rem",fontWeight:500}}>
            + Adicionar item
          </button>
          <div style={{marginTop:"1.5rem",display:"flex",justifyContent:"flex-end",alignItems:"center",gap:"1.5rem",paddingTop:"1rem",borderTop:"1px solid rgba(15,14,12,0.08)"}}>
            <span style={{color:"#7a7368",fontSize:"0.9rem"}}>Total</span>
            <span style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.75rem",color:"#c8511a",letterSpacing:"-0.02em"}}>{formatCurrency(total)}</span>
          </div>
        </div>

        <div style={{display:"flex",gap:"1rem",justifyContent:"flex-end"}}>
          <button type="button" onClick={()=>router.back()}
            style={{background:"transparent",border:"1.5px solid rgba(15,14,12,0.15)",padding:"0.7rem 1.5rem",borderRadius:100,cursor:"pointer",fontSize:"0.9rem",fontWeight:500}}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            style={{background:"#c8511a",color:"white",padding:"0.7rem 2rem",borderRadius:100,border:"none",cursor:"pointer",fontSize:"0.9rem",fontWeight:600,opacity:loading?0.7:1}}>
            {loading ? 'Salvando...' : 'Salvar proposta'}
          </button>
        </div>
      </form>
    </div>
  )
}
