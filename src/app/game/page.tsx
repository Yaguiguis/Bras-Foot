"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function GamePage(){
  const router=useRouter();
  const supabase=getSupabase();
  useEffect(()=>{
    let alive=true;
    async function check(){
      if(!supabase){router.replace("/");return;}
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){router.replace("/");return;}
      const {data,error}=await supabase.from("careers").select("id").eq("user_id",session.user.id).limit(1);
      if(!alive)return;
      if(error){console.error("Erro ao verificar carreira:",error);return;}
      if(!data?.length){router.replace("/game/new-career");return;}
      router.replace("/game/home");
    }
    void check();
    return()=>{alive=false};
  },[router,supabase]);
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:"Arial",background:"#f4f7f5"}}>Carregando BRAS FOOT...</main>;
}
