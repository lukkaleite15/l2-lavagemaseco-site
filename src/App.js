import React, { useState, useCallback, useEffect } from "react";
import logoAsset from "@/assets/logo-l2.jpg.asset.json";
import poltronaAsset from "@/assets/poltrona.png.asset.json";

const LOGO_URL = logoAsset.url;
const POLTRONA_URL = poltronaAsset.url;

// ── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "l2_bookings";
const NOTIF_KEY = "l2_notifications";
const USERS_KEY = "l2_registered_users";

async function loadAllBookings() {
  try {
    if (typeof window !== "undefined" && (window as any).storage?.get) {
      const r = await (window as any).storage.get(STORAGE_KEY, true);
      return r ? JSON.parse(r.value) : [];
    }
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
}

async function saveAllBookings(list) {
  try {
    if (typeof window !== "undefined" && (window as any).storage?.set) {
      await (window as any).storage.set(STORAGE_KEY, JSON.stringify(list), true);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch {}
}

async function getMyNotifications(bookingId) {
  try {
    let all = [];
    if (typeof window !== "undefined" && (window as any).storage?.get) {
      const r = await (window as any).storage.get(NOTIF_KEY, true);
      all = r ? JSON.parse(r.value) : [];
    } else {
      const local = localStorage.getItem(NOTIF_KEY);
      all = local ? JSON.parse(local) : [];
    }
    return all.filter((n) => n.bookingId === bookingId && !n.seen);
  } catch {
    return [];
  }
}

async function markNotifsSeen(bookingId) {
  try {
    let all = [];
    if (typeof window !== "undefined" && (window as any).storage?.get) {
      const r = await (window as any).storage.get(NOTIF_KEY, true);
      all = r ? JSON.parse(r.value) : [];
      all = all.map((n) => (n.bookingId === bookingId ? { ...n, seen: true } : n));
      await (window as any).storage.set(NOTIF_KEY, JSON.stringify(all), true);
    } else {
      const local = localStorage.getItem(NOTIF_KEY);
      all = local ? JSON.parse(local) : [];
      all = all.map((n) => (n.bookingId === bookingId ? { ...n, seen: true } : n));
      localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    }
  } catch {}
}

function getUsersFromStorage() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ── Helpers de data ──────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isBookingExpired(b) {
  if (!b?.date || !b?.time) return false;
  const dt = new Date(`${b.date}T${b.time}:00`);
  return dt.getTime() < Date.now();
}

// Cancela automaticamente agendamentos expirados (data/hora já passaram)
async function cancelExpiredBookings() {
  try {
    const all = await loadAllBookings();
    let changed = false;
    const updated = all.map((b) => {
      if (b.status === "agendado" || b.status === "alterado") {
        if (isBookingExpired(b)) {
          changed = true;
          return { ...b, status: "cancelado", auto_canceled: true };
        }
      }
      return b;
    });
    if (changed) await saveAllBookings(updated);
    return updated;
  } catch {
    return await loadAllBookings();
  }
}

const WA_NUMBER = "5585987880298";
const WA_DISPLAY = "(85) 98788-0298";

// ── Dados ────────────────────────────────────────────────────────────────────
const UPHOLSTERY = [
  { value: "Sofá", icon: "🛋️", desc: "Higienização profunda para sofás",
    tipos: ["Comum (2 lugares)", "Comum (3 lugares)", "Retrátil (2 lugares)", "Retrátil (3 lugares)", "Sofá-Cama", "Outro"] },
  { value: "Tapete", icon: "🧶", desc: "Remoção de sujeira e odores", tipos: ["m²"] },
  { value: "Cama", icon: "🛏️", desc: "Limpeza e sanitização de colchões",
    tipos: ["Colchão Solteiro", "Colchão Solteiro King", "Colchão Padrão", "Colchão Casal Padrão", "Colchão Casal Queen", "Colchão Casal King", "Outro"] },
  { value: "Cadeiras", icon: "🪑", desc: "Ideal para tecido e couro",
    tipos: ["Cadeira de Escritório", "Cadeira de Jantar", "Outro"] },
  { value: "Poltrona", icon: null, desc: "Limpeza profunda e higienização de poltronas",
    tipos: ["Simples", "Reclinável", "Outro"] },
];

const SERVICES = [
  { value: "Atendimento em Domicílio", icon: "🏠", desc: "O profissional vai até o endereço do cliente." },
  { value: "Recolha e Entrega", icon: "🚚", desc: "O estofado será recolhido e devolvido após lavagem." },
];

const WEEKDAY_TIMES = ["08:00", "09:30", "11:00", "14:00", "15:30", "17:00"];
const WEEKEND_TIMES = ["08:00", "09:30", "11:00"];

function getAvailableTimes(dateStr, booked = []) {
  if (!dateStr) return [];
  const day = new Date(dateStr + "T00:00:00").getDay();
  const base = day === 0 || day === 6 ? WEEKEND_TIMES : WEEKDAY_TIMES;
  let times = base.filter((t) => !booked.includes(`${dateStr}_${t}`));
  // Se for hoje, remover horários que já passaram
  if (dateStr === todayStr()) {
    const now = new Date();
    times = times.filter((t) => {
      const [h, m] = t.split(":").map(Number);
      const slot = new Date();
      slot.setHours(h, m, 0, 0);
      return slot.getTime() > now.getTime();
    });
  }
  return times;
}

function isValidPhone(ph) { return /^\d{10,11}$/.test(ph.replace(/\D/g, "")); }
function isValidEmail(em) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em); }

// ── Estilos ──────────────────────────────────────────────────────────────────
const pageBg = { background: "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(200,20,20,0.18), transparent 55%), #09090b" };
const inputCls = "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors w-full";
const cardCls = "bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6";
const btnRed = "bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer";
const btnGhost = "bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-sm transition-colors cursor-pointer";

// ── Base ─────────────────────────────────────────────────────────────────────
function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 bg-red-600/15 border border-red-500/50 text-red-400 text-sm font-medium rounded-lg px-4 py-3 mt-2">
      ⚠️ {msg}
    </div>
  );
}

function ContactModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  function copy() {
    const el = document.createElement("textarea");
    el.value = WA_DISPLAY;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999);
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">Falar Conosco</h3>
        <p className="text-zinc-400 text-sm mb-4">Escolha como entrar em contato:</p>
        <div className="flex flex-col gap-3">
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 bg-green-700 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors text-center justify-center">
            💬 WhatsApp — {WA_DISPLAY}
          </a>
          <a href={`tel:+${WA_NUMBER}`}
            className="flex items-center gap-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors text-center justify-center">
            📞 Ligar — {WA_DISPLAY}
          </a>
          <button onClick={copy}
            className="flex items-center gap-3 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer justify-center">
            {copied ? "✅ Número copiado!" : "📋 Copiar número"}
          </button>
        </div>
        <button onClick={onClose} className="mt-4 text-zinc-500 text-xs hover:text-zinc-300 w-full text-center cursor-pointer">Fechar</button>
      </div>
    </>
  );
}

function Logo({ size = 40 }) {
  return <img src={LOGO_URL} alt="L2 Lavagem a Seco" style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", display: "block" }} />;
}

function LogoWithText({ compact = false }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <Logo size={compact ? 36 : 52} />
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500 m-0">L2</p>
        <p className="text-sm font-bold text-white leading-tight m-0">Lavagem a Seco</p>
      </div>
    </div>
  );
}

function StepChips({ current }) {
  return (
    <div className="flex gap-2 mb-7 overflow-x-auto pb-1">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${current >= n ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
          Etapa {n}
        </span>
      ))}
    </div>
  );
}

