import { useState, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Sidebar } from "./components/UI";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import NoBookingPage from "./pages/NoBookingPage";

export default function App() {
  const [user, setUser]               = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [page, setPage]               = useState("auth");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft]             = useState(null);

  // Carrega sessão salva no localStorage
  useEffect(() => {
    const saved = localStorage.getItem("l2_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); setPage("home"); } catch {}
    }
  }, []);

  // Carrega horários já ocupados do banco
  useEffect(() => {
    async function loadSlots() {
      const { data } = await supabase
        .from("agendamentos")
        .select("date, time")
        .eq("status", "ativo");
      if (data) setBookedSlots(data.map(a => `${a.date}_${a.time}`));
    }
    loadSlots();
  }, []);

  // Carrega agendamento ativo do usuário logado
  useEffect(() => {
    if (!user) return;
    async function loadBooking() {
      const { data } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("status", "ativo")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) setActiveBooking(data[0]);
    }
    loadBooking();
  }, [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("l2_user");
    setUser(null);
    setActiveBooking(null);
    setPage("auth");
  }, []);

  const handleAuthSuccess = useCallback((u) => {
    localStorage.setItem("l2_user", JSON.stringify(u));
    setUser(u);
    setPage("home");
  }, []);

  const handleGoToBookingCheck = useCallback(() => {
    if (activeBooking) setPage("myBooking");
    else setPage("noBooking");
  }, [activeBooking]);

  const handleConfirm = useCallback((booking, slot) => {
    setBookedSlots(p => [...p, slot]);
    setActiveBooking(booking);
    setDraft(null);
    setPage("confirmation");
  }, []);

  const handleEdit = useCallback(() => {
    setDraft(activeBooking);
    setPage("booking");
  }, [activeBooking]);

  const handleCancel = useCallback(async () => {
    if (activeBooking?.id) {
      await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", activeBooking.id);
      setBookedSlots(p => p.filter(s => s !== `${activeBooking.date}_${activeBooking.time}`));
    }
    setActiveBooking(null);
    setPage("home");
  }, [activeBooking]);

  const sidebarProps = {
    open: sidebarOpen,
    onClose: () => setSidebarOpen(false),
    user,
    onGoToAuth: () => { setPage("auth"); setSidebarOpen(false); },
    onGoToBookingCheck: () => { handleGoToBookingCheck(); setSidebarOpen(false); },
  };

  return (
    <div className="page-bg">
      <Sidebar {...sidebarProps} />

      {page === "auth" && (
        <AuthPage onSuccess={handleAuthSuccess} currentUser={user} />
      )}
      {page === "home" && (
        <HomePage user={user} onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)}
          onStart={() => { setDraft(null); setPage("booking"); }} />
      )}
      {page === "booking" && (
        <BookingPage user={user} onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)}
          bookedSlots={bookedSlots} onConfirm={handleConfirm}
          draft={draft} existingSlot={draft ? `${draft.date}_${draft.time}` : null} />
      )}
      {(page === "confirmation" || page === "myBooking") && (
        <ConfirmationPage booking={activeBooking} user={user}
          onLogout={handleLogout} onMenuOpen={() => setSidebarOpen(true)}
          onRestart={() => setPage("home")} onEdit={handleEdit} onCancel={handleCancel} />
      )}
      {page === "noBooking" && (
        <NoBookingPage user={user} onLogout={handleLogout}
          onMenuOpen={() => setSidebarOpen(true)} onBack={() => setPage("home")} />
      )}
    </div>
  );
        }
            
