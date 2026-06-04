import React, { useState, useCallback, useEffect } from "react";

// Injeta dinamicamente o Tailwind CSS e as Fontes para garantir o visual idêntico
if (typeof window !== "undefined" && !document.getElementById("tailwind-cdn")) {
  const linkFont = document.createElement("link");
  linkFont.rel = "stylesheet";
  linkFont.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(linkFont);

  const scriptTailwind = document.createElement("script");
  scriptTailwind.id = "tailwind-cdn";
  scriptTailwind.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
  document.head.appendChild(scriptTailwind);

  const styleInline = document.createElement("style");
  styleInline.innerHTML = `* { font-family: 'Inter', sans-serif !important; }`;
  document.head.appendChild(styleInline);
}

// ── Chaves de Storage (Correção do salvamento de contas e agendamentos) ───────
const STORAGE_KEY = "l2_bookings";
const NOTIF_KEY   = "l2_notifications";
const USERS_KEY   = "l2_registered_users";

async function loadAllBookings() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch { return []; }
}

async function saveAllBookings(list) {
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

async function getMyNotifications(bookingId) {
  try {
    const local = localStorage.getItem(NOTIF_KEY);
    const all = local ? JSON.parse(local) : [];
    return all.filter(n => n.bookingId === bookingId && !n.seen);
  } catch { return []; }
}

async function markNotifsSeen(bookingId) {
  try {
    const local = localStorage.getItem(NOTIF_KEY);
    let all = local ? JSON.parse(local) : [];
    all = all.map(n => n.bookingId === bookingId ? { ...n, seen: true } : n);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch {}
}

// ── Banco de Dados dos Serviços ──────────────────────────────────────────────
const UPHOLSTERY = [
  { value: "Sofá",     icon: "🛋️", desc: "Higienização profunda para sofás",
    tipos: ["Comum (2 lugares)","Comum (3 lugares)","Retrátil (2 lugares)","Retrátil (3 lugares)","Sofá-Cama","Outro"] },
  { value: "Tapete",   icon: "🧶",  desc: "Remoção de sujeira e odores", tipos: ["m²"] },
  { value: "Cama",     icon: "🛏️", desc: "Limpeza e sanitização de colchões",
    tipos: ["Colchão Solteiro","Colchão Solteiro King","Colchão Padrão","Colchão Casal Padrão","Colchão Casal Queen","Colchão Casal King","Outro"] },
  { value: "Cadeiras", icon: "🪑",  desc: "Ideal para tecido e couro",
    tipos: ["Cadeira de Escritório","Cadeira de Jantar","Outro"] },
  { value: "Poltrona", icon: "🦺",  desc: "Limpeza profunda e higienização de poltronas",
    tipos: ["Simples","Reclinável","Outro"] },
];

const SERVICES = [
  { value: "Atendimento em Domicílio", icon: "🏠", desc: "O profissional vai até o endereço do cliente." },
  { value: "Recolha e Entrega",        icon: "🚚", desc: "O estofado será recolhido e devolvido após lavagem." },
];

const WEEKDAY_TIMES = ["08:00","09:30","11:00","14:00","15:30","17:00"];
const WEEKEND_TIMES = ["08:00","09:30","11:00"];

function getAvailableTimes(dateStr, booked = []) {
  if (!dateStr) return [];
  const day = new Date(dateStr + "T00:00:00").getDay();
  const base = (day === 0 || day === 6) ? WEEKEND_TIMES : WEEKDAY_TIMES;
  return base.filter(t => !booked.includes(`${dateStr}_${t}`));
}

function isValidPhone(ph) { return /^\d{10,11}$/.test(ph.replace(/\D/g,"")); }
function isValidEmail(em) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em); }