function Sidebar({ open, onClose, user, onGoToAuth, onGoToBookingCheck }) {
  const [contactOpen, setContactOpen] = useState(false);
  const initial = user?.full_name?.[0]?.toUpperCase() || "?";
  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      {open && <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <LogoWithText compact />
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl cursor-pointer">✕</button>
        </div>
        <button onClick={() => { onGoToAuth(); onClose(); }}
          className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left w-full cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">{initial}</div>
          <div>
            <p className="text-xs text-zinc-500 m-0">— Minha conta</p>
            <p className="text-sm font-semibold text-white truncate max-w-[160px] m-0">{user?.full_name || "Visitante"}</p>
          </div>
        </button>
        <button onClick={() => { onGoToBookingCheck(); onClose(); }}
          className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left w-full cursor-pointer">
          <span className="text-xl">📋</span>
          <p className="text-sm font-semibold text-white m-0">Conferir agendamento de lavagem</p>
        </button>
        <button onClick={() => setContactOpen(true)}
          className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left w-full cursor-pointer">
          <span className="text-xl">💬</span>
          <p className="text-sm font-semibold text-white m-0">Falar conosco</p>
        </button>
        <div className="mt-auto p-4 text-xs text-zinc-600">© {new Date().getFullYear()} L2 Lavagem a Seco</div>
      </div>
    </>
  );
}

function Header({ user, onLogout, onMenuOpen }) {
  return (
    <header className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuOpen} className="flex flex-col gap-1 p-2 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer">
          {[0, 1, 2].map((i) => <span key={i} className="block w-5 h-0.5 bg-zinc-300" />)}
        </button>
        <LogoWithText compact />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 hidden sm:inline">Cliente</span>
        <button onClick={onLogout} className={`${btnGhost} px-4 py-2`}>Sair</button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-2xl px-5 py-4 mt-8 flex-wrap gap-3 text-left">
      <LogoWithText compact />
      <p className="text-zinc-600 text-xs m-0">© {new Date().getFullYear()} L2 - Lavagem a Seco. Atendimento profissional e pontual.</p>
    </footer>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [page, setPage] = useState("auth");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [adminNotif, setAdminNotif] = useState(null);

  useEffect(() => {
    async function init() {
      const all = await cancelExpiredBookings();
      const slots = all.filter((b) => b.status !== "cancelado").map((b) => `${b.date}_${b.time}`);
      setBookedSlots(slots);
      if (user) {
        const mine = all.filter((b) => b.client_email === user.email);
        if (mine.length > 0) {
          const sorted = mine.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setActiveBooking(sorted[0]);
        } else {
          setActiveBooking(null);
        }
      }
    }
    init();
  }, [user]);

  // Verifica expiração periodicamente
  useEffect(() => {
    const t = setInterval(async () => {
      const all = await cancelExpiredBookings();
      const slots = all.filter((b) => b.status !== "cancelado").map((b) => `${b.date}_${b.time}`);
      setBookedSlots(slots);
      if (activeBooking) {
        const updated = all.find((b) => b.id === activeBooking.id);
        if (updated && updated.status !== activeBooking.status) setActiveBooking(updated);
      }
    }, 60000);
    return () => clearInterval(t);
  }, [activeBooking]);

  const handleLogout = useCallback(() => { setUser(null); setPage("auth"); }, []);
  const handleAuthSuccess = useCallback((u) => { setUser(u); setPage("home"); }, []);

  useEffect(() => {
    if (!activeBooking?.id) return;
    const poll = setInterval(async () => {
      try {
        const all = await loadAllBookings();
        const updated = all.find((b) => b.id === activeBooking.id);
        if (!updated) return;
        if (updated.status !== activeBooking.status || updated.date !== activeBooking.date || updated.time !== activeBooking.time) {
          setActiveBooking(updated);
        }
        const notifs = await getMyNotifications(activeBooking.id);
        if (notifs.length > 0) {
          setAdminNotif(notifs[0].msg);
          await markNotifsSeen(activeBooking.id);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, [activeBooking]);

  const handleGoToBookingCheck = useCallback(() => {
    if (activeBooking && !isBookingExpired(activeBooking) && activeBooking.status !== "cancelado") setPage("myBooking");
    else setPage("noBooking");
  }, [activeBooking]);

  const handleConfirm = useCallback(async (booking, slot) => {
    try {
      const all = await loadAllBookings();
      const newBooking = {
        ...booking,
        id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        client_name: user?.full_name || "Cliente",
        client_email: user?.email || "",
        client_phone: user?.phone || "",
        status: "agendado",
        created_at: new Date().toISOString(),
      };
      await saveAllBookings([...all, newBooking]);
      setBookedSlots((p) => [...p, slot]);
      setActiveBooking(newBooking);
    } catch {
      setActiveBooking({ ...booking, status: "agendado" });
    }
    setDraft(null);
    setPage("confirmation");
  }, [user]);

  const handleEdit = useCallback(() => {
    setDraft(activeBooking);
    setPage("booking");
  }, [activeBooking]);

  const handleCancel = useCallback(async () => {
    if (activeBooking) {
      const slot = `${activeBooking.date}_${activeBooking.time}`;
      setBookedSlots((p) => p.filter((s) => s !== slot));
      try {
        const all = await loadAllBookings();
        await saveAllBookings(all.map((b) => (b.id === activeBooking.id ? { ...b, status: "cancelado" } : b)));
      } catch {}
      setActiveBooking(null);
    }
    setPage("home");
  }, [activeBooking]);

  return (
    <div style={pageBg} className="min-h-screen text-zinc-100 flex flex-col justify-between">
      <div>
        {adminNotif && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold cursor-pointer max-w-xs text-center"
            onClick={() => setAdminNotif(null)}>
            🔔 {adminNotif}
          </div>
        )}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user}
          onGoToAuth={() => { setPage("auth"); setSidebarOpen(false); }}
          onGoToBookingCheck={() => { handleGoToBookingCheck(); setSidebarOpen(false); }} />

        {page === "auth" && <AuthPage onSuccess={handleAuthSuccess} currentUser={user} />}
        {page === "home" && <HomePage user={user} onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)} onStart={() => { setDraft(null); setPage("booking"); }} />}
        {page === "booking" && <BookingPage user={user} onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)} bookedSlots={bookedSlots} onConfirm={handleConfirm} draft={draft} existingSlot={draft ? `${draft.date}_${draft.time}` : null} />}
        {(page === "confirmation" || page === "myBooking") && <ConfirmationPage booking={activeBooking} user={user} onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)} onRestart={() => setPage("home")} onEdit={handleEdit} onCancel={handleCancel} />}
        {page === "noBooking" && <NoBookingPage user={user} onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)} onBack={() => setPage("home")} />}
      </div>
    </div>
  );
}

