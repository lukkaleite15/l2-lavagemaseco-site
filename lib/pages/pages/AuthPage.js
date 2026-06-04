import { useState } from "react";
import { supabase } from "../lib/supabase";
import { isValidPhone, isValidEmail } from "../lib/constants";
import { LogoWithText, ErrorMsg, Toast } from "../components/UI";

export default function AuthPage({ onSuccess, currentUser }) {
  const [mode, setMode]   = useState("register");
  const [reg, setReg]     = useState({ full_name:"", phone:"", email:"", password:"", confirm:"" });
  const [log, setLog]     = useState({ email: currentUser?.email || "", password: currentUser?.password || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const upd  = k => e => setReg(p => ({...p, [k]: e.target.value}));
  const updL = k => e => setLog(p => ({...p, [k]: e.target.value}));

  async function doRegister() {
    setError("");
    if (!reg.full_name.trim())        { setError("Preencha o nome completo."); return; }
    if (!isValidPhone(reg.phone))     { setError("Telefone não existente ou inválido."); return; }
    if (!isValidEmail(reg.email))     { setError("E-mail não existente ou inválido."); return; }
    if (!reg.password)                { setError("Preencha a senha."); return; }
    if (reg.password.length < 6)     { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (reg.password !== reg.confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    // Verifica se email já existe
    const { data: exists } = await supabase.from("usuarios").select("id").eq("email", reg.email).single();
    if (exists) { setError("E-mail já cadastrado."); setLoading(false); return; }

    const { data, error: err } = await supabase.from("usuarios").insert([{
      full_name: reg.full_name,
      phone: reg.phone,
      email: reg.email,
      password: reg.password,
    }]).select().single();

    setLoading(false);
    if (err) { setError("Erro ao cadastrar. Tente novamente."); return; }
    setToast("Cadastro concluído!");
    setTimeout(() => onSuccess(data), 800);
  }

  async function doLogin() {
    setError("");
    if (!log.email)    { setError("Preencha o e-mail."); return; }
    if (!log.password) { setError("Preencha a senha."); return; }

    setLoading(true);
    const { data, error: err } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", log.email)
      .single();

    setLoading(false);
    if (err || !data)          { setError("E-mail não cadastrado."); return; }
    if (data.password !== log.password) { setError("Senha incorreta."); return; }
    setToast("Login realizado!");
    setTimeout(() => onSuccess(data), 800);
  }

  const inputStyle = { marginTop: 4 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      <div style={{ width: "100%", maxWidth: 900, background: "rgba(24,24,27,0.85)", border: "1px solid #27272a", borderRadius: 24, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="two-col">

          {/* Esquerda */}
          <div style={{ padding: "40px 36px", background: "rgba(0,0,0,0.3)", borderRight: "1px solid #27272a", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32 }}>
            <div>
              <LogoWithText />
              <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: "#f4f4f5", marginTop: 24, lineHeight: 1.1 }}>
                Agende sua lavagem de estofados em minutos.
              </h1>
              <p style={{ color: "#71717a", fontSize: 14, marginTop: 14, lineHeight: 1.7 }}>
                Atendimento profissional com sistema simples: cadastro, escolha do serviço e confirmação.
              </p>
            </div>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#a1a1aa" }}>
              ✔️ Processo otimizado para celular, tablet e computador.
            </div>
          </div>

          {/* Direita */}
          <div style={{ padding: "40px 36px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f4f4f5", marginBottom: 20 }}>
              {mode === "register" ? "Criar conta" : "Entrar na conta"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[["register","Cadastrar"],["login","Já tenho conta"]].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  style={{ padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "background 0.15s",
                    background: mode === m ? "#dc2626" : "#27272a",
                    color: mode === m ? "white" : "#a1a1aa",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {mode === "register" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[["Nome completo","full_name","text","Digite seu nome"],["Telefone / WhatsApp","phone","tel","(85) 99999-9999"],["Email","email","email","seu@email.com"],["Senha","password","password","Mínimo 6 caracteres"],["Confirmar senha","confirm","password",""]].map(([label, k, type, ph]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#71717a" }}>{label}</label>
                    <input type={type} placeholder={ph} value={reg[k]} onChange={upd(k)} className="input-field" style={inputStyle} />
                  </div>
                ))}
                <ErrorMsg msg={error} />
                <button className="btn-red" onClick={doRegister} disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#71717a" }}>Email</label>
                  <input type="email" placeholder="seu@email.com" value={log.email} onChange={updL("email")} className="input-field" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#71717a" }}>Senha</label>
                  <input type="password" value={log.password} onChange={updL("password")} className="input-field" style={inputStyle} />
                </div>
                <ErrorMsg msg={error} />
                <button className="btn-red" onClick={doLogin} disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
        }

