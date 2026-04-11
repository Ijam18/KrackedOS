import{o as s}from"./index-Cfw7r794.js";const t={GROQ:"groq",LOCAL:"ollama",OPENROUTER:"openrouter",FALLBACK:"enhanced-local"};function d(e=""){return String(e).trim().toLowerCase().replace(/^["'`]+|["'`]+$/g,"")}function u(){return{phase:"hardening",label:"Phase 4: Hardening",immediate:"kemaskan doctrine, runtime alignment, dan command semantics supaya Krack behavior lagi konsisten",support:"guna `save` lepas perubahan durable supaya repo-backed memory card terisi, kemudian `bmad review` untuk cari drift seterusnya",caution:"bezakan antara browser-local session state dengan repo-backed MAJI memory card supaya save semantics tak bercampur"}}function o(){return"command MAJI yang available sekarang:\n\nMAJI core:\n- `MAJI`\n- `save` / `maji save`\n- `load bmad`\n- `update memory`\n- `review growth`\n\nDiary:\n- `load diary archive`\n- `load save-diary`\n- `save diary`\n- `review diary`\n\nBMAD:\n- `bmad help`\n- `bmad brainstorm`\n- `bmad plan`\n- `bmad review`\n- `bmad edge-cases`\n- `bmad distill`"}function c(e,r=[]){const a=d(e),n=Array.isArray(r)?r.length:0,i=u();return a==="maji"?`MAJI aktif pada doctrine semasa.

state semasa:
- bahasa melayu dulu
- muslim-friendly dengan adab
- Krack ialah layer canonical untuk memory, method, dan skills
- shared core + user overlay ialah model memory semasa
- first-use flow sepatutnya minta nama user sebelum load penuh

${o()}`:a==="load bmad"?`BMAD loaded dalam context runtime.

mode yang available:
- \`bmad help\`
- \`bmad brainstorm\`
- \`bmad plan\`
- \`bmad review\`
- \`bmad edge-cases\`
- \`bmad distill\`

fasa paling masuk akal sekarang: ${i.label}.
focus semasa: ${i.immediate}.`:a==="bmad help"?`bmad help:

fasa semasa: ${i.label}

immediate next step:
- ${i.immediate}

optional supporting step:
- ${i.support}

caution:
- ${i.caution}`:a==="bmad brainstorm"?`bmad brainstorm:

arah brainstorm paling berguna sekarang:
1. macam mana nak jadikan command semantics MAJI lebih deterministic dalam runtime
2. macam mana nak bezakan repo-backed memory dengan browser-local session state dengan lebih jelas
3. macam mana nak buat layer command response yang reusable tanpa duplicate doctrine dalam banyak tempat

kalau nak, lepas ni paling natural ialah \`bmad plan\` atau \`bmad review\`.`:a==="bmad plan"?`bmad plan:

1. lock source of truth command dari Krack docs
2. route command utama secara deterministic dalam runtime layer
3. pastikan fallback still guna model bila bukan command exact
4. verify build
5. guna \`save\` kalau perubahan tu durable untuk future sessions`:a==="bmad review"?`bmad review:

focus review untuk state sekarang:
- adakah runtime command reply match doctrine Krack
- adakah user boleh keliru antara browser-local session save dan repo-backed MAJI save
- adakah command coverage cukup untuk command utama MAJI dan BMAD
- adakah fallback masih masuk bila input bukan exact command

kalau nak risk hunting, terus guna \`bmad edge-cases\`.`:a==="bmad edge-cases"?`bmad edge-cases:

edge cases yang patut dijaga:
- user taip command dengan huruf besar/kecil berbeza
- user tambah quote atau spacing pelik pada command
- user guna command yang hampir sama tapi bukan exact match
- user pertama kali run \`MAJI\` tapi belum ada overlay nama
- user anggap \`save\` masih local-only walaupun semantics baru ialah repo-backed memory card

default sekarang patut: exact command route dulu, selain tu fall back ke AI biasa.`:a==="bmad distill"?`bmad distill:

ringkasan context semasa:
- Krack ialah canonical layer untuk memory, method, dan skills
- BMAD ialah workflow engine dalam Krack
- memory card model sekarang ialah shared core + user overlays
- benda paling penting untuk preserve ialah beza antara doctrine repo-backed dengan state runtime local

kalau nak persist perubahan yang durable, next command ialah \`save\`.`:a==="review growth"?`review growth ringkas:

1. identity MAJI sekarang lebih konsisten: bahasa melayu dulu, muslim-friendly, dan lebih jelas sebagai operator KRACKED_OS.
2. doctrine makin kemas: Krack sekarang lebih jelas sebagai layer canonical untuk memory, method, dan skills.
3. workflow maturity naik: BMAD, skill promotion, dan boundary dengan tooling luar macam KD dah lebih tersusun.
4. runtime alignment bertambah baik dengan model portable memory card untuk shared core + user overlays.

next best move: guna \`save\` bila kau nak preserve perubahan yang durable.`:a==="load diary archive"?`load diary archive:

status semasa:
- layer diary archive memang wujud dalam doctrine Krack
- struktur baru guna \`daily-diary/current/\` untuk entry aktif dan \`daily-diary/archived/\` untuk bulan lama
- repo semasa dah ada entry aktif bertarikh \`2026-03-29\`
- archive history sebenar masih nipis, jadi benda paling berguna sekarang ialah \`review diary\`

nota runtime:
- command ini sekarang beri guided access dalam chat
- pembacaan fail repo sebenar masih bergantung pada session agent yang ada akses fail`:a==="load save-diary"?`load save-diary:

diary system aktif dalam doctrine semasa.

apa yang available:
- struktur \`daily-diary/current/\` untuk entry harian append-only
- struktur \`daily-diary/archived/\` untuk archive bulanan
- flow semasa: \`save diary\` untuk rekod sesi, \`review diary\` untuk recap

nota penting:
- dalam runtime chat, command ini bertindak sebagai activation/guide layer
- persistence ke fail repo sebenar masih perlukan session yang ada akses fail`:a==="save diary"?`save diary:

state semasa:
- semantics diary dah aktif dalam runtime
- source of truth repo sekarang guna fail harian dalam \`daily-diary/current/\`
- entry bertarikh \`2026-03-29\` dah wujud sebagai rekod sesi pertama untuk struktur baru

caution:
- chat runtime sendiri tak terus menulis fail repo
- untuk save repo-backed yang sebenar, session agent dengan akses fail masih diperlukan`:a==="review diary"?`review diary:

ringkasan diary semasa:
- struktur diary baru sudah dimulakan dengan fail harian bertarikh \`2026-03-29\`
- entry itu merakam aktivasi MAJI/BMAD, semakan \`load diary archive\`, dan kickoff save-diary flow

insight utama:
- layer diary sekarang dah ada bentuk repo-backed yang lebih kemas
- command diary dalam runtime dah lebih jelas, tapi operasi fail sebenar masih berasingan daripada browser-local chat state

next best move:
- teruskan sesi dan guna \`save diary\` lagi bila ada milestone baru yang patut dipreserve`:a==="save"?`save sekarang sepatutnya route ke repo-backed MAJI memory card.

apa yang patut berlaku:
- action log user ditambah dalam overlay repo
- current summary user direfresh
- shared core kekal canonical dan tak dioverwrite sesuka hati
- browser-local conversation save kekal berasingan sebagai convenience layer

jumlah mesej dalam session ni sekarang: ${n}.`:a==="update memory"?`update memory:

untuk runtime layer, maksud paling dekat ialah refresh cara jawab supaya ikut doctrine semasa Krack.

untuk persistence sebenar, arah yang betul sekarang ialah repo-backed memory card dengan model shared core + user overlay. kalau perubahan sekarang memang durable, biasanya flow paling betul ialah:
1. \`review growth\`
2. \`save\``:null}async function l(e,r,a=[]){return console.warn("VITE_GROQ_API_KEY not set, falling back to local intelligence"),s.getResponse(r,a)}async function k(e="phi-3",r,a=[]){try{const n=await fetch("http://localhost:11434/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:e,prompt:b(r,a),stream:!1})});return n.ok?(await n.json()).response||"Maaf, model tak jalan sekarang.":(console.error("Ollama API error:",n.status),s.getResponse(r,a))}catch(n){return console.error("Ollama call failed:",n),s.getResponse(r,a)}}function b(e,r){return`System: You are IJAM, the Malay-first and Muslim-friendly AI assistant for KRACKED_OS.
Keep tone ringkas, practical, dan respectful.
Treat Krack as the canonical memory, method, and skill layer for KRACKED_OS.

Conversation History:
${r.map(n=>`${n.role}: ${n.content}`).join(`
`)}

Current Request: ${e}`}async function g(e=t.GROQ,r,a=[]){console.log(`IJAM AI called with mode: ${e}, message:`,r);const n=c(r,a);if(n)return n;switch(e){case t.GROQ:return l(m(),r,a);case t.LOCAL:return k("phi-3",r,a);case t.OPENROUTER:return l(m(),r,a);case t.FALLBACK:return s.getResponse(r,a);default:return l(m(),r,a)}}function m(){const e=new Date().getHours();return e>=5&&e<12?"Assalamualaikum, selamat pagi :)":e>=12&&e<17?"Assalamualaikum, selamat tengah hari :)":e>=17&&e<20?"Assalamualaikum, selamat petang :)":"Assalamualaikum, selamat malam :)"}export{t as AI_MODELS,g as callIJAMAI,m as getIslamicGreeting,c as getMajiRuntimeCommandResponse};
