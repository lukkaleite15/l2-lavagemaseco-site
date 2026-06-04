import { Logo, LogoWithText, Header, Footer } from "../components/UI";

export default function HomePage({ user, onLogout, onStart, onMenuOpen }) {
  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: "0 16px" }}>
          <Logo size={84} />
          <h1 style={{ fontSize: "clamp(30px,6vw,60px)", fontWeight: 800, color: "#f4f4f5", lineHeight: 1.1, marginTop: 28, marginBottom: 14 }}>
            Agende sua lavagem de estofados em minutos.
          </h1>
          <p style={{ color: "#71717a", fontSize: 16, marginBottom: 36 }}>
            Atendimento profissional com sistema simples.
          </p>
          <button className="btn-red" onClick={onStart}
            style={{ fontSize: 16, padding: "14px 36px", borderRadius: 16, boxShadow: "0 8px 32px rgba(220,38,38,0.25)" }}>
            Começar o agendamento →
          </button>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export function NoBookingPage({ user, onLogout, onMenuOpen, onBack }) {
  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />
        <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
          <div className="card">
            <p style={{ fontSize: 40, marginBottom: 14 }}>📋</p>
            <p style={{ color: "#f4f4f5", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Nenhum agendamento feito</p>
            <p style={{ color: "#71717a", fontSize: 13, marginBottom: 24 }}>Você ainda não possui agendamentos ativos.</p>
            <button className="btn-red" onClick={onBack}>← Voltar</button>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
  }
  
