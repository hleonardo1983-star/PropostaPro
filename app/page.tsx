import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#f5f0e8",color:"#0f0e0c",minHeight:"100vh"}}>
      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.25rem 5vw",background:"rgba(245,240,232,0.9)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(15,14,12,0.12)"}}>
        <span style={{fontFamily:"'Instrument Serif',serif",fontSize:"1.5rem",letterSpacing:"-0.02em"}}>
          Proposta<span style={{color:"#c8511a"}}>Fácil</span>
        </span>
        <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
          <Link href="/login" style={{color:"#7a7368",textDecoration:"none",fontSize:"0.9rem",fontWeight:500}}>Entrar</Link>
          <Link href="/register" style={{background:"#c8511a",color:"white",padding:"0.55rem 1.4rem",borderRadius:"100px",textDecoration:"none",fontWeight:600,fontSize:"0.875rem"}}>
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"8rem 5vw 5rem",textAlign:"center"}}>
        <div style={{maxWidth:860}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"white",border:"1px solid rgba(15,14,12,0.12)",padding:"0.4rem 1rem",borderRadius:"100px",fontSize:"0.8rem",fontWeight:500,color:"#7a7368",marginBottom:"2rem"}}>
            <span style={{width:7,height:7,background:"#40916c",borderRadius:"50%",display:"inline-block"}}></span>
            Mais de 3.000 propostas assinadas este mês
          </div>
          <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(3rem,7vw,5.5rem)",lineHeight:1.08,letterSpacing:"-0.03em",marginBottom:"1.5rem"}}>
            Orçamentos que <em style={{color:"#c8511a"}}>fecham</em><br/>negócios — sem esforço
          </h1>
          <p style={{fontSize:"1.15rem",color:"#7a7368",maxWidth:540,margin:"0 auto 2.5rem",lineHeight:1.6,fontWeight:300}}>
            Crie propostas profissionais, envie por WhatsApp ou e-mail, receba a assinatura do cliente e gere a cobrança automaticamente.
          </p>
          <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
            <Link href="/register" style={{background:"#c8511a",color:"white",padding:"0.9rem 2rem",borderRadius:"100px",textDecoration:"none",fontWeight:600,fontSize:"1rem",boxShadow:"0 4px 20px rgba(200,81,26,0.3)"}}>
              Criar conta grátis
            </Link>
            <Link href="/login" style={{background:"transparent",color:"#0f0e0c",padding:"0.9rem 2rem",borderRadius:"100px",textDecoration:"none",fontWeight:500,fontSize:"1rem",border:"1.5px solid rgba(15,14,12,0.15)"}}>
              Já tenho conta →
            </Link>
          </div>
          <div style={{marginTop:"2rem",display:"flex",gap:"2rem",justifyContent:"center",fontSize:"0.8rem",color:"#7a7368",flexWrap:"wrap"}}>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ 14 dias gratuitos</span>
            <span>✓ Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{background:"#f0e8d5",padding:"6rem 5vw"}}>
        <p style={{fontSize:"0.75rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",color:"#c8511a",marginBottom:"1rem"}}>Como funciona</p>
        <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(2rem,4vw,3rem)",letterSpacing:"-0.025em",marginBottom:"3rem",maxWidth:500}}>Da proposta à cobrança em minutos</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"1.5rem"}}>
          {[
            {num:"01",icon:"📝",title:"Crie a proposta",desc:"Monte orçamentos com seus serviços e valores em minutos."},
            {num:"02",icon:"📤",title:"Envie ao cliente",desc:"Link via WhatsApp ou e-mail com um clique. Sem burocracia."},
            {num:"03",icon:"✍️",title:"Cliente assina",desc:"Assinatura digital simples, direto no celular do seu cliente."},
            {num:"04",icon:"💰",title:"Cobrança automática",desc:"Conta a receber gerada automaticamente ao assinar."},
          ].map(s => (
            <div key={s.num} style={{background:"white",borderRadius:16,padding:"2rem",border:"1px solid rgba(15,14,12,0.1)",position:"relative"}}>
              <span style={{fontFamily:"'Instrument Serif',serif",fontSize:"3.5rem",color:"rgba(15,14,12,0.06)",position:"absolute",top:"0.5rem",right:"1rem"}}>{s.num}</span>
              <div style={{fontSize:"1.5rem",marginBottom:"1rem"}}>{s.icon}</div>
              <h3 style={{fontWeight:600,marginBottom:"0.5rem"}}>{s.title}</h3>
              <p style={{fontSize:"0.875rem",color:"#7a7368",lineHeight:1.6}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:"#0f0e0c",color:"#f5f0e8",padding:"6rem 5vw"}}>
        <p style={{fontSize:"0.75rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.12em",color:"#e8673a",marginBottom:"1rem"}}>Preços</p>
        <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(2rem,4vw,3rem)",letterSpacing:"-0.025em",marginBottom:"3rem"}}>Simples e transparente</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"1.5rem",maxWidth:900}}>
          {[
            {name:"Starter",price:"49",desc:"Para freelancers",features:["20 propostas/mês","WhatsApp + E-mail","Assinatura digital","Contas a receber"],featured:false},
            {name:"Profissional",price:"99",desc:"Para pequenas empresas",features:["Propostas ilimitadas","WhatsApp + E-mail","Assinatura + certificado","Relatórios","5 usuários"],featured:true},
            {name:"Business",price:"199",desc:"Para equipes",features:["Tudo do Pro","Usuários ilimitados","API + Webhooks","Suporte prioritário"],featured:false},
          ].map(p => (
            <div key={p.name} style={{background:p.featured?"#c8511a":"rgba(255,255,255,0.05)",border:p.featured?"none":"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"2.5rem",position:"relative"}}>
              {p.featured && <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#f5f0e8",color:"#0f0e0c",fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"0.3rem 0.8rem",borderRadius:"100px",whiteSpace:"nowrap"}}>⚡ Mais popular</div>}
              <div style={{fontSize:"0.8rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",opacity:0.6,marginBottom:"0.75rem"}}>{p.name}</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"3rem",letterSpacing:"-0.03em",lineHeight:1}}>R$ {p.price}<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.9rem",opacity:0.5}}>/mês</span></div>
              <p style={{fontSize:"0.85rem",opacity:0.6,margin:"0.75rem 0 1.75rem"}}>{p.desc}</p>
              <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:"0.65rem",marginBottom:"2rem",padding:0}}>
                {p.features.map(f => <li key={f} style={{fontSize:"0.875rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
                  <span style={{color:p.featured?"rgba(255,255,255,0.8)":"#40916c",fontWeight:700}}>✓</span>{f}
                </li>)}
              </ul>
              <Link href="/register" style={{display:"block",width:"100%",padding:"0.85rem",borderRadius:"100px",fontWeight:600,fontSize:"0.9rem",textAlign:"center",textDecoration:"none",background:p.featured?"#f5f0e8":"transparent",color:p.featured?"#c8511a":"#f5f0e8",border:p.featured?"none":"1.5px solid rgba(255,255,255,0.2)"}}>
                Começar grátis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#0f0e0c",borderTop:"1px solid rgba(255,255,255,0.06)",padding:"2rem 5vw",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem",fontSize:"0.85rem",color:"rgba(245,240,232,0.4)"}}>
        <span style={{fontFamily:"'Instrument Serif',serif",color:"rgba(245,240,232,0.7)"}}>Proposta<span style={{color:"#c8511a"}}>Fácil</span></span>
        <span>© 2026 PropostaFácil. Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}
