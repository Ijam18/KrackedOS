import React, { useState } from 'react';
import {
    Copy, Check, ChevronRight, ChevronLeft, Wand2, X, ExternalLink,
    Zap, Palette, Server, Database, Smartphone, Bot, ShieldCheck,
    Settings2, TrendingUp, Rocket, Code2
} from 'lucide-react';

const STEPS = ['Role + Stack (R)', 'Objective (O)', 'Features (F)', 'Constraints (C)', 'Output Format (O)'];
const NB_FONT = "'Courier New', Courier, monospace";
const UI_FONT = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Role Data ─────────────────────────────────────────────────────────────────
const ROLES = [
    { id: 'fullstack', label: 'Senior Fullstack Engineer', Icon: Code2, color: '#3b82f6',
        description: 'End-to-end builder who handles both frontend and backend. Expert in React, Node.js, databases, and API design.',
        bestFor: 'Complete app builds, MVPs, SaaS products',
        skills: ['React', 'Node.js', 'REST APIs', 'SQL', 'Auth'] },
    { id: 'frontend', label: 'Frontend UI/UX Expert', Icon: Palette, color: '#ec4899',
        description: 'Specialist in pixel-perfect interfaces, animations, and user experience flows. Masters Tailwind, Framer Motion, and design systems.',
        bestFor: 'Landing pages, dashboards, mobile-first apps',
        skills: ['React', 'TailwindCSS', 'Framer Motion', 'Figma-to-Code', 'Accessibility'] },
    { id: 'backend', label: 'Backend API Architect', Icon: Server, color: '#f97316',
        description: 'Server-side specialist focused on scalable APIs, database schema design, caching, and performance.',
        bestFor: 'API services, data-heavy apps, microservices',
        skills: ['Node.js', 'PostgreSQL', 'Redis', 'REST/GraphQL', 'Supabase Edge Functions'] },
    { id: 'db', label: 'Database Architect', Icon: Database, color: '#14b8a6',
        description: 'Expert in relational and NoSQL schema design, query optimization, RLS policies, and data modeling.',
        bestFor: 'Complex data models, multi-tenant SaaS, analytics',
        skills: ['PostgreSQL', 'Supabase', 'RLS', 'Indexing', 'ERD Design'] },
    { id: 'mobile', label: 'Mobile-First Developer', Icon: Smartphone, color: '#8b5cf6',
        description: 'Builds apps that feel native on iOS and Android. Expert in PWA, touch interactions, and performance on low-end devices.',
        bestFor: 'PWAs, mobile apps, responsive-first products',
        skills: ['React Native', 'PWA', 'Touch UX', 'Offline-first', 'App Store'] },
    { id: 'ai', label: 'AI Integration Engineer', Icon: Bot, color: '#f59e0b',
        description: 'Connects LLMs, embeddings, and AI APIs into products. Expert in prompt engineering, RAG pipelines, and AI UX.',
        bestFor: 'AI-powered features, chatbots, semantic search',
        skills: ['Claude API', 'NVIDIA NIM', 'LangChain', 'Vector DB', 'Prompt Engineering'] },
    { id: 'security', label: 'Security-First Engineer', Icon: ShieldCheck, color: '#ef4444',
        description: 'Designs with auth, authorization, and data privacy first. Expert in JWT, RLS, OAuth, and OWASP top 10.',
        bestFor: 'Apps handling sensitive data, fintech, healthcare',
        skills: ['JWT', 'OAuth2', 'RLS', 'OWASP', 'Supabase Auth'] },
    { id: 'devops', label: 'DevOps / Infra Engineer', Icon: Settings2, color: '#6366f1',
        description: 'Automates deployment, CI/CD, and infrastructure. Expert in Docker, GitHub Actions, Vercel, and monitoring.',
        bestFor: 'Production-ready apps, automated pipelines, scalable infra',
        skills: ['Docker', 'GitHub Actions', 'Vercel', 'Cloudflare', 'Monitoring'] },
    { id: 'growth', label: 'Growth Engineer', Icon: TrendingUp, color: '#10b981',
        description: 'Builds features that drive user acquisition, retention, and monetization. Expert in analytics, A/B testing, and conversion.',
        bestFor: 'Consumer apps, SaaS with free tier, viral loops',
        skills: ['Analytics', 'A/B Testing', 'SEO', 'Onboarding Flows', 'Pricing Pages'] },
    { id: 'vibe', label: 'Vibe Coder (Ship It Fast)', Icon: Rocket, color: '#C8102E',
        description: 'Move fast, ship daily. Uses AI-first workflows, copy-paste components, and zero-to-launched in 24h mindset.',
        bestFor: 'Hackathons, builder sprints, rapid MVPs',
        skills: ['Claude/Cursor', 'v0.dev', 'Bolt.new', 'Vercel', 'No-code integration'] },
];

