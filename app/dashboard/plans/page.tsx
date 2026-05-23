'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

const PLAN_USER_LIMITS: Record<string, number> = {
  free: 1, starter: 1, professional: 3, business: 999
}

const PLAN_ORDER = ['free', 'starter', 'professional', 'business']

export default function PlansPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposalsUsed, setProposalsUsed] = useState(0)
  const [tenantId, setTenantId] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [downgradeModal, setDowngradeModal] = useState<{ targetPlan: string; usersToKeep: string[] } | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(plan, proposals_this_month, created_at)')
        .eq('id', user.id).single()
      if (!profile) return
      const tenant = (profile.tenants as any)
      setTenantId(profile.tenant_id)
      setCurrentPlan(tenant?.plan || 'free')
      setProposalsUsed(tenant?.proposals_this_month || 0)
      if (!tenant?.plan || tenant?.plan === 'free') {
        const created = new Date(tenant?.created_at || user.created_at)
        const trialEnd = new Date(created.getTime() + 14 * 86400000)
        const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
        setTrialDaysLeft(daysLeft)
      }
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, is_master, is_suspended')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_suspended', false)
      setActiveUsers(users || [])
      setLoading(false)
    }
    load()
  }, [])

  const plans = [
    { id: 'free',         name: 'Free',         price: 0,   period: 'para sempre', desc: 'Para conhecer a plataforma',    limit: 5,      userLimit: 1, features: ['5 propostas/mês','1 usuário','Assinatura digital','Contas a receber','WhatsApp + E-mail'], missing: ['Relatórios','Multi-usuário'], color: '#6b7280', featured: false },
    { id: 'starter',      name: 'Starter',       price: 49,  period: '/mês',        desc: 'Para freelancers e autônomos', limit: 10,     userLimit: 1, features: ['10 propostas/mês','1 usuário master','Assinatura digital','Contas a receber','WhatsApp + E-mail','1 relatório/mês'], missing: ['Multi-usuário'], color: '#1d4ed8', featured: false },
    { id: 'professional', name: 'Profissional',  price: 99,  period: '/mês',        desc: 'Para pequenas empresas',       limit: 30,     userLimit: 3, features: ['30 propostas/mês','3 usuários','Assinatura digital','Contas a receber','WhatsApp + E-mail','3 relatórios/mês','Gestão de usuários'], missing: [], color: '#c8511a', featured: true },
    { id: 'business',     name: 'Business',      price: 199, period: '/mês',        desc: 'Para equipes e empresas',      limit: 999999, userLimit: 999, features: ['Propostas ilimitadas','Usuários ilimitados','Assinatura digital','Contas a receber','WhatsApp + E-mail','Relatórios ilimitados','Gestão de usuários','Suporte prioritário'], missing: [], color: '#7c3aed', featured: false },
  ]

  const currentPlanData = plans.find(p => p.id === currentPlan) || plans[0]
  const proposalPercent = Math.min(100, Math.round((proposalsUsed / Math.max(currentPlanData.limit, 1)) * 100))

  function handlePlanClick(plan: typeof plans[0]) {
    const currentIdx = PLAN_ORDER.indexOf(currentPlan)
    const targetIdx = PLAN_ORDER.indexOf(plan.id)
    const isDowngrade = targetIdx < currentIdx

    if (isDowngrade) {
      const newUserLimit = PLAN_USER_LIMITS[plan.id] || 1
      const nonMasterActive = activeUsers.filter(u => !u.is_master && !u.is_suspended)
      const totalActive = activeUsers.filter(u => !u.is_suspended).length

      if (totalActive > newUserLimit) {
        // Precisa do modal de seleção
        const masterUser = activeUsers.find(u => u.is_master)
        const preSelected = masterUser ? [masterUser.id] : []
        setSelectedUsers(preSelected)
        setDowngradeModal({ targetPlan: plan.id, usersToKeep: preSelected })
      } else {
        // Sem excedentes, downgrade direto
        executePlanChange(plan.id, null)
      }
    } else {
      // Upgrade
      alert('Integração com pagamento em breve! Entre em contato para fazer upgrade.')
    }
  }

  async function executePlanChange(targetPlan: string, usersToKeep: string[] | null) {
    setProcessing(true)
    // Atualizar plano
    await supabase.from('tenants').update({ plan: targetPlan }).eq('id', tenantId)

    // Suspender usuários excedentes se necessário
    if (usersToKeep && usersToKeep.length > 0) {
      const toSuspend = activeUsers.filter(u => !usersToKeep.includes(u.id))
      for (const u of toSuspend) {
        await supabase.from('profiles').update({ is_suspended: true }).eq('id', u.id)
      }
    }

    setDowngradeModal(null)
    setProcessing(false)
    router.refresh()
    window.location.reload()
  }

  function toggleUser(userId: string, isMaster: boolean) {
    if (isMaster) return // master sempre fica
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280', fontFamily: font }}>Carregando...</div>

  const targetPlanData = downgradeModal ? plans.find(p => p.id === downgradeModal.targetPlan) : null
  const newUserLimit = downgradeModal ? (PLAN_USER_LIMITS[downgradeModal.targetPlan] || 1) : 1
  const canConfirmDowngrade = selectedUsers.length <= newUserLimit

  return (
    <div style={{ fontFamily: font }}>

      {/* Modal de downgrade */}
      {downgradeModal && targetPlanData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(200,81,26,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>⚠️</div>
            <h3 style={{ fontFamily: font, fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0d1117', textAlign: 'center' }}>
              Atenção — Limite de usuários
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6, textAlign: 'center' }}>
              O plano <strong>{targetPlanData.name}</strong> permite apenas <strong>{newUserLimit} usuário{newUserLimit > 1 ? 's' : ''}</strong>. Você tem <strong>{activeUsers.length} usuários ativos</strong>.
              <br />Selecione quais manter ativos. Os demais serão suspensos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {activeUsers.map(u => {
                const isSelected = selectedUsers.includes(u.id)
                const isMaster = u.is_master
                return (
                  <div key={u.id}
                    onClick={() => toggleUser(u.id, isMaster)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: 10, border: `1.5px solid ${isSelected ? '#c8511a' : 'rgba(13,17,23,0.1)'}`, background: isSelected ? 'rgba(200,81,26,0.05)' : 'white', cursor: isMaster ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? '#c8511a' : '#d1d5db'}`, background: isSelected ? '#c8511a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d1117', marginBottom: '0.1rem' }}>{u.full_name || 'Sem nome'}</p>
                      {isMaster && <p style={{ fontSize: '0.72rem', color: '#c8511a', fontWeight: 600 }}>Master — obrigatório</p>}
                    </div>
                    {!isSelected && !isMaster && <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500 }}>será suspenso</span>}
                  </div>
                )
              })}
            </div>

            {!canConfirmDowngrade && (
              <p style={{ fontSize: '0.82rem', color: '#c8511a', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
                ⚠️ Selecione no máximo {newUserLimit} usuário{newUserLimit > 1 ? 's' : ''} para o plano {targetPlanData.name}.
              </p>
            )}

            <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '1.5rem', textAlign: 'center', lineHeight: 1.5 }}>
              Usuários suspensos têm seus dados preservados. Faça upgrade a qualquer momento para reativá-los.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDowngradeModal(null)} style={{ flex: 1, background: 'transparent', border: '1.5px solid rgba(13,17,23,0.15)', padding: '0.75rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: font }}>
                Cancelar
              </button>
              <button
                onClick={() => executePlanChange(downgradeModal.targetPlan, selectedUsers)}
                disabled={!canConfirmDowngrade || processing}
                style={{ flex: 1, background: canConfirmDowngrade ? '#c8511a' : '#d1d5db', color: 'white', border: 'none', padding: '0.75rem', borderRadius: 100, cursor: canConfirmDowngrade ? 'pointer' : 'not-allowed', fontSize: '0.875rem', fontWeight: 700, fontFamily: font, opacity: processing ? 0.7 : 1 }}>
                {processing ? 'Processando...' : 'Confirmar downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem', color: '#0d1117' }}>Planos</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Gerencie sua assinatura</p>
      </div>

      {/* Status atual */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(13,17,23,0.08)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: currentPlanData.limit < 999999 ? '1.5rem' : 0 }}>
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
            <div style={{ background: trialDaysLeft <= 3 ? 'rgba(200,81,26,0.08)' : 'rgba(5,150,105,0.08)', border: `1px solid ${trialDaysLeft <= 3 ? 'rgba(200,81,26,0.2)' : 'rgba(5,150,105,0.2)'}`, borderRadius: 12, padding: '0.85rem 1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: trialDaysLeft <= 3 ? '#c8511a' : '#065f46', lineHeight: 1 }}>{trialDaysLeft > 0 ? trialDaysLeft : '!'}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: trialDaysLeft <= 3 ? '#c8511a' : '#065f46' }}>{trialDaysLeft > 0 ? 'dias de trial' : 'Trial expirado'}</p>
            </div>
          )}
        </div>
        {currentPlanData.limit < 999999 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Propostas este mês</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: proposalPercent >= 80 ? '#c8511a' : '#0d1117' }}>{proposalsUsed} / {currentPlanData.limit}</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${proposalPercent}%`, background: proposalPercent >= 80 ? '#c8511a' : '#059669', borderRadius: 100, transition: 'width 0.5s ease' }}></div>
            </div>
            {proposalPercent >= 80 && <p style={{ fontSize: '0.78rem', color: '#c8511a', marginTop: '0.4rem', fontWeight: 500 }}>{proposalPercent >= 100 ? '⚠️ Limite atingido! Faça upgrade para continuar.' : `⚡ Você usou ${proposalPercent}% do seu limite mensal.`}</p>}
          </div>
        )}
      </div>

      {/* Grade de planos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {plans.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan
          const currentIdx = PLAN_ORDER.indexOf(currentPlan)
          const targetIdx = PLAN_ORDER.indexOf(plan.id)
          const isUpgrade = targetIdx > currentIdx
          const isDowngrade = targetIdx < currentIdx
          return (
            <div key={plan.id} style={{ background: plan.featured ? '#0d1117' : 'white', borderRadius: 16, border: isCurrent ? `2px solid ${plan.color}` : plan.featured ? 'none' : '1px solid rgba(13,17,23,0.08)', padding: '1.75rem', position: 'relative', boxShadow: plan.featured ? '0 8px 32px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
              {isCurrent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.75rem', borderRadius: 100, whiteSpace: 'nowrap' }}>Plano atual</div>}
              {plan.featured && !isCurrent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#c8511a', color: 'white', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.75rem', borderRadius: 100, whiteSpace: 'nowrap' }}>⚡ Mais popular</div>}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#9ca3af', marginBottom: '0.5rem' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.25rem' }}>
                {plan.price > 0 && <span style={{ fontSize: '0.85rem', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>R$</span>}
                <span style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: plan.featured ? 'white' : '#0d1117', lineHeight: 1 }}>{plan.price === 0 ? 'Grátis' : plan.price}</span>
                <span style={{ fontSize: '0.82rem', color: plan.featured ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: plan.featured ? 'rgba(255,255,255,0.45)' : '#6b7280', marginBottom: '1.25rem', lineHeight: 1.5 }}>{plan.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
                {plan.features.map(f => <li key={f} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: plan.featured ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                  <span style={{ color: plan.featured ? '#c8511a' : '#059669', fontWeight: 700 }}>✓</span>{f}
                </li>)}
                {plan.missing.map(f => <li key={f} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: plan.featured ? 'rgba(255,255,255,0.2)' : '#d1d5db' }}>
                  <span style={{ fontWeight: 700 }}>—</span>{f}
                </li>)}
              </ul>
              {isCurrent ? (
                <div style={{ width: '100%', padding: '0.7rem', borderRadius: 100, background: `${plan.color}18`, color: plan.color, fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', border: `1.5px solid ${plan.color}40` }}>✓ Plano ativo</div>
              ) : isUpgrade ? (
                <button onClick={() => handlePlanClick(plan)} style={{ width: '100%', padding: '0.7rem', borderRadius: 100, background: plan.featured ? '#c8511a' : '#0d1117', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: font }}>Fazer upgrade →</button>
              ) : isDowngrade ? (
                <button onClick={() => handlePlanClick(plan)} style={{ width: '100%', padding: '0.7rem', borderRadius: 100, background: 'transparent', color: '#6b7280', border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: font }}>Fazer downgrade</button>
              ) : null}
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
