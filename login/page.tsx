'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.8rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(17,24,39,0.15)", fontSize: "0.95rem",
    outline: "none", background: "white", fontFamily: "inherit", color: "#111827",
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8f7f4 0%, #f0ede6 100%)", padding: "2rem" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "3rem", width: "100%", maxWidth: 420, border: "1px solid rgba(17,24,39,0.08)", boxShadow: "0 24px 64px rgba(17,24,39,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.6rem", color: "#111827", textDecoration: "none", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Proposta<span style={{ color: "#c8511a" }}>Pro</span>
          </Link>
          <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9rem" }}>Entre na sua conta</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.4rem", color: "#374151" }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="voce@empresa.com" />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.4rem", color: "#374151" }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: "3rem" }}
                placeholder="Sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "1.1rem", padding: 0 }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(200,81,26,0.08)", border: "1px solid rgba(200,81,26,0.2)", borderRadius: 8, padding: "0.75rem 1rem", color: "#c8511a", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ background: loading ? "#d1d5db" : "#c8511a", color: "white", padding: "0.9rem", borderRadius: 100, border: "none", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", marginTop: "0.5rem", fontFamily: "inherit" }}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Não tem conta?{' '}
          <Link href="/register" style={{ color: "#c8511a", fontWeight: 600, textDecoration: "none" }}>Criar grátis</Link>
        </p>
      </div>
    </div>
  )
}
