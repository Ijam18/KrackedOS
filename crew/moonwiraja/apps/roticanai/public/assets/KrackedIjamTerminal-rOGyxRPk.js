const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./ijamsAIService-Hicf01nU.js","./index-D1-zZxIi.js","./index-BNHqtBfm.css"])))=>i.map(i=>d[i]);
import{r as p,j as n,_ as H}from"./index-D1-zZxIi.js";const L="ijam_conversations_index",F="ijam_diary_meta",T="ijam_diary_entries",Y="ijam_maji_active_user_slug";function N(r,s){try{const i=localStorage.getItem(r);return i?JSON.parse(i):s}catch(i){return console.error(`Failed to read localStorage key: ${r}`,i),s}}function J(r,s){try{localStorage.setItem(r,JSON.stringify(s))}catch(i){console.error(`Failed to write localStorage key: ${r}`,i)}}function V(r,s=""){try{const i=localStorage.getItem(r);return i??s}catch(i){return console.error(`Failed to read localStorage key: ${r}`,i),s}}function P(r,s){try{localStorage.setItem(r,s)}catch(i){console.error(`Failed to write localStorage key: ${r}`,i)}}function B(r=""){return String(r).trim().toLowerCase().replace(/^["'`]+|["'`]+$/g,"")}function G(r){return new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric"}).format(r)}function Q(r){return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(r)}function X(r=[]){const s=r.filter(i=>(i==null?void 0:i.role)==="user").map(i=>B(i.content));return s.some(i=>i.startsWith("bmad"))?"Work / BMAD":s.some(i=>i.includes("maji")||i.includes("diary"))?"Work / MAJI System":"Work / General"}function q(r=[]){const s=new Date,i=r.filter(l=>(l==null?void 0:l.role)==="user").map(l=>String(l.content||"").trim()).filter(Boolean),g=r.filter(l=>(l==null?void 0:l.role)==="assistant").map(l=>String(l.content||"").trim()).filter(Boolean),f=i.slice(-3),m=g.slice(-2);return{id:`diary-${s.getTime()}`,createdAt:s.toISOString(),dateKey:s.toISOString().slice(0,10),monthKey:s.toISOString().slice(0,7),title:f[0]||"Session diary entry",sessionType:X(r),messageCount:r.length,topics:f,highlights:m,summary:f.length>0?`Topik utama: ${f.join(" | ")}`:"Tiada topik panjang, tapi sesi ini tetap dipreserve sebagai checkpoint.",transcriptPreview:r.slice(-6)}}function Z(){const[r,s]=p.useState(()=>N(L,[])),[i,g]=p.useState(null),[f,m]=p.useState(null),[l,b]=p.useState(()=>N(F,null)),[y,S]=p.useState(()=>N(T,[])),[k,$]=p.useState(()=>V(Y,"")),[j,v]=p.useState(!1),[M,w]=p.useState(null),C=()=>{const e=new Date().getHours();return e>=5&&e<12?"Assalamualaikum, selamat pagi :)":e>=12&&e<17?"Assalamualaikum, selamat tengah hari :)":e>=17&&e<20?"Assalamualaikum, selamat petang :)":"Assalamualaikum, selamat malam :)"},u=e=>{if(!r.find(t=>t.id===e))return[];g(e),m("Assalamualaikum! Jumpa lagi kita terus dari mana tadi :)");try{const t=localStorage.getItem(`ijam_conversation_${e}`);if(t)return JSON.parse(t).messages||[]}catch(t){console.error("Failed to load conversation:",t)}return[]},A=(e=r)=>{if(!Array.isArray(e)||e.length===0)return;const a=i||Date.now(),t={id:a,timestamp:new Date().toISOString(),messages:e,resumedFrom:f};localStorage.setItem(`ijam_conversation_${a}`,JSON.stringify(t)),g(a);const o=[{id:a,timestamp:t.timestamp,messageCount:e.length},...r.filter(d=>d.id!==a)].slice(0,20);s(o),J(L,o),console.log("Conversation saved:",t)},I=()=>{const e=l||N(F,null),a=Array.isArray(y)?y:N(T,[]);if(e)return{meta:e,entries:a};const t={name:"Session Diary",initializedAt:new Date().toISOString(),version:1};J(F,t),b(t);const o=Array.isArray(a)?a:[];return Array.isArray(a)||(J(T,[]),S([])),{meta:t,entries:o}},z=(e=[])=>{const{meta:a,entries:t}=I(),o=q(e),d=[...t,o];return J(T,d),S(d),`save diary:

session berjaya dipreserve dalam local diary browser.

apa yang disimpan:
- nama diary: \`${a.name}\`
- jumlah entry terkumpul: ${d.length}
- entry terbaru: ${o.dateKey} (${Q(new Date(o.createdAt))})
- mesej dalam snapshot sesi ini: ${o.messageCount}

nota:
- ini ialah persistence sebenar pada app layer melalui localStorage
- ia masih berbeza daripada repo-backed memory files`},U=()=>{const{meta:e,entries:a}=I();if(!a.length)return`review diary:

\`${e.name}\` belum ada entry lagi.

next best move:
- guna \`save diary\` bila kau nak preserve sesi semasa`;const t=[...a].slice(-3).reverse(),o=t.map((d,h)=>`${h+1}. ${d.dateKey} - ${d.summary}`).join(`
`);return`review diary:

ringkasan \`${e.name}\`:
- jumlah entry: ${a.length}
- entry paling baru: ${t[0].dateKey}

recent entries:
${o}`},K=()=>{const{meta:e,entries:a}=I();if(!a.length)return`load diary archive:

\`${e.name}\` sudah diaktifkan, tapi archive masih kosong.

apa maksudnya:
- belum ada entry terdahulu untuk digroup sebagai sejarah
- langkah paling berguna sekarang ialah \`save diary\``;const t=a.reduce((d,h)=>(d[h.monthKey]=(d[h.monthKey]||0)+1,d),{}),o=Object.entries(t).sort((d,h)=>h[0].localeCompare(d[0])).map(([d,h])=>`- ${d}: ${h} entry`).join(`
`);return`load diary archive:

status archive untuk \`${e.name}\`:
- jumlah entry tersimpan: ${a.length}
- bulan aktif pertama: ${a[0].monthKey}

pecahan bulan:
${o}`},W=()=>{const{meta:e,entries:a}=I();return`load save-diary:

diary system browser-layer aktif.

status semasa:
- nama diary: \`${e.name}\`
- initialized: ${G(new Date(e.initializedAt))}
- jumlah entry semasa: ${a.length}

flow tersedia:
- \`save diary\` untuk preserve snapshot sesi
- \`review diary\` untuk recap entry terkini
- \`load diary archive\` untuk tengok pecahan sejarah`},D=async e=>{var o;if(typeof window>"u")throw new Error("MAJI memory card hanya available dalam browser dev server atau desktop runtime.");if((o=window.krackedOS)!=null&&o.maji){if((e==null?void 0:e.action)==="load")return window.krackedOS.maji.load(e);if((e==null?void 0:e.action)==="onboard")return window.krackedOS.maji.onboard(e);if((e==null?void 0:e.action)==="save")return window.krackedOS.maji.save(e)}const a=await fetch("/__maji-memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),t=await a.json().catch(()=>({}));if(!a.ok)throw new Error((t==null?void 0:t.error)||"Failed to access MAJI memory card.");return t},E=e=>{$(e),P(Y,e)},_=(e=[])=>e.length?e.map(a=>`- ${a.displayName} (\`${a.slug}\`)`).join(`
`):"- belum ada overlay user lain yang ditemui dalam repo ini",O=(e=[])=>e.length?e.map(a=>`- ${a.displayName} (\`${a.slug}\`): ${a.summaryLine}`).join(`
`):"- belum ada contributor summary yang tersimpan lagi";return{conversations:r,currentConversationId:i,diaryMeta:l,diaryEntries:y,startNewConversation:()=>{g(null),s([]),m(null)},resumeConversation:u,saveCurrentConversation:A,saveDiaryEntry:z,reviewDiaryEntries:U,loadDiaryArchive:K,loadSaveDiary:W,loadMajiMemory:async()=>{var a,t,o;const e=await D({action:"load",activeUserSlug:k});return w(e),e!=null&&e.requiresOnboarding?(v(!0),`MAJI perlukan nama user dulu untuk aktifkan memory card repo ini.

apa yang perlu dibuat sekarang:
- balas dengan nama anda sahaja
- saya akan cipta user overlay peribadi dalam repo
- lepas itu MAJI akan load shared core + overlay anda

memory cards yang sudah wujud dalam repo:
${_(e==null?void 0:e.knownUsers)}`):(v(!1),`MAJI aktif.

memory card loaded:
- shared core files: ${e.sharedCore.length}
- active user: \`${((a=e.activeUser)==null?void 0:a.displayName)||"Unknown"}\`
- active slug: \`${((t=e.activeUser)==null?void 0:t.slug)||"unknown"}\`
- overlays detected: ${((o=e.knownUsers)==null?void 0:o.length)||0}

apa yang diload:
- shared MAJI core doctrine
- BMAD shared method layer
- user overlay summary semasa
- contributor context dari semua overlay yang ada dalam repo

contributor context penuh:
${O(e==null?void 0:e.contributorSummaries)}

available sekarang:
- \`load bmad\`
- \`save\` atau \`maji save\`
- \`review growth\`
- \`load diary archive\``)},submitMajiOnboardingName:async e=>{var t,o,d,h;const a=await D({action:"onboard",name:e});return E(((t=a==null?void 0:a.activeUser)==null?void 0:t.slug)||""),w(a),v(!1),`MAJI onboarding selesai.

user overlay dicipta:
- nama: \`${((o=a.activeUser)==null?void 0:o.displayName)||e}\`
- slug: \`${((d=a.activeUser)==null?void 0:d.slug)||"unknown"}\`
- known overlays dalam repo: ${((h=a.knownUsers)==null?void 0:h.length)||0}

context contributor yang turut tersedia:
${O(a==null?void 0:a.contributorSummaries)}

sekarang MAJI dah load:
- shared core memory
- user overlay peribadi anda
- context repo semasa dari semua contributor yang sudah save juga

next best move:
- guna \`load bmad\` bila nak aktifkan method layer
- guna \`save\` atau \`maji save\` bila nak tulis action log ke memory card`},saveMajiMemory:async(e=[])=>{if(!k)return v(!0),`MAJI belum ada user aktif dalam clone ini.

sebelum save repo-backed boleh jalan:
- guna \`MAJI\`
- masukkan nama anda bila diminta`;const a=await D({action:"save",activeUserSlug:k,messages:e});return w(t=>{var o;return{...t||{},activeUser:a.activeUser,activeSummary:((o=a.paths)==null?void 0:o.summary)||"",loadedAt:a.savedAt}}),`maji save:

memory card berjaya ditulis ke repo.

apa yang disimpan:
- user: \`${a.activeUser.displayName}\`
- action log: \`${a.paths.actions}\`
- current summary: \`${a.paths.summary}\`
- profile: \`${a.paths.profile}\`
- mesej dalam snapshot ini: ${a.messageSummary.messageCount}

ringkasan:
- ${a.messageSummary.summaryLine}

nota:
- ini save ke repo-backed MAJI memory card
- ini bukan git commit atau push`},majiPendingOnboarding:j,majiMemoryState:M,activeMajiUserSlug:k,normalizeCommand:B,getIslamicGreeting:C}}function ee(r){return r.replace(/\([^()]*[^\x00-\x7F][^()]*\)/g,"").replace(/\s{2,}/g," ").trim()}function ae({prefillMessage:r="",onPrefillConsumed:s=null,compact:i=!1}){const[g,f]=p.useState([]),[m,l]=p.useState(!1),[b,y]=p.useState(""),{startNewConversation:S,resumeConversation:k,saveCurrentConversation:$,conversations:j,diaryMeta:v,diaryEntries:M,saveDiaryEntry:w,reviewDiaryEntries:C,loadDiaryArchive:u,loadSaveDiary:A,loadMajiMemory:I,submitMajiOnboardingName:z,saveMajiMemory:U,majiPendingOnboarding:K,normalizeCommand:W}=Z(),D=[...Array.isArray(M)?M:[]].slice(-3).reverse();p.useEffect(()=>{r&&(y(r),s==null||s())},[s,r]);const E=async c=>{const x=c.trim();if(!x||m)return;const e=[...g,{role:"user",content:x,timestamp:new Date().toISOString()}];f(e),y("");const a=W(x);let t;K?t=await z(x):a==="maji"?t=await I():a==="save"||a==="maji save"?t=await U(e):a==="save diary"?t=w(e):a==="review diary"?t=C():a==="load diary archive"?t=u():a==="load save-diary"?t=A():t=await H(()=>import("./ijamsAIService-Hicf01nU.js"),__vite__mapDeps([0,1,2]),import.meta.url).then(d=>d.callIJAMAI("groq",x,e));const o=[...e,{role:"assistant",content:ee(t),timestamp:new Date().toISOString()}];f(o),$(o)},_=async()=>{!b.trim()||m||(await E(b),y(""))},O=async c=>{l(!0);const x=await k(c);f(Array.isArray(x)?x:[]),setTimeout(()=>l(!1),1e3)},R=async c=>{y(""),await E(c)};return n.jsxs("div",{className:"kracked-ijam-chat",children:[n.jsxs("div",{className:"chat-header",children:[n.jsx("div",{className:"chat-title",children:n.jsx("h2",{children:"IJAM Chat"})}),j.length>1&&n.jsx("button",{className:"secondary-button",onClick:()=>O(j[j.length-1].id),disabled:m,children:"Resume Conversation"}),j.length>0&&!m&&n.jsx("button",{className:"secondary-button",onClick:S,children:"New Chat"})]}),n.jsxs("div",{className:"diary-panel",children:[n.jsxs("div",{className:"diary-panel-header",children:[n.jsxs("div",{children:[n.jsx("p",{className:"diary-kicker",children:"Diary Layer"}),n.jsx("h3",{children:(v==null?void 0:v.name)||"Session Diary"})]}),n.jsxs("div",{className:"diary-count-pill",children:[M.length," entry"]})]}),n.jsxs("div",{className:"diary-actions",children:[n.jsx("button",{type:"button",className:"secondary-button",onClick:()=>R("save diary"),children:"Save Diary"}),n.jsx("button",{type:"button",className:"secondary-button",onClick:()=>R("review diary"),children:"Review Diary"}),n.jsx("button",{type:"button",className:"secondary-button",onClick:()=>R("load diary archive"),children:"Load Archive"})]}),D.length>0?n.jsx("div",{className:"diary-entry-list",children:D.map(c=>n.jsxs("div",{className:"diary-entry-card",children:[n.jsxs("div",{className:"diary-entry-meta",children:[n.jsx("strong",{children:c.dateKey}),n.jsx("span",{children:c.sessionType})]}),n.jsx("p",{children:c.summary})]},c.id))}):n.jsxs("div",{className:"diary-empty-state",children:["Belum ada entry browser-layer lagi. Guna ",n.jsx("code",{children:"save diary"})," untuk mula simpan milestone sesi."]})]}),n.jsx("div",{className:"chat-messages",children:g.map((c,x)=>{const e=c.role==="user";return n.jsxs("div",{className:`message ${e?"user":"ai"}`,children:[n.jsx("div",{className:"message-content",children:c.content}),n.jsx("div",{className:"timestamp",children:new Date(c.timestamp).toLocaleTimeString("ms-MY",{hour:"2-digit",minute:"2-digit"})})]},x)})}),n.jsxs("div",{className:"chat-input",children:[n.jsx("input",{type:"text",value:b,onChange:c=>y(c.target.value),onKeyDown:c=>{c.key==="Enter"&&!c.shiftKey&&b.trim()&&_()},placeholder:"Tanya IJAM tentang apa-apa...",disabled:m}),n.jsx("button",{onClick:_,disabled:m||!b.trim(),className:"send-button",children:"Hantar"})]}),n.jsx("style",{children:`
        .kracked-ijam-chat {
          width: 100%;
          max-width: ${i?"none":"1200px"};
          height: ${i?"100%":"600px"};
          margin: 0 auto;
          background: #f8fafc;
          border: 1px solid #dbe4ef;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #0f172a;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #dbe4ef;
        }

        .chat-title {
          flex: 1;
        }

        .chat-title h2 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: ${i?"16px":"20px"};
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .diary-panel {
          padding: 16px 20px;
          border-bottom: 1px solid #dbe4ef;
          background:
            radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 42%),
            linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
        }

        .diary-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .diary-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #166534;
        }

        .diary-panel h3 {
          margin: 0;
          font-size: 18px;
          color: #14532d;
        }

        .diary-count-pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(34, 197, 94, 0.18);
          color: #166534;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .diary-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        .diary-entry-list {
          display: grid;
          gap: 10px;
        }

        .diary-entry-card {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(148, 163, 184, 0.24);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
        }

        .diary-entry-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 12px;
          color: #475569;
        }

        .diary-entry-card p,
        .diary-empty-state {
          margin: 0;
          line-height: 1.5;
          color: #0f172a;
          font-size: 13px;
        }

        .message {
          max-width: 72%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #dbe4ef;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        }

        .message.user {
          align-self: flex-end;
          background: #dcfce7;
          border-color: #86efac;
        }

        .message.ai {
          align-self: flex-start;
          background: #ffffff;
        }

        .message-content {
          line-height: 1.6;
          color: #0f172a;
          white-space: pre-wrap;
        }

        .timestamp {
          font-size: 11px;
          color: #64748b;
          text-align: right;
          margin-top: 8px;
        }

        .chat-input {
          display: flex;
          gap: 10px;
          padding: ${i?"14px 16px":"16px 20px"};
          background: #ffffff;
          border-top: 1px solid #dbe4ef;
        }

        .chat-input input {
          flex: 1;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
        }

        .chat-input input::placeholder {
          color: #64748b;
        }

        .chat-input input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }

        .send-button,
        .secondary-button {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .send-button {
          background: #16a34a;
          color: #ffffff;
        }

        .send-button:hover {
          background: #15803d;
        }

        .secondary-button {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .secondary-button:hover {
          background: #f8fafc;
        }

        .send-button:disabled,
        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .diary-panel,
          .chat-header,
          .chat-input {
            padding-left: 16px;
            padding-right: 16px;
          }

          .diary-panel-header,
          .diary-entry-meta,
          .chat-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .message {
            max-width: 88%;
          }
        }
      `})]})}function ne(r){return`Jelaskan output terminal ini dan cadangkan next step yang paling sesuai:

${r.slice(-6).map(i=>`${i.role.toUpperCase()}: ${i.text}`).join(`
`)}`}function re({terminalLog:r,terminalBusy:s,terminalInput:i,setTerminalInput:g,executeTerminalCommand:f,terminalOutputRef:m,userRank:l,userVibes:b,chatPrefill:y,onChatPrefill:S,onChatPrefillConsumed:k,questTitle:$="",questObjective:j="",questXpReward:v=0,jobTheme:M="",onMarkQuestComplete:w}){const C=p.useMemo(()=>[...r].reverse().find(u=>u.role==="assistant"||u.role==="system"),[r]);return n.jsxs("div",{style:{height:"100%",display:"grid",gridTemplateColumns:"minmax(320px, 1.15fr) minmax(320px, 0.95fr)",gap:"16px",padding:"16px",background:"#eef4fb"},children:[n.jsxs("section",{style:{minHeight:0,display:"grid",gridTemplateRows:$?"auto auto minmax(0, 1fr) auto":"auto minmax(0, 1fr) auto",gap:"12px"},children:[$&&n.jsxs("div",{style:{background:"#ffffff",border:"1px solid #dbe4ef",borderRadius:"12px",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",flexWrap:"wrap"},children:[n.jsxs("div",{children:[n.jsx("div",{style:{fontSize:"11px",fontWeight:800,letterSpacing:"0.08em",color:"#64748b",textTransform:"uppercase"},children:M||"Academy Quest"}),n.jsx("div",{style:{marginTop:"6px",fontSize:"18px",fontWeight:800,color:"#0f172a"},children:$}),j&&n.jsx("div",{style:{marginTop:"6px",color:"#475569",lineHeight:1.6,fontSize:"13px"},children:j})]}),n.jsxs("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"},children:[n.jsxs("div",{style:{padding:"8px 10px",borderRadius:"999px",background:"#eff6ff",color:"#1d4ed8",fontSize:"12px",fontWeight:800},children:[v," XP"]}),w&&n.jsx("button",{type:"button",onClick:w,style:{padding:"9px 12px",borderRadius:"10px",border:"1px solid #cbd5e1",background:"#ffffff",color:"#0f172a",fontWeight:700,cursor:"pointer"},children:"Complete Quest"})]})]}),n.jsxs("div",{style:{background:"#ffffff",border:"1px solid #dbe4ef",borderRadius:"12px",padding:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"},children:[n.jsxs("div",{children:[n.jsx("div",{style:{fontSize:"12px",fontWeight:700,letterSpacing:"0.08em",color:"#64748b",textTransform:"uppercase"},children:"Terminal Workspace"}),n.jsx("div",{style:{fontSize:"18px",fontWeight:800,color:"#0f172a"},children:"Live command stream"})]}),n.jsx("button",{type:"button",onClick:()=>S(ne(r)),style:{padding:"10px 14px",borderRadius:"10px",border:"1px solid #cbd5e1",background:"#ffffff",color:"#0f172a",fontWeight:700,cursor:"pointer"},children:"Ask IJAM About Latest Output"})]}),n.jsxs("div",{style:{minHeight:0,background:"#ffffff",border:"1px solid #dbe4ef",borderRadius:"12px",overflow:"hidden",display:"grid",gridTemplateRows:"auto minmax(0, 1fr)"},children:[n.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px",background:"#f8fafc"},children:[n.jsxs("div",{style:{color:"#334155",fontSize:"13px",fontWeight:700},children:[`${l} | ${b}`," synced with terminal session"]}),C&&n.jsx("button",{type:"button",onClick:()=>S(`Terangkan mesej terminal ini dengan ringkas:

${C.text}`),style:{padding:"8px 12px",borderRadius:"10px",border:"1px solid #cbd5e1",background:"#ffffff",color:"#0f172a",fontWeight:700,cursor:"pointer"},children:"Explain Last Line"})]}),n.jsxs("div",{ref:m,style:{padding:"16px",overflowY:"auto",fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",fontSize:"12px",lineHeight:1.6,background:"#f8fafc"},children:[r.map((u,A)=>n.jsxs("div",{style:{marginBottom:"10px",whiteSpace:"pre-wrap"},children:[u.role!=="system"&&n.jsx("span",{style:{color:u.role==="assistant"?"#0f766e":"#166534",fontWeight:800},children:u.role==="assistant"?"KRACKED_BOT>":`[${l} | ${b}] YOU>`}),u.role!=="system"&&" ",n.jsx("span",{style:{color:u.role==="system"?"#475569":"#0f172a",fontStyle:u.role==="system"?"italic":"normal"},children:u.text})]},`${u.role}-${A}`)),s&&n.jsxs("div",{children:[n.jsx("span",{style:{color:"#0f766e",fontWeight:800},children:"KRACKED_BOT>"})," processing..."]})]})]}),n.jsxs("form",{onSubmit:async u=>{u.preventDefault();const A=i;g(""),await f(A)},style:{display:"grid",gridTemplateColumns:"1fr auto",gap:"10px",padding:"14px",background:"#ffffff",border:"1px solid #dbe4ef",borderRadius:"12px"},children:[n.jsx("input",{value:i,onChange:u=>g(u.target.value),placeholder:"Type a command or request...",style:{border:"1px solid #cbd5e1",borderRadius:"10px",background:"#ffffff",color:"#0f172a",padding:"12px 14px",fontFamily:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",fontWeight:700,minWidth:0,width:"100%"}}),n.jsx("button",{type:"submit",disabled:s,style:{padding:"12px 18px",borderRadius:"10px",border:"none",background:"#16a34a",color:"#ffffff",fontWeight:800,cursor:s?"not-allowed":"pointer",opacity:s?.5:1},children:"Run"})]})]}),n.jsx("section",{style:{minHeight:0},children:n.jsx(ae,{compact:!0,prefillMessage:y,onPrefillConsumed:k})})]})}export{re as default};
