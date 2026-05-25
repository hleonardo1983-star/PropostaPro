'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTrialStatus } from '@/lib/trial-context'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

interface Item { id: string; description: string; quantity: number; unit_price: number; unit_price_display: string; type: 'service' | 'product' }

function formatCurrencyInput(value: string): string {
  const nums = value.replace(/\D/g, '')
  if (!nums) return ''
  const number = parseInt(nums, 10) / 100
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseCurrency(display: string): number {
  const nums = display.replace(/\D/g, '')
  if (!nums) return 0
  return parseInt(nums, 10) / 100
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10,
  border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.9rem',
  outline: 'none', background: 'white', fontFamily: font, color: '#0d1117',
}
const labelStyle: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }

interface ItemBlockProps {
  type: 'service' | 'product'; icon: string; label: string; list: Item[]
  subtotal: number; onAdd: () => void; onRemove: (id: string) => void
  onUpdate: (id: string, field: string, value: any) => void
  onPriceInput: (id: string, raw: string) => void; canRemove: boolean
}

function ItemBlock({ type, icon, label, list, subtotal, onAdd, onRemove, onUpdate, onPriceInput, canRemove }: ItemBlockProps) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ background: '#0d1117', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{icon}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{label}</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: 100 }}>
            {list.length} item{list.length !== 1 ? 's' : ''}
          </span>
        </div>
        {list.length > 0 && <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2563eb' }}>{formatCurrency(subtotal)}</span>}
      </div>
      <div style={{ padding: '1.5rem' }}>
        {list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {list.map((item, idx) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 150px 36px', gap: '0.75rem', alignItems: 'end' }}>
                <div>
                  {idx === 0 && <label style={labelStyle}>Descrição *</label>}
                  <input value={item.description} onChange={e => onUpdate(item.id, 'description', e.target.value)} style={inputStyle} placeholder={type === 'service' ? 'Ex: Consultoria mensal' : 'Ex: Notebook Dell'} />
                </div>
                <div>
                  {idx === 0 && <label style={labelStyle}>Qtd</label>}
                  <input type="number" value={item.quantity} min={1} step={0.01} onChange={e => onUpdate(item.id, 'quantity', parseFloat(e.target.value) || 1)} style={inputStyle} />
                </div>
                <div>
                  {idx === 0 && <label style={labelStyle}>Valor unitário</label>}
                  <input value={item.unit_price_display} onChange={e => onPriceInput(item.id, e.target.value)} style={inputStyle} placeholder="R$ 0,00" inputMode="numeric" />
                </div>
                <div>
                  {idx === 0 && <label style={labelStyle}>&nbsp;</label>}
                  <button type="button" onClick={() => onRemove(item.id)} disabled={!canRemove && list.length === 1}
                    style={{ width: 36, height: 38, borderRadius: 8, border: '1px solid rgba(13,17,23,0.15)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={onAdd} style={{ background: 'transparent', border: '1.5px dashed rgba(13,17,23,0.2)', color: '#6b7280', padding: '0.6rem 1.2rem', borderRadius: 10, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: font }}>
          + Adicionar {type === 'service' ? 'serviço' : 'produto'}
        </button>
      </div>
    </div>
  )
}

export default function NewProposalPage() {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const defaultValidUntil = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  const [validUntil, setValidUntil] = useState(defaultValidUntil)
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [items, setItems] = useState<Item[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, unit_price_display: '', type: 'service' },
    { id: '2', description: '', quantity: 1, unit_price: 0, unit_price_display: '', type: 'product' },
  ])
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [proposalCount, setProposalCount] = useState(1)
  const router = useRouter()
  const supabase = createClient()
  const { isBlocked } = useTrialStatus()

  useEffect(() => {
    if (isBlocked) router.replace('/dashboard/plans')
  }, [isBlocked])

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

  const addItem = useCallback((type: 'service' | 'product') => {
    setItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, unit_price_display: '', type }])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev)
  }, [])

  const updateItem = useCallback((id: string, field: string, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }, [])

  const handlePriceInput = useCallback((id: string, raw: string) => {
    const display = formatCurrencyInput(raw)
    const value = parseCurrency(display)
    setItems(prev => prev.map(i => i.id === id ? { ...i, unit_price: value, unit_price_display: display } : i))
  }, [])

  const services = items.filter(i => i.type === 'service')
  const products = items.filter(i => i.type === 'product')
  const totalServices = services.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const totalProducts = products.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const total = totalServices + totalProducts

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allItems = items.filter(i => i.description.trim())
    if (!title || allItems.length === 0) { alert('Preencha o título e ao menos um item'); return }
    setLoading(true)
    try {
      const { data: proposal, error } = await supabase.from('proposals').insert({
        tenant_id: tenantId, client_id: clientId || null, created_by: profileId,
        number: proposalCount, title, notes: notes || null, valid_until: validUntil || null, status: 'draft',
      }).select().single()
      if (error) throw error
      const itemsToInsert = allItems.map((item, idx) => ({
        proposal_id: proposal.id, description: item.description,
        quantity: Number(item.quantity), unit_price: Number(item.unit_price),
        sort_order: item.type === 'service' ? idx : 1000 + idx, item_type: item.type,
      }))
      const { error: itemsError } = await supabase.from('proposal_items').insert(itemsToInsert)
      if (itemsError) throw itemsError
      router.push(`/dashboard/proposals/${proposal.id}`)
    } catch (err: any) {
      alert(err.message || 'Erro ao criar proposta')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 780, fontFamily: font }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Nova proposta</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Proposta #{proposalCount}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#0d1117' }}>Informações gerais</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Título da proposta *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} placeholder="Ex: Desenvolvimento de site institucional" />
            </div>
            <div>
              <label style={labelStyle}>Cliente</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
                <option value="">Selecionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Válida até</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Observações / Condições</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Ex: Pagamento em 3x, prazo de entrega 30 dias..." />
            </div>
          </div>
        </div>

        <ItemBlock type="service" icon="🛠️" label="Serviços" list={services} subtotal={totalServices}
          onAdd={() => addItem('service')} onRemove={removeItem} onUpdate={updateItem}
          onPriceInput={handlePriceInput} canRemove={items.length > 1} />

        <ItemBlock type="product" icon="📦" label="Produtos" list={products} subtotal={totalProducts}
          onAdd={() => addItem('product')} onRemove={removeItem} onUpdate={updateItem}
          onPriceInput={handlePriceInput} canRemove={items.length > 1} />

        <div style={{ background: '#0d1117', borderRadius: 16, padding: '1.25rem 1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total da proposta</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: font }}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ background: '#2563eb', color: 'white', padding: '0.7rem 2rem', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, opacity: loading ? 0.7 : 1, fontFamily: font }}>
            {loading ? 'Salvando...' : 'Salvar proposta →'}
          </button>
        </div>
      </form>
    </div>
  )
}
