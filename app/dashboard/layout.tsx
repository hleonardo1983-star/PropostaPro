'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

let userDataCache: any = null
let cacheTime = 0
const CACHE_TTL = 30000

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<{
    userName: string; companyName: string; trialDaysLeft: number | null
    plan: string; isMaster: boolean; trialExpired: boolean
  }>({ userName: '', companyName: '', trialDaysLeft: null, plan: 'free', isMaster: false, trialExpired: false })

  const loadUser = useCallback(async () => {
    if (userDataCache && Date.now() - cacheTime < CACHE_TTL) { setUserData(userDataCache); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, is_master, tenants(name, plan, created_at)')
      .eq('id', user.id).single()
    if (!profile) return
    const tenantPlan = (profile.tenants as any)?.plan || 'free'
    let trialDaysLeft: number | null = null
    let trialExpired = false
    if (!tenantPlan || tenantPlan === 'free') {
      const created = new Date((profile.tenants as any)?.created_at || user.created_at)
      const trialEnd = new Date(created.getTime() + 14 * 86400000)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
      trialExpired = trialDaysLeft === 0
    }
    const data = { userName: profile.full_name || '', companyName: (profile.tenants as any)?.name || '', plan: tenantPlan, isMaster: profile.is_master || false, trialDaysLeft, trialExpired }
    userDataCache = data; cacheTime = Date.now(); setUserData(data)
  }, [])

  useEffect(() => { loadUser() }, [])

  async function logout() {
    userDataCache = null
    await supabase.auth.signOut()
    router.push('/')
  }

  const nav = [
    { href: '/dashboard',             label: 'Dashboard',        icon: '▣', masterOnly: false },
    { href: '/dashboard/proposals',   label: 'Propostas',        icon: '◧', masterOnly: false },
    { href: '/dashboard/clients',     label: 'Clientes',         icon: '◉', masterOnly: false },
    { href: '/dashboard/receivables', label: 'Contas a receber', icon: '◆', masterOnly: false },
    { href: '/dashboard/reports',     label: 'Relatórios',       icon: '◈', masterOnly: false },
    { href: '/dashboard/users',       label: 'Usuários',         icon: '◎', masterOnly: true  },
    { href: '/dashboard/plans',       label: 'Planos',           icon: '★', masterOnly: false },
  ]

  const { userName, companyName, trialDaysLeft, plan, isMaster, trialExpired } = userData
  const isSettings = pathname === '/dashboard/settings'
  const isPlansPage = pathname === '/dashboard/plans'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f7f4', fontFamily: font }}>
      <aside style={{ width: 256, background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '1.75rem 1.5rem 1.25rem' }}>
          <span style={{ fontFamily: font, fontSize: '1.35rem', color: 'white', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Proposta<span style={{ color: '#2563eb' }}>Pro</span>
          </span>
        </div>

        {trialDaysLeft !== null && plan === 'free' && (
          <Link href="/dashboard/plans" style={{
            margin: '0 0.75rem 0.75rem', padding: '0.75rem 1rem',
            background: trialExpired ? 'rgba(220,38,38,0.25)' : trialDaysLeft <= 3 ? 'rgba(37,99,235,0.25)' : 'rgba(5,150,105,0.15)',
            borderRadius: 10, border: `1px solid ${trialExpired ? 'rgba(220,38,38,0.5)' : trialDaysLeft <= 3 ? 'rgba(37,99,235,0.4)' : 'rgba(5,150,105,0.3)'}`,
            textDecoration: 'none', display: 'block',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: trialExpired ? '#fca5a5' : trialDaysLeft <= 3 ? '#93c5fd' : '#34d399', marginBottom: '0.1rem' }}>
              {trialExpired ? '🔒 Trial expirado' : `⏳ ${trialDaysLeft} dias de trial`}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
              {trialExpired ? 'Assine um plano para continuar' : 'Clique para fazer upgrade'}
            </p>
          </Link>
        )}

        {(userName || companyName) && (
          <Link href="/dashboard/settings" style={{
            margin: '0 0.75rem 1.25rem', padding: '0.9rem 1rem',
            background: isSettings ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.06)',
            borderRadius: 12, border: isSettings ? '1px solid rgba(37,99,235,0.3)' : '1px solid rgba(255,255,255,0.08)',
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
                background: active ? 'rgba(37,99,235,0.18)' : isPlans ? 'rgba(255,255,255,0.04)' : 'transparent',
                color: active ? '#93c5fd' : isPlans ? 'rgba(255,215,0,0.75)' : 'rgba(255,255,255,0.55)',
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

      <main style={{ flex: 1, marginLeft: 256, overflow: 'auto', padding: '2.5rem 3rem', minHeight: '100vh', position: 'relative' }}>
        {/* Bloqueio de trial expirado — exceto na página de planos */}
        {trialExpired && !isPlansPage && (
          <div style={{ position: 'fixed', top: 0, left: 256, right: 0, bottom: 0, background: 'rgba(248,247,244,0.97)', backdropFilter: 'blur(8px)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ background: 'white', borderRadius: 24, padding: '3rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', border: '1px solid rgba(13,17,23,0.08)' }}>
              <div style={{ width: 72, height: 72, background: 'rgba(37,99,235,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>🔒</div>
              <h2 style={{ fontFamily: font, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0d1117', marginBottom: '0.75rem' }}>Seu período gratuito encerrou</h2>
              <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                Os 14 dias de acesso completo chegaram ao fim. Escolha um plano para continuar criando propostas e usando o sistema.
              </p>
              <Link href="/dashboard/plans" style={{ display: 'block', background: '#2563eb', color: 'white', padding: '1rem 2rem', borderRadius: 100, textDecoration: 'none', fontWeight: 800, fontSize: '1rem', marginBottom: '0.75rem', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                Ver planos e assinar →
              </Link>
              <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '0.85rem', cursor: 'pointer', fontFamily: font }}>
                Sair da conta
              </button>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
