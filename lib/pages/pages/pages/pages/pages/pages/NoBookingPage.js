import { Header, Footer } from "../components/UI";

export default function NoBookingPage({ user, onLogout, onMenuOpen, onBack }) {
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

