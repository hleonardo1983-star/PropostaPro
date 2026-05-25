'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [plan, setPlan] = useState('free')
  const [isMaster, setIsMaster] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, is_master, tenant_id, tenants(name, plan, created_at)')
        .eq('id', user.id).single()
      if (profile) {
        setUserName(profile.full_name || '')
        setCompanyName((profile.tenants as any)?.name || '')
        setIsMaster(profile.is_master || false)
        const tenantPlan = (profile.tenants as any)?.plan || 'free'
        setPlan(tenantPlan)
        if (!tenantPlan || tenantPlan === 'free') {
          const created = new Date((profile.tenants as any)?.created_at || user.created_at)
          const trialEnd = new Date(created.getTime() + 14 * 86400000)
          const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
          setTrialDaysLeft(daysLeft)
        }
      }
    }
    loadUser()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const nav = [
    { href: '/dashboard',              label: 'Dashboard',        icon: '▣', masterOnly: false },
    { href: '/dashboard/proposals',    label: 'Propostas',        icon: '◧', masterOnly: false },
    { href: '/dashboard/clients',      label: 'Clientes',         icon: '◉', masterOnly: false },
    { href: '/dashboard/receivables',  label: 'Contas a receber', icon: '◆', masterOnly: false },
    { href: '/dashboard/reports',      label: 'Relatórios',       icon: '◈', masterOnly: false },
    { href: '/dashboard/users',        label: 'Usuários',         icon: '◎', masterOnly: true  },
    { href: '/dashboard/plans',        label: 'Planos',           icon: '★', masterOnly: false },
  ]

  const isSettings = pathname === '/dashboard/settings'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f7f4', fontFamily: font }}>
      <aside style={{ width: 256, background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '1.75rem 1.5rem 1.25rem' }}>
          <span style={{ fontFamily: font, fontSize: '1.35rem', color: 'white', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Proposta<span style={{ color: '#0f766e' }}>Pro</span>
          </span>
        </div>

        {trialDaysLeft !== null && plan === 'free' && (
          <Link href="/dashboard/plans" style={{
            margin: '0 0.75rem 0.75rem', padding: '0.75rem 1rem',
            background: trialDaysLeft <= 3 ? 'rgba(15,118,110,0.25)' : 'rgba(5,150,105,0.15)',
            borderRadius: 10, border: `1px solid ${trialDaysLeft <= 3 ? 'rgba(15,118,110,0.4)' : 'rgba(5,150,105,0.3)'}`,
            textDecoration: 'none', display: 'block',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: trialDaysLeft <= 3 ? '#14b8a6' : '#34d399', marginBottom: '0.1rem' }}>
              {trialDaysLeft > 0 ? `⏳ ${trialDaysLeft} dias de trial` : '⚠️ Trial expirado'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
              {trialDaysLeft > 0 ? 'Clique para fazer upgrade' : 'Limite: 5 propostas/mês'}
            </p>
          </Link>
        )}

        {(userName || companyName) && (
          <Link href="/dashboard/settings" style={{
            margin: '0 0.75rem 1.25rem', padding: '0.9rem 1rem',
            background: isSettings ? 'rgba(15,118,110,0.18)' : 'rgba(255,255,255,0.06)',
            borderRadius: 12, border: isSettings ? '1px solid rgba(15,118,110,0.28)' : '1px solid rgba(255,255,255,0.08)',
            textDecoration: 'none', display: 'block',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {companyName && <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', marginBottom: '0.15rem' }}>{companyName}</p>}
                {userName && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{userName}</p>}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>✎</span>
            </div>
          </Link>
        )}

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0 0.75rem' }}>
          {nav.filter(item => !item.masterOnly || isMaster).map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const isPlans = item.href === '/dashboard/plans'
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 0.9rem', borderRadius: 10,
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                background: active ? 'rgba(15,118,110,0.18)' : isPlans ? 'rgba(255,255,255,0.04)' : 'transparent',
                color: active ? '#14b8a6' : isPlans ? 'rgba(255,215,0,0.75)' : 'rgba(255,255,255,0.55)',
                border: isPlans && !active ? '1px solid rgba(255,255,255,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: font }}>
            ↩ Sair da conta
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 256, overflow: 'auto', padding: '2.5rem 3rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