// ── Estilos e Constantes de Design ───────────────────────────────────────────
const pageBg  = { background: "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(200,20,20,0.18), transparent 55%), #09090b" };
const inputCls = "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors w-full";
const cardCls  = "bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6";
const btnRed   = "bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer";
const btnGhost = "bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-sm transition-colors cursor-pointer";

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
    navigator.clipboard.writeText("(85) 98788-0298");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose}/>
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">Falar Conosco</h3>
        <p className="text-zinc-400 text-sm mb-4">Escolha como entrar em contato:</p>
        <div className="flex flex-col gap-3">
          <a href="https://wa.me/5585987880298" target="_blank" rel="noreferrer"
            className="flex items-center gap-3 bg-green-700 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors text-center justify-center">
            💬 WhatsApp — (85) 98788-0298
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

function LogoWithText({ compact=false }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className={`rounded-xl bg-red-600 flex items-center justify-center text-white font-black font-mono shadow-md shadow-red-900/40 ${compact ? 'w-9 h-9 text-lg' : 'w-12 h-12 text-2xl'}`}>
        L2
      </div>
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
      {[1,2,3,4].map(n=>(
        <span key={n} className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${current>=n?"bg-red-600 text-white":"bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
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
      <ContactModal open={contactOpen} onClose={()=>setContactOpen(false)}/>
      {open && <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose}/>}
      <div className={`fixed top-0 left-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 ${open?"translate-x-0":"-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <LogoWithText compact/>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl cursor-pointer">✕</button>
        </div>
        <button onClick={()=>{ onGoToAuth(); onClose(); }}
          className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left w-full cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
            {initial}
          </div>
          <div>
            <p className="text-xs text-zinc-500 m-0">— Minha conta</p>
            <p className="text-sm font-semibold text-white truncate max-w-[160px] m-0">{user?.full_name||"Visitante"}</p>
          </div>
        </button>
        <button onClick={()=>{ onGoToBookingCheck(); onClose(); }}
          className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left w-full cursor-pointer">
          <span className="text-xl">📋</span>
          <p className="text-sm font-semibold text-white m-0">Conferir agendamento</p>
        </button>
        <button onClick={()=>setContactOpen(true)}
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
          {[0,1,2].map(i=><span key={i} className="block w-5 h-0.5 bg-zinc-300"/>)}
        </button>
        <LogoWithText compact/>
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
      <LogoWithText compact/>
      <p className="text-zinc-600 text-xs m-0">© {new Date().getFullYear()} L2 - Lavagem a Seco.</p>
    </footer>
  );
}

export default function App() {
  const [user,         setUser]         = useState(null);
  const [bookedSlots,  setBookedSlots]  = useState([]);
  const [activeBooking,setActiveBooking]= useState(null);
  const [page,         setPage]         = useState("auth");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [draft,        setDraft]        = useState(null);
  const [adminNotif,   setAdminNotif]   = useState(null);

  const handleLogout      = useCallback(()=>{ setUser(null); setPage("auth"); },[]);
  const handleAuthSuccess = useCallback(u=>{ setUser(u); setPage("home"); },[]);

  useEffect(()=>{
    if (!activeBooking?.id) return;
    const poll = setInterval(async ()=>{
      try {
        const all = await loadAllBookings();
        const updated = all.find(b=>b.id===activeBooking.id);
        if (!updated) return;
        if (updated.status!==activeBooking.status||updated.date!==activeBooking.date||updated.time!==activeBooking.time) {
          setActiveBooking(updated);
        }
        const notifs = await getMyNotifications(activeBooking.id);
        if (notifs.length>0) {
          setAdminNotif(notifs[0].msg);
          await markNotifsSeen(activeBooking.id);
        }
      } catch {}
    }, 10000);
    return ()=>clearInterval(poll);
  },[activeBooking]);

  const handleGoToBookingCheck = useCallback(()=>{
    if (activeBooking && new Date(activeBooking.date+"T23:59:59")>=new Date()) setPage("myBooking");
    else setPage("noBooking");
  },[activeBooking]);

  const handleConfirm = useCallback(async (booking, slot)=>{
    try {
      const all = await loadAllBookings();
      const newBooking = {
        ...booking,
        id: `bk_${Date.now()}`,
        client_name:  user?.full_name||"Cliente",
        client_email: user?.email||"",
        client_phone: user?.phone||"",
        status: "agendado",
        created_at: new Date().toISOString(),
      };
      await saveAllBookings([...all, newBooking]);
      setBookedSlots(p=>[...p,slot]);
      setActiveBooking(newBooking);
    } catch {
      setActiveBooking({ ...booking, status:"agendado" });
    }
    setDraft(null);
    setPage("confirmation");
  },[user]);

  return (
    <div style={pageBg} className="min-h-screen text-zinc-100 flex flex-col justify-between">
      <div>
        {adminNotif && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-center"
            onClick={()=>setAdminNotif(null)}>
            🔔 {adminNotif}
          </div>
        )}
        <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} user={user}
          onGoToAuth={()=>{ setPage("auth"); setSidebarOpen(false); }}
          onGoToBookingCheck={()=>{ handleGoToBookingCheck(); setSidebarOpen(false); }}/>

        {page==="auth"         && <AuthPage onSuccess={handleAuthSuccess} currentUser={user}/>}
        {page==="home"         && <HomePage user={user} onLogout={handleLogout} onMenuOpen={()=>setSidebarOpen(true)} onStart={()=>{ setDraft(null); setPage("booking"); }}/>}
        {page==="booking"      && <BookingPage user={user} onLogout={handleLogout} onMenuOpen={()=>setSidebarOpen(true)} bookedSlots={bookedSlots} onConfirm={handleConfirm} draft={draft}/>}
        {(page==="confirmation"||page==="myBooking") && <ConfirmationPage booking={activeBooking} user={user} onLogout={handleLogout} onMenuOpen={()=>setSidebarOpen(true)} onRestart={()=>setPage("home")} onCancel={()=>setPage("home")}/>}
        {page==="noBooking"    && <NoBookingPage user={user} onLogout={handleLogout} onMenuOpen={()=>setSidebarOpen(true)} onBack={()=>setPage("home")}/>}
      </div>
    </div>
  );
}

function AuthPage({ onSuccess, currentUser }) {
  const [mode,  setMode]  = useState("register");
  const [reg,   setReg]   = useState({ full_name:"", phone:"", email:"", password:"", confirm:"" });
  const [log,   setLog]   = useState({ email:currentUser?.email||"", password:currentUser?.password||"" });
  const [error, setError] = useState("");

  const upd  = k=>e=>setReg(p=>({...p,[k]:e.target.value}));
  const updL = k=>e=>setLog(p=>({...p,[k]:e.target.value}));

  // Puxa do localStorage em vez de sumir ao recarregar a página
  const getUsersFromStorage = () => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  };

  function doRegister() {
    setError("");
    if (!reg.full_name.trim())        { setError("Preencha o nome completo."); return; }
    if (!isValidPhone(reg.phone))     { setError("Telefone inválido."); return; }
    if (!isValidEmail(reg.email))     { setError("E-mail inválido."); return; }
    
    const currentUsers = getUsersFromStorage();
    if (currentUsers.find(u=>u.email===reg.email)) { setError("E-mail já cadastrado."); return; }
    if (!reg.password)                { setError("Preencha a senha."); return; }
    if (reg.password!==reg.confirm)   { setError("As senhas não coincidem."); return; }
    
    const nu = { full_name:reg.full_name, phone:reg.phone, email:reg.email, password:reg.password };
    localStorage.setItem(USERS_KEY, JSON.stringify([...currentUsers, nu]));
    onSuccess(nu);
  }

  function doLogin() {
    setError("");
    if (!log.email)    { setError("Preencha o e-mail."); return; }
    if (!log.password) { setError("Preencha a senha."); return; }
    
    const currentUsers = getUsersFromStorage();
    const found = currentUsers.find(u=>u.email===log.email);
    if (!found)                          { setError("E-mail não cadastrado."); return; }
    if (found.password!==log.password)   { setError("Senha incorreta."); return; }
    onSuccess(found);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-between gap-8 p-8 bg-black/30 border-b md:border-b-0 md:border-r border-zinc-800 text-left">
            <div className="space-y-5">
              <LogoWithText/>
              <h1 className="text-3xl font-extrabold text-white leading-tight">Agende sua lavagem de estofados em minutos.</h1>
              <p className="text-zinc-400 text-sm">Atendimento profissional com sistema simples.</p>
            </div>
          </div>
          <div className="p-8 text-left">
            <h2 className="text-xl font-bold text-white mb-5">{mode==="register"?"Criar conta":"Entrar na conta"}</h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button onClick={()=>{ setMode("register"); setError(""); }} className={`py-2 rounded-lg text-sm font-semibold ${mode==="register"?"bg-red-600 text-white":"bg-zinc-800 text-zinc-300"}`}>Cadastrar</button>
              <button onClick={()=>{ setMode("login"); setError(""); }} className={`py-2 rounded-lg text-sm font-semibold ${mode==="login"?"bg-red-600 text-white":"bg-zinc-800 text-zinc-300"}`}>Já tenho conta</button>
            </div>
            {mode==="register" ? (
              <div className="space-y-3">
                <input type="text" placeholder="Nome completo" value={reg.full_name} onChange={upd("full_name")} className={inputCls}/>
                <input type="tel" placeholder="Telefone" value={reg.phone} onChange={upd("phone")} className={inputCls}/>
                <input type="email" placeholder="Email" value={reg.email} onChange={upd("email")} className={inputCls}/>
                <input type="password" placeholder="Senha" value={reg.password} onChange={upd("password")} className={inputCls}/>
                <input type="password" placeholder="Confirmar senha" value={reg.confirm} onChange={upd("confirm")} className={inputCls}/>
                <ErrorMsg msg={error}/><button onClick={doRegister} className={`${btnRed} w-full py-3 mt-2`}>Cadastrar</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="email" placeholder="Email" value={log.email} onChange={updL("email")} className={inputCls}/>
                <input type="password" placeholder="Senha" value={log.password} onChange={updL("password")} className={inputCls}/>
                <ErrorMsg msg={error}/><button onClick={doLogin} className={`${btnRed} w-full py-3 mt-2`}>Entrar</button>
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
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen}/>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black font-mono text-4xl shadow-xl shadow-red-900/50 mb-6">L2</div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">Agende sua lavagem de estofados em minutos.</h1>
          <button onClick={onStart} className={`${btnRed} px-10 py-4 text-lg shadow-lg`}>Começar o agendamento →</button>
        </div><Footer/>
      </div>
    </div>
  );
}

function BookingPage({ user, onLogout, onMenuOpen, bookedSlots, onConfirm, draft }) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([{ upholstery:"", tipoSel:"", tipoCustom:"", m2:"" }]);
  const [service, setService] = useState("");
  const [loc, setLoc] = useState({ address:"", neighborhood:"", city:"", date:"", time:"" });
  const [error, setError] = useState("");

  const updLoc = k=>e=>setLoc(p=>({...p,[k]:e.target.value}));
  const availTimes = getAvailableTimes(loc.date, bookedSlots);

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full text-left">
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen}/>
        <StepChips current={step}/>
        {step===1 && (
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-white mb-4">1) Escolha o que deseja lavar:</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {UPHOLSTERY.map(u=>(
                <button key={u.value} onClick={()=>setItems([{upholstery:u.value, tipoSel:u.tipos?u.tipos[0]:"", tipoCustom:"", m2:""}])}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-sm font-bold transition-all ${items[0].upholstery===u.value?"border-red-500 bg-red-600/10 text-white":"border-zinc-800 bg-zinc-900/40 text-zinc-400"}`}>
                  <span className="text-2xl">{u.icon}</span>{u.value}
                </button>
              ))}
            </div>
            <button onClick={()=>items[0].upholstery?setStep(2):setError("Selecione um item.")} className={`${btnRed} px-6 py-2.5 mt-4`}>Continuar →</button>
            <ErrorMsg msg={error}/>
          </div>
        )}
        {step===2 && (
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-white mb-4">2) Tipo de atendimento:</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {SERVICES.map(s=>(
                <button key={s.value} onClick={()=>setService(s.value)} className={`p-6 rounded-2xl border text-left ${service===s.value?"border-red-500 bg-red-600/10":"border-zinc-800"}`}>
                  <span className="text-3xl block mb-2">{s.icon}</span><p className="text-white font-bold">{s.value}</p>
                </button>
              ))}
            </div>
            <button onClick={()=>service?setStep(3):setError("Escolha o serviço.")} className={`${btnRed} px-6 py-2.5 mt-6`}>Continuar →</button>
            <ErrorMsg msg={error}/>
          </div>
        )}
        {step===3 && (
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-white mb-4">3) Agendamento:</h2>
            <div className="space-y-3">
              <input placeholder="Endereço" value={loc.address} onChange={updLoc("address")} className={inputCls}/>
              <input placeholder="Bairro" value={loc.neighborhood} onChange={updLoc("neighborhood")} className={inputCls}/>
              <input placeholder="Cidade" value={loc.city} onChange={updLoc("city")} className={inputCls}/>
              <input type="date" value={loc.date} onChange={updLoc("date")} className={inputCls}/>
              <select value={loc.time} onChange={updLoc("time")} className={inputCls}>
                <option value="">Selecione o horário</option>
                {availTimes.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={()=>{
              if(!loc.address||!loc.date||!loc.time) { setError("Preencha todos os campos."); return; }
              onConfirm({ items:[{upholstery_type:items[0].upholstery, tipo:"Padrão"}], service_type:service, ...loc }, `${loc.date}_${loc.time}`);
            }} className={`${btnRed} px-6 py-2.5 mt-6`}>Finalizar Agendamento</button>
            <ErrorMsg msg={error}/>
          </div>
        )}<Footer/>
      </div>
    </div>
  );
}