function AuthPage({ onSuccess, currentUser }) {
  const [mode, setMode] = useState("register");
  const [reg, setReg] = useState({ full_name: "", phone: "", email: "", password: "", confirm: "" });
  const [log, setLog] = useState({ email: currentUser?.email || "", password: currentUser?.password || "" });
  const [error, setError] = useState("");

  const upd = (k) => (e) => setReg((p) => ({ ...p, [k]: e.target.value }));
  const updL = (k) => (e) => setLog((p) => ({ ...p, [k]: e.target.value }));

  function doRegister() {
    setError("");
    if (!reg.full_name.trim()) { setError("Preencha o nome completo."); return; }
    if (!isValidPhone(reg.phone)) { setError("Telefone não existente ou inválido."); return; }
    if (!isValidEmail(reg.email)) { setError("E-mail não existente ou inválido."); return; }
    const currentUsers = getUsersFromStorage();
    if (currentUsers.find((u) => u.email === reg.email)) { setError("E-mail já cadastrado."); return; }
    if (!reg.password) { setError("Preencha a senha."); return; }
    if (reg.password !== reg.confirm) { setError("As senhas não coincidem."); return; }
    const nu = { full_name: reg.full_name, phone: reg.phone, email: reg.email, password: reg.password, role: "client" };
    try { localStorage.setItem(USERS_KEY, JSON.stringify([...currentUsers, nu])); } catch {}
    onSuccess(nu);
  }
  function doLogin() {
    setError("");
    if (!log.email) { setError("Preencha o e-mail."); return; }
    if (!log.password) { setError("Preencha a senha."); return; }
    const currentUsers = getUsersFromStorage();
    const found = currentUsers.find((u) => u.email === log.email);
    if (!found) { setError("E-mail não cadastrado."); return; }
    if (found.password !== log.password) { setError("Senha incorreta."); return; }
    onSuccess(found);
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-between gap-8 p-8 bg-black/30 border-b md:border-b-0 md:border-r border-zinc-800 text-left">
            <div className="space-y-5">
              <LogoWithText />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Agende sua lavagem de estofados em minutos.</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">Atendimento profissional com sistema simples: cadastro, escolha do serviço e confirmação.</p>
            </div>
  <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-300">
              ✔️ Processo otimizado para celular, tablet e computador.
            </div>
          </div>
          <div className="p-8 text-left">
            <h2 className="text-xl font-bold text-white mb-5">{mode === "register" ? "Criar conta" : "Entrar na conta"}</h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[["register", "Cadastrar"], ["login", "Já tenho conta"]].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}

                  className={`py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${mode === m ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"}`}>
{label}
                </button>
              ))}
            </div>
            {mode === "register" ? (
              <div className="space-y-3">
                {[["Nome completo", "full_name", "text", "Digite seu nome"], ["Telefone / WhatsApp", "phone", "tel", "(85) 99999-9999"], ["Email", "email", "email", "seu@email.com"], ["Senha", "password", "password", ""], ["Confirmar senha", "confirm", "password", ""]].map(([label, k, type, ph]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-400">{label}</label>
                    <input type={type} placeholder={ph} value={reg[k]} onChange={upd(k)} className={inputCls} />
                  </div>
                ))}
                <ErrorMsg msg={error} />
                <button onClick={doRegister} className={`${btnRed} w-full py-3 mt-2`}>Cadastrar</button>
              </div>
              ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">Email</label>
                  <input type="email" placeholder="seu@email.com" value={log.email} onChange={updL("email")} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">Senha</label>
                  <input type="password" value={log.password} onChange={updL("password")} className={inputCls} />
                </div>
                <ErrorMsg msg={error} />
                <button onClick={doLogin} className={`${btnRed} w-full py-3 mt-2`}>Entrar</button>
              </div>
            )}
          </div>
        </div>
