'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) { setError('E-mail é obrigatório'); return }
    setLoading(true); setError('')
    try {
      const slug = form.company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')
      const { error: fnError } = await supabase.rpc('create_tenant_and_profile', {
        p_user_id: authData.user.id,
        p_full_name: form.name,
        p_company_name: form.company,
        p_slug: slug,
      })
      if (fnError) throw fnError
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.8rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(17,24,39,0.15)", fontSize: "0.95rem",
    outline: "none", background: "white", fontFamily: "inherit",
    color: "#111827", transition: "border-color 0.2s",
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8f7f4 0%, #f0ede6 100%)", padding: "2rem" }}>
      <div style={{ background: "white", borderRadius: 24, padding: "3rem", width: "100%", maxWidth: 440, border: "1px solid rgba(17,24,39,0.08)", boxShadow: "0 24px 64px rgba(17,24,39,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.6rem", color: "#111827", textDecoration: "none", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Proposta<span style={{ color: "#c8511a" }}>Pro</span>
          </Link>
          <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9rem" }}>Crie sua conta grátis</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.4rem", color: "#374151" }}>Seu nome</label>
            <input type="text" value={form.name} onChange={set('name')} required style={inputStyle} placeholder="João Silva" />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.4rem", color: "#374151" }}>Nome da empresa</label>
            <input type="text" value={form.company} onChange={set('company')} required style={inputStyle} placeholder="Minha Empresa" />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.4rem", color: "#374151" }}>
              E-mail <span style={{ color: "#c8511a" }}>*</span>
            </label>
            <input type="email" value={form.email} onChange={set('email')} required style={inputStyle} placeholder="voce@empresa.com" />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "0.4rem", color: "#374151" }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                style={{ ...inputStyle, paddingRight: "3rem" }}
                placeholder="Mínimo 8 caracteres"
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

          <button type="submit" disabled={loading} style={{ background: loading ? "#d1d5db" : "#c8511a", color: "white", padding: "0.9rem", borderRadius: 100, border: "none", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", marginTop: "0.5rem", fontFamily: "inherit", transition: "background 0.2s" }}>
            {loading ? 'Criando conta...' : 'Criar conta grátis →'}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: "#c8511a", fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