function ConfirmationPage({ booking, user, onLogout, onMenuOpen, onRestart }) {
  return (
    <div className="min-h-screen px-4 py-6 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full text-left">
        <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen}/>
        <div className={cardCls}>
          <h2 className="text-2xl font-extrabold text-green-400 mb-4">✅ Agendamento Confirmado!</h2>
          <div className="bg-zinc-800/60 p-4 rounded-xl space-y-2 text-sm mb-6">
            <p className="text-white"><strong>Item:</strong> {booking?.items?.[0]?.upholstery_type}</p>
            <p className="text-white"><strong>Atendimento:</strong> {booking?.service_type}</p>
            <p className="text-white"><strong>Local:</strong> {booking?.address}, {booking?.neighborhood}</p>
            <p className="text-white"><strong>Horário:</strong> {booking?.date} às {booking?.time}</p>
          </div>
          <button onClick={onRestart} className={`${btnGhost} px-6 py-3`}>Voltar ao Início</button>
        </div><Footer/>
      </div>
    </div>
  );
}

function NoBookingPage({ user, onLogout, onMenuOpen, onBack }) {
  return (
    <div className="min-h-screen px-4 py-6"><div className="max-w-5xl mx-auto">
      <Header user={user} onLogout={onLogout} onMenuOpen={onMenuOpen}/>
      <div className={`${cardCls} max-w-md mx-auto text-center mt-10`}>
        <p className="text-white font-bold mb-4">Nenhum agendamento ativo.</p>
        <button onClick={onBack} className={`${btnRed} px-6 py-2`}>Voltar</button>
      </div>
    </div></div>
  );
                }
