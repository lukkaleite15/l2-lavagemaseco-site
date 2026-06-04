import { useState } from "react";
import { supabase } from "../lib/supabase";
import { UPHOLSTERY, SERVICES, getAvailableTimes } from "../lib/constants";
import { Header, Footer, StepChips, ErrorMsg, Toast } from "../components/UI";

export default function BookingPage({ user, onLogout, onMenuOpen, bookedSlots, onConfirm, draft, existingSlot }) {
  const findTipoSel = () => {
    if (!draft?.tipo) return "";
    const up = UPHOLSTERY.find(u => u.value === draft.upholstery_type);
    if (!up) return "";
    return up.tipos.includes(draft.tipo) ? draft.tipo : "Outro";
  };

  const [step,       setStep]       = useState(1);
  const [upholstery, setUpholstery] = useState(draft?.upholstery_type || "");
  const [tipoSel,    setTipoSel]    = useState(findTipoSel);
  const [tipoCustom, setTipoCustom] = useState(() => {
    if (!draft?.tipo) return "";
    const up = UPHOLSTERY.find(u => u.value === draft?.upholstery_type);
    if (!up) return "";
    return up.tipos.includes(draft.tipo) ? "" : draft.tipo;
  });
  const [m2,      setM2]      = useState(() => draft?.upholstery_type === "Tapete" && draft?.tipo ? draft.tipo.replace(" m²","") : "");
  const [service, setService] = useState(draft?.service_type || "");
  const [loc,     setLoc]     = useState({
    address: draft?.address || "", neighborhood: draft?.neighborhood || "",
    city: draft?.city || "", date: draft?.date || "", time: draft?.time || "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState("");

  const updLoc = k => e => setLoc(p => ({...p, [k]: e.target.value}));
  const upholsteryData = UPHOLSTERY.find(u => u.value === upholstery);
  const isTapete = upholstery === "Tapete";
  const effectiveBooked = existingSlot ? bookedSlots.filter(s => s !== existingSlot) : bookedSlots;
  const availTimes = getAvailableTimes(loc.date, effectiveBooked);

  function resetTipo() { setTipoSel(""); setTipoCustom(""); setM2(""); }

  function goStep2() {
    setError("");
    if (!upholstery)                              { setError("Selecione o tipo de estofado."); return; }
    if (isTapete && !m2.trim())                   { setError("Informe a metragem (m²)."); return; }
    if (!isTapete && !tipoSel)                    { setError("Selecione o tipo."); return; }
    if (tipoSel === "Outro" && !tipoCustom.trim()){ setError("Descreva o tipo."); return; }
    setStep(2);
  }
  function goStep3() {
    setError("");
    if (!service) { setError("Selecione o tipo de atendimento."); return; }
    setStep(3);
  }

  async function submit() {
    setError("");
    if (!loc.address.trim())      { setError("Preencha o endereço."); return; }
    if (!loc.neighborhood.trim()) { setError("Preencha o bairro."); return; }
    if (!loc.city.trim())         { setError("Preencha a cidade."); return; }
    if (!loc.date)                { setError("Selecione a data."); return; }
    if (!loc.time)                { setError("Selecione o horário."); return; }

    const tipoFinal = isTapete ? `${m2} m²` : (tipoSel === "Outro" ? tipoCustom : tipoSel);
    const slot = `${loc.date}_${loc.time}`;

    setLoading(true);

    // Se editando, cancela o agendamento anterior
    if (draft?.id) {
      await supabase.from("agendamentos").update({ status: "editado" }).eq("id", draft.id);
    }

    const { data, error: err } = await supabase.from("agendamentos").insert([{
      usuario_id:     user.id,
      upholstery_type: upholstery,
      tipo:           tipoFinal,
      service_type:   service,
      address:        loc.address,
      neighborhood:   loc.neighborhood,
      city:           loc.city,
      date:           loc.date,
      time:           loc.time,
      status:         "ativo",
    }]).select().single();

    setLoading(false);
    if (err) { setError("Erro ao salvar agendamento. Tente novamente."); return; }

    setToast("Agendamento confirmado!");
    setTimeout(() => onConfirm(data, slot), 800);
  }

  const isWeekend = (() => {
    if (!loc.date) return false;
    const d = new Date(loc.date + "T00:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  })();

  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px" }}>
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(26px,5vw,48px)", fontWeight: 800, color: "#f4f4f5", lineHeight: 1.1 }}>
            Agendamento de Lavagem a Seco
          </h1>
          <p style={{ color: "#71717a", fontSize: 13, marginTop: 8, maxWidth: 520 }}>
            Escolha o estofado, o tipo de atendimento, informe sua localização e confirme seu horário.
          </p>
          <div style={{ marginTop: 20 }}><StepChips current={step} /></div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="two-col">
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", marginBottom: 16 }}>1) Selecione o estofado</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {UPHOLSTERY.map(u => (
                  <button key={u.value} className={`opt-btn ${upholstery === u.value ? "selected" : ""}`}
                    onClick={() => { setUpholstery(u.value); resetTipo(); setError(""); }}>
                    <span style={{ fontSize: 22 }}>{u.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f4f4f5", fontSize: 14 }}>{u.value}</div>
                      <div style={{ color: "#71717a", fontSize: 12, marginTop: 2 }}>{u.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", marginBottom: 16 }}>Tipo</h2>
              {!upholstery && <p style={{ color: "#52525b", fontSize: 13 }}>Primeiro escolha um estofado.</p>}

              {upholsteryData && isTapete && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Metragem (m²)</label>
                  <input type="number" min="0" placeholder="Ex: 4" value={m2} onChange={e => setM2(e.target.value)} className="input-field" style={{ marginTop: 4 }} />
                </div>
              )}

              {upholsteryData && !isTapete && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {upholsteryData.tipos.map(t => (
                    <div key={t}>
                      <button className={`opt-btn ${tipoSel === t ? "selected" : ""}`}
                        onClick={() => { setTipoSel(t); setTipoCustom(""); setError(""); }}
                        style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: tipoSel === t ? "#f4f4f5" : "#a1a1aa" }}>{t}</span>
                      </button>
                      {t === "Outro" && tipoSel === "Outro" && (
                        <input type="text" placeholder="Descreva..." value={tipoCustom} onChange={e => setTipoCustom(e.target.value)} className="input-field" style={{ marginTop: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <ErrorMsg msg={error} />
              <button className="btn-red" onClick={goStep2} style={{ width: "100%", marginTop: 16 }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", marginBottom: 20 }}>2) Como você deseja realizar o serviço?</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="two-col">
                {SERVICES.map(s => (
                  <button key={s.value} className={`opt-btn ${service === s.value ? "selected" : ""}`}
                    onClick={() => { setService(s.value); setError(""); }}
                    style={{ flexDirection: "column", alignItems: "flex-start", padding: "20px 18px" }}>
                    <span style={{ fontSize: 34, marginBottom: 12 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, color: "#f4f4f5", fontSize: 15 }}>{s.value}</span>
                    <span style={{ color: "#71717a", fontSize: 12, marginTop: 6 }}>{s.desc}</span>
                  </button>
                ))}
              </div>
              <ErrorMsg msg={error} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <button className="btn-ghost" onClick={() => { setStep(1); setError(""); }}>← Voltar</button>
              <button className="btn-red"   onClick={goStep3}>Próximo →</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="card" style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5", marginBottom: 20 }}>📍 3) Localização e Agendamento</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Endereço completo</label>
                <input className="input-field" value={loc.address} onChange={updLoc("address")} placeholder="Rua, número" style={{ marginTop: 4 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Bairro</label>
                  <input className="input-field" value={loc.neighborhood} onChange={updLoc("neighborhood")} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Cidade</label>
                  <input className="input-field" value={loc.city} onChange={updLoc("city")} style={{ marginTop: 4 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Data</label>
                  <input type="date" className="input-field" value={loc.date}
                    onChange={e => { updLoc("date")(e); setLoc(p => ({...p, time:""})); }}
                    style={{ marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Horário</label>
                  <select className="input-field" value={loc.time} onChange={updLoc("time")} style={{ marginTop: 4 }}>
                    <option value="">Escolha um horário</option>
                    {loc.date && availTimes.length === 0 && <option disabled>Sem horários disponíveis</option>}
                    {availTimes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {isWeekend && <p style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>🗓️ Fim de semana: horários até 12h.</p>}
                </div>
              </div>
            </div>
            <ErrorMsg msg={error} />
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => { setStep(2); setError(""); }}>← Voltar</button>
              <button className="btn-red" onClick={submit} disabled={loading}>
                {loading ? "Salvando..." : "Confirmar Agendamento"}
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