</div>
    </div>
  );
}
function HomePage({ user, onLogout, onStart, onMenuOpen }) {
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full">
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-3xl mx-auto">
          <Logo size={80} />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mt-8 mb-4">Agende sua lavagem de estofados em minutos.</h1>
          <p className="text-zinc-400 text-base sm:text-lg mb-10">Atendimento profissional com sistema simples.</p>
  <button onClick={onStart} className={`${btnRed} px-10 py-4 text-lg shadow-lg shadow-red-900/40`}>Começar o agendamento →</button>
        </div>
        <Footer />
      </div>
    </div>
  );
}
const emptyItem = () => ({ upholstery: "", tipoSel: "", tipoCustom: "", m2: "" });
function ItemCard({ item, index, total, onChange, onRemove }) {
  const data = UPHOLSTERY.find((u) => u.value === item.upholstery);
  const isTapete = item.upholstery === "Tapete";
  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-4 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Estofado {index + 1}</span>
        {total > 1 && (
          <button onClick={() => onRemove(index)}
            className="text-xs text-red-400 hover:text-red-300 border border-red-700/40 rounded-lg px-2 py-1 transition-colors cursor-pointer">
            ✕ Remover
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {UPHOLSTERY.map((u) => (
          <button key={u.value}
            onClick={() => onChange(index, { upholstery: u.value, tipoSel: "", tipoCustom: "", m2: "" })}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center text-xs font-semibold transition-colors cursor-pointer
              ${item.upholstery === u.value ? "border-red-500 bg-red-600/10 text-white" : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-500"}`}>
            {u.value === "Poltrona"
             ? <img src={POLTRONA_URL} alt="Poltrona" style={{ width: 28, height: 28, objectFit: "contain" }} />
              : <span className="text-xl">{u.icon}</span>}
            {u.value}
          </button>
        ))}
      </div>
      {data && isTapete && (
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1">Metragem (m²)</label>
          <input type="number" min="0" placeholder="Ex: 4" value={item.m2}
            onChange={(e) => onChange(index, { m2: e.target.value })} className={inputCls} />
        </div>
      )}
      {data && !isTapete && (
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-2">Tipo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.tipos.map((t) => (
              <div key={t} className="w-full">
              <button onClick={() => onChange(index, { tipoSel: t, tipoCustom: "" })}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer
                    ${item.tipoSel === t ? "border-red-500 bg-red-600/10 text-white" : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-500"}`}>
                  {t}
                </button>
                {t === "Outro" && item.tipoSel === "Outro" && (
                  <input type="text" placeholder="Descreva o modelo..." value={item.tipoCustom}
                    onChange={(e) => onChange(index, { tipoCustom: e.target.value })}
                    className={inputCls + " mt-1 text-xs"} />
                )}
              </div>
            ))}
          </div>
        </div>
)}
    </div>
  );
}
function BookingPage({ user, onLogout, onMenuOpen, bookedSlots, onConfirm, draft, existingSlot }) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState(draft?.items || [emptyItem()]);
  const [service, setService] = useState(draft?.service_type || "");
  const [loc, setLoc] = useState({
    address: draft?.address || "",
    neighborhood: draft?.neighborhood || "",
    city: draft?.city || "",
    date: draft?.date || "",
    time: draft?.time || "",
  });
  const [error, setError] = useState("");
  const updLoc = (k) => (e) => setLoc((p) => ({ ...p, [k]: e.target.value }));
  const effectiveBooked = existingSlot ? bookedSlots.filter((s) => s !== existingSlot) : bookedSlots;
  const availTimes = getAvailableTimes(loc.date, effectiveBooked);
  const minDate = todayStr();
  function changeItem(index, patch) { setItems((p) => p.map((it, i) => (i === index ? { ...it, ...patch } : it))); setError(""); }
  function removeItem(index) { setItems((p) => p.filter((_, i) => i !== index)); }
  function addItem() { setItems((p) => [...p, emptyItem()]); }
  function goStep2() {
    setError("");
    for (let i = 0; i < items.length; i++) {
      const it = items[i], n = i + 1;
      if (!it.upholstery) { setError(`Estofado ${n}: selecione o tipo de estofado.`); return; }
      if (it.upholstery === "Tapete" && !it.m2.trim()) { setError(`Estofado ${n}: informe a metragem (m²).`); return; }
      if (it.upholstery !== "Tapete" && !it.tipoSel) { setError(`Estofado ${n}: selecione o tipo.`); return; }
      if (it.tipoSel === "Outro" && !it.tipoCustom.trim()) { setError(`Estofado ${n}: descreva o tipo.`); return; }
    }
    setStep(2);
  }
  function goStep3() {
    setError("");
    if (!service) { setError("Selecione o tipo de atendimento."); return; }
    setStep(3);
  }
  function submit() {
    setError("");
    if (!loc.address.trim()) { setError("Preencha o endereço."); return; }
    if (!loc.neighborhood.trim()) { setError("Preencha o bairro."); return; }
    if (!loc.city.trim()) { setError("Preencha a cidade."); return; }
    if (!loc.date) { setError("Selecione a data."); return; }
    if (loc.date < minDate) { setError("Não é possível agendar em datas passadas."); return; }
    if (!loc.time) { setError("Selecione o horário."); return; }
    // Verificação extra: data/hora completos no futuro
  const slotDate = new Date(`${loc.date}T${loc.time}:00`);
    if (slotDate.getTime() <= Date.now()) { setError("Este horário já passou. Escolha um horário futuro."); return; }
    const itemsFinal = items.map((it) => ({
      upholstery_type: it.upholstery,
      tipo: it.upholstery === "Tapete" ? `${it.m2} m²` : it.tipoSel === "Outro" ? it.tipoCustom : it.tipoSel,
    }));
    onConfirm({ items: itemsFinal, service_type: service, ...loc }, `${loc.date}_${loc.time}`);
  }
  const isWeekend = loc.date && [0, 6].includes(new Date(loc.date + "T00:00:00").getDay());
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full text-left">
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />
        <div className="mb-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Agendamento de Lavagem</h1>
          <p className="text-zinc-400 text-sm mt-2">Escolha os estofados, o tipo de atendimento, informe sua localização e confirme seu horário.</p>
          <div className="mt-5"><StepChips current={step} /></div>
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">1) Selecione os estofados</h2>
                <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1">
                  {items.length} item{items.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-4">
                  {items.map((item, i) => (
                  <ItemCard key={i} item={item} index={i} total={items.length} onChange={changeItem} onRemove={removeItem} />
                ))}
              </div>
              <button onClick={addItem}
                className="mt-4 w-full border border-dashed border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded-2xl py-4 text-sm font-semibold transition-colors cursor-pointer">
                + Adicionar outro estofado
              </button>
            </div>
            <ErrorMsg msg={error} />
            <button onClick={goStep2} className={`${btnRed} px-8 py-3 mt-2`}>Continuar →</button>
          </div>
        )}
        {step === 2 && (
          <div>
         <div className={cardCls}>
              <h2 className="text-lg font-bold text-white mb-5">2) Como você deseja realizar o serviço?</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {SERVICES.map((s) => (
                  <button key={s.value} onClick={() => { setService(s.value); setError(""); }}
                    className={`p-6 rounded-2xl border text-left transition-colors cursor-pointer ${service === s.value ? "border-red-500 bg-red-600/10" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"}`}>
                    <div className="text-4xl mb-4">{s.icon}</div>
                    <p className="text-white font-bold text-base m-0">{s.value}</p>
                    <p className="text-zinc-400 text-sm mt-2 m-0">{s.desc}</p>
                  </button>
                ))}
              </div>
              <ErrorMsg msg={error} />
            </div>
<div className="flex gap-3 mt-5">
              <button onClick={() => { setStep(1); setError(""); }} className={`${btnGhost} px-5 py-2.5`}>← Voltar</button>
              <button onClick={goStep3} className={`${btnRed} px-6 py-2.5`}>Próximo →</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-white mb-5">📍 3) Localização e Agendamento</h2>
            <div className="space-y-4 max-w-lg">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-400">Endereço completo</label>
                <input className={inputCls} value={loc.address} onChange={updLoc("address")} placeholder="Rua, número, bloco" />
              </div>
              <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">Bairro</label>
                  <input className={inputCls} value={loc.neighborhood} onChange={updLoc("neighborhood")} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">Cidade</label>
                  <input className={inputCls} value={loc.city} onChange={updLoc("city")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">Data</label>
                  <input type="date" min={minDate} className={inputCls} value={loc.date}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v && v < minDate) {
                        setError("Não é possível agendar em datas passadas.");
                        return;
                      }
                      setError("");
                      setLoc((p) => ({ ...p, date: v, time: "" }));
                    }} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-400">Horário</label>
                  <select className={inputCls} value={loc.time} onChange={updLoc("time")}>
                    <option value="">Escolha um horário</option>
                    {loc.date && availTimes.length === 0 && <option disabled>Sem horários disponíveis</option>}
                    {availTimes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                                    </div>
              </div>
              {isWeekend && <p className="text-xs text-zinc-500 m-0">🗓️ Sábados e domingos: atendimentos na parte da manhã.</p>}
            </div>
            <ErrorMsg msg={error} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setStep(2); setError(""); }} className={`${btnGhost} px-5 py-2.5`}>← Voltar</button>
              <button onClick={submit} className={`${btnRed} px-6 py-2.5`}>Confirmar Agendamento</button>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}