// ─── Tech Stack Data ────────────────────────────────────────────────────────────
const TECH_CATEGORIES = [
    { label: 'Frontend', options: [
        { id: 'React', desc: 'Industry-standard component library. Massive ecosystem.', pros: 'Huge community, great tooling', cons: 'Learning curve, boilerplate', bestFor: 'SPAs, dashboards, interactive UIs', docs: 'https://react.dev' },
        { id: 'Vue', desc: 'Progressive framework with gentle learning curve.', pros: 'Easy to learn, great docs', cons: 'Smaller ecosystem than React', bestFor: 'Quick prototypes, teams new to JS frameworks', docs: 'https://vuejs.org' },
        { id: 'Next.js', desc: 'React meta-framework with SSR, SSG, and file-based routing.', pros: 'SEO-friendly, full-stack in one', cons: 'More complex build setup', bestFor: 'Public-facing sites, SEO-critical apps', docs: 'https://nextjs.org' },
        { id: 'Svelte', desc: 'Compiles to vanilla JS — no virtual DOM overhead.', pros: 'Tiny bundle, fast runtime', cons: 'Smaller community, fewer libs', bestFor: 'Performance-critical UIs, lean apps', docs: 'https://svelte.dev' },
        { id: 'Astro', desc: 'Content-first framework with island architecture.', pros: 'Zero JS by default, fast sites', cons: 'Less suited for dynamic apps', bestFor: 'Blogs, docs, marketing sites', docs: 'https://astro.build' },
    ]},
    { label: 'Styling', options: [
        { id: 'TailwindCSS', desc: 'Utility-first CSS framework. Write styles in your markup.', pros: 'Fast, consistent, no CSS files', cons: 'Verbose class names', bestFor: 'Any project, especially with component libraries', docs: 'https://tailwindcss.com' },
        { id: 'shadcn/ui', desc: 'Copy-paste component library built on Radix + Tailwind.', pros: 'Beautiful, accessible, customizable', cons: 'Requires Tailwind', bestFor: 'Dashboards, admin panels, SaaS UIs', docs: 'https://ui.shadcn.com' },
        { id: 'Chakra UI', desc: 'Accessible, composable React component library.', pros: 'Great DX, dark mode built-in', cons: 'Runtime CSS-in-JS overhead', bestFor: 'Quick UI builds with accessible defaults', docs: 'https://chakra-ui.com' },
        { id: 'Framer Motion', desc: 'Production-ready animations and gestures for React.', pros: 'Declarative, powerful, easy', cons: 'Adds ~40KB to bundle', bestFor: 'Any app needing smooth animations', docs: 'https://www.framer.com/motion' },
    ]},
    { label: 'Backend / DB', options: [
        { id: 'Supabase', desc: 'Open source Firebase alternative — Postgres + Auth + Storage.', pros: 'Realtime, RLS, great DX', cons: 'Cold starts on free tier', bestFor: 'Full-stack apps, auth, real-time features', docs: 'https://supabase.com/docs' },
        { id: 'Firebase', desc: "Google's BaaS with Firestore, Auth, and Cloud Functions.", pros: 'Managed, scales well', cons: 'NoSQL only, vendor lock-in', bestFor: 'Mobile-first apps, rapid prototypes', docs: 'https://firebase.google.com/docs' },
        { id: 'PocketBase', desc: 'Single-file open-source backend with realtime and auth.', pros: 'Zero ops, fast setup', cons: 'Less scalable, newer ecosystem', bestFor: 'Solo builders, self-hosted apps', docs: 'https://pocketbase.io/docs' },
        { id: 'Prisma + PostgreSQL', desc: 'Type-safe ORM over Postgres. Works with any Node.js backend.', pros: 'Type safety, great migrations', cons: 'More setup, requires separate DB', bestFor: 'Complex schemas, team projects', docs: 'https://www.prisma.io/docs' },
        { id: 'Convex', desc: 'Reactive backend platform with ACID transactions and realtime.', pros: 'Realtime by default, TypeScript-native', cons: 'Proprietary, newer', bestFor: 'Realtime collaborative apps', docs: 'https://docs.convex.dev' },
    ]},
    { label: 'Tooling', options: [
        { id: 'Vite', desc: 'Lightning-fast build tool and dev server.', pros: 'Instant HMR, fast builds', cons: 'Some legacy library compat issues', bestFor: 'All modern React/Vue/Svelte projects', docs: 'https://vitejs.dev' },
        { id: 'Zustand', desc: 'Minimalist global state management for React.', pros: 'Tiny, simple API', cons: 'No built-in devtools (need plugin)', bestFor: 'Apps needing lightweight global state', docs: 'https://zustand-demo.pmnd.rs' },
        { id: 'React Query', desc: 'Async state management for data fetching and caching.', pros: 'Caching, refetch, devtools', cons: 'More config than fetch()', bestFor: 'Apps with frequent API calls', docs: 'https://tanstack.com/query' },
        { id: 'Zod', desc: 'TypeScript-first schema validation library.', pros: 'Runtime type safety, great errors', cons: 'TypeScript-centric', bestFor: 'Form validation, API response parsing', docs: 'https://zod.dev' },
        { id: 'Lucide Icons', desc: 'Beautiful, consistent open-source icon set.', pros: 'Tree-shakeable, 1000+ icons', cons: 'None really', bestFor: 'Any React project needing icons', docs: 'https://lucide.dev' },
    ]},
];

