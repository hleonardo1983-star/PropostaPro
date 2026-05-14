'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tenants(name)')
        .eq('id', user.id)
        .single()
      if (profile) {
        setUserName(profile.full_name || '')
        setCompanyName((profile.tenants as any)?.name || '')
      }
    }
    loadUser()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: '▣' },
    { href: '/dashboard/proposals', label: 'Propostas', icon: '◧' },
    { href: '/dashboard/clients', label: 'Clientes', icon: '◉' },
    { href: '/dashboard/receivables', label: 'Contas a receber', icon: '◆' },
  ]

  const isSettings = pathname === '/dashboard/settings'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f7f4' }}>
      {/* Sidebar */}
      <aside style={{ width: 256, background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0 }}>

        {/* Logo */}
        <div style={{ padding: '1.75rem 1.5rem 1.25rem' }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '1.35rem', color: 'white', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Proposta<span style={{ color: '#c8511a' }}>Pro</span>
          </span>
        </div>

        {/* User info — clicável para configurações */}
        {(userName || companyName) && (
          <Link href="/dashboard/settings" style={{
            margin: '0 0.75rem 1.25rem',
            padding: '0.9rem 1rem',
            background: isSettings ? 'rgba(200,81,26,0.18)' : 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            border: isSettings ? '1px solid rgba(200,81,26,0.3)' : '1px solid rgba(255,255,255,0.08)',
            textDecoration: 'none',
            display: 'block',
            transition: 'all 0.15s',
            cursor: 'pointer',
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

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0 0.75rem' }}>
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 0.9rem', borderRadius: 10,
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
                background: item.href === '/dashboard/proposals/ai'
                  ? active ? 'linear-gradient(135deg, rgba(200,81,26,0.3), rgba(124,58,237,0.3))' : 'linear-gradient(135deg, rgba(200,81,26,0.12), rgba(124,58,237,0.12))'
                  : active ? 'rgba(200,81,26,0.18)' : 'transparent',
                color: item.href === '/dashboard/proposals/ai'
                  ? active ? '#e8a87c' : 'rgba(232,168,124,0.8)'
                  : active ? '#e8673a' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.15s',
                border: item.href === '/dashboard/proposals/ai' ? '1px solid rgba(200,81,26,0.2)' : 'none',
              }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'inherit' }}>
            ↩ Sair da conta
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 256, overflow: 'auto', padding: '2.5rem 3rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