function ConfirmationPage({ booking, user, onLogout, onMenuOpen, onRestart, onEdit, onCancel }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  if (!booking) return null;
  const isCanceled = booking.status === "cancelado";
  const isAltered = booking.status === "alterado";
  const isConcluded = booking.status === "concluido";
  const expired = isBookingExpired(booking);
  const itemsList = booking.items || [];
  const itemsStr = itemsList.map((it) => `${it.upholstery_type} (${it.tipo})`).join(", ");
  const waMsg = encodeURIComponent(`Olá, gostaria de fazer um orçamento para lavagem de ${itemsStr} na L2 Lavagem a Seco.`);
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-between">
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <div className="max-w-2xl mx-auto w-full text-left">
  <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />
        <div className={cardCls}>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
            {isCanceled ? "🚫 Agendamento Cancelado" : isAltered ? "⚠️ Agendamento Alterado" : isConcluded ? "✔ Serviço Concluído" : "✅ Agendamento Confirmado"}
          </h2>
          {isCanceled && (
            <div className="bg-red-900/25 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm font-semibold mb-5">
              {booking.auto_canceled
                ? "Este agendamento foi cancelado automaticamente porque a data/horário expirou."
                : "Este agendamento foi cancelado. Entre em contato para mais informações."}
            </div>
          )}
          {isAltered && (
            <div className="bg-yellow-900/25 border border-yellow-500/40 rounded-xl px-4 py-3 text-yellow-300 text-sm font-semibold mb-5">
            ⚠️ A empresa alterou seu agendamento. Confira os novos dados abaixo.
            </div>
          )}
          {!isCanceled && !isAltered && !isConcluded && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3 text-green-300 text-sm font-semibold mb-5">
              Seu serviço foi agendado com sucesso!
            </div>
          )}
          {isConcluded && (
            <div className="bg-green-900/25 border border-green-500/40 rounded-xl px-4 py-3 text-green-300 text-sm font-semibold mb-5">
              ✔ Serviço concluído. Obrigado por escolher a L2 Lavagem a Seco!
            </div>
          )}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 space-y-4 text-sm mb-6">
            <div>
            <p className="text-white font-semibold mb-2">Estofados ({itemsList.length}):</p>
              <div className="space-y-1 pl-2">
                {itemsList.map((it, i) => (
                  <p key={i} className="text-zinc-300 m-0">
                    <span className="text-zinc-500 mr-1">{i + 1}.</span>
                    <strong className="text-white">{it.upholstery_type}</strong> — {it.tipo}
                  </p>
                ))}
              </div>
            </div>
            <div className="border-t border-zinc-700 pt-3 space-y-2">
              {[
                ["Tipo de atendimento", booking.service_type],
                ["Endereço", `${booking.address}, ${booking.neighborhood}, ${booking.city}`],
                ["Data e horário", `${booking.date} às ${booking.time}`],
              ].map(([label, value]) => (
                <p key={label} className="text-zinc-300 m-0"><strong className="text-white">{label}:</strong> {value}</p>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <a href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`} target="_blank" rel="noreferrer"
              className="bg-green-700 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors text-center justify-center inline-block">
              💬 Orçamento pelo WhatsApp
            </a>
            <button onClick={() => setContactOpen(true)}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors cursor-pointer">
              📞 Orçamento pelo Telefone
            </button>
<button onClick={onRestart} className={`${btnGhost} px-5 py-3`}>Voltar ao Início</button>
          </div>
          {!isCanceled && !isConcluded && !expired && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
              <button onClick={onEdit}
                className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
                ✏️ Editar Agendamento
              </button>
              <button onClick={() => setShowCancelConfirm(true)}
                className="bg-red-900/30 border border-red-700/50 hover:bg-red-900/60 text-red-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
                🗑️ Cancelar Agendamento
              </button>
            </div>
          )}


{showCancelConfirm && (
            <div className="mt-4 bg-zinc-800 border border-zinc-700 rounded-xl p-4">
              <p className="text-white text-sm font-semibold mb-3">Tem certeza que deseja cancelar?</p>
              <div className="flex gap-3">
                <button onClick={onCancel} className={`${btnRed} px-4 py-2`}>Sim, cancelar</button>
                <button onClick={() => setShowCancelConfirm(false)} className={`${btnGhost} px-4 py-2`}>Não, manter</button>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
function NoBookingPage({ user, onLogout, onMenuOpen, onBack }) {
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full">
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen} />
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className={cardCls}>
            <p className="text-3xl mb-4 m-0">📋</p>
            <p className="text-white font-bold text-lg mb-2 m-0">Nenhum agendamento ativo</p>
            <p className="text-zinc-400 text-sm mb-6 m-0">Você não possui agendamentos ativos ou eles já expiraram.</p>
            <button onClick={onBack} className={`${btnRed} px-6 py-3`}>← Voltar</button>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
