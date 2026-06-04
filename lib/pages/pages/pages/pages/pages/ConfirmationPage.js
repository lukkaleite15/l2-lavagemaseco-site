import { useState } from "react";
import { WA_NUMBER, WA_DISPLAY } from "../lib/constants";
import { Header, Footer, ContactModal } from "../components/UI";

export default function ConfirmationPage({ booking, user, onLogout, onMenuOpen, onRestart, onEdit, onCancel }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [showCancel,  setShowCancel]  = useState(false);
  if (!booking) return null;

  const waMsg = encodeURIComponent(
    `Olá! Gostaria de fazer um orçamento para lavagem de ${booking.upholstery_type} na L2 Lavagem a Seco.`
  );

  const rows = [
    ["Tipo de estofado",    booking.upholstery_type],
    ["Tipo",               booking.tipo],
    ["Tipo de atendimento",booking.service_type],
    ["Endereço",           `${booking.address}, ${booking.neighborhood}, ${booking.city}`],
    ["Data e horário",     `${booking.date} às ${booking.time}`],
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px" }}>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />

        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div className="card">
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f4f4f5", marginBottom: 20 }}>✅ Confirmação do Agendamento</h2>

            <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 12, padding: "12px 16px", color: "#4ade80", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              Seu serviço foi agendado com sucesso!
            </div>

            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
              {rows.map(([label, value]) => (
                <p key={label} style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>
                  <strong style={{ color: "#f4f4f5" }}>{label}:</strong> {value}
                </p>
              ))}
            </div>

            {/* Botões de orçamento */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <a href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#15803d", color: "white", padding: "12px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                💬 Orçamento pelo WhatsApp
              </a>
              <button onClick={() => setContactOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1e40af", color: "white", padding: "12px 18px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                📞 Orçamento pelo Telefone
              </button>
              <button className="btn-ghost" onClick={onRestart} style={{ fontSize: 13 }}>
                Voltar ao Início
              </button>
            </div>

            {/* Editar / Cancelar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 16, borderTop: "1px solid #27272a" }}>
              <button onClick={onEdit}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#27272a", border: "1px solid #3f3f46", color: "#d4d4d8", padding: "10px 18px", borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                ✏️ Editar Agendamento
              </button>
              <button onClick={() => setShowCancel(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171", padding: "10px 18px", borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                🗑️ Cancelar Agendamento
              </button>
            </div>

            {showCancel && (
              <div style={{ marginTop: 16, background: "#27272a", border: "1px solid #3f3f46", borderRadius: 14, padding: "16px 18px" }}>
                <p style={{ color: "#f4f4f5", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Tem certeza que deseja cancelar o agendamento?
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-red" onClick={onCancel} style={{ padding: "9px 20px", fontSize: 13 }}>
                    Sim, cancelar
                  </button>
                  <button className="btn-ghost" onClick={() => setShowCancel(false)} style={{ padding: "9px 20px", fontSize: 13 }}>
                    Não, manter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
  }
  
