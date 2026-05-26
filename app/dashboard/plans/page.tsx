'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function PlansPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposalsUsed, setProposalsUsed] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(plan, proposals_this_month, created_at)')
        .eq('id', user.id).single()
      if (!profile) return
      const tenant = (profile.tenants as any)
      setCurrentPlan(tenant?.plan || 'free')
      setProposalsUsed(tenant?.proposals_this_month || 0)
      if (!tenant?.plan || tenant?.plan === 'free') {
        const created = new Date(tenant?.created_at || user.created_at)
        const trialEnd = new Date(created.getTime() + 14 * 86400000)
        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
        setTrialDaysLeft(daysLeft)
      }
      setLoading(false)
    }
    load()
  }, [])

  const plans = [
    { id: 'free', name: 'Free', price: 0, period: 'para sempre', desc: '14 dias grátis com tudo liberado', limit: 5,
      features: ['5 propostas/mês', '1 usuário', 'Assinatura digital', 'Contas a receber', 'WhatsApp + E-mail'],
      missing: ['Relatórios', 'Multi-usuário'], color: '#6b7280', featured: false },
    { id: 'starter', name: 'Starter', price: 49, period: '/mês', desc: 'Para freelancers e autônomos', limit: 10,
      features: ['10 propostas/mês', '1 usuário master', 'Assinatura digital', 'Contas a receber', 'WhatsApp + E-mail', '1 relatório/mês'],
      missing: ['Multi-usuário'], color: '#1d4ed8', featured: false },
    { id: 'professional', name: 'Profissional', price: 99, period: '/mês', desc: 'Para pequenas empresas', limit: 30,
      features: ['30 propostas/mês', '3 usuários', 'Assinatura digital', 'Contas a receber', 'WhatsApp + E-mail', '3 relatórios/mês', 'Gestão de usuários'],
      missing: [], color: '#2563eb', featured: true },
    { id: 'business', name: 'Business', price: 199, period: '/mês', desc: 'Para equipes e empresas', limit: 999999,
      features: ['Propostas ilimitadas', 'Usuários ilimitados', 'Assinatura digital', 'Contas a receber', 'WhatsApp + E-mail', 'Relatórios ilimitados', 'Gestão de usuários', 'Suporte prioritário'],
      missing: [], color: '#7c3aed', featured: false },
  ]

  const currentPlanData = plans.find(p => p.id === currentPlan) || plans[0]
  const proposalPercent = Math.min(100, Math.round((proposalsUsed / Math.max(currentPlanData.limit, 1)) * 100))

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280', fontFamily: font }}>Carregando...</div>

  return (
    <div style={{ fontFamily: font }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Planos</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Gerencie sua assinatura</p>
      </div>

      {/* Status atual */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Plano atual</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117' }}>{currentPlanData.name}</span>
              <span style={{ background: currentPlanData.color, color: 'white', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>
                {currentPlan === 'free' ? 'Gratuito' : `R$ ${currentPlanData.price}/mês`}
              </span>
            </div>
          </div>
          {trialDaysLeft !== null && (
            <div style={{ background: trialDaysLeft <= 3 ? 'rgba(37,99,235,0.08)' : 'rgba(5,150,105,0.08)', border: `1px solid ${trialDaysLeft <= 3 ? 'rgba(37,99,235,0.2)' : 'rgba(5,150,105,0.2)'}`, borderRadius: 12, padding: '0.85rem 1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: trialDaysLeft <= 3 ? '#2563eb' : '#065f46', lineHeight: 1 }}>{trialDaysLeft > 0 ? trialDaysLeft : '!'}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: trialDaysLeft <= 3 ? '#2563eb' : '#065f46' }}>{trialDaysLeft > 0 ? 'dias de trial' : 'Trial expirado'}</p>
            </div>
          )}
        </div>
        {currentPlanData.limit < 999999 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Propostas este mês</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: proposalPercent >= 80 ? '#2563eb' : '#0d1117' }}>{proposalsUsed} / {currentPlanData.limit}</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${proposalPercent}%`, background: proposalPercent >= 80 ? '#2563eb' : '#059669', borderRadius: 100, transition: 'width 0.5s ease' }}></div>
            </div>
            {proposalPercent >= 80 && (
              <p style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '0.4rem', fontWeight: 500 }}>
                {proposalPercent >= 100 ? '⚠️ Limite atingido! Faça upgrade para continuar.' : `⚡ Você usou ${proposalPercent}% do seu limite mensal.`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Grade de planos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {plans.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan
          const currentIdx = plans.findIndex(p => p.id === currentPlan)
          const isUpgrade = idx > currentIdx
          return (
            <div key={plan.id} style={{ background: plan.featured ? '#0d1117' : 'white', borderRadius: 16, border: isCurrent ? `2px solid ${plan.color}` : plan.featured ? 'none' : '1px solid rgba(13,17,23,0.08)', padding: '1.75rem', position: 'relative', boxShadow: plan.featured ? '0 8px 32px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
              {isCurrent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.75rem', borderRadius: 100, whiteSpace: 'nowrap' }}>Plano atual</div>}
              {plan.featured && !isCurrent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.75rem', borderRadius: 100, whiteSpace: 'nowrap' }}>⚡ Mais popular</div>}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#9ca3af', marginBottom: '0.5rem' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.25rem' }}>
                {plan.price > 0 && <span style={{ fontSize: '0.85rem', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>R$</span>}
                <span style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: plan.featured ? 'white' : '#0d1117', lineHeight: 1 }}>{plan.price === 0 ? 'Grátis' : plan.price}</span>
                <span style={{ fontSize: '0.82rem', color: plan.featured ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: plan.featured ? 'rgba(255,255,255,0.45)' : '#6b7280', marginBottom: '1.25rem', lineHeight: 1.5 }}>{plan.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
                {plan.features.map(f => <li key={f} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: plan.featured ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                  <span style={{ color: plan.featured ? '#2563eb' : '#059669', fontWeight: 700 }}>✓</span>{f}
                </li>)}
                {plan.missing.map(f => <li key={f} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: plan.featured ? 'rgba(255,255,255,0.2)' : '#d1d5db' }}>
                  <span style={{ fontWeight: 700 }}>—</span>{f}
                </li>)}
              </ul>
              {isCurrent ? (
                <div style={{ width: '100%', padding: '0.7rem', borderRadius: 100, background: `${plan.color}18`, color: plan.color, fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', border: `1.5px solid ${plan.color}40` }}>✓ Plano ativo</div>
              ) : isUpgrade ? (
                <button onClick={() => alert('Integração com pagamento em breve!')} style={{ width: '100%', padding: '0.7rem', borderRadius: 100, background: plan.featured ? '#2563eb' : '#0d1117', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: font }}>Fazer upgrade →</button>
              ) : (
                <div style={{ width: '100%', padding: '0.7rem', borderRadius: 100, background: '#f3f4f6', color: '#9ca3af', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Plano inferior</div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ background: 'rgba(29,78,216,0.06)', border: '1px solid rgba(29,78,216,0.15)', borderRadius: 12, padding: '1.25rem 1.5rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        <div>
          <p style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.9rem' }}>Pagamentos em breve</p>
          <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>A integração com Asaas está sendo implementada. Em breve você poderá assinar diretamente pelo sistema.</p>
        </div>
      </div>
    </div>
  )
}