// ─── Design Vibes ────────────────────────────────────────────────────────────
const VIBES = [
    { id: 'neobrutalism', label: 'NeoBrutalism', accent: '#f5d000', bg: 'rgba(245,208,0,0.08)',
        desc: 'Thick black borders, flat color fills, offset box shadows, bold type. No gradients.',
        preview: 'bg:#0b1220  border:3px solid #121417\nshadow: 4px 4px 0 #121417\nfont: Black 900, UPPERCASE\naccent: #F5D000 + #C8102E',
        cssRules: 'background: #0b1220 | border: 3px solid #121417 | box-shadow: 4px 4px 0 #121417 | font-weight: 900 | letter-spacing: 0.05em | accent: #F5D000, #C8102E' },
    { id: 'glassmorphism', label: 'Glassmorphism', accent: '#60a5fa', bg: 'rgba(255,255,255,0.04)',
        desc: 'Frosted glass cards with blur backdrop, translucent overlays, soft glow borders.',
        preview: 'bg: rgba(255,255,255,0.08)\nbackdropFilter: blur(20px)\nborder: 1px solid rgba(255,255,255,0.2)\nglow: box-shadow inset',
        cssRules: 'background: rgba(255,255,255,0.08) | backdrop-filter: blur(20px) | border: 1px solid rgba(255,255,255,0.2) | box-shadow: 0 0 20px rgba(96,165,250,0.15) | border-radius: 16px' },
    { id: 'darkminimal', label: 'Dark Minimal', accent: '#e2e8f0', bg: 'rgba(255,255,255,0.03)',
        desc: 'Clean dark background, subtle borders, generous whitespace, monospaced code accents.',
        preview: 'bg: #0f172a  text: #e2e8f0\nborder: 1px solid #1e293b\nfont: Inter, weight 300-500\naccent: subtle muted tones',
        cssRules: 'background: #0f172a | color: #e2e8f0 | border: 1px solid #1e293b | font-family: Inter | font-weight: 300-500 | spacing: generous' },
    { id: 'retroterminal', label: 'Retro Terminal', accent: '#00ff41', bg: 'rgba(0,255,65,0.04)',
        desc: 'Green-on-black, scan-line effect, monospace everything, blinking cursor.',
        preview: 'bg: #000  text: #00ff41\nfont: Courier New, monospace\nscanlines: repeating-linear-gradient\ncursor: blink animation',
        cssRules: 'background: #000 | color: #00ff41 | font-family: "Courier New", monospace | text-shadow: 0 0 8px #00ff41 | scanline: repeating-linear-gradient overlay' },
    { id: 'pastelsoft', label: 'Pastel Soft', accent: '#f9a8d4', bg: 'rgba(249,168,212,0.06)',
        desc: 'Soft pastels, high border-radius, warm friendly typography, generous spacing.',
        preview: 'bg: #fdf2f8  text: #831843\nborderRadius: 24px\nfont: Nunito, weight 400-700\npalette: rose, lavender, mint',
        cssRules: 'background: #fdf2f8 | color: #831843 | border-radius: 24px | font-family: Nunito | palette: #f9a8d4, #c4b5fd, #86efac' },
    { id: 'corporateclean', label: 'Corporate Clean', accent: '#2563eb', bg: 'rgba(37,99,235,0.06)',
        desc: 'Professional blue palette, generous whitespace, Stripe/Airbnb-style precision.',
        preview: 'bg: #fff  primary: #2563eb\nborder: 1px solid #e5e7eb\nfont: Inter, weight 400-600\nspacing: generous, structured',
        cssRules: 'background: #fff | primary: #2563eb | border: 1px solid #e5e7eb | font-family: Inter | font-weight: 400-600 | spacing: 8px grid system' },
    { id: 'y2kmaximalist', label: 'Y2K Maximalist', accent: '#ff00ff', bg: 'rgba(255,0,255,0.05)',
        desc: 'Hot pink and chrome, star bullets, metallic gradients, chaotic energy.',
        preview: 'bg: #000  text: #ff00ff\nChrome text gradient effect\nstar ★ bullets, thick borders\nfont: Impact / Impact knockoff',
        cssRules: 'background: #000 | color: #ff00ff | font-family: Impact | background: linear-gradient(chrome) | border: 3px solid #ff00ff | star ★ bullets' },
    { id: 'glassdark', label: 'Glassmorphism Dark', accent: '#a855f7', bg: 'rgba(168,85,247,0.06)',
        desc: 'Dark glass with purple/blue tint — Figma, Linear, and Notion-style.',
        preview: 'bg: rgba(30,20,50,0.85)\nblur: 32px  border: purple tint\nfont: Inter 400-500\naccent: #a855f7 → #6366f1',
        cssRules: 'background: rgba(30,20,50,0.85) | backdrop-filter: blur(32px) | border: 1px solid rgba(168,85,247,0.3) | accent: #a855f7 gradient to #6366f1' },
    { id: 'memphistyle', label: 'Memphis Pattern', accent: '#ef4444', bg: 'rgba(239,68,68,0.06)',
        desc: 'Bold geometric shapes, primary color palette, Canva-style playful design.',
        preview: 'bg: #fff + geometric shapes\ncolors: red, yellow, blue, black\nfont: Futura / Poppins Black\nborderRadius: mixed, playful',
        cssRules: 'background: #fff with geometric shapes | colors: #ef4444, #f5d000, #3b82f6 | font-family: Poppins Black | border-radius: mixed 4px-32px' },
    { id: 'iosnative', label: 'iOS Native', accent: '#007aff', bg: 'rgba(0,122,255,0.06)',
        desc: 'Clean Apple-style design — rounded rectangles, SF Pro, blur chrome, system colors.',
        preview: 'bg: #f2f2f7  text: #000\nfont: -apple-system, SF Pro\nborderRadius: 12-22px\ncolor: #007aff, #34c759, #ff3b30',
        cssRules: 'background: #f2f2f7 | font-family: -apple-system, SF Pro | border-radius: 12-22px | colors: #007aff, #34c759, #ff3b30, #ff9500' },
];

