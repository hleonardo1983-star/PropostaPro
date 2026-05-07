import Link from 'next/link'

const sora = "'Sora', system-ui, sans-serif"
const inter = "'Outfit', system-ui, sans-serif"

export default function LandingPage() {
  return (
    <div style={{ fontFamily: inter, background: "#f8f7f4", color: "#111827", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 5vw", background: "rgba(248,247,244,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(17,24,39,0.08)" }}>
        <span style={{ fontFamily: sora, fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
          Proposta<span style={{ color: "#c8511a" }}>Pro</span>
        </span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/login" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>Entrar</Link>
          <Link href="/register" style={{ background: "#c8511a", color: "white", padding: "0.55rem 1.4rem", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "8rem 5vw 5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 820 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "white", border: "1px solid rgba(17,24,39,0.1)", padding: "0.4rem 1rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 500, color: "#6b7280", marginBottom: "2rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <span style={{ width: 7, height: 7, background: "#059669", borderRadius: "50%", display: "inline-block" }}></span>
            Mais de 3.000 propostas assinadas este mês
          </div>
          <h1 style={{ fontFamily: sora, fontSize: "clamp(2.8rem,6vw,5rem)", lineHeight: 1.1, letterSpacing: "-0.04em", fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            Orçamentos que <span style={{ color: "#c8511a", fontStyle: "italic" }}>fecham</span><br />negócios — sem esforço
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#6b7280", maxWidth: 520, margin: "0 auto 2.5rem", lineHeight: 1.65, fontWeight: 400 }}>
            Crie propostas profissionais, envie por WhatsApp ou e-mail, receba a assinatura do cliente e gere a cobrança automaticamente.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ background: "#c8511a", color: "white", padding: "0.9rem 2.25rem", borderRadius: "100px", textDecoration: "none", fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(200,81,26,0.3)", fontFamily: inter }}>
              Criar conta grátis
            </Link>
            <Link href="/login" style={{ background: "white", color: "#111827", padding: "0.9rem 2rem", borderRadius: "100px", textDecoration: "none", fontWeight: 500, fontSize: "1rem", border: "1.5px solid rgba(17,24,39,0.12)" }}>
              Já tenho conta →
            </Link>
          </div>
          <div style={{ marginTop: "2rem", display: "flex", gap: "2rem", justifyContent: "center", fontSize: "0.82rem", color: "#9ca3af", flexWrap: "wrap" }}>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ 14 dias gratuitos</span>
            <span>✓ Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "white", padding: "6rem 5vw" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#c8511a", marginBottom: "0.75rem" }}>Como funciona</p>
          <h2 style={{ fontFamily: sora, fontSize: "clamp(1.8rem,3.5vw,2.75rem)", letterSpacing: "-0.03em", fontWeight: 700, marginBottom: "3rem", color: "#111827", maxWidth: 480 }}>
            Da proposta à cobrança em minutos
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.5rem" }}>
            {[
              { num: "01", icon: "📝", title: "Crie a proposta", desc: "Monte orçamentos com seus serviços e valores em minutos, com visual profissional." },
              { num: "02", icon: "📤", title: "Envie ao cliente", desc: "Compartilhe via WhatsApp com um link ou por e-mail diretamente pelo sistema." },
              { num: "03", icon: "✍️", title: "Cliente assina", desc: "Assinatura digital simples, direto no celular. Sem app, sem burocracia." },
              { num: "04", icon: "💰", title: "Cobrança automática", desc: "Conta a receber criada automaticamente assim que o cliente assina." },
            ].map(s => (
              <div key={s.num} style={{ background: "#f8f7f4", borderRadius: 16, padding: "2rem", position: "relative", border: "1px solid rgba(17,24,39,0.06)" }}>
                <span style={{ fontFamily: sora, fontSize: "3rem", color: "rgba(17,24,39,0.05)", position: "absolute", top: "1rem", right: "1.25rem", fontWeight: 700 }}>{s.num}</span>
                <div style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>{s.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1rem", color: "#111827" }}>{s.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "6rem 5vw", background: "#f8f7f4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#c8511a", marginBottom: "0.75rem" }}>Funcionalidades</p>
          <h2 style={{ fontFamily: sora, fontSize: "clamp(1.8rem,3.5vw,2.75rem)", letterSpacing: "-0.03em", fontWeight: 700, marginBottom: "3rem", color: "#111827" }}>
            Tudo que você precisa
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem" }}>
            {[
              { icon: "📱", title: "Envio via WhatsApp", desc: "Link direto para o cliente com um clique. Sem API paga, sem complicação." },
              { icon: "✉️", title: "Envio por E-mail", desc: "E-mails profissionais com rastreamento de abertura em tempo real." },
              { icon: "🔏", title: "Assinatura digital", desc: "Assinatura registrada com nome, timestamp e hash de verificação." },
              { icon: "💳", title: "Contas a receber", desc: "Geradas automaticamente ao assinar. Fluxo de caixa sempre atualizado." },
              { icon: "📊", title: "Dashboard completo", desc: "Métricas de propostas, conversão e valores a receber em tempo real." },
              { icon: "🔒", title: "Multi-empresa seguro", desc: "Cada cliente acessa apenas seus dados. Isolamento total com RLS." },
            ].map(f => (
              <div key={f.title} style={{ background: "white", padding: "1.75rem", borderRadius: 14, border: "1px solid rgba(17,24,39,0.08)" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.85rem" }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.95rem", color: "#111827" }}>{f.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: "#111827", color: "white", padding: "6rem 5vw" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#e8673a", marginBottom: "0.75rem" }}>Preços</p>
          <h2 style={{ fontFamily: sora, fontSize: "clamp(1.8rem,3.5vw,2.75rem)", letterSpacing: "-0.03em", fontWeight: 700, marginBottom: "3rem" }}>
            Simples e transparente
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1.5rem", maxWidth: 900 }}>
            {[
              { name: "Starter", price: "49", desc: "Para freelancers", features: ["20 propostas/mês", "WhatsApp + E-mail", "Assinatura digital", "Contas a receber"], featured: false },
              { name: "Profissional", price: "99", desc: "Para pequenas empresas", features: ["Propostas ilimitadas", "WhatsApp + E-mail", "Assinatura digital", "Relatórios", "5 usuários"], featured: true },
              { name: "Business", price: "199", desc: "Para equipes", features: ["Tudo do Pro", "Usuários ilimitados", "API + Webhooks", "Suporte prioritário"], featured: false },
            ].map(p => (
              <div key={p.name} style={{ background: p.featured ? "#c8511a" : "rgba(255,255,255,0.05)", border: p.featured ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2.25rem", position: "relative" }}>
                {p.featured && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "white", color: "#111827", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.3rem 0.8rem", borderRadius: "100px", whiteSpace: "nowrap" }}>⚡ Mais popular</div>}
                <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: "0.75rem" }}>{p.name}</div>
                <div style={{ fontFamily: sora, fontSize: "2.75rem", letterSpacing: "-0.03em", lineHeight: 1, fontWeight: 700 }}>R$ {p.price}<span style={{ fontFamily: inter, fontSize: "0.9rem", opacity: 0.5 }}>/mês</span></div>
                <p style={{ fontSize: "0.85rem", opacity: 0.6, margin: "0.75rem 0 1.75rem" }}>{p.desc}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem", padding: 0 }}>
                  {p.features.map(f => <li key={f} style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ color: p.featured ? "rgba(255,255,255,0.8)" : "#059669", fontWeight: 700 }}>✓</span>{f}
                  </li>)}
                </ul>
                <Link href="/register" style={{ display: "block", width: "100%", padding: "0.85rem", borderRadius: "100px", fontWeight: 700, fontSize: "0.9rem", textAlign: "center", textDecoration: "none", background: p.featured ? "white" : "transparent", color: p.featured ? "#c8511a" : "white", border: p.featured ? "none" : "1.5px solid rgba(255,255,255,0.2)", fontFamily: inter }}>
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "7rem 5vw", textAlign: "center", background: "#f8f7f4" }}>
        <h2 style={{ fontFamily: sora, fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-0.03em", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
          Sua primeira proposta em 5 minutos
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "2.5rem", fontSize: "1rem" }}>14 dias grátis. Sem cartão de crédito. Cancele quando quiser.</p>
        <Link href="/register" style={{ background: "#c8511a", color: "white", padding: "1rem 2.5rem", borderRadius: "100px", textDecoration: "none", fontWeight: 700, fontSize: "1.05rem", boxShadow: "0 4px 20px rgba(200,81,26,0.3)", fontFamily: inter }}>
          Criar conta grátis →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", padding: "2rem 5vw", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.3)" }}>
        <span style={{ fontFamily: sora, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>Proposta<span style={{ color: "#c8511a" }}>Pro</span></span>
        <span>© 2026 PropostaPro. Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}
