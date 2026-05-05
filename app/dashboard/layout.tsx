'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/proposals', label: 'Propostas', icon: '📝' },
    { href: '/dashboard/clients', label: 'Clientes', icon: '👥' },
    { href: '/dashboard/receivables', label: 'Contas a receber', icon: '💰' },
  ]

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f5f0e8"}}>
      {/* Sidebar */}
      <aside style={{width:240,background:"#0f0e0c",display:"flex",flexDirection:"column",padding:"1.5rem 0",flexShrink:0}}>
        <div style={{padding:"0 1.5rem 2rem",fontFamily:"'Fraunces',Georgia,serif",fontSize:"1.3rem",color:"#f5f0e8",letterSpacing:"-0.02em"}}>
          Proposta<span style={{color:"#c8511a"}}>Fácil</span>
        </div>
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:"0.25rem",padding:"0 0.75rem"}}>
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.7rem 0.75rem",
                borderRadius:10,textDecoration:"none",fontSize:"0.875rem",fontWeight:500,
                background:active?"rgba(200,81,26,0.2)":"transparent",
                color:active?"#e8673a":"rgba(245,240,232,0.6)",
                transition:"all 0.15s"
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{padding:"1rem 1.5rem",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={logout} style={{background:"transparent",border:"none",color:"rgba(245,240,232,0.4)",fontSize:"0.85rem",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:"0.5rem"}}>
            🚪 Sair
          </button>
        </div>
      </aside>
      {/* Main */}
      <main style={{flex:1,overflow:"auto",padding:"2.5rem"}}>
        {children}
      </main>
    </div>
  )
}
