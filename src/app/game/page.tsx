"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowRight, Banknote, Bell, CalendarDays, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Clock3, Goal, Home, LogOut, Menu, Newspaper,
  Search, Settings, Shield, Shirt, SlidersHorizontal, Sparkles, Star, Target, Trophy, Users, Wallet, X,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { money } from "@/lib/format";

type Club = { id:number; name:string; short_name:string|null; logo_url:string|null; finances:number; transfer_budget:number; reputation:number };
type Career = { id:string; name:string; manager_name:string; season_year:number; game_date:string; current_club_id:number|null; balance:number; confidence:number; user_id:string };
type Section = "Início"|"Elenco"|"Tática"|"Calendário"|"Competições"|"Transferências"|"Finanças"|"Clube"|"Carreira"|"Notícias"|"Configurações";

const sections: { name:Section; icon:typeof Home; group:string }[] = [
 {name:"Início",icon:Home,group:"JOGO"},
 {name:"Elenco",icon:Shirt,group:"GERENCIAMENTO"},
 {name:"Tática",icon:SlidersHorizontal,group:"GERENCIAMENTO"},
 {name:"Calendário",icon:CalendarDays,group:"COMPETIÇÕES"},
 {name:"Competições",icon:Trophy,group:"COMPETIÇÕES"},
 {name:"Transferências",icon:ArrowLeftRight,group:"MERCADO"},
 {name:"Finanças",icon:Wallet,group:"CLUBE"},
 {name:"Clube",icon:Shield,group:"CLUBE"},
 {name:"Carreira",icon:Star,group:"CLUBE"},
 {name:"Notícias",icon:Newspaper,group:"JOGO"},
 {name:"Configurações",icon:Settings,group:"SISTEMA"},
];
const mockClubs = [
 {name:"Flamengo",country:"Brasil",league:"Série A",strength:84,budget:92000000,initials:"FLA"},
 {name:"Palmeiras",country:"Brasil",league:"Série A",strength:83,budget:78000000,initials:"PAL"},
 {name:"Santos",country:"Brasil",league:"Série A",strength:75,budget:26000000,initials:"SAN"},
 {name:"Corinthians",country:"Brasil",league:"Série A",strength:77,budget:21000000,initials:"COR"},
 {name:"São Paulo",country:"Brasil",league:"Série A",strength:79,budget:34000000,initials:"SAO"},
 {name:"Grêmio",country:"Brasil",league:"Série A",strength:78,budget:30000000,initials:"GRE"},
 {name:"Atlético-MG",country:"Brasil",league:"Série A",strength:80,budget:41000000,initials:"CAM"},
 {name:"Botafogo",country:"Brasil",league:"Série A",strength:81,budget:50000000,initials:"BOT"},
 {name:"Fluminense",country:"Brasil",league:"Série A",strength:78,budget:29000000,initials:"FLU"},
 {name:"Internacional",country:"Brasil",league:"Série A",strength:77,budget:25000000,initials:"INT"},
 {name:"Cruzeiro",country:"Brasil",league:"Série A",strength:78,budget:33000000,initials:"CRU"},
 {name:"Athletico-PR",country:"Brasil",league:"Série A",strength:77,budget:32000000,initials:"CAP"},
];
type Player = { id:number; name:string; position:string; overall:number; potential:number|null; value:number; shirt_number:number|null; base_club_id:number|null };
type Match = { match_id:string; match_date:string; home_club:string; away_club:string; home_club_id:number; away_club_id:number; competition_name:string; match_status:string };
const fallbackSquad: Player[] = [
 {id:1,name:"Goleiro",position:"GOL",overall:68,potential:75,value:1200000,shirt_number:1,base_club_id:null},
 {id:2,name:"Defensor",position:"ZAG",overall:70,potential:77,value:2200000,shirt_number:3,base_club_id:null},
 {id:3,name:"Meio-campista",position:"MEI",overall:72,potential:80,value:3500000,shirt_number:8,base_club_id:null},
 {id:4,name:"Atacante",position:"ATA",overall:74,potential:82,value:5000000,shirt_number:9,base_club_id:null},
];

