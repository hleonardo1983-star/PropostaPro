'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f0e8",padding:"2rem"}}>
      <div style={{background:"white",borderRadius:20,padding:"3rem",width:"100%",maxWidth:420,border:"1px solid rgba(15,14,12,0.1)",boxShadow:"0 20px 60px rgba(15,14,12,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <Link href="/" style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.75rem",color:"#0f0e0c",textDecoration:"none",letterSpacing:"-0.02em"}}>
            Proposta<span style={{color:"#c8511a"}}>Fácil</span>
          </Link>
          <p style={{color:"#7a7368",marginTop:"0.5rem",fontSize:"0.9rem"}}>Entre na sua conta</p>
        </div>
        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div>
            <label style={{fontSize:"0.85rem",fontWeight:500,display:"block",marginBottom:"0.4rem"}}>E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:"100%",padding:"0.75rem 1rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.95rem",outline:"none",background:"#f5f0e8"}}
              placeholder="voce@empresa.com" />
          </div>
          <div>
            <label style={{fontSize:"0.85rem",fontWeight:500,display:"block",marginBottom:"0.4rem"}}>Senha</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:"100%",padding:"0.75rem 1rem",borderRadius:10,border:"1.5px solid rgba(15,14,12,0.15)",fontSize:"0.95rem",outline:"none",background:"#f5f0e8"}}
              placeholder="••••••••" />
          </div>
          {error && <p style={{color:"#c8511a",fontSize:"0.85rem",textAlign:"center"}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{background:"#c8511a",color:"white",padding:"0.9rem",borderRadius:100,border:"none",fontWeight:600,fontSize:"1rem",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginTop:"0.5rem"}}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:"1.5rem",fontSize:"0.875rem",color:"#7a7368"}}>
          Não tem conta? <Link href="/register" style={{color:"#c8511a",fontWeight:600,textDecoration:"none"}}>Criar grátis</Link>
        </p>
      </div>
    </div>
  )
}
