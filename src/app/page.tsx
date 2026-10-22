"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, Shield, CalendarDays, ChartNoAxesCombined, CircleUserRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/game");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("O Supabase ainda não está configurado. Adicione as variáveis de ambiente na Vercel.");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split("@")[0] } } });
        if (error) throw error;
        if (data.session) router.push("/game");
        else setError("Conta criada. Verifique a configuração Confirm email no Supabase Auth e tente entrar novamente.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/game");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <main className="landing">
    <nav className="topbar"><a className="wordmark" href="/"><span className="brand-ball">B</span><span>BRAS <b>FOOT</b></span></a><span className="top-note">FOOTBALL MANAGER</span></nav>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot" /> SEU CLUBE. SUAS DECISÕES.</div>
        <h1>O futebol<br/>é <em>seu.</em></h1>
        <p className="hero-text">Monte seu elenco, negocie cada contratação e construa uma história. Você decide tudo fora de campo. A partida? Um botão.</p>
        <div className="feature-row">
          <div><Shield size={18}/><span>Gestão completa</span></div>
          <div><CalendarDays size={18}/><span>Temporadas</span></div>
          <div><Trophy size={18}/><span>Conquiste títulos</span></div>
        </div>
        <div className="hero-stat"><div className="stat-icon"><ChartNoAxesCombined size={20}/></div><div><strong>Uma nova história a cada temporada</strong><small>Seu clube, suas escolhas, seu legado.</small></div></div>
      </div>
      <div className="auth-wrap"><div className="auth-card">
        <div className="auth-brand"><span className="mini-crest">BF</span><div><h2>Entre em campo.</h2><p>Seu próximo capítulo começa aqui.</p></div></div>
        <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");}}>Entrar</button><button className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setError("");}}>Criar conta</button></div>
        <form onSubmit={submit}>
          <label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/>
          <label htmlFor="password">Senha</label><input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/>
          {error && <div className="alert" role="alert">{error}</div>}
          <button className="primary-btn" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar no jogo" : "Criar conta"} <ArrowRight size={17}/></button>
        </form>
        <p className="secure-note"><CircleUserRound size={14}/> Sua carreira é salva na sua conta.</p>
      </div><div className="under-card">GRÁTIS PARA COMEÇAR <span>•</span> SUA CARREIRA TE ESPERA</div></div>
    </section>
    <footer className="landing-footer"><span>© BRAS FOOT</span><span>FEITO PARA QUEM VIVE FUTEBOL</span></footer>
  </main>;
}