export default function GamePage() {
 const router=useRouter();
 const [userEmail,setUserEmail]=useState("");
 const [section,setSection]=useState<Section>("Início");
 const [mobileNav,setMobileNav]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [clubs,setClubs]=useState<Club[]>([]);
 const [clubSearch,setClubSearch]=useState("");
 const [clubPick,setClubPick]=useState<Club|null>(null);
 const [careers,setCareers]=useState<Career[]>([]);
 const [career,setCareer]=useState<Career|null>(null);
 const [players,setPlayers]=useState<Player[]>([]);
 const [matches,setMatches]=useState<Match[]>([]);
 const [standings,setStandings]=useState<any[]>([]);
 const [news,setNews]=useState<any[]>([]);
 const [transferOffers,setTransferOffers]=useState<any[]>([]);
 const [selectedCompetition,setSelectedCompetition]=useState<number|null>(null);
 const [competitions,setCompetitions]=useState<any[]>([]);
 const [tactic,setTactic]=useState({formation:"4-3-3",style:"Equilibrado",tempo:55,pressing:55,defensive_line:55});
 const [lineup,setLineup]=useState<number[]>([]);
 const [shirtEdit,setShirtEdit]=useState<{id:number;number:string}|null>(null);

 const supabase=getSupabase();
 const activeClub=useMemo(()=>career ? clubs.find(c=>c.id===career.current_club_id)??null : null,[career,clubs]);
 const upcoming=matches.filter(m=>m.match_status!=="finished").slice(0,4);

 useEffect(()=>{ let alive=true; async function init(){
   if(!supabase){setLoading(false);setError("Configure o Supabase para usar dados salvos. O modo demonstração não grava carreiras.");return;}
   const {data:{session}}=await supabase.auth.getSession();
   if(!session){router.replace("/");return;}
   if(alive)setUserEmail(session.user.email??"");
   const {data: c, error: ce}=await supabase.from("clubs").select("id,name,short_name,logo_url,finances,transfer_budget,reputation").eq("active",true).order("name").limit(2000);
   if(ce)setError("Não foi possível carregar clubes: "+ce.message); else if(alive)setClubs((c??[]) as Club[]);
   const {data: cs,error: careersError}=await supabase.from("careers").select("*").eq("user_id",session.user.id).order("updated_at",{ascending:false});
   if(careersError)setError(careersError.message); else if(alive)setCareers((cs??[]) as Career[]);
   if(alive)setLoading(false);
 } init();return()=>{alive=false};},[router,supabase]);

 async function reloadCareer(id:string){
  if(!supabase)return;
  const {data,error:err}=await supabase.from("careers").select("*").eq("id",id).single();
  if(err)throw err;
  const active=data as Career;setCareer(active);
  const clubId=active.current_club_id;
  if(!clubId)return;
  const [{data:ps,error:pe},{data:ms,error:me},{data:ns},{data:os},{data:cs}]=await Promise.all([
   supabase.from("career_players").select("player_id,club_id,overall,potential,shirt_number,squad_status,players(id,name,position,potential,value,shirt_number,base_club_id)").eq("career_id",id).eq("club_id",clubId),
   supabase.rpc("get_career_upcoming_matches",{p_career_id:id,p_limit:30}),
   supabase.from("news").select("*").eq("career_id",id).order("published_at",{ascending:false}).limit(20),
   supabase.rpc("get_career_market",{p_career_id:id}),
   supabase.from("competitions").select("*").eq("active",true).order("name").limit(500)
  ]);
  if(pe)throw pe;if(me)throw me;
  const flat=(ps??[]).map((row:any)=>({id:row.player_id,name:row.players?.name??"Jogador",position:row.players?.position??"MEI",overall:row.overall,potential:row.potential??row.players?.potential,value:row.players?.value??0,shirt_number:row.shirt_number,base_club_id:row.players?.base_club_id}));
  setPlayers(flat);setMatches((ms??[]) as Match[]);setNews(ns??[]);setTransferOffers(os??[]);setCompetitions(cs??[]);
  const {data:t}=await supabase.from("tactics").select("*").eq("career_id",id).eq("club_id",clubId).maybeSingle();
  if(t)setTactic({formation:t.formation,style:t.style,tempo:t.tempo,pressing:t.pressing,defensive_line:t.defensive_line});
  setLineup(flat.filter((p:any)=>p.squad_status==="titular").map((p:any)=>p.id));
 }
 async function startCareer(club:Club){
  if(!supabase)return;setBusy(true);setError("");
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error("Entre novamente.");
   const {data,error:err}=await supabase.rpc("create_career",{p_club_id:club.id,p_manager_name:"Treinador",p_name:"Minha carreira",p_nationality_country_id:1,p_season_year:2026});
   if(err)throw err;
   const id=typeof data==="string"?data:(data as any)?.id;if(!id)throw new Error("A carreira não retornou um identificador.");
   await reloadCareer(id);setSection("Início");setNotice("Carreira criada com sucesso.");
   const {data:cs}=await supabase.from("careers").select("*").eq("user_id",session.user.id).order("updated_at",{ascending:false});setCareers((cs??[]) as Career[]);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível criar a carreira.");}
  finally{setBusy(false);}
 }
 async function runMatch(matchId?:string){
  if(!supabase||!career)return;setBusy(true);setError("");setNotice("");
  try{
   let target=matchId;
   if(!target){const next=matches.find(m=>m.match_status!=="finished");target=next?.match_id;}
   if(!target)throw new Error("Não há partida pendente no calendário.");
   const {error:simErr}=await supabase.rpc("simulate_match",{p_match_id:target});if(simErr)throw simErr;
   const {error:finishErr}=await supabase.rpc("finish_match_and_update_table",{p_match_id:target});if(finishErr)throw finishErr;
   await reloadCareer(career.id);setNotice("Partida simulada e resultado salvo.");
  }catch(e){setError(e instanceof Error?e.message:"Falha ao simular a partida.");}
  finally{setBusy(false);}
 }
 async function advanceDay(){
  if(!supabase||!career)return;setBusy(true);setError("");
  try{const {error:err}=await supabase.rpc("advance_career_day",{p_career_id:career.id,p_days:1});if(err)throw err;await reloadCareer(career.id);setNotice("Calendário avançou um dia.");}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível avançar o calendário.");}finally{setBusy(false);}
 }
 async function saveTactic(){
  if(!supabase||!career||!activeClub)return;setBusy(true);setError("");
  try{const {error:err}=await supabase.rpc("set_career_tactic",{p_career_id:career.id,p_formation:tactic.formation,p_style:tactic.style,p_tempo:tactic.tempo,p_pressing:tactic.pressing,p_defensive_line:tactic.defensive_line});if(err)throw err;setNotice("Tática salva.");}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar a tática.");}finally{setBusy(false);}
 }
 async function changeShirt(playerId:number,num:string){
  if(!supabase||!career)return;const n=Number(num);if(!Number.isInteger(n)||n<1||n>99){setError("Escolha um número entre 1 e 99.");return;}setBusy(true);setError("");
  try{const {error:err}=await supabase.rpc("set_career_shirt_number",{p_career_id:career.id,p_player_id:playerId,p_shirt_number:n});if(err)throw err;await reloadCareer(career.id);setShirtEdit(null);setNotice("Número atualizado.");}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível alterar a camisa.");}finally{setBusy(false);}
 }
 async function signOut(){if(supabase)await supabase.auth.signOut();router.replace("/");}

 if(loading)return <div className="loading-screen"><span className="loader-mark">BF</span><p>Preparando o seu clube...</p></div>;
 const nav=<>{["JOGO","GERENCIAMENTO","COMPETIÇÕES","MERCADO","CLUBE","SISTEMA"].map(group=><div className="nav-group" key={group}><small>{group}</small>{sections.filter(s=>s.group===group).map(s=>{const Icon=s.icon;return <button key={s.name} onClick={()=>{setSection(s.name);setMobileNav(false);}} className={"nav-link "+(section===s.name?"selected":"")}><Icon size={17}/><span>{s.name}</span>{s.name==="Transferências"&&transferOffers.length>0&&<i>{transferOffers.length}</i>}</button>})}</div>)}</>;

 return <div className="game-shell">
  <aside className={"sidebar "+(mobileNav?"mobile-open":"")}><a className="wordmark game-wordmark" href="/game"><span className="brand-ball">B</span><span>BRAS <b>FOOT</b></span></a><div className="nav-scroll">{nav}</div><div className="sidebar-bottom"><div className="user-mini"><div className="avatar">BF</div><div><strong>Treinador</strong><small>{userEmail||"Minha carreira"}</small></div></div><button className="nav-link" onClick={signOut}><LogOut size={17}/><span>Sair da conta</span></button></div></aside>
  {mobileNav&&<button className="scrim" onClick={()=>setMobileNav(false)} aria-label="Fechar menu"/>}
  <main className="game-main">
   <header className="game-topbar"><button className="icon-button mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Menu"><Menu size={20}/></button><div className="breadcrumbs">BRAS FOOT <span>/</span> {career?.name??"Nova carreira"}</div><div className="top-actions"><span className="season-chip">TEMPORADA {career?.season_year??"2026/27"}</span><button className="icon-button" title="Notícias" onClick={()=>setSection("Notícias")}><Bell size={18}/>{news.length>0&&<i/>}</button></div></header>
   <div className="page-content">
    {error&&<div className="banner-error"><X size={18}/><span>{error}</span><button onClick={()=>setError("")}><X size={15}/></button></div>}
    {notice&&<div className="banner-success"><Check size={18}/><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    {!supabase&&<div className="empty-state"><Shield size={32}/><h3>Conecte o banco para começar</h3><p>Configure as variáveis do Supabase na Vercel para salvar sua conta e suas carreiras.</p></div>}
    {!career&&supabase&&<section className="choose-career">
      <div className="section-heading"><div><span className="eyebrow">SUA HISTÓRIA COMEÇA AGORA</span><h1>Escolha seu próximo desafio.</h1><p>Selecione um clube e assuma o comando.</p></div></div>
      <div className="career-columns"><div className="career-list-card"><div className="card-heading"><div><h3>Suas carreiras</h3><p>Continue de onde parou ou comece uma nova.</p></div><span className="count-pill">{careers.length}</span></div>
        {careers.length===0?<div className="blank-slate"><Trophy size={25}/><strong>Nenhuma carreira por aqui</strong><p>Escolha um clube ao lado para começar sua história.</p></div>:careers.map(c=><button className="career-row" key={c.id} onClick={()=>reloadCareer(c.id).catch(e=>setError(e.message))}><span className="club-badge">BF</span><span><b>{c.name}</b><small>{new Date(c.game_date+"T12:00:00").toLocaleDateString("pt-BR")} · Temporada {c.season_year}/27</small></span><ArrowRight size={16}/></button>)}
      </div><div className="club-pick-card"><div className="card-heading"><div><h3>Escolher clube</h3><p>Qual será o seu primeiro passo?</p></div></div><div className="search-box"><Search size={16}/><input value={clubSearch} onChange={e=>setClubSearch(e.target.value)} placeholder="Buscar clube..."/></div>
        <div className="club-pick-list">{clubs.filter(c=>c.name.toLowerCase().includes(clubSearch.toLowerCase())).slice(0,24).map(c=><button key={c.id} className={"club-pick-row "+(clubPick?.id===c.id?"picked":"")} onClick={()=>setClubPick(c)}><span className="club-badge">{c.short_name?.slice(0,3)||c.name.slice(0,3)}</span><span><b>{c.name}</b><small>{money(c.transfer_budget)} para transferências</small></span>{clubPick?.id===c.id?<Check size={17}/>:<ChevronRight size={17}/>}</button>)}</div>
        <button className="primary-btn full" disabled={!clubPick||busy} onClick={()=>clubPick&&startCareer(clubPick)}>{busy?"Criando carreira...":"Assumir o clube"} <ArrowRight size={17}/></button>
      </div></div>
    </section>}
    {career&&activeClub&&<><div className="welcome-row"><div><span className="eyebrow">PAINEL DO TREINADOR</span><h1>{activeClub.name}</h1><p>Gerencie seu clube, planeje a próxima partida e construa sua história.</p></div><button className="secondary-btn" onClick={()=>{setCareer(null);setSection("Início");}}>Trocar carreira <ChevronDown size={15}/></button></div>
    {section==="Início"&&<><div className="metric-grid"><div className="metric-card"><span>CAIXA DO CLUBE</span><strong>{money(career.balance)}</strong><small><CircleDollarSign size={14}/> Finanças do clube</small></div><div className="metric-card"><span>ORÇAMENTO DE TRANSFERÊNCIAS</span><strong>{money(activeClub.transfer_budget)}</strong><small><ArrowDownLeft size={14}/> Disponível para reforços</small></div><div className="metric-card"><span>CONFIANÇA DA DIRETORIA</span><strong>{career.confidence}%</strong><div className="progress"><i style={{width:career.confidence+"%"}}/></div></div><div className="metric-card"><span>REPUTAÇÃO</span><strong>{activeClub.reputation}/100</strong><small><Star size={14}/> Prestígio do clube</small></div></div>
     <div className="home-grid"><section className="panel next-match-panel"><div className="panel-top"><div><span className="eyebrow">AGENDA DO CLUBE</span><h2>Próximo compromisso</h2></div><CalendarDays size={20}/></div>
      {upcoming[0]?<><div className="match-meta">{upcoming[0].competition_name||"Competição"} <span>•</span> {new Date(upcoming[0].match_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long"})}</div><div className="match-versus"><div><span className="large-crest">{upcoming[0].home_club.slice(0,3).toUpperCase()}</span><b>{upcoming[0].home_club}</b><small>MANDANTE</small></div><strong>VS</strong><div><span className="large-crest">{upcoming[0].away_club.slice(0,3).toUpperCase()}</span><b>{upcoming[0].away_club}</b><small>VISITANTE</small></div></div><button className="primary-btn full" disabled={busy} onClick={()=>runMatch(upcoming[0].match_id)}>{busy?"Simulando...":"SIMULAR PARTIDA"} <ArrowRight size={17}/></button></>:<div className="blank-slate compact"><CalendarDays size={24}/><strong>Calendário ainda não gerado</strong><p>Quando houver partidas registradas, elas aparecerão aqui.</p></div>}
     </section><section className="panel upcoming-panel"><div className="panel-top"><div><span className="eyebrow">CALENDÁRIO</span><h2>Próximos jogos</h2></div><button className="text-link" onClick={()=>setSection("Calendário")}>Ver todos <ArrowRight size={15}/></button></div>
      {upcoming.slice(0,3).map(m=><div className="fixture-row" key={m.match_id}><div><b>{m.home_club} <span>×</span> {m.away_club}</b><small>{m.competition_name}</small></div><time>{new Date(m.match_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</time></div>)}{upcoming.length===0&&<p className="muted">Nenhum jogo pendente.</p>}<button className="secondary-btn full" disabled={busy} onClick={advanceDay}>Avançar um dia <ArrowRight size={15}/></button>
     </section></div>
     <div className="lower-grid"><section className="panel"><div className="panel-top"><div><span className="eyebrow">NO RADAR</span><h2>Últimas notícias</h2></div><button className="text-link" onClick={()=>setSection("Notícias")}>Ver notícias <ArrowRight size={15}/></button></div>{news.slice(0,4).map(n=><div className="news-row" key={n.id}><span className="news-dot"/><div><small>{n.category}</small><b>{n.title}</b><p>{n.body}</p></div></div>)}{news.length===0&&<p className="muted">As notícias da sua carreira aparecerão aqui.</p>}</section><section className="panel quick-panel"><span className="eyebrow">ACESSO RÁPIDO</span><h2>O próximo passo é seu.</h2><div className="quick-grid">{[{name:"Organizar elenco",icon:Users,target:"Elenco" as Section},{name:"Montar tática",icon:Target,target:"Tática" as Section},{name:"Buscar reforços",icon:ArrowLeftRight,target:"Transferências" as Section},{name:"Ver competições",icon:Trophy,target:"Competições" as Section}].map(q=>{const I=q.icon;return <button key={q.name} onClick={()=>setSection(q.target)}><I size={18}/><span>{q.name}</span><ArrowRight size={14}/></button>})}</div></section></div>
    </>}
    {section==="Elenco"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">GERENCIAMENTO</span><h2>Elenco principal</h2><p>Edite os números e confira as informações dos jogadores.</p></div><span className="count-pill">{players.length} jogadores</span></div><div className="table-wrap"><table><thead><tr><th>Nº</th><th>Jogador</th><th>Posição</th><th>Força</th><th>Potencial</th><th>Valor</th><th>Ação</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td className="shirt-cell">{shirtEdit?.id===p.id?<input className="shirt-input" type="number" min="1" max="99" value={shirtEdit.number} onChange={e=>setShirtEdit({id:p.id,number:e.target.value})}/>:<b>{p.shirt_number??"—"}</b>}</td><td><b>{p.name}</b></td><td><span className="position-chip">{p.position}</span></td><td><b>{p.overall}</b></td><td>{p.potential??"—"}</td><td>{money(p.value)}</td><td>{shirtEdit?.id===p.id?<><button className="small-btn" onClick={()=>changeShirt(p.id,shirtEdit.number)}>Salvar</button><button className="small-btn quiet" onClick={()=>setShirtEdit(null)}>Cancelar</button></>:<button className="small-btn" onClick={()=>setShirtEdit({id:p.id,number:String(p.shirt_number??"")})}>Editar camisa</button>}</td></tr>)}</tbody></table>{players.length===0&&<div className="blank-slate"><Users size={25}/><strong>Elenco não cadastrado</strong><p>Os jogadores aparecerão aqui quando o banco de dados for populado.</p></div>}</div></section>}
    {section==="Tática"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">PREPARAÇÃO</span><h2>Plano de jogo</h2><p>Configure como seu time deve atuar na próxima partida.</p></div><Target size={22}/></div><div className="tactic-layout"><div className="pitch"><div className="pitch-lines"><span/><span/><div className="center-circle"/></div>{["ATA","PE","PD","MEI","MC","MC","LE","ZAG","ZAG","LD","GOL"].map((p,i)=><div key={i} className={"player-token token-"+i}><b>{p}</b><small>{i+1}</small></div>)}</div><div className="tactic-controls"><label>Formação<select value={tactic.formation} onChange={e=>setTactic({...tactic,formation:e.target.value})}>{["4-3-3","4-4-2","4-2-3-1","3-5-2","3-4-3","5-3-2"].map(x=><option key={x}>{x}</option>)}</select></label><label>Estilo de jogo<select value={tactic.style} onChange={e=>setTactic({...tactic,style:e.target.value})}>{["Equilibrado","Posse de bola","Contra-ataque","Pressão alta","Bola longa"].map(x=><option key={x}>{x}</option>)}</select></label>{[{key:"tempo" as const,label:"Ritmo",value:tactic.tempo},{key:"pressing" as const,label:"Pressão",value:tactic.pressing},{key:"defensive_line" as const,label:"Linha defensiva",value:tactic.defensive_line}].map(t=><label className="range-label" key={t.key}><span>{t.label}<b>{t.value}/100</b></span><input type="range" min="0" max="100" value={t.value} onChange={e=>setTactic({...tactic,[t.key]:Number(e.target.value)})}/></label>)}<button className="primary-btn full" disabled={busy} onClick={saveTactic}>Salvar tática <Check size={16}/></button></div></div></section>}
    {section==="Calendário"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">TEMPORADA {career.season_year}/27</span><h2>Calendário de jogos</h2><p>Simule cada partida ou avance os dias da temporada.</p></div><button className="secondary-btn" disabled={busy} onClick={advanceDay}>Avançar dia <ArrowRight size={15}/></button></div>{matches.length===0?<div className="blank-slate"><CalendarDays size={25}/><strong>Nenhum compromisso encontrado</strong><p>O calendário será exibido quando a competição tiver jogos gerados.</p></div>:matches.map(m=><div className="calendar-row" key={m.match_id}><time>{new Date(m.match_date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</time><div><b>{m.home_club} <span>×</span> {m.away_club}</b><small>{m.competition_name||"Competição"}</small></div>{m.match_status==="finished"?<span className="done-chip">Finalizada</span>:<button className="small-btn" disabled={busy} onClick={()=>runMatch(m.match_id)}>Simular</button>}</div>)}</section>}
    {section==="Competições"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">MUNDO DO FUTEBOL</span><h2>Competições</h2><p>Consulte as ligas e torneios disponíveis.</p></div><Trophy size={22}/></div><div className="competition-grid">{competitions.map(c=><button className={"competition-card "+(selectedCompetition===c.id?"chosen":"")} key={c.id} onClick={()=>setSelectedCompetition(c.id)}><span className="competition-icon"><Trophy size={19}/></span><span><b>{c.name}</b><small>{c.region||c.confederation||"Nacional"} · {c.competition_type}</small></span><ChevronRight size={16}/></button>)}</div>{competitions.length===0&&<div className="blank-slate"><Trophy size={25}/><strong>Competições ainda indisponíveis</strong><p>Cadastre as competições no banco para listá-las aqui.</p></div>}{selectedCompetition&&<p className="inline-info">Competição selecionada. A classificação aparecerá quando houver temporada e participantes vinculados.</p>}</section>}
    {section==="Transferências"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">MERCADO DA BOLA</span><h2>Negociações</h2><p>Analise ofertas, faça contrapropostas e acompanhe o mercado.</p></div><ArrowLeftRight size={22}/></div>{transferOffers.length===0?<div className="blank-slate"><ArrowLeftRight size={25}/><strong>Nenhuma proposta recebida</strong><p>Novas propostas aparecerão aqui conforme o mercado movimentar a carreira.</p></div>:transferOffers.map((o:any)=><div className="offer-row" key={o.offer_id}><div className="club-badge">{String(o.buying_club).slice(0,3).toUpperCase()}</div><div className="offer-details"><b>{o.player_name}</b><small>Proposta de {o.buying_club} · {o.offer_status}</small></div><strong>{money(o.amount)}</strong><span className="position-chip">{o.future_sale_percent}% futura venda</span><button className="small-btn" onClick={()=>setNotice("Abra a negociação no detalhe para enviar uma contraproposta.")}>Detalhes</button></div>)}</section>}
    {section==="Finanças"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">GESTÃO DO CLUBE</span><h2>Finanças</h2><p>Acompanhe o caixa e os recursos para montar seu elenco.</p></div><Wallet size={22}/></div><div className="metric-grid finance-metrics"><div className="metric-card"><span>SALDO ATUAL</span><strong>{money(career.balance)}</strong></div><div className="metric-card"><span>ORÇAMENTO DE TRANSFERÊNCIAS</span><strong>{money(activeClub.transfer_budget)}</strong></div><div className="metric-card"><span>FOLHA SALARIAL</span><strong>{money(activeClub.wage_budget)}</strong></div></div><div className="blank-slate compact"><Banknote size={25}/><strong>Movimentações financeiras</strong><p>Receitas, salários, premiações e transferências aparecerão aqui conforme forem registradas.</p></div></section>}
    {section==="Clube"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">ESTRUTURA</span><h2>{activeClub.name}</h2><p>Visão geral do clube e sua estrutura esportiva.</p></div><Shield size={22}/></div><div className="club-overview"><div className="club-big-mark">{activeClub.short_name?.slice(0,3)||activeClub.name.slice(0,3)}</div><div><h3>{activeClub.name}</h3><p>Reputação {activeClub.reputation}/100</p><div className="progress"><i style={{width:activeClub.reputation+"%"}}/></div></div></div><div className="facility-grid">{[{title:"Estádio",value:"Estrutura do clube",icon:Goal},{title:"Centro de treinamento",value:"Desenvolvimento",icon:Activity},{title:"Categorias de base",value:"Formação de jovens",icon:Users},{title:"Departamento médico",value:"Preparação física",icon:HeartIconPlaceholder}].map((f:any)=><div className="facility-card" key={f.title}><f.icon size={21}/><b>{f.title}</b><small>{f.value}</small><span>Dados em configuração</span></div>)}</div></section>}
    {section==="Carreira"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">SUA TRAJETÓRIA</span><h2>Carreira do treinador</h2><p>Seu histórico começa com a primeira decisão.</p></div><Star size={22}/></div><div className="manager-card"><span className="manager-avatar">BF</span><div><small>TREINADOR</small><h3>Treinador</h3><p>{activeClub.name} · Temporada {career.season_year}/27</p></div><div className="manager-rating"><b>{career.confidence}</b><small>CONFIANÇA</small></div></div><div className="history-empty"><Trophy size={28}/><h3>O legado está por escrever.</h3><p>Resultados e títulos serão registrados ao longo das temporadas.</p></div></section>}
    {section==="Notícias"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">CENTRAL DE INFORMAÇÕES</span><h2>Notícias do futebol</h2><p>Acompanhe os acontecimentos da sua carreira.</p></div><Newspaper size={22}/></div>{news.length===0?<div className="blank-slate"><Newspaper size={25}/><strong>Sem notícias por enquanto</strong><p>Resultados, mercado e acontecimentos gerarão notícias ao longo da carreira.</p></div>:news.map(n=><article className="article-row" key={n.id}><small>{n.category} · {new Date(n.published_at).toLocaleDateString("pt-BR")}</small><h3>{n.title}</h3><p>{n.body}</p></article>)}</section>}
    {section==="Configurações"&&<section className="panel page-panel"><div className="panel-top"><div><span className="eyebrow">PREFERÊNCIAS</span><h2>Configurações</h2><p>Gerencie sua sessão e os dados da sua carreira.</p></div><Settings size={22}/></div><div className="settings-row"><div><b>Conta conectada</b><p>{userEmail}</p></div><span className="connected-chip"><i/> Conectada</span></div><div className="settings-row"><div><b>Salvar progresso</b><p>As alterações são gravadas no Supabase.</p></div><Check size={18}/></div><div className="settings-row"><div><b>Encerrar sessão</b><p>Saia da conta com segurança.</p></div><button className="secondary-btn" onClick={signOut}>Sair <LogOut size={15}/></button></div></section>}
    </>}
   </div>
  </main>
 </div>;
}

function HeartIconPlaceholder(props:any){return <Activity {...props}/>}
