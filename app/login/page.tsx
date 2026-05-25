'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const font = "'Plus Jakarta Sans', system-ui, sans-serif"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid rgba(13,17,23,0.15)', fontSize: '0.95rem', outline: 'none', background: 'white', fontFamily: font }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', padding: '2rem', fontFamily: font }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '3rem', width: '100%', maxWidth: 420, border: '1px solid rgba(13,17,23,0.08)', boxShadow: '0 20px 60px rgba(13,17,23,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d1117', textDecoration: 'none', letterSpacing: '-0.03em', fontFamily: font }}>
            Proposta<span style={{ color: '#2563eb' }}>Pro</span>
          </Link>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>Entre na sua conta</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="voce@empresa.com" />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, paddingRight: '3rem' }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.85rem' }}>{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: '#2563eb', color: 'white', padding: '0.9rem', borderRadius: 100, border: 'none', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem', fontFamily: font }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Não tem conta? <Link href="/register" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Criar grátis</Link>
        </p>
      </div>
    </div>
  )
}
