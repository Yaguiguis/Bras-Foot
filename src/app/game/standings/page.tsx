"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import "./standings.css";

export default function StandingsPage(){
 const router=useRouter(), supabase=getSupabase();
 const [rows,setRows]=useState<any[]>([]),[error,setError]=useState(""),[career,setCareer]=useState<any>(null);
 useEffect(()=>{async function load(){if(!supabase){setError("Supabase não configurado.");return}const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/");return}const {data:cs,error:ce}=await supabase.from("careers").select("*").eq("user_id",session.user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();if(ce||!cs){setError(ce?.message??"Crie uma carreira primeiro.");return}setCareer(cs);const {data:seasons,error:se}=await supabase.from("competition_seasons").select("id,competition_id,season_year,competitions(name)").eq("season_year",cs.season_year).limit(500);if(se){setError(se.message);return}const found:any[]=[];for(const s of seasons??[]){const {data,error:e}=await supabase.rpc("get_career_standings",{p_career_id:cs.id,p_competition_season_id:s.id});if(!e&&data?.length)found.push({competition:Array.isArray(s.competitions)?(s.competitions[0]?.name??"Competição"):(s.competitions?.name??"Competição"),rows:data})}setRows(found)}void load()},[router,supabase]);
 return <main className="standings-page"><a href="/game" className="secondary-btn"><ArrowLeft size={15}/> Voltar ao jogo</a><header><Trophy/><div><h1>Classificações</h1><p>Temporada {career?.season_year}/{career?career.season_year+1:"2027"}</p></div></header>{error&&<div className="alert">{error}</div>}{rows.length===0&&!error&&<div className="blank-slate"><Trophy/><strong>Nenhuma tabela disponível</strong><p>As classificações são exibidas quando houver temporadas e equipes participantes no banco.</p></div>}{rows.map((comp,i)=><section className="panel" key={i}><h2>{comp.competition}</h2><div className="table-wrap"><table><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead><tbody>{comp.rows.map((r:any,j:number)=><tr key={r.club_id}><td>{r.pos??j+1}</td><td>{r.club_name}</td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.goal_difference}</td><td><b>{r.points}</b></td></tr>)}</tbody></table></div></section>)}</main>
}
