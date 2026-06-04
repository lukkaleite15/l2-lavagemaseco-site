import { useState } from "react";
import { LOGO_B64, WA_NUMBER, WA_DISPLAY } from "../lib/constants";

export function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <div className="error-box">⚠️ {msg}</div>;
}

export function Toast({ msg, onClose }) {
  if (!msg) return null;
  return <div className="toast" onClick={onClose}>✅ {msg}</div>;
}

export function Logo({ size = 40 }) {
  return (
    <img
      src={LOGO_B64}
      alt="L2 Lavagem a Seco"
      style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", display: "block", flexShrink: 0 }}
    />
  );
}

export function LogoWithText({ compact = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Logo size={compact ? 36 : 50} />
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#71717a", textTransform: "uppercase" }}>L2</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5", lineHeight: 1.2 }}>Lavagem a Seco</div>
      </div>
    </div>
  );
}

export function StepChips({ current }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {[1,2,3,4].map(n => (
        <span key={n} className={current >= n ? "chip-active" : "chip-inactive"}>
          Etapa {n}
        </span>
      ))}
    </div>
  );
}

export function ContactModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  function copyNum() {
    navigator.clipboard?.writeText(WA_DISPLAY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#f4f4f5", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Falar Conosco</h3>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 20 }}>Escolha como entrar em contato:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 10, background: "#15803d", color: "white", padding: "12px 16px", borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14 }}
          >
            💬 WhatsApp — {WA_DISPLAY}
          </a>
          <a
            href={`tel:+${WA_NUMBER}`}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "#1e40af", color: "white", padding: "12px 16px", borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14 }}
          >
            📞 Ligar — {WA_DISPLAY}
          </a>
          <button onClick={copyNum} style={{ background: "#27272a", color: "#d4d4d8", border: "1px solid #3f3f46", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✅ Número copiado!" : `📋 Copiar número`}
          </button>
        </div>
        <button onClick={onClose} style={{ marginTop: 16, color: "#71717a", fontSize: 12, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "center" }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose, user, onGoToAuth, onGoToBookingCheck }) {
  const [contactOpen, setContactOpen] = useState(false);
  const initial = user?.full_name?.[0]?.toUpperCase() || "?";

  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      {open && <div className="overlay" onClick={onClose} />}
      <div className={`sidebar ${open ? "" : "closed"}`}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #27272a" }}>
          <LogoWithText compact />
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#71717a", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {/* Minha conta */}
        <button onClick={() => { onGoToAuth(); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #27272a", background: "none", border: "none", borderBottom: "1px solid #27272a", cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(39,39,42,0.5)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#71717a" }}>— Minha conta</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name || "Visitante"}</div>
          </div>
        </button>

        {/* Conferir agendamento */}
        <button onClick={() => { onGoToBookingCheck(); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #27272a", background: "none", border: "none", borderBottom: "1px solid #27272a", cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(39,39,42,0.5)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize: 20 }}>📋</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Conferir agendamento de lavagem</span>
        </button>

        {/* Falar conosco */}
        <button onClick={() => setContactOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #27272a", background: "none", border: "none", borderBottom: "1px solid #27272a", cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(39,39,42,0.5)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ fontSize: 20 }}>💬</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>Falar conosco</span>
        </button>

        <div style={{ marginTop: "auto", padding: 16, fontSize: 11, color: "#52525b" }}>
          © {new Date().getFullYear()} L2 Lavagem a Seco
        </div>
      </div>
    </>
  );
}

export function Header({ user, onLogout, onMenuOpen }) {
  return (
    <div className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onMenuOpen} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, padding: 4 }}>
          <span style={{ display: "block", width: 20, height: 2, background: "#a1a1aa", borderRadius: 2 }} />
          <span style={{ display: "block", width: 20, height: 2, background: "#a1a1aa", borderRadius: 2 }} />
          <span style={{ display: "block", width: 20, height: 2, background: "#a1a1aa", borderRadius: 2 }} />
        </button>
        <LogoWithText compact />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", background: "#27272a", border: "1px solid #3f3f46", borderRadius: 99, padding: "3px 12px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Cliente
        </span>
        <button className="btn-ghost" onClick={onLogout} style={{ padding: "7px 16px", fontSize: 13 }}>
          Sair
        </button>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(24,24,27,0.6)", border: "1px solid #27272a", borderRadius: 18, padding: "14px 20px", marginTop: 32, flexWrap: "wrap", gap: 12 }}>
      <LogoWithText compact />
      <span style={{ fontSize: 11, color: "#52525b" }}>© {new Date().getFullYear()} L2 - Lavagem a Seco. Atendimento profissional e pontual.</span>
    </div>
  );
  }
    
