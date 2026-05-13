'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface GeneratedItem {
  description: string
  quantity: number
  unit_price: number
  type: 'service' | 'product'
}

interface GeneratedProposal {
  title: string
  notes: string
  valid_until: string
  client_name: string
  client_email: string
  client_phone: string
  services: GeneratedItem[]
  products: GeneratedItem[]
}

export default function AIProposalPage() {
  const [step, setStep] = useState<'input' | 'review' | 'saving'>('input')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedProposal | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [proposalCount, setProposalCount] = useState(1)
  const [error, setError] = useState('')
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
      const { data: cls } = await supabase.from('clients').select('id, name, email, phone').eq('tenant_id', profile.tenant_id).order('name')
      setClients(cls || [])
      const { count } = await supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id)
      setProposalCount((count || 0) + 1)
    }
    load()
  }, [])

  async function generateProposal() {
    if (!description.trim()) return
    setGenerating(true)
    setError('')
    try {
      const response = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erro na geração')
      }
      const parsed: GeneratedProposal = await response.json()
      setGenerated(parsed)
      setStep('review')
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar proposta. Tente descrever com mais detalhes.')
    }
    setGenerating(false)
  }

  async function saveProposal() {
    if (!generated) return
    setStep('saving')
    try {
      let clientId = selectedClientId
      if (!clientId && generated.client_name) {
        const { data: existing } = await supabase.from('clients').select('id').eq('tenant_id', tenantId).ilike('name', generated.client_name).single()
        if (existing) {
          clientId = existing.id
        } else {
          const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenantId,
            name: generated.client_name,
            email: generated.client_email || null,
            phone: generated.client_phone || null,
          }).select().single()
          if (newClient) clientId = newClient.id
        }
      }
      const { data: proposal, error: propError } = await supabase.from('proposals').insert({
        tenant_id: tenantId, client_id: clientId || null, created_by: profileId,
        number: proposalCount, title: generated.title, notes: generated.notes || null,
        valid_until: generated.valid_until || null, status: 'draft',
      }).select().single()
      if (propError) throw propError
      const allItems = [
        ...generated.services.map((s, i) => ({ ...s, sort_order: i, item_type: 'service', proposal_id: proposal.id })),
        ...generated.products.map((p, i) => ({ ...p, sort_order: 1000 + i, item_type: 'product', proposal_id: proposal.id })),
      ]
      if (allItems.length > 0) {
        await supabase.from('proposal_items').insert(allItems.map(item => ({
          proposal_id: item.proposal_id, description: item.description,
          quantity: item.quantity, unit_price: item.unit_price,
          sort_order: item.sort_order, item_type: item.item_type,
        })))
      }
      router.push(`/dashboard/proposals/${proposal.id}`)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setStep('review')
    }
  }

  function updateService(idx: number, field: string, value: any) {
    if (!generated) return
    const services = [...generated.services]
    services[idx] = { ...services[idx], [field]: value }
    setGenerated({ ...generated, services })
  }

  function updateProduct(idx: number, field: string, value: any) {
    if (!generated) return
    const products = [...generated.products]
    products[idx] = { ...products[idx], [field]: value }
    setGenerated({ ...generated, products })
  }

  const totalServices = generated?.services.reduce((s, i) => s + i.quantity * i.unit_price, 0) || 0
  const totalProducts = generated?.products.reduce((s, i) => s + i.quantity * i.unit_price, 0) || 0
  const total = totalServices + totalProducts

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10,
    border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.875rem',
    outline: 'none', background: 'white', fontFamily: font, color: '#0d1117',
  }
  const labelStyle: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }

  return (
    <div style={{ maxWidth: 780, fontFamily: font }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #c8511a, #7c3aed)', borderRadius: 14, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>✨</div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0d1117', lineHeight: 1 }}>Proposta Perfeita com IA</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, marginTop: '0.25rem' }}>Descreva em linguagem natural e a IA cria sua proposta em segundos</p>
        </div>
      </div>

      {/* STEP: INPUT */}
      {step === 'input' && (
        <div>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem', color: '#0d1117' }}>
              Descreva sua proposta em linguagem natural
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.7 }}
              placeholder={`Exemplos:\n\n"Proposta para João Silva da empresa ABC. Consultoria de marketing digital por 3 meses, R$ 3.500/mês. Inclui gestão de redes sociais e criação de conteúdo. Pagamento mensal."\n\n"Proposta para Maria Santos. Desenvolvimento de site institucional por R$ 8.000. Prazo de 45 dias. 50% de entrada e 50% na entrega."`}
            />
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clique para preencher um exemplo</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  'Consultoria de TI mensal por R$ 2.500 para empresa XYZ',
                  'Desenvolvimento de app Android por R$ 15.000, 60 dias',
                  'Manutenção predial trimestral R$ 4.800 para Condomínio ABC',
                ].map(ex => (
                  <button key={ex} type="button" onClick={() => setDescription(ex)}
                    style={{ background: '#f9fafb', border: '1px solid rgba(13,17,23,0.1)', borderRadius: 100, padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', color: '#6b7280', fontFamily: font }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div style={{ background: 'rgba(200,81,26,0.08)', border: '1px solid rgba(200,81,26,0.2)', borderRadius: 10, padding: '0.85rem 1rem', color: '#c8511a', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.back()}
              style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: font }}>
              Cancelar
            </button>
            <button type="button" onClick={generateProposal} disabled={generating || !description.trim()}
              style={{ background: generating || !description.trim() ? '#d1d5db' : 'linear-gradient(135deg, #c8511a, #7c3aed)', color: 'white', padding: '0.7rem 2rem', borderRadius: 100, border: 'none', cursor: generating || !description.trim() ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: font }}>
              {generating ? '⟳ Gerando...' : '✨ Gerar Proposta com IA'}
            </button>
          </div>
        </div>
      )}

      {/* STEP: REVIEW */}
      {step === 'review' && generated && (
        <div>
          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✅</span>
            <div>
              <p style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.9rem' }}>Proposta gerada! Revise e ajuste antes de salvar.</p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem', color: '#0d1117' }}>Informações gerais</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input value={generated.title} onChange={e => setGenerated({ ...generated, title: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Cliente existente</label>
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={inputStyle}>
                    <option value="">Usar dados gerados pela IA</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Válida até</label>
                  <input type="date" value={generated.valid_until} onChange={e => setGenerated({ ...generated, valid_until: e.target.value })} style={inputStyle} />
                </div>
              </div>
              {!selectedClientId && generated.client_name && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', border: '1px solid rgba(13,17,23,0.06)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Novo cliente (criado automaticamente)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { label: 'Nome', field: 'client_name', placeholder: 'Nome do cliente' },
                      { label: 'E-mail', field: 'client_email', placeholder: 'email@cliente.com' },
                      { label: 'Telefone', field: 'client_phone', placeholder: '5544999999999' },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={{ ...labelStyle, fontSize: '0.75rem' }}>{f.label}</label>
                        <input value={(generated as any)[f.field]} onChange={e => setGenerated({ ...generated, [f.field]: e.target.value })} style={{ ...inputStyle, fontSize: '0.82rem' }} placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label style={labelStyle}>Observações e condições</label>
                <textarea value={generated.notes} onChange={e => setGenerated({ ...generated, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {generated.services.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ background: '#0d1117', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🛠️</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Serviços</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c8511a' }}>{formatCurrency(totalServices)}</span>
              </div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {generated.services.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Descrição</label>}
                      <input value={item.description} onChange={e => updateService(idx, 'description', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Qtd</label>}
                      <input type="number" value={item.quantity} min={1} onChange={e => updateService(idx, 'quantity', parseFloat(e.target.value))} style={inputStyle} />
                    </div>
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Valor (R$)</label>}
                      <input type="number" value={item.unit_price} min={0} step={0.01} onChange={e => updateService(idx, 'unit_price', parseFloat(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generated.products.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ background: '#0d1117', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📦</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Produtos</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c8511a' }}>{formatCurrency(totalProducts)}</span>
              </div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {generated.products.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Descrição</label>}
                      <input value={item.description} onChange={e => updateProduct(idx, 'description', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Qtd</label>}
                      <input type="number" value={item.quantity} min={1} onChange={e => updateProduct(idx, 'quantity', parseFloat(e.target.value))} style={inputStyle} />
                    </div>
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Valor (R$)</label>}
                      <input type="number" value={item.unit_price} min={0} step={0.01} onChange={e => updateProduct(idx, 'unit_price', parseFloat(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#0d1117', borderRadius: 16, padding: '1.25rem 1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total da proposta</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c8511a', letterSpacing: '-0.02em' }}>{formatCurrency(total)}</span>
          </div>

          {error && <div style={{ background: 'rgba(200,81,26,0.08)', border: '1px solid rgba(200,81,26,0.2)', borderRadius: 10, padding: '0.85rem 1rem', color: '#c8511a', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button onClick={() => { setStep('input'); setGenerated(null) }}
              style={{ background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.7rem 1.5rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: font }}>
              ← Redigitar
            </button>
            <button onClick={saveProposal}
              style={{ background: '#c8511a', color: 'white', padding: '0.7rem 2rem', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: font }}>
              Salvar proposta →
            </button>
          </div>
        </div>
      )}

      {step === 'saving' && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117', marginBottom: '0.5rem' }}>Salvando proposta...</h2>
          <p style={{ color: '#6b7280' }}>Aguarde um momento</p>
        </div>
      )}
    </div>
  )
}