// ─── Popup Modal ────────────────────────────────────────────────────────────────
const Popup = ({ onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
        <div style={{ position: 'relative', background: '#0b1220', border: '2px solid #F5D000', boxShadow: '6px 6px 0 #F5D000', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%', zIndex: 1, maxHeight: '80vh', overflowY: 'auto' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
            </button>
            {children}
        </div>
    </div>
);

// ─── Info Alert / Prompting Tip ──────────────────────────────────────────────
const TipCard = ({ title, children }) => (
    <div style={{ background: 'rgba(245,208,0,0.05)', border: '1px solid rgba(245,208,0,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', gap: '10px' }}>
        <Zap size={18} color="#F5D000" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#F5D000', textTransform: 'uppercase', marginBottom: '4px', fontFamily: NB_FONT }}>AJWAD'S PROMPT TIP: {title}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{children}</div>
        </div>
    </div>
);

// ─── Tag Chip ────────────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove, color = '#C8102E' }) => (
    <div style={{ background: color, border: '2px solid #121417', boxShadow: '2px 2px 0 #121417',
        borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, color: 'white',
        display: 'inline-flex', gap: '6px', alignItems: 'center', fontFamily: NB_FONT }}>
        {label}
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
    </div>
);

// ─── Label ────────────────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
    <div style={{ color: 'rgba(245,208,0,0.7)', fontSize: '11px', fontWeight: 700, marginBottom: '6px', fontFamily: NB_FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{children}</div>
);

// ─── Text Input ──────────────────────────────────────────────────────────────
const TextInput = ({ value, onChange, placeholder, rows }) => {
    const base = { width: '100%', background: '#0b1220', border: '2px solid #1e2d3d', color: '#fff', padding: '10px 12px', borderRadius: '6px', fontFamily: UI_FONT, fontSize: '13px', outline: 'none', resize: rows ? 'vertical' : 'none', boxSizing: 'border-box' };
    return rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={base} />
        : <input value={value} onChange={onChange} placeholder={placeholder} style={{ ...base, resize: undefined }} />;
};

// ─── Design system helper ─────────────────────────────────────────────────────
const getVibeDesignSystem = (selectedVibeIds, vibes) => {
    if (!selectedVibeIds.length) return 'Design vibe not selected — apply your own style preferences.';
    return selectedVibeIds.map(id => {
        const v = vibes.find(x => x.id === id);
        return v ? `[${v.label}]\n  ${v.cssRules}` : '';
    }).filter(Boolean).join('\n\n');
};

// ─── Pascal case helper for component names ────────────────────────────────────
const toPascalCase = str => str.replace(/(?:^|\s|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');

export default function PromptForgeApp() {
    const [step, setStep] = useState(0);
    const [role, setRole] = useState(null);
    const [roleDetail, setRoleDetail] = useState(null);

    // Step 1 — Context
    const [appName, setAppName] = useState('');
    const [problemStatement, setProblemStatement] = useState('');
    const [targetUsers, setTargetUsers] = useState('');
    const [inspiration, setInspiration] = useState('');
    const [hasSimilarApp, setHasSimilarApp] = useState(false);
    const [inspirationUrl, setInspirationUrl] = useState('');
    const [competitors, setCompetitors] = useState('');

    // Step 2 — Features
    const [mustHaveTags, setMustHaveTags] = useState([]);
    const [niceToHaveTags, setNiceToHaveTags] = useState([]);
    const [mustInput, setMustInput] = useState('');
    const [niceInput, setNiceInput] = useState('');
    const [uniqueFeature, setUniqueFeature] = useState('');
    const [techConstraints, setTechConstraints] = useState('');

    // Step 3 — Stack & Vibe
    const [stack, setStack] = useState(['React', 'Vite']);
    const [techDetail, setTechDetail] = useState(null);
    const [styleVibe, setStyleVibe] = useState([]);
    const [vibeDetail, setVibeDetail] = useState(null);
    const [customStyle, setCustomStyle] = useState('');

    const [copied, setCopied] = useState(false);

    const toggleStack = (id) => setStack(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    const toggleVibe = (id) => setStyleVibe(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);

    const addTag = (bucket, input, setBucket, setInput) => {
        const val = input.trim();
        if (!val || bucket.includes(val)) return;
        setBucket(prev => [...prev, val]);
        setInput('');
    };

    const generatePrompt = () => {
        const r = role || { label: 'Senior Fullstack Engineer', skills: ['React', 'Node.js', 'Supabase'] };
        const vibeLabels = styleVibe.map(id => VIBES.find(v => v.id === id)?.label).filter(Boolean);
        const safeAppName = appName || 'MyApp';
        const slug = safeAppName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const useSupabase = stack.includes('Supabase');
        const useAI = stack.some(s => ['OpenAI', 'Claude'].includes(s));
        const componentNames = mustHaveTags.map((f, i) => `${i + 3}. <${toPascalCase(f)} /> — handles ${f.toLowerCase()} feature`);

        return `You are a ${r.label} with deep expertise in ${r.skills.join(', ')}.
Your mission: build a COMPLETE, SHIPPABLE app in ONE session. No half-measures. No "add the rest later."

═══════════════════════════════════════════════════════════════════
VIBE CODING PHILOSOPHY — Ship fast. Iterate daily. Build in public.
Every message should output WORKING CODE, not explanations.
Build the simplest thing that SHIPS. Save clever for v2.
═══════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[R] ROLE + TECH STACK: ${r.label}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please adopt this persona carefully to guide your focus. Every decision you make should align with the expertise of a ${r.label}.

TECH STACK:
${stack.length ? stack.map(t => `► ${t}`).join('\n') : '► React\n► Vite'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[O] OBJECTIVE & CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
App Name:     ${safeAppName}
Problem:      ${problemStatement || '[Solve a real user problem]'}
Target Users: ${targetUsers || '[Define your user clearly]'}
${inspiration ? `Inspiration:  ${inspiration}` : ''}
${inspirationUrl ? `Reference:    ${inspirationUrl}${competitors ? `\n              Improve: ${competitors}` : ''}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[F] FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUST-BUILD FEATURES:
${mustHaveTags.length ? mustHaveTags.map(f => `► ${f}`).join('\n') : '► [Define your core features]'}

NICE TO HAVE (Build after MVP ships):
${niceToHaveTags.length ? niceToHaveTags.map(f => `  · ${f}`).join('\n') : '  · None specified'}

${uniqueFeature ? `UNIQUE DIFFERENTIATOR:\n${uniqueFeature}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[C] CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${techConstraints ? techConstraints : 'No specific constraints defined — use best practices.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vibe: ${vibeLabels.length ? vibeLabels.join(' + ') : 'Your choice — make it beautiful and consistent'}

${getVibeDesignSystem(styleVibe, VIBES)}
${customStyle ? `\nCustom style notes: ${customStyle}` : ''}

Apply the design system GLOBALLY from component 1. Never mix vibes mid-app.
Every component must look like it belongs to the same design language.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT FILE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${slug}/
├── src/
│   ├── components/       ← small, reusable UI pieces (1 file = 1 component)
│   ├── pages/            ← route-level screens
│   ├── lib/
│   │   └── supabase.js   ← Supabase client (if using Supabase)
│   ├── hooks/            ← custom React hooks (useAuth, useData, etc.)
│   ├── utils/            ← pure helper functions
│   ├── App.jsx           ← router + auth listener
│   └── main.jsx          ← entry point
├── public/
├── .env.local            ← NEVER commit this file
├── .gitignore            ← include .env.local
├── package.json
└── vite.config.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES (.env)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Note: We separate variables between \`.env.local\` for development and \`.env.production\` for deployment to keep sensitive data secure.

${useSupabase ? `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here` : '# Add your backend env vars here'}
${useAI ? '\nVITE_OPENAI_API_KEY=sk-your-key-here' : ''}

⚠️  NEVER hardcode secrets. NEVER commit .env.local to Git.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA${useSupabase ? ' (run in Supabase SQL Editor FIRST)' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${useSupabase ? `-- 1. User profiles (extends Supabase auth)
create table if not exists public.${slug}_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  created_at timestamptz default now()
);
alter table public.${slug}_profiles enable row level security;
create policy "Users can view own profile"
  on public.${slug}_profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.${slug}_profiles for update using (auth.uid() = id);

-- 2. Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.${slug}_profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Feature tables — add one table per must-have feature:
-- TODO: Create tables for: ${mustHaveTags.join(', ') || 'your features here'}
-- Pattern: create table public.${slug}_<feature_name> (id uuid, user_id uuid references ${slug}_profiles, ...);` : `-- Configure your database schema based on your chosen backend.
-- Create tables for: ${mustHaveTags.join(', ') || 'your core features'}`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY COMPONENTS — BUILD IN THIS ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. <App /> — routing setup + ${useSupabase ? 'Supabase auth state listener' : 'global state provider'}
2. <AuthForm /> — login + signup with error handling
${componentNames.length ? componentNames.join('\n') : '3. <Dashboard /> — main app screen\n4. <EmptyState /> — shown when no data yet'}
${mustHaveTags.length + 3}. <LoadingSpinner /> — consistent loading UI
${mustHaveTags.length + 4}. <ErrorBoundary /> — graceful error handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[O] OUTPUT FORMAT & BUILD SEQUENCE — FOLLOW EXACTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT LAYERING (Crucial): Do not build everything at once. We will separate implementation layer by layer.
Focus on one single isolated element at a time to ensure high clarity and no ambiguity.
STEP 1 → CONFIRM UNDERSTANDING
  · Restate the app brief in 2 sentences
  · List the 3 most important technical decisions
  · Ask ONE clarifying question if anything is ambiguous
  · Wait for builder confirmation before proceeding

STEP 2 → SCAFFOLD
  · Run: npm create vite@latest ${slug} -- --template react
  · Install: ${stack.filter(s => !['React', 'Vite'].includes(s)).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')).join(' ')}
  · Set up .env.local with the env vars above
  · Output: complete App.jsx with routing skeleton

STEP 3 → AUTH FIRST
  · Implement complete auth flow (login, signup, logout)
  · ${useSupabase ? 'Wire up Supabase auth + profile auto-creation' : 'Implement auth with your chosen backend'}
  · Test: user can sign up, log in, see their profile, log out

STEP 4 → BUILD CORE FEATURE
  · Start with the FIRST must-have feature: ${mustHaveTags[0] || 'your primary feature'}
  · Write complete, working code — no TODOs, no placeholders
  · Include: component + data layer + error states + loading states
  · Test before moving to next feature

STEP 5 → REMAINING FEATURES
  · Build each remaining feature one at a time
  · After each: confirm it works before proceeding
  · Must-haves: ${mustHaveTags.join(', ') || 'your features'}

STEP 6 → DESIGN POLISH
  · Apply ${vibeLabels.length ? vibeLabels.join(' + ') : 'the design vibe'} globally
  · Mobile-first responsiveness (test at 375px width)
  · Add loading skeletons, empty states, error messages
  · Verify: every state (loading / empty / error / success) looks intentional

STEP 7 → SHIP
  · npm run build — fix any build errors
  · git init && git add . && git commit -m "feat: initial ${slug} build"
  · Push to GitHub → deploy on Vercel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  ALWAYS provide COMPLETE code. Never say "add the rest of your code here."
2.  If something needs a .env variable, state it explicitly with the exact key name.
3.  Prefer boring, proven solutions over clever ones.
4.  Think mobile-first in EVERY UI decision. Test at 375px.
5.  Ship the MVP. Save perfection for v2.
6.  Build every component as its OWN file — no 500-line mega components.
7.  After each component: show exactly how to test it in the browser.
8.  Enable ${useSupabase ? 'Supabase RLS' : 'backend auth'} from day 1 — NEVER skip security.
9.  One feature at a time — finish and test before the next.
10. At end of session: output the complete deploy checklist below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOY CHECKLIST (copy-paste when ready)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ npm run build  →  confirm 0 errors
□ git init && git add . && git commit -m "feat: ${slug} v1.0"
□ gh repo create ${slug} --public --source=. --push
□ Go to vercel.com → New Project → Import GitHub repo
□ Add env vars in Vercel: Project → Settings → Environment Variables
□ Click Deploy → get live URL in < 2 minutes
□ Test live URL on mobile (375px)
□ Share your link — you shipped!

═══════════════════════════════════════════════════════════════════
Built with Prompt Forge — Based on ROFCO Framework
"Developer yang mahir prompting akan berada di hadapan." – Ajwad
═══════════════════════════════════════════════════════════════════`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatePrompt());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetAll = () => {
        setStep(0); setRole(null); setAppName(''); setProblemStatement('');
        setTargetUsers(''); setInspiration(''); setHasSimilarApp(false);
        setInspirationUrl(''); setCompetitors(''); setMustHaveTags([]);
        setNiceToHaveTags([]); setUniqueFeature(''); setTechConstraints('');
        setStack(['React', 'Vite']); setStyleVibe([]); setCustomStyle('');
    };

    return (
        <div style={{ padding: '20px', color: '#fff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontFamily: UI_FONT }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px dashed rgba(245,208,0,0.2)' }}>
                <div style={{ background: '#F5D000', color: '#0b1220', padding: '10px', borderRadius: '10px', border: '3px solid #121417', boxShadow: '4px 4px 0 #121417', flexShrink: 0 }}>
                    <Wand2 size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#F5D000', margin: 0, fontFamily: NB_FONT }}>[ PROMPT_FORGE: FRAMEWORK ROFCO ]</h2>
                    <p style={{ margin: '3px 0 0', color: 'rgba(245,208,0,0.45)', fontSize: '12px' }}>"Developer yang mahir prompting akan berada di hadapan." – Ajwad</p>
                </div>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', alignItems: 'center' }}>
                {STEPS.map((s, idx) => (
                    <React.Fragment key={s}>
                        <div style={{ flex: 1 }}>
                            <div style={{ height: '6px', background: idx <= step ? '#F5D000' : '#1a2840', borderRadius: '3px', border: '1px solid #121417', transition: 'background 0.3s' }} />
                            <div style={{ fontSize: '9px', color: idx <= step ? '#F5D000' : 'rgba(255,255,255,0.25)', marginTop: '4px', textAlign: 'center', fontWeight: 700, letterSpacing: '0.02em' }}>{s.toUpperCase()}</div>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* ── STEP 0: Assign AI Role + Tech Stack ───────────────────────────── */}
            {step === 0 && (
                <div style={{ flex: 1 }}>
                    <TipCard title="R - ROLE + TECH STACK">
                        Define the role of the AI and the tech stack for the project. The role guides the AI's focus and expertise, while the tech stack defines the tools and technologies to build with.
                    </TipCard>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#F5D000', marginBottom: '6px', fontFamily: NB_FONT }}>1. ROLE + STACK (R) - AI PERSONA & TOOLS</h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '16px' }}>Select the persona the AI should adopt. Click a card for details.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {ROLES.map(r => (
                            <div key={r.id}
                                onClick={() => setRole(r)}
                                onDoubleClick={() => setRoleDetail(r)}
                                style={{
                                    padding: '14px 12px', borderRadius: '10px', cursor: 'pointer',
                                    background: role?.id === r.id ? r.color + '22' : '#0b1220',
                                    border: role?.id === r.id ? `2px solid ${r.color}` : '2px solid #1e2d3d',
                                    boxShadow: role?.id === r.id ? `3px 3px 0 ${r.color}` : '2px 2px 0 #121417',
                                    transition: 'all 0.15s',
                                }}>
                                {/* Icon badge */}
                                <div style={{ width: 32, height: 32, background: r.color + '22', border: `1.5px solid ${r.color}55`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                    <r.Icon size={16} color={r.color} strokeWidth={2} />
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: role?.id === r.id ? r.color : '#e2e8f0', lineHeight: 1.3, marginBottom: '4px' }}>{r.label}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{r.bestFor}</div>
                                <button onClick={e => { e.stopPropagation(); setRoleDetail(r); }}
                                    style={{ marginTop: '8px', background: 'none', border: `1px solid ${r.color}44`, color: r.color, borderRadius: '4px', fontSize: '9px', padding: '2px 7px', cursor: 'pointer', fontWeight: 700 }}>
                                    DETAILS →
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Tech Stack section within Role */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed rgba(245,208,0,0.15)' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#F5D000', marginBottom: '12px', fontFamily: NB_FONT }}>⚡ TECH STACK</h4>
                        {TECH_CATEGORIES.map(cat => (
                            <div key={cat.label} style={{ marginBottom: '12px' }}>
                                <FieldLabel>{cat.label}</FieldLabel>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                    {cat.options.map(tech => (
                                        <div key={tech.id} style={{ display: 'flex', gap: '2px' }}>
                                            <button onClick={() => toggleStack(tech.id)}
                                                style={{ padding: '6px 12px', background: stack.includes(tech.id) ? '#F5D000' : '#0d1928',
                                                    color: stack.includes(tech.id) ? '#0b1220' : 'rgba(255,255,255,0.55)',
                                                    border: stack.includes(tech.id) ? '2px solid #121417' : '2px solid #1e2d3d',
                                                    boxShadow: stack.includes(tech.id) ? '2px 2px 0 #121417' : 'none',
                                                    borderRadius: '20px 0 0 20px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: UI_FONT }}>
                                                {tech.id}
                                            </button>
                                            <button onClick={() => setTechDetail(tech)}
                                                style={{ padding: '6px 8px', background: '#0d1928', color: 'rgba(255,255,255,0.35)',
                                                    border: '2px solid #1e2d3d', borderLeft: 'none',
                                                    borderRadius: '0 20px 20px 0', cursor: 'pointer', fontSize: '11px' }}>ℹ</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Role detail popup */}
                    {roleDetail && (
                        <Popup onClose={() => setRoleDetail(null)}>
                            <div style={{ width: 44, height: 44, background: roleDetail.color + '22', borderRadius: '12px', border: `2px solid ${roleDetail.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                <roleDetail.Icon size={24} color={roleDetail.color} strokeWidth={2} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, color: roleDetail.color, marginBottom: '8px', fontFamily: NB_FONT }}>{roleDetail.label}</h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '12px' }}>{roleDetail.description}</p>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '6px' }}>Best For</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{roleDetail.bestFor}</div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '8px' }}>Skills</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {roleDetail.skills.map(s => (
                                        <span key={s} style={{ background: roleDetail.color + '22', border: `1px solid ${roleDetail.color}55`, color: roleDetail.color, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>{s}</span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => { setRole(roleDetail); setRoleDetail(null); }}
                                style={{ width: '100%', padding: '12px', background: roleDetail.color, color: 'white', border: '2px solid #121417', boxShadow: '3px 3px 0 #121417', borderRadius: '8px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', fontFamily: NB_FONT }}>
                                SELECT THIS ROLE ✓
                            </button>
                        </Popup>
                    )}

                    {/* Tech detail popup */}
                    {techDetail && (
                        <Popup onClose={() => setTechDetail(null)}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#F5D000', marginBottom: '8px', fontFamily: NB_FONT }}>{techDetail.id}</h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '12px' }}>{techDetail.desc}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ background: '#0b1220', padding: '10px', borderRadius: '8px', border: '1px solid #166534' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', marginBottom: '4px' }}>Pros</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{techDetail.pros}</div>
                                </div>
                                <div style={{ background: '#0b1220', padding: '10px', borderRadius: '8px', border: '1px solid #7f1d1d' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>Cons</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{techDetail.cons}</div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '4px' }}>Best For</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{techDetail.bestFor}</div>
                            </div>
                            <a href={techDetail.docs} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                                <ExternalLink size={14} /> View Docs
                            </a>
                        </Popup>
                    )}
                </div>
            )}

            {/* ── STEP 1: Define Context & MVP ──────────────────────────────────── */}
            {step === 1 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TipCard title="O - OBJECTIVE">
                        Clearly state the objective of your prompt. This ensures the AI understands the core goal, leading to much more accurate and relevant responses. Treat this prompt as a specification document for the AI.
                    </TipCard>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#F5D000', marginBottom: '0', fontFamily: NB_FONT }}>2. OBJECTIVE (O) - DEFINE CONTEXT & GOAL</h3>

                    <div>
                        <FieldLabel>App Name</FieldLabel>
                        <TextInput value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g. InvoiceSnap, StudyBuddy, SprintOS" />
                    </div>

                    <div>
                        <FieldLabel>What problem does this solve?</FieldLabel>
                        <TextInput value={problemStatement} onChange={e => setProblemStatement(e.target.value)} placeholder="e.g. Freelancers in SEA struggle to send professional invoices without complex software..." rows={3} />
                    </div>

                    <div>
                        <FieldLabel>Who is your target user?</FieldLabel>
                        <TextInput value={targetUsers} onChange={e => setTargetUsers(e.target.value)} placeholder="e.g. Freelancers in Southeast Asia who need to track invoices on mobile" rows={2} />
                    </div>

                    <div>
                        <FieldLabel>What inspired this idea?</FieldLabel>
                        <TextInput value={inspiration} onChange={e => setInspiration(e.target.value)} placeholder="e.g. I noticed that existing tools are too complex for non-tech users..." rows={2} />
                    </div>

                    <div>
                        <FieldLabel>Similar app for reference?</FieldLabel>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: hasSimilarApp ? '10px' : 0 }}>
                            {['Yes', 'No'].map(opt => (
                                <button key={opt} onClick={() => setHasSimilarApp(opt === 'Yes')}
                                    style={{ padding: '7px 18px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                        background: (hasSimilarApp ? 'Yes' : 'No') === opt ? '#F5D000' : '#0d1928',
                                        color: (hasSimilarApp ? 'Yes' : 'No') === opt ? '#0b1220' : 'rgba(255,255,255,0.55)',
                                        border: (hasSimilarApp ? 'Yes' : 'No') === opt ? '2px solid #F5D000' : '2px solid #1e2d3d' }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {hasSimilarApp && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#0d1928', borderRadius: '8px', border: '1px solid #1a2840' }}>
                                <TextInput value={inspirationUrl} onChange={e => setInspirationUrl(e.target.value)} placeholder="Paste their URL (e.g. https://linear.app)" />
                                <TextInput value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="What do you want to replicate or improve?" rows={2} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── STEP 2: Features ──────────────────────────────────────────────── */}
            {step === 2 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <TipCard title="F - FEATURES">
                        Detail specific capabilities needed to fulfill project objectives. List all must-have and nice-to-have features to give the AI a clear picture of what to build.
                    </TipCard>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#F5D000', marginBottom: '0', fontFamily: NB_FONT }}>3. FEATURES (F)</h3>

                    {/* Must Have */}
                    <div>
                        <FieldLabel>Must Have Features</FieldLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
                            {mustHaveTags.map(tag => <Chip key={tag} label={tag} onRemove={() => setMustHaveTags(prev => prev.filter(t => t !== tag))} color="#C8102E" />)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={mustInput} onChange={e => setMustInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(mustHaveTags, mustInput, setMustHaveTags, setMustInput); } }}
                                placeholder="e.g. User Auth, Dashboard... (Enter to add)"
                                style={{ flex: 1, background: '#0b1220', border: '2px solid #C8102E', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: UI_FONT }} />
                            <button onClick={() => addTag(mustHaveTags, mustInput, setMustHaveTags, setMustInput)}
                                style={{ padding: '8px 14px', background: '#C8102E', color: 'white', border: '2px solid #121417', boxShadow: '2px 2px 0 #121417', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>+</button>
                        </div>
                    </div>

                    {/* Nice to Have */}
                    <div>
                        <FieldLabel>Nice to Have Features</FieldLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
                            {niceToHaveTags.map(tag => <Chip key={tag} label={tag} onRemove={() => setNiceToHaveTags(prev => prev.filter(t => t !== tag))} color="#1e2d3d" />)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={niceInput} onChange={e => setNiceInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(niceToHaveTags, niceInput, setNiceToHaveTags, setNiceInput); } }}
                                placeholder="e.g. Dark Mode, Export PDF... (Enter to add)"
                                style={{ flex: 1, background: '#0b1220', border: '2px solid #1e2d3d', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: UI_FONT }} />
                            <button onClick={() => addTag(niceToHaveTags, niceInput, setNiceToHaveTags, setNiceInput)}
                                style={{ padding: '8px 14px', background: '#1e2d3d', color: 'white', border: '2px solid #121417', boxShadow: '2px 2px 0 #121417', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>+</button>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>What makes this app unique?</FieldLabel>
                        <TextInput value={uniqueFeature} onChange={e => setUniqueFeature(e.target.value)} placeholder="e.g. AI-generated invoice summaries, voice input, works fully offline..." rows={2} />
                    </div>
                </div>
            )}

            {/* ── STEP 3: Constraints ────────────────────────────────────────────── */}
            {step === 3 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <TipCard title="C - CONSTRAINTS">
                        Add constraints to focus the AI. Avoid ambiguity in your queries to get cleaner results. Constraints guide the boundary of development and prevent scope creep.
                    </TipCard>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#F5D000', marginBottom: '0', fontFamily: NB_FONT }}>4. CONSTRAINTS (C)</h3>

                    <div>
                        <FieldLabel>Technical constraints or requirements</FieldLabel>
                        <TextInput value={techConstraints} onChange={e => setTechConstraints(e.target.value)} placeholder="e.g. Must work offline, under 5MB bundle, no third-party auth, must support RTL..." rows={4} />
                    </div>

                    {/* Design Vibe */}
                    <div>
                        <FieldLabel>Design Vibe (select all that apply)</FieldLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {VIBES.map(vibe => (
                                <div key={vibe.id} style={{ display: 'flex', gap: '2px' }}>
                                    <button onClick={() => toggleVibe(vibe.id)}
                                        style={{ flex: 1, padding: '8px 10px', textAlign: 'left',
                                            background: styleVibe.includes(vibe.id) ? vibe.bg : '#0b1220',
                                            border: styleVibe.includes(vibe.id) ? `2px solid ${vibe.accent}` : '2px solid #1e2d3d',
                                            borderRadius: '8px 0 0 8px', cursor: 'pointer',
                                            boxShadow: styleVibe.includes(vibe.id) ? `2px 2px 0 ${vibe.accent}` : 'none' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: styleVibe.includes(vibe.id) ? vibe.accent : 'rgba(255,255,255,0.55)' }}>{vibe.label}</div>
                                    </button>
                                    <button onClick={() => setVibeDetail(vibe)}
                                        style={{ padding: '8px 10px', background: '#0b1220', color: 'rgba(255,255,255,0.35)',
                                            border: '2px solid #1e2d3d', borderLeft: 'none',
                                            borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: '11px' }}>ℹ</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Additional style notes</FieldLabel>
                        <TextInput value={customStyle} onChange={e => setCustomStyle(e.target.value)} placeholder="e.g. Use Inter font, keep primary color #C8102E, no animations on mobile..." />
                    </div>

                    {/* Vibe detail popup */}
                    {vibeDetail && (
                        <Popup onClose={() => setVibeDetail(null)}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, color: vibeDetail.accent, marginBottom: '8px', fontFamily: NB_FONT }}>{vibeDetail.label}</h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '12px' }}>{vibeDetail.desc}</p>
                            <div style={{ background: '#000', border: `1px solid ${vibeDetail.accent}`, borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '6px' }}>Style Reference</div>
                                <pre style={{ color: vibeDetail.accent, fontSize: '11px', fontFamily: NB_FONT, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{vibeDetail.preview}</pre>
                            </div>
                            <button onClick={() => { toggleVibe(vibeDetail.id); setVibeDetail(null); }}
                                style={{ width: '100%', padding: '12px', background: styleVibe.includes(vibeDetail.id) ? '#1e2d3d' : vibeDetail.accent, color: styleVibe.includes(vibeDetail.id) ? '#fff' : '#000', border: '2px solid #121417', boxShadow: '3px 3px 0 #121417', borderRadius: '8px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', fontFamily: NB_FONT }}>
                                {styleVibe.includes(vibeDetail.id) ? 'REMOVE VIBE ✕' : 'SELECT THIS VIBE ✓'}
                            </button>
                        </Popup>
                    )}
                </div>
            )}



            {/* ── STEP 4: Master Prompt Output ─────────────────────────────────── */}
            {step === 4 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <TipCard title="O - OUTPUT FORMAT">
                        <strong>Prompt Layering:</strong> Don't ask everything at once! Layer your prompts. Focus on one element at a time to keep interactions natural and prompts clear.
                    </TipCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#22c55e', margin: 0, fontFamily: NB_FONT }}>5. OUTPUT (O) - MASTER PROMPT</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={copyToClipboard}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: copied ? '#22c55e' : '#F5D000',
                                    color: '#0b1220', border: '2px solid #121417', boxShadow: '3px 3px 0 #121417',
                                    padding: '8px 14px', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', fontFamily: NB_FONT, fontSize: '12px' }}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'COPIED!' : 'COPY PROMPT'}
                            </button>
                            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0b1220', color: '#F5D000',
                                    border: '2px solid #F5D000', boxShadow: '3px 3px 0 #F5D000',
                                    padding: '8px 14px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '12px' }}>
                                <ExternalLink size={13} /> Open Claude.ai
                            </a>
                        </div>
                    </div>
                    <div style={{ background: '#0b1220', padding: '16px', borderRadius: '8px', border: '2px solid #1e2d3d',
                        color: '#e2e8f0', fontFamily: NB_FONT, whiteSpace: 'pre-wrap', fontSize: '11.5px', lineHeight: 1.7,
                        flex: 1, overflowY: 'auto', maxHeight: '420px' }}>
                        {generatePrompt()}
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#0d1928', borderRadius: '8px', border: '1px solid #1a2840', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'rgba(245,208,0,0.7)' }}>How to use:</strong> Copy → Open Claude.ai via Antigravity → Paste as your first message → Follow the 7-step build guide. Claude will confirm each step before writing code.
                    </div>
                </div>
            )}

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed rgba(245,208,0,0.2)', gap: '12px' }}>
                <button disabled={step === 0} onClick={() => setStep(prev => Math.max(0, prev - 1))}
                    style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent',
                        color: step === 0 ? 'rgba(255,255,255,0.2)' : '#F5D000', border: '2px solid', borderColor: step === 0 ? '#1a2840' : '#F5D000',
                        borderRadius: '8px', fontWeight: 900, cursor: step === 0 ? 'not-allowed' : 'pointer', fontFamily: NB_FONT, fontSize: '13px' }}>
                    <ChevronLeft size={16} /> BACK
                </button>

                {step < 4 ? (
                    <button onClick={() => setStep(prev => Math.min(4, prev + 1))}
                        style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: '6px', background: '#F5D000',
                            color: '#0b1220', border: '2px solid #121417', boxShadow: '3px 3px 0 #121417',
                            borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontFamily: NB_FONT, fontSize: '13px' }}>
                        NEXT <ChevronRight size={16} />
                    </button>
                ) : (
                    <button onClick={resetAll}
                        style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: '6px', background: '#0d1928',
                            color: '#fff', border: '2px solid #1e2d3d', boxShadow: '2px 2px 0 #121417',
                            borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontFamily: NB_FONT, fontSize: '13px' }}>
                        RESET FORGE
                    </button>
                )}
            </div>
        </div>
    );
}
