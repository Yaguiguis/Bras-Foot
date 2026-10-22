# BRAS FOOT

Manager de futebol para navegador, com partidas simuladas por botão. Interface em branco, verde escuro e preto.

## Desenvolvimento
1. Instale Node.js 20+.
2. Copie `.env.example` para `.env.local`.
3. Preencha a URL e a chave publicável do Supabase.
4. Execute `npm install` e `npm run dev`.

## Publicar na Vercel
Importe este repositório e configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Nunca use uma chave service_role em variáveis `NEXT_PUBLIC_*`.

A aplicação possui modo de demonstração quando as variáveis Supabase não estão configuradas; ações de persistência exigem conexão real.
