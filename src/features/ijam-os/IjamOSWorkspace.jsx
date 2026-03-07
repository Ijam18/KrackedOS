import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Home,
    Globe, Server,
    Sparkles,
    Brain,
    Database,
    Github,
    Rocket,
    ArrowRight,
    ArrowLeft,
    ExternalLink,
    BookOpen,
    Users,
    Bot,
    Terminal,
    SendHorizontal,
    CheckCircle2,
    Lightbulb,
    Folder,
    User,
    Settings,
    Power,
    Trash2,
    Gamepad2,
    Search,
    Activity,
    Waypoints,
    Wand2,
    Wifi,
    Bluetooth,
    SlidersHorizontal,
    SunMedium,
    Volume2,
    MoonStar
} from 'lucide-react';
import { callNvidiaLLM, localIntelligence, ZARULIJAM_SYSTEM_PROMPT } from '../../lib/nvidia';
import { useWeather } from '../../utils/useWeather';
import { useSoundEffects } from '../../utils/useSoundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import IjamBotMascot from '../../components/IjamBotMascot';
import MobileStatusBar from '../../components/MobileStatusBar';
import { useIjamOSWindowManager } from './hooks/useIjamOSWindowManager';
import { APP_REGISTRY } from './constants/appRegistry';
import KrackedInteractiveLoading from './components/loading/KrackedInteractiveLoading';

const BuilderStudioLocal = lazy(() => import('./components/BuilderStudioLocal'));
const VibeSimulator = lazy(() => import('../../components/simulator/VibeSimulator'));
const MindMapperApp = lazy(() => import('../../components/mindmapper/MindMapperApp'));
const PromptForgeApp = lazy(() => import('../../components/promptforge/PromptForgeApp'));
const KrackedMissionConsole = lazy(() => import('./components/windows/KrackedMissionConsole'));
const KrackedIjamTerminal = lazy(() => import('./components/windows/KrackedIjamTerminal'));
const KrackedKdAcademy = lazy(() => import('./components/windows/KrackedKdAcademy'));

function WindowModuleLoader({ label, background = '#0b1220' }) {
    return (
        <div
            style={{
                height: '100%',
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background,
                color: '#f8fafc',
                fontFamily: 'monospace'
            }}
        >
            <div
                style={{
                    border: '1px solid rgba(245,208,0,0.28)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    background: 'rgba(15,23,42,0.76)',
                    boxShadow: '4px 4px 0 rgba(11,18,32,0.85)',
                    textAlign: 'center'
                }}
            >
                <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#f5d000', fontWeight: 900 }}>
                    LOADING_MODULE
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700 }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

const LESSONS_IJAM = [
    {
        id: "function-over-form",
        icon: Activity,
        title: "Buat App Berfungsi Dulu, Cantik Kemudian",
        stage: "Builder Mindset",
        summary: "Jangan buang masa 10 jam pilih warna kalau tiang utama app tu belum wujud. Fokus pada Core Feature.",
        eli5: "Macam bina rumah, pastikan tapak kukuh dan bumbung tak bocor dulu. Bab warna cat dinding dan langsir tu boleh fikir kemudian.",
        steps: [
            "Tentukan 1 Core Problem yang app kau nak selesaikan.",
            "Bina Core Feature (Minimum Viable Product).",
            "Guna layout default/hitam putih dulu masa tengah buat logic.",
            "Pastikan flow (klik -> loading -> masuk database) berjaya.",
            "Selepas logic 100% jalan, baru masukkan \"Vibe\" (animasi, Neo-brutalist style, warna)."
        ],
        linkLabel: "Buka Mind Mapper",
        linkUrl: ""
    },
    {
        id: "app-vibe-quality",
        icon: Sparkles,
        title: "Resipi App Yang Sedap & \"Vibey\"",
        stage: "Builder Mindset",
        summary: "App yang baik bukan sekadar cantik, tapi responsif, laju, dan bagi maklum balas jelas kat user.",
        eli5: "Pernah tekan butang bas tapi loceng tak bunyi? Mesti kau tekan banyak kali kan? App pun sama, kena ada feedback bila ditekan.",
        steps: [
            "Feedback Cepat: Setiap butang mesti ada \"Hover\" state dan \"Loading\" state.",
            "Kurangkan Klik: Kalau boleh settle dalam 1 screen, jangan paksa user lalu 3 page.",
            "Error Handling: Jangan bagi screen putih. Kalau error, tunjuk mesej mesra.",
            "Konsistensi UI: Guna sistem warna dan font yang selaras di semua page."
        ],
        linkLabel: "Buka Simulator",
        linkUrl: ""
    },
    {
        id: "system-thinking",
        icon: Brain,
        title: "Pecahkan Idea Besar Jadi Sistem Kecil",
        stage: "Builder Mindset",
        summary: "Bila nampak idea tu besar sangat, kau akan jam. Seninya adalah pecahkan idea tu kepada bahagian-bahagian kecil.",
        eli5: "Nak makan pizza sebiji besar sekaligus memang tercekik. Kena potong 8 slice, makan satu-satu. App pun sama, potong ikut jadual.",
        steps: [
            "Asingkan Frontend (Apa user nampak: UI, Warna, Butang).",
            "Asingkan Backend/Logic (Apa sistem buat: Save profile, kira markah).",
            "Asingkan Database (Di mana data disimpan: Supabase / Storage).",
            "Selesaikan satu persatu masa prompt AI nanti. Jangan campur adukkan frontend dan backend dalam satu prompt minta AI buat semua."
        ],
        linkLabel: "Buka Simulator",
        linkUrl: ""
    },
    {
        id: "user-centric-empathy",
        icon: Users,
        title: "Bina Untuk User, Bukan Untuk Ego Sendiri",
        stage: "Builder Mindset",
        summary: "Ramai builder syok sendiri letak 100 features yang user tak peduli pun. Kenal pasti siapa guna app kau.",
        eli5: "Kalau kau buat kasut untuk budak main bola, jangan pasang roda kat kasut tu sebab kau rasa cool. Buat benda yang diorang betul-betul perlukan.",
        steps: [
            "Letakkan diri kau di tempat pengguna. Adakah app ni menyenangkan diorang?",
            "Pastikan teks boleh dibaca (kontras warna yang tinggi).",
            "Kurangkan borang yang panjang. Tanya apa yang penting sahaja.",
            "Test app kat handphone sendiri sebab 80% user guna mobile."
        ],
        linkLabel: "Buka Simulator",
        linkUrl: ""
    },
    {
        id: "creativity-constraints",
        icon: BookOpen,
        title: "Jadi Kreatif Dalam Keterbatasan",
        stage: "Builder Mindset",
        summary: "Kau tak perlukan bajet bebilion atau kemahiran coding 10 tahun untuk buat app yang power. Guna AI sebagai lever.",
        eli5: "Orang yang power masak boleh hasilkan makanan sedap walaupun cuma ada telur dan kicap. Builder yang power guna limitasi AI sebagai peluang.",
        steps: [
            "Guna aset open-source (Lucide Icons, Tailwind UI).",
            "Bila ChatGPT \"lupa\" kod kau, ingatkan dia atau bagi \"Master Prompt\" semula.",
            "Jangan mengalah bila naik error merah; itu tandanya kau \"on the right track\".",
            "Kalau feature susah nak buat, tukar ke feature mudah yang capai matlamat sama."
        ],
        linkLabel: "Buka Prompt Forge",
        linkUrl: ""
    },
    {
        id: "setup-environment",
        icon: Sparkles,
        title: "Install Node.js + Antigravity (First Setup)",
        stage: "Foundation",
        summary: "Ni setup paling basic sebelum mula vibe coding dengan lancar.",
        eli5: "Node.js ni macam enjin kereta. Antigravity pula co-pilot AI kau. Kalau enjin takde, kereta tak jalan.",
        steps: [
            "Install Node.js LTS dari website rasmi.",
            "Buka terminal, check `node -v` dan `npm -v`.",
            "Install/open Antigravity ikut panduan platform kau.",
            "Dalam project folder, run `npm install`.",
            "Run `npm run dev` dan pastikan website boleh hidup."
        ],
        linkLabel: "Buka Node.js Download",
        linkUrl: "https://nodejs.org/en/download"
    },
    {
        id: "setup-ai-api-key",
        icon: Brain,
        title: "Dapatkan API Key AI & Pasang di Antigravity",
        stage: "Foundation",
        summary: "Penting: Manage token API korang supaya tak mahal. OpenRouter paling jimat untuk guna semua model.",
        eli5: "API Key ni macam kad pengenalan. Korang boleh guna Groq (laju & murah) atau NVIDIA LLM. OpenRouter pula act macam wallet prepaid untuk bayar semua model.",
        steps: [
            "Buka platform pilihan: Groq (Percuma/Murah), NVIDIA LLM, atau OpenRouter (Jimat).",
            "Register akaun dan ambil 'API Keys'.",
            "Buka VSCode/Cursor, pergi bahagian settings Antigravity.",
            "Paste API key dan pilih model.",
            "Elakkan guna Opus/Sonnet untuk benda simple sebab mahal token."
        ],
        linkLabel: "Dapatkan Groq API Key",
        linkUrl: "https://console.groq.com/keys"
    },
    {
        id: "chatgpt-personality",
        icon: Users,
        title: "Set Up Personality ChatGPT",
        stage: "Ideation",
        summary: "Ajar ChatGPT jadi pakar sebelum kau tanya teknikal.",
        eli5: "Macam kau lantik Manager. Mula-mula bagi dia title 'Senior UI Engineer & PM', baru instruction dia mantap.",
        steps: [
            "Buka ChatGPT.",
            "Tulis prompt: 'You are an expert React UI Engineer and Product Manager...'",
            "Ceritakan idea app kau secara ringkas.",
            "Minta dia suggest features dan UX flow sebelum buat apa-apa.",
            "Bincang sampai idea tu solid."
        ],
        linkLabel: "Buka ChatGPT",
        linkUrl: "https://chat.openai.com"
    },
    {
        id: "chatgpt-master-prompt",
        icon: BookOpen,
        title: "Generate The Master Prompt",
        stage: "Ideation",
        summary: "Tukar idea jadi satu arahan lengkap untuk Antigravity.",
        eli5: "Bila idea dah confirm, kau suruh ChatGPT rumuskan jadi satu pelan tindakan (blueprint) yang lengkap untuk AI lain baca.",
        steps: [
            "Bila brainstorm dah siap di ChatGPT.",
            "Minta ChatGPT: 'Summarize everything we discussed into ONE single master prompt for an AI coding assistant (like Claude 3) to build this app.'",
            "Pastikan prompt tu ada details UI, warna, layout, dan data structure.",
            "Copy Master Prompt tu."
        ],
        linkLabel: "Buka ChatGPT",
        linkUrl: "https://chat.openai.com"
    },
    {
        id: "antigravity-sonnet",
        icon: Rocket,
        title: "Paste Master Prompt ke Antigravity",
        stage: "Vibe Coding",
        summary: "Pilih model yang tepat dan mula bina aplikasi. Sonnet untuk architect, Gemini untuk visual.",
        eli5: "Antigravity ada banyak AI. Claude 3.5 Sonnet = Senior Engineer (steady). Opus = KrackedDev (power gila). Gemini Pro = Junior (cepat). Gemini Flash = UI Designer. Gemini 3.1 = High-Performance All Rounder.",
        steps: [
            "Buka Antigravity dalam project folder.",
            "Pilih AI model yang sesuai: Claude 3.5 Sonnet atau Gemini 3.1 (all-rounder).",
            "Paste Master Prompt dari ChatGPT tadi.",
            "Tekan Enter dan tunggu AI siapkan struktur website dan component.",
            "Kalau nak tukar warna/padding UI, switch ke Gemini Flash (Designer)."
        ],
        linkLabel: "Buka Antigravity Docs",
        linkUrl: "https://antigravity.id"
    },
    {
        id: "github-repo-setup",
        icon: Github,
        title: "Push Code ke GitHub",
        stage: "Versioning",
        summary: "Save code secara cloud supaya tak hilang dan boleh deploy.",
        eli5: "GitHub ni macam Google Drive tapi khas untuk code. Kau 'push' code ke sana untuk simpan secara kekal.",
        steps: [
            "Buka browser dan create GitHub repo baru.",
            "Dalam terminal VSCode, run: `git init`.",
            "Run: `git add .` lepas tu `git commit -m 'initial commit'`.",
            "Penting: Belajar beza `git pull` (tarik code turun) dan `git fetch`.",
            "Run command `git push -u origin main` untuk upload semua code asal ke branch utama (main)."
        ],
        linkLabel: "Buka GitHub",
        linkUrl: "https://github.com"
    },
    {
        id: "vercel-deploy",
        icon: Rocket,
        title: "Deploy ke Vercel",
        stage: "Launch",
        summary: "Pancarkan website kau ke internet. Paste Vercel URL dalam terminal ni untuk dapat Trophy!",
        eli5: "Dalam local, kau je nampak website tu. Vercel akan ambil code dari GitHub dan letak kat server awam.",
        steps: [
            "Create akaun Vercel guna GitHub.",
            "Import repo yang kau baru push tadi.",
            "Biarkan settings default dan tekan Deploy.",
            "Bila dah siap, copy URL `.vercel.app` tu.",
            "PASTE URL TU DALAM TERMINAL INI tekan ENTER untuk complete task!"
        ],
        linkLabel: "Buka Vercel",
        linkUrl: "https://vercel.com"
    },
    {
        id: "vercel-analytics",
        icon: Users,
        title: "Pasang Vercel Analytics",
        stage: "Launch",
        summary: "Track visitor website secara percuma dan mudah.",
        eli5: "Macam pasang CCTV kat kedai, kau boleh nampak berapa orang masuk dan dari mana diorang datang.",
        steps: [
            "Dalam Vercel dashboard, pergi tab Analytics dan klik Enable.",
            "Dalam terminal VSCode, run: `npm i @vercel/analytics`.",
            "Import dan letak component `<Analytics />` dalam fail utama app (contoh: `App.jsx` atau `main.jsx`).",
            "Commit dan push ke GitHub (Vercel akan auto-deploy).",
            "Sekarang kau boleh tengok graf traffic kat Vercel dashboard."
        ],
        linkLabel: "Vercel Analytics Guide",
        linkUrl: "https://vercel.com/docs/analytics/quickstart"
    },
    {
        id: "supabase-setup",
        icon: Database,
        title: "Cipta Database Supabase",
        stage: "Database",
        summary: "Bina database cloud. PENTING: Faham beza Anon Key dan Service Role Key.",
        eli5: "Bila buat akaun login atau simpan data form, kau perlukan backend database. Supabase paling senang untuk mula.",
        steps: [
            "Buat project kat Supabase, tunggu 2-3 minit server setup.",
            "Pergi ke Project Settings > API.",
            "Copy `Project URL` dan `anon - public` key.",
            "AMARAN: Jangan sekali-kali expose `service_role` key! Berbahaya!",
            "Buat file `.env.local` dan masukkan keys tersebut."
        ],
        linkLabel: "Buka Supabase",
        linkUrl: "https://supabase.com"
    },
    {
        id: "supabase-sql",
        icon: Database,
        title: "Run SQL Query & Bina Table",
        stage: "Database",
        summary: "Cara paling cepat cipta struktur kotak data guna AI dan SQL.",
        eli5: "Dari buat table satu per satu pakai mouse, suruh AI generate script SQL, paste dalam Supabase, dan siap sepenip mata.",
        steps: [
            "Minta Antigravity: 'Generate a Supabase SQL query to create a users table with name and email'.",
            "Dalam Supabase dashboard, pergi ke SQL Editor (icon terminal kilat).",
            "Klik New Query, paste code tadi dan tekan RUN.",
            "Pergi ke Table Editor untuk confirm table tu dah wujud.",
            "Disable RLS buat masa ni kalau kau sekadar prototype."
        ],
        linkLabel: "Buka Supabase SQL Editor Guide",
        linkUrl: "https://supabase.com/docs/guides/database/sql-editor"
    },
    {
        id: "supabase-connect",
        icon: Database,
        title: "Sambung Database ke Vercel & UI",
        stage: "Database",
        summary: "Panggil data dari cloud masuk ke UI website korang.",
        eli5: "Wayar dah sambung kat local, tapi Vercel tak tau password Supabase. Kena setting environment variable.",
        steps: [
            "Masukkan credentials Supabase dalam `.env` ke dalam Vercel Dashboard > Settings > Environment Variables.",
            "Suruh Antigravity tulis logic fetchData untuk panggil data dari table.",
            "Minta Antigravity map data tu kat atas UI table atau cards.",
            "Push code ke GitHub, tunggu Vercel deploy.",
            "Boom! Website dah bersambung dengan database live."
        ],
        linkLabel: "Environment Variables Supabase",
        linkUrl: "https://vercel.com/docs/environment-variables"
    },
    {
        id: "custom-domain",
        icon: Rocket,
        title: "Bonus: Beli & Pasang Custom Domain",
        stage: "Bonus",
        summary: "Buang hujung .vercel.app dan nampak professional dengan domain .com.",
        eli5: "Beli nama rumah unik, lepastu sambung letrik ke Vercel.",
        steps: [
            "Beli domain (contoh dari Namecheap atau Porkbun).",
            "Dalam Vercel dashboard > Settings > Domains, add domain yang baru dibeli.",
            "Vercel akan bagi setting A Record dan CNAME.",
            "Copy settings tu dan paste dekat DNS settings di tempat beli domain tu.",
            "Tunggu propagate (kadang cepat, kadang beberapa jam)."
        ],
        linkLabel: "Vercel Domains Guide",
        linkUrl: "https://vercel.com/docs/custom-domains"
    }
    ,

    {
        id: 'install-node-antigravity',
        icon: Sparkles,
        title: 'Install Node.js + Antigravity (First Setup)',
        stage: 'Extended Toolkit',
        summary: 'Ni setup paling basic sebelum mula vibe coding dengan lancar.',
        eli5: 'Node.js ni macam enjin kereta. Antigravity pula co-pilot AI kau. Kalau enjin takde, kereta tak jalan.',
        steps: [
            'Install Node.js LTS dari website rasmi.',
            'Buka terminal, check `node -v` dan `npm -v`.',
            'Install/open Antigravity ikut panduan platform kau.',
            'Dalam project folder, run `npm install`.',
            'Run `npm run dev` dan pastikan website boleh hidup.'
        ],
        linkLabel: 'Buka Node.js Download',
        linkUrl: 'https://nodejs.org/en/download'
    },
    {
        id: 'setup-ai-api-key-v2',
        icon: Brain,
        title: 'Dapatkan API Key AI & Pasang di Antigravity',
        stage: 'Extended Toolkit',
        summary: 'Tanpa API key, AI tak boleh berfikir. Ini cara dapatkan otak untuk Antigravity kau.',
        eli5: 'API Key ni macam kad pengenalan untuk AI. Kau tunjuk kad ni kat server, baru dorang bagi AI tolong kau.',
        steps: [
            'Buka platform AI pilihan (contoh: Groq, Gemini, OpenAI).',
            'Register akaun dan cari bahagian "API Keys".',
            'Generate key baru dan copy.',
            'Buka VSCode (atau Cursor), pergi bahagian settings Antigravity.',
            'Paste API key dan pilih model AI yang kau nak guna.'
        ],
        linkLabel: 'Dapatkan Groq API Key (Laju & Free)',
        linkUrl: 'https://console.groq.com/keys'
    },
    {
        id: 'the-4-step-flow',
        icon: Rocket,
        title: 'Benda First: The 4-Step App Flow',
        stage: 'Extended Toolkit',
        summary: 'Membina app tak susah. Ini adalah 4 langkah utama yang kita akan sentiasa ulang.',
        eli5: 'Kalau masak, kita (1) cari resepi idea, (2) masak kat dapur Antigravity, (3) hidang kat meja Vercel, pastu (4) letak buku log Supabase.',
        steps: [
            'Idea & Brainstorming.',
            'Vibe Coding pada Antigravity.',
            'Publish secara live pada Vercel.',
            'Sambung Database Supabase untuk simpan memori.'
        ],
        linkLabel: 'Baca Proses Vibe Coding',
        linkUrl: '#'
    },
    {
        id: 'ai-tech-stack',
        icon: Brain,
        title: 'AI Tech Stack: Guna Tool Yang Betul',
        stage: 'Extended Toolkit',
        summary: 'Banyak AI tools dekat luar sana. Ini cara kita gabungkannya untuk hasilkan app terbaik.',
        eli5: 'ChatGPT tu manager bincang idea. Gemini pelukis yang hasilkan aset. Antigravity pula arkitek yang bantu kita ikat bata satu per satu.',
        steps: [
            'Gunakan ChatGPT untuk bincang idea dan brainstorm.',
            'Gunakan Gemini AI untuk janaan gambar dan aset design.',
            'Gunakan Antigravity (VSCode/Cursor) untuk coding.',
            'Jangan suruh satu AI buat semua benda.'
        ],
        linkLabel: 'Teroka ChatGPT untuk Idea',
        linkUrl: 'https://chat.openai.com'
    },
    {
        id: 'skill-md-basics',
        icon: BookOpen,
        title: 'Step 1: Faham `.md` & Skill Creator Dulu',
        stage: 'Extended Toolkit',
        summary: 'Sebelum start vibe coding, kena faham file instruction (`SKILL.md`) supaya AI ikut arahan kau betul-betul.',
        eli5: '`.md` tu macam buku manual. Kalau manual jelas, robot tak sesat. Skill Creator pula macam mesin yang bantu kau buat manual special ikut task kau.',
        steps: [
            'Buka `SKILL.md` dan tengok struktur dia.',
            'Faham frontmatter penting: `name` + `description`.',
            'Tulis instruction ringkas dan jelas (jangan panjang berjela).',
            'Asingkan bahan ikut folder: `scripts/`, `references/`, `assets/`.',
            'Uji skill guna task kecil dulu sebelum guna untuk task besar.'
        ],
        linkLabel: 'Rujuk Skill Creator Guide',
        linkUrl: 'https://platform.openai.com/docs'
    },
    {
        id: 'style-direction',
        icon: BookOpen,
        title: 'Pilih Design Direction Sendiri',
        stage: 'Extended Toolkit',
        summary: 'Supaya website kau tak nampak generic AI template.',
        eli5: 'Website macam baju. Kalau semua pakai uniform sama, takde identiti. Kau pilih gaya dulu baru AI ikut gaya kau.',
        steps: [
            'Pilih 3 keyword mood (contoh: bold, warm, playful).',
            'Pilih 2 website reference yang kau suka.',
            'Ambil elemen, jangan copy bulat-bulat.',
            'Set 1 font heading + 1 font body.',
            'Set 1 warna utama + 1 accent.'
        ],
        linkLabel: 'Buka Design Inspiration',
        linkUrl: 'https://www.behance.net/',
        designExamples: [
            { label: 'Glassmorphism', url: 'https://dribbble.com/tags/glassmorphism' },
            { label: 'Neo-Brutalist', url: 'https://dribbble.com/tags/neo-brutalism' },
            { label: 'Minimal Clean', url: 'https://dribbble.com/tags/minimal_web_design' },
            { label: 'Bento Grid', url: 'https://dribbble.com/tags/bento_ui' },
            { label: 'Dark Editorial', url: 'https://dribbble.com/tags/editorial_web_design' }
        ]
    },
    {
        id: 'ai-refer-design',
        icon: Brain,
        title: 'Lepas Pilih Design, Suruh AI Refer Style Tu',
        stage: 'Extended Toolkit',
        summary: 'Jangan minta AI random design. Bagi AI reference website supaya output lebih kena dengan taste kau.',
        eli5: 'Macam bagi contoh baju kat tailor. Tailor tak agak-agak, dia ikut rujukan yang kau suka.',
        steps: [
            'Pilih 1-2 website reference yang paling ngam.',
            'Bagi AI link/reference + terangkan apa yang kau suka.',
            'Minta AI replicate style principle, bukan copy exact design.',
            'Minta output ikut section (hero, cards, footer) satu-satu.',
            'Semak consistency font, spacing, dan warna.'
        ],
        linkLabel: 'Buka AI Design Referencing',
        linkUrl: 'https://www.youtube.com/results?search_query=how+to+use+ai+with+design+references'
    },
    {
        id: 'container-frame-element',
        icon: BookOpen,
        title: 'Container, Frame, Element (Visual Basics)',
        stage: 'Extended Toolkit',
        summary: 'Belajar struktur visual paling penting supaya layout tak bersepah.',
        eli5: 'Container macam kotak besar, frame macam rak dalam kotak, element pula barang atas rak.',
        steps: [
            'Kenal pasti container utama untuk setiap section.',
            'Pecahkan setiap container kepada frame kecil (header, content, footer).',
            'Letak element ikut hierarchy: title > isi > action.',
            'Pastikan spacing konsisten antara frame dan element.',
            'Semak balik: senang scan atau nampak serabut?'
        ],
        linkLabel: 'Buka Layout Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=ui+layout+container+frame+element+basics'
    },
    {
        id: 'move-elements',
        icon: Rocket,
        title: 'Cara Move Element Dengan Betul',
        stage: 'Extended Toolkit',
        summary: 'Bukan sekadar drag. Kena tahu alignment, spacing, dan visual balance.',
        eli5: 'Alih kerusi dalam rumah kena tengok laluan orang jalan. Website pun sama, elemen kena ada flow.',
        steps: [
            'Gerakkan element ikut grid (jangan random).',
            'Gunakan align left/center/right ikut konteks section.',
            'Check jarak atas-bawah kiri-kanan supaya seimbang.',
            'Test desktop dulu, lepas tu mobile.',
            'Ambil screenshot before/after untuk compare.'
        ],
        linkLabel: 'Buka Visual Alignment Guide',
        linkUrl: 'https://www.youtube.com/results?search_query=how+to+align+ui+elements+properly'
    },
    {
        id: 'asset-format-basics',
        icon: BookOpen,
        title: 'JPG, PNG, SVG: Bila Nak Guna Apa',
        stage: 'Extended Toolkit',
        summary: 'Faham format assets supaya website laju dan visual kekal sharp.',
        eli5: 'JPG untuk gambar biasa, PNG untuk gambar ada transparent, SVG untuk icon/shape yang sentiasa tajam.',
        steps: [
            'Guna JPG untuk photo/background image.',
            'Guna PNG untuk asset perlukan transparency.',
            'Guna SVG untuk logo, icon, illustration line-art.',
            'Semak saiz fail sebelum upload.',
            'Test visual quality di mobile dan desktop.'
        ],
        linkLabel: 'Buka Image Format Lesson',
        linkUrl: 'https://www.youtube.com/results?search_query=jpg+png+svg+explained+for+web+design'
    },
    {
        id: 'generate-assets-ai',
        icon: Sparkles,
        title: 'Generate Asset Dengan AI (Image, Icon, Mockup)',
        stage: 'Extended Toolkit',
        summary: 'Belajar hasilkan asset cepat guna AI tanpa nampak generic.',
        eli5: 'AI macam designer assistant. Kau bagi direction jelas, dia hasilkan draft laju untuk kau polish.',
        steps: [
            'Tulis prompt ikut style brand (warna, mood, penggunaan).',
            'Generate beberapa variation (jangan ambil first result terus).',
            'Pilih yang paling sesuai dengan layout website.',
            'Refine prompt untuk fix details kecil.',
            'Export format yang sesuai: PNG/SVG/JPG.'
        ],
        linkLabel: 'Buka AI Asset Generation',
        linkUrl: 'https://www.youtube.com/results?search_query=ai+image+generation+for+website+assets'
    },
    {
        id: 'generate-3d-assets',
        icon: Sparkles,
        title: 'Generate 3D Assets Untuk Website',
        stage: 'Extended Toolkit',
        summary: 'Tambah depth dan wow factor guna 3D asset secara ringan.',
        eli5: '3D assets macam prop pentas. Kalau guna betul, website nampak hidup. Kalau over, jadi berat.',
        steps: [
            'Pilih 1-2 3D asset hero sahaja (jangan penuh satu page).',
            'Gunakan format glTF/GLB untuk web bila sesuai.',
            'Compress asset supaya loading tak berat.',
            'Test performance sebelum publish.',
            'Sediakan fallback image untuk device lemah.'
        ],
        linkLabel: 'Buka 3D for Web Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=3d+assets+for+web+beginners+gltf+glb'
    },
    {
        id: 'ai-build-website',
        icon: Brain,
        title: 'Guna AI Buat Website dengan Betul',
        stage: 'Extended Toolkit',
        summary: 'Prompt clear = output cun. Prompt kabur = output random.',
        eli5: 'AI ni macam runner. Kalau kau bagi alamat clear, dia sampai. Kalau alamat vague, dia pusing-pusing.',
        steps: [
            'Bagi AI context: audience + objective + vibe.',
            'Minta structure page dulu (baru visual).',
            'Minta one section at a time.',
            'Review dengan checklist (clear CTA? readable?)',
            'Iterate 2-3 round je, jangan endless tweak.'
        ],
        linkLabel: 'Buka AI Builder',
        linkUrl: 'https://v0.dev/'
    },
    {
        id: 'basic-prompting',
        icon: Brain,
        title: 'Basic Prompting: Cara Bagi Arahan Yang Menjadi',
        stage: 'Extended Toolkit',
        summary: 'Belajar format prompt basic supaya AI bagi output yang tepat dan boleh pakai terus.',
        eli5: 'Prompt tu macam bagi alamat rumah. Lagi jelas alamat, lagi senang orang sampai betul-betul depan pintu.',
        steps: [
            'Guna format ringkas: Goal + Context + Format.',
            'Nyatakan gaya output yang kau nak.',
            'Letak contoh ringkas kalau perlu.',
            'Minta AI tanya balik kalau info tak cukup.',
            'Iterate cepat guna prompt v2, v3.'
        ],
        linkLabel: 'Buka Prompting Basics',
        linkUrl: 'https://platform.openai.com/docs/guides/prompt-engineering'
    },
    {
        id: 'ai-implementation-planning',
        icon: Brain,
        title: 'Discuss dengan AI untuk Buat Implementation Plan',
        stage: 'Extended Toolkit',
        summary: 'Sebelum terus build, bincang dengan AI untuk pecah kerja kepada task kecil yang clear.',
        eli5: 'Macam nak travel: rancang route dulu, baru jalan. Kalau tak, buang masa pusing-pusing.',
        steps: [
            'Terangkan objective feature secara jelas.',
            'Minta AI pecahkan task ikut fasa: UI, data, test, deploy.',
            'Minta AI highlight risk dan fallback plan.',
            'Minta priority order (must-have vs nice-to-have).',
            'Gunakan plan tu sebagai checklist execution.'
        ],
        linkLabel: 'Buka AI Planning Workflow',
        linkUrl: 'https://www.youtube.com/results?search_query=ai+implementation+planning+for+developers'
    },
    {
        id: 'ux-flow',
        icon: Users,
        title: 'Bina Website yang Senang Guna',
        stage: 'Extended Toolkit',
        summary: 'Cantik je tak cukup. User mesti senang faham dan klik.',
        eli5: 'Rumah cantik tapi pintu susah cari memang stress. Website pun sama.',
        steps: [
            'Hero mesti jawab: apa ini + untuk siapa + apa next.',
            'Navbar maksimum 5 item utama.',
            'CTA guna ayat action (contoh: Start Free Audit).',
            'Setiap section ada satu tujuan jelas.',
            'Buang benda yang tak bantu user decision.'
        ],
        linkLabel: 'Buka UX Basics',
        linkUrl: 'https://www.nngroup.com/articles/'
    },
    {
        id: 'content-copy',
        icon: BookOpen,
        title: 'Copywriting yang Bantu Convert',
        stage: 'Extended Toolkit',
        summary: 'Ayat website kena jelas, bukan sekadar fancy.',
        eli5: 'Kalau kedai tak letak signboard jelas, orang tak tahu kedai jual apa.',
        steps: [
            'Headline: problem + promise.',
            'Subheadline: explain result in plain language.',
            'Tambah 1-2 bukti (testimonial / outcome).',
            'Gunakan bahasa user, bukan jargon tech.',
            'Setiap page ada CTA tunggal yang kuat.'
        ],
        linkLabel: 'Buka Landing Copy Tips',
        linkUrl: 'https://www.copyhackers.com/blog/'
    },
    {
        id: 'inspect-mobile-view',
        icon: Rocket,
        title: 'Inspect Element: Test Mobile View Macam Pro',
        stage: 'Extended Toolkit',
        summary: 'Lepas design siap, kena check versi phone guna browser inspect supaya layout tak pecah.',
        eli5: 'Inspect element tu macam cermin ajaib. Kau boleh tukar skrin jadi phone mode dan tengok website kau kemas ke tak.',
        steps: [
            'Mulakan design dalam phone width dulu (mobile-first).',
            'Buka website dalam Chrome.',
            'Tekan `F12` untuk buka DevTools.',
            'Klik icon phone/tablet (Toggle Device Toolbar).',
            'Pilih device (iPhone/Pixel/iPad) dan test setiap section.',
            'Fix text, spacing, button size sampai mobile view smooth.'
        ],
        linkLabel: 'Buka Guide Chrome DevTools',
        linkUrl: 'https://developer.chrome.com/docs/devtools/device-mode'
    },
    {
        id: 'file-structure-basics',
        icon: BookOpen,
        title: 'File Structure Basics (Supaya Tak Serabut)',
        stage: 'Extended Toolkit',
        summary: 'Susun folder dari awal supaya senang maintain bila project makin besar.',
        eli5: 'Macam susun almari. Kalau baju campur kasut campur dokumen, nanti semua jadi lambat nak cari.',
        steps: [
            'Asingkan folder ikut fungsi: pages, components, styles, lib, assets.',
            'Guna nama fail jelas dan konsisten.',
            'Simpan reusable UI dalam components.',
            'Simpan logic helper/API dalam lib atau utils.',
            'Review structure setiap minggu dan kemas semula bila perlu.'
        ],
        linkLabel: 'Buka Project Structure Guide',
        linkUrl: 'https://www.youtube.com/results?search_query=react+project+folder+structure+for+beginners'
    },
    {
        id: 'ask-ai-code-comments',
        icon: Brain,
        title: 'Nak Faham Code? Suruh AI Tulis Comment',
        stage: 'Extended Toolkit',
        summary: 'Kalau blur dengan code, gunakan AI untuk annotate code langkah demi langkah.',
        eli5: 'Comment tu macam subtitle dalam movie. Kau terus faham scene tu pasal apa.',
        steps: [
            'Copy function atau component yang kau tak faham.',
            'Minta AI explain line-by-line dalam bahasa mudah.',
            'Minta AI tambah komen pada code tanpa ubah behavior.',
            'Baca semula code yang dah ada komen.',
            'Buang komen berlebihan bila dah faham.'
        ],
        linkLabel: 'Buka Code Explanation Workflow',
        linkUrl: 'https://www.youtube.com/results?search_query=understand+code+with+ai+comments'
    },
    {
        id: 'user-retention',
        icon: Users,
        title: 'User Retention: Buat User Datang Balik',
        stage: 'Extended Toolkit',
        summary: 'Retention penting supaya app kau bukan sekadar viral sehari dua, tapi terus digunakan.',
        eli5: 'User retention macam orang datang balik ke kedai sebab servis sedap dan barang berguna.',
        steps: [
            'Kenal pasti “aha moment” user seawal mungkin.',
            'Permudahkan onboarding supaya user cepat faham value.',
            'Tambah habit trigger (email reminder, progress tracker).',
            'Pantau drop-off point dan baiki friction.',
            'Kumpul feedback user aktif dan iterasi cepat.'
        ],
        linkLabel: 'Buka User Retention Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=user+retention+for+web+apps+beginners'
    },
    {
        id: 'scale-your-app',
        icon: Rocket,
        title: 'Scale Your App (Bila User Makin Ramai)',
        stage: 'Extended Toolkit',
        summary: 'Bila traction naik, app kena tahan load, maintain laju, dan senang diurus.',
        eli5: 'Macam kedai makin ramai customer, kena tambah staff dan sistem supaya tak kelam-kabut.',
        steps: [
            'Pantau metrik performance (load time, error rate).',
            'Optimize image, query, dan frontend bundle.',
            'Guna caching untuk data yang kerap dibaca.',
            'Asingkan service bila logic makin kompleks.',
            'Set monitoring + alert untuk issue production.'
        ],
        linkLabel: 'Buka App Scaling Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=how+to+scale+web+application+beginners'
    },
    {
        id: 'monetize-app',
        icon: Sparkles,
        title: 'Monetize Your App (Jana Income)',
        stage: 'Extended Toolkit',
        summary: 'Lepas produk stabil, pilih model monetization yang sesuai dengan value app kau.',
        eli5: 'Kalau app kau bantu orang, monetization ialah cara dapat hasil sambil terus improve servis.',
        steps: [
            'Pilih model awal: subscription, one-time, atau freemium.',
            'Pastikan free tier masih bagi value.',
            'Tetapkan pricing berdasarkan outcome, bukan tekaan.',
            'Test pricing dengan user kecil dulu.',
            'Track conversion dari free ke paid.'
        ],
        linkLabel: 'Buka App Monetization Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=app+monetization+for+beginners+saas'
    },
    {
        id: 'visual-troubleshooting',
        icon: Sparkles,
        title: 'Troubleshoot Visual Issue (Copy Paste Workflow)',
        stage: 'Extended Toolkit',
        summary: 'Kalau layout rosak, ikut SOP troubleshooting yang cepat dan clear.',
        eli5: 'Macam baiki basikal: test satu benda dulu, jangan tukar semua serentak.',
        steps: [
            'Copy error/issue description dan screenshot masalah.',
            'Copy section code yang terlibat sahaja (jangan satu file penuh).',
            'Paste kepada AI dengan format: masalah + expected result + code snippet.',
            'Apply fix kecil dulu, test sekali lagi.',
            'Kalau okay baru simpan; kalau tak okay, revert dan cuba versi lain.'
        ],
        linkLabel: 'Buka Frontend Debugging Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=frontend+debugging+workflow+for+beginners'
    },
    {
        id: 'connect-database',
        icon: Database,
        title: 'Sambung Website ke Database',
        stage: 'Extended Toolkit',
        summary: 'Bagi website memory: simpan data user, submission, feedback.',
        eli5: 'Database ni kotak simpan barang berlabel. Website boleh letak dan cari semula bila perlu.',
        steps: [
            'Create project dekat Supabase.',
            'Bina table penting dulu (users/submissions).',
            'Copy URL + anon key ke `.env`.',
            'Test tambah satu data contoh.',
            'Test baca balik data tu.'
        ],
        linkLabel: 'Buka Supabase Guide',
        linkUrl: 'https://supabase.com/docs/guides/getting-started'
    },
    {
        id: 'api-basics',
        icon: Brain,
        title: 'API Tu Apa (Versi Beginner)',
        stage: 'Extended Toolkit',
        summary: 'API ialah cara app kau minta data dari service lain.',
        eli5: 'API macam waiter restoran. Kau bagi order, waiter pergi dapur, lepas tu waiter bawa balik makanan (data).',
        steps: [
            'Kenal pasti data apa kau nak ambil/hantar.',
            'Tengok endpoint API (contoh: `/users`, `/products`).',
            'Faham request masuk, response keluar.',
            'Test API guna sample data dulu.',
            'Tunjuk error message yang clear kalau API gagal.'
        ],
        linkLabel: 'Buka API Intro',
        linkUrl: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Introduction'
    },
    {
        id: 'fetching-basics',
        icon: Brain,
        title: 'Fetching Data (Cara Ambil Data Dalam App)',
        stage: 'Extended Toolkit',
        summary: 'Fetching = app kau ambil data dari API/database dan paparkan dekat UI.',
        eli5: 'Macam kau ambil air guna paip. Kau buka paip (request), air keluar (response), lepas tu guna air tu dalam rumah (UI).',
        steps: [
            'Kenal pasti data mana nak ambil dulu.',
            'Call API endpoint dengan format betul.',
            'Tunjuk loading state sementara tunggu data.',
            'Handle error kalau fetch gagal.',
            'Render data dalam UI dengan kemas.'
        ],
        linkLabel: 'Buka Fetch API Guide',
        linkUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch'
    },
    {
        id: 'web-scraping-basics',
        icon: BookOpen,
        title: 'Web Scraping (Ambil Data Website Secara Beretika)',
        stage: 'Extended Toolkit',
        summary: 'Scraping sesuai untuk research/content sourcing, tapi kena ikut rules laman web.',
        eli5: 'Scraping macam salin nota dari papan putih. Boleh salin, tapi kena ikut peraturan kelas dan jangan rosakkan papan.',
        steps: [
            'Semak Terms of Service website dulu.',
            'Ambil data yang public sahaja.',
            'Jangan spam request terlalu laju.',
            'Simpan source URL untuk rujukan/credit.',
            'Gunakan data untuk insight, bukan copy bulat-bulat.'
        ],
        linkLabel: 'Buka Web Scraping Intro',
        linkUrl: 'https://developer.mozilla.org/en-US/docs/Glossary/Web_scraping'
    },
    {
        id: 'supabase-keys',
        icon: Database,
        title: 'Supabase Keys: Mana Boleh Share, Mana Tak Boleh',
        stage: 'Extended Toolkit',
        summary: 'Kena faham beza anon key dan service role key supaya project selamat.',
        eli5: 'Kunci rumah ada dua: kunci tetamu dan kunci master. Tetamu boleh guna ruang biasa, kunci master jangan bagi orang.',
        steps: [
            'Guna `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` untuk frontend.',
            'Jangan letak `service_role` key dalam frontend.',
            'Simpan keys dalam `.env`, bukan hardcode.',
            'Semak `.gitignore` supaya `.env` tak ter-push ke GitHub.',
            'Set RLS policy supaya data access ikut role.'
        ],
        linkLabel: 'Buka Supabase API Keys Docs',
        linkUrl: 'https://supabase.com/docs/guides/api/api-keys'
    },
    {
        id: 'github-flow',
        icon: Github,
        title: 'Upload Project ke GitHub',
        stage: 'Extended Toolkit',
        summary: 'Backup kerja + senang kolaborasi + senang deploy.',
        eli5: 'GitHub macam cloud folder versioned. Setiap kemas kini ada rekod.',
        steps: [
            'Create repo baru.',
            'git init -> git add . -> git commit.',
            'Connect repo URL.',
            'git push untuk upload.',
            'Set habit: commit kecil tapi konsisten.'
        ],
        linkLabel: 'Buka GitHub Quickstart',
        linkUrl: 'https://docs.github.com/en/get-started/start-your-journey/hello-world'
    },
    {
        id: 'github-antigravity',
        icon: Github,
        title: 'Connection GitHub <-> Antigravity',
        stage: 'Extended Toolkit',
        summary: 'Antigravity bantu generate/edit, GitHub simpan version rasmi project kau.',
        eli5: 'Antigravity macam co-pilot kereta, GitHub macam dashcam. Co-pilot bantu drive, dashcam simpan semua perjalanan.',
        steps: [
            'Pastikan project local dah connect ke GitHub repo.',
            'Guna Antigravity untuk generate/refactor feature kecil.',
            'Review hasil dulu, jangan push terus tanpa check.',
            'Commit ikut task (satu task, satu commit).',
            'Push ke GitHub supaya version kau sentiasa selamat.'
        ],
        linkLabel: 'Buka GitHub Flow Guide',
        linkUrl: 'https://docs.github.com/en/get-started/using-github/github-flow'
    },
    {
        id: 'deploy-live',
        icon: Rocket,
        title: 'Deploy Website Sampai Live',
        stage: 'Extended Toolkit',
        summary: 'Lepas deploy, semua orang boleh buka link website kau.',
        eli5: 'Sebelum deploy, website duduk dalam bilik kau. Lepas deploy, dia duduk kat jalan besar.',
        steps: [
            'Create akaun Vercel.',
            'Import GitHub repo.',
            'Masukkan environment variables.',
            'Klik Deploy.',
            'Test live link macam user baru.'
        ],
        linkLabel: 'Buka Vercel Guide',
        linkUrl: 'https://vercel.com/docs/getting-started-with-vercel'
    },
    {
        id: 'vercel-production',
        icon: Rocket,
        title: 'Vercel: Dari Preview ke Production',
        stage: 'Extended Toolkit',
        summary: 'Belajar beza preview deployment dan production deployment.',
        eli5: 'Preview macam rehearsal atas stage kosong. Production macam show sebenar depan audience.',
        steps: [
            'Import repo ke Vercel.',
            'Set environment variables ikut environment yang betul.',
            'Guna preview URL untuk test sebelum publish.',
            'Semak form, API, dan mobile view dekat preview.',
            'Baru promote/deploy ke production.'
        ],
        linkLabel: 'Buka Vercel Deployment Docs',
        linkUrl: 'https://vercel.com/docs/deployments/overview'
    },
    {
        id: 'install-skills',
        icon: Sparkles,
        title: 'Install Skills untuk Start Vibe Coding',
        stage: 'Extended Toolkit',
        summary: 'Skills bagi kau shortcut workflow supaya tak blank bila start.',
        eli5: 'Skills macam preset gear dalam game. Bila equip, kerja jadi lagi cepat dan terarah.',
        steps: [
            'Pilih 1 skill ikut goal (UI, backend, deployment).',
            'Install ikut guide tool kau.',
            'Test skill dengan task kecil.',
            'Simpan template prompt untuk repeat use.',
            'Tambah skill baru bila workflow dah stabil.'
        ],
        linkLabel: 'Buka Skill Guide',
        linkUrl: 'https://platform.openai.com/docs'
    },
    {
        id: 'creative-motion',
        icon: Sparkles,
        title: 'Creative Mode: Animation yang Sedap Tengok',
        stage: 'Extended Toolkit',
        summary: 'Bila website dah launch, baru tambah wow factor secara berhemah.',
        eli5: 'Animation macam seasoning. Sikit jadi sedap, terlalu banyak jadi pening.',
        steps: [
            'Pilih 2-3 animation pattern je.',
            'Utamakan reveal + hover + feedback state.',
            'Pastikan animation bantu fokus user.',
            'Semak performance (tak laggy).',
            'Sediakan reduced-motion option.'
        ],
        linkLabel: 'Buka Motion Inspiration',
        linkUrl: 'https://www.awwwards.com/websites/animations/'
    },
    {
        id: 'ai-imagination',
        icon: Brain,
        title: 'Imagination with AI: Idea Jadi Reality',
        stage: 'Extended Toolkit',
        summary: 'Lepas basic settle, imagination kau jadi engine utama.',
        eli5: 'AI ibarat tukang bina laju, tapi architect tetap kau. Kalau imaginasi jelas, hasil unik.',
        steps: [
            'Mulakan dengan satu crazy-but-useful idea.',
            'Pecah idea jadi micro features.',
            'Prototype cepat dengan AI.',
            'Uji dengan 3 orang user sebenar.',
            'Iterate based on feedback, bukan ego.'
        ],
        linkLabel: 'Buka AI Product Inspiration',
        linkUrl: 'https://www.producthunt.com/'
    }
];

const LESSONS_FORMAL = [
    {
        id: "function-over-form",
        icon: Activity,
        title: "Functionality First, Aesthetics Later",
        stage: "Builder Mindset",
        summary: "Focus on the Core Features before spending 10 hours selecting colors.",
        eli5: "Like building a house, ensure the foundation is strong before choosing the wall color.",
        steps: [
            "Identify 1 Core Problem your app solves.",
            "Build the Core Feature (Minimum Viable Product).",
            "Use default layout/black and white while building logic.",
            "Ensure the flow (click -> load -> save to database) succeeds.",
            "After logic is 100% complete, inject the \"Vibe\" (animations, colors)."
        ],
        linkLabel: "Open Mind Mapper",
        linkUrl: ""
    },
    {
        id: "app-vibe-quality",
        icon: Sparkles,
        title: "The Recipe for a Premium \"Vibey\" App",
        stage: "Builder Mindset",
        summary: "A great app is responsive, fast, and provides clear feedback to the user.",
        eli5: "If you press a doorbell and it doesn't ring, you press it again. Apps are the same; they need feedback states.",
        steps: [
            "Instant Feedback: Every button must have a \"Hover\" state and \"Loading\" state.",
            "Reduce Clicks: If you can solve it in 1 screen, don't force users through 3 pages.",
            "Error Handling: Don't show white screens. If an error occurs, show a friendly message.",
            "UI Consistency: Use a consistent color and font system across all pages."
        ],
        linkLabel: "Open Simulator",
        linkUrl: ""
    },
    {
        id: "system-thinking",
        icon: Brain,
        title: "Break Huge Ideas Into Small Systems",
        stage: "Builder Mindset",
        summary: "When an idea is too big, you freeze. The art is deconstructing it into small parts.",
        eli5: "You can't eat a whole pizza in one bite. Slice it into 8 pieces. Apps work the same way.",
        steps: [
            "Isolate Frontend (UI, Colors, Buttons).",
            "Isolate Backend/Logic (Saving profiles, calculating scores).",
            "Isolate Database (Where data lives: Supabase).",
            "Solve them one by one when prompting AI. Do not mix frontend and backend in a single prompt."
        ],
        linkLabel: "Open Simulator",
        linkUrl: ""
    },
    {
        id: "user-centric-empathy",
        icon: Users,
        title: "Build for the User, Not Your Ego",
        stage: "Builder Mindset",
        summary: "Identify exactly who will use your app and solve their problem, cutting out useless features.",
        eli5: "If you make soccer cleats for a child, don't add wheels because you think it's cool. Build what they need.",
        steps: [
            "Put yourself in the user's shoes. Is this app pleasant to use?",
            "Ensure text is legible (high color contrast).",
            "Reduce long forms. Only ask what is strictly necessary.",
            "Test the app on your own mobile phone, as 80% of users use mobile."
        ],
        linkLabel: "Open Simulator",
        linkUrl: ""
    },
    {
        id: "creativity-constraints",
        icon: BookOpen,
        title: "Finding Creativity in Constraints",
        stage: "Builder Mindset",
        summary: "You don't need billions in budget or 10 years of coding skill. Use AI as leverage.",
        eli5: "A great chef can make a delicious meal with just eggs and soy sauce. A great builder uses AI limitations as an opportunity.",
        steps: [
            "Use open-source assets (Lucide Icons, Tailwind UI).",
            "When ChatGPT \"forgets\" your code, remind it or paste the \"Master Prompt\" again.",
            "Do not give up when you see red errors; it signifies you are on the right track.",
            "If a feature is too hard to build, pivot to an easier feature that achieves the same goal."
        ],
        linkLabel: "Open Prompt Forge",
        linkUrl: ""
    },
    {
        id: "setup-environment",
        icon: Sparkles,
        title: "Install Node.js + Antigravity (First Setup)",
        stage: "Foundation",
        summary: "This is the initial setup sebelum mula vibe coding dengan lancar.",
        eli5: "Node.js ni macam enjin kereta. Antigravity pula co-pilot AI kau. Kalau enjin takde, kereta tak jalan.",
        steps: [
            "Install Node.js LTS dari website rasmi.",
            "Buka terminal, check `node -v` dan `npm -v`.",
            "Install/open Antigravity ikut panduan platform kau.",
            "Dalam project folder, run `npm install`.",
            "Run `npm run dev` dan pastikan website boleh hidup."
        ],
        linkLabel: "Buka Node.js Download",
        linkUrl: "https://nodejs.org/en/download"
    },
    {
        id: "setup-ai-api-key",
        icon: Brain,
        title: "Dapatkan API Key AI & Pasang di Antigravity",
        stage: "Foundation",
        summary: "Penting: Manage token API korang supaya tak mahal. OpenRouter paling jimat untuk guna semua model.",
        eli5: "API Key ni macam kad pengenalan. Korang boleh guna Groq (laju & murah) atau NVIDIA LLM. OpenRouter pula act macam wallet prepaid untuk bayar semua model.",
        steps: [
            "Open your chosen platform: Groq (Percuma/Murah), NVIDIA LLM, atau OpenRouter (Jimat).",
            "Register akaun dan ambil 'API Keys'.",
            "Buka VSCode/Cursor, pergi bahagian settings Antigravity.",
            "Paste API key dan pilih model.",
            "Elakkan guna Opus/Sonnet untuk benda simple sebab mahal token."
        ],
        linkLabel: "Dapatkan Groq API Key",
        linkUrl: "https://console.groq.com/keys"
    },
    {
        id: "chatgpt-personality",
        icon: Users,
        title: "Set Up Personality ChatGPT",
        stage: "Ideation",
        summary: "Train ChatGPT to act as an expert sebelum kau tanya teknikal.",
        eli5: "Macam kau lantik Manager. Mula-mula bagi dia title 'Senior UI Engineer & PM', baru instruction dia mantap.",
        steps: [
            "Buka ChatGPT.",
            "Tulis prompt: 'You are an expert React UI Engineer and Product Manager...'",
            "Ceritakan idea app kau secara ringkas.",
            "Minta dia suggest features dan UX flow sebelum buat apa-apa.",
            "Bincang sampai idea tu solid."
        ],
        linkLabel: "Buka ChatGPT",
        linkUrl: "https://chat.openai.com"
    },
    {
        id: "chatgpt-master-prompt",
        icon: BookOpen,
        title: "Generate The Master Prompt",
        stage: "Ideation",
        summary: "Translate ideas into a single comprehensive arahan lengkap untuk Antigravity.",
        eli5: "Bila idea dah confirm, kau suruh ChatGPT rumuskan jadi satu pelan tindakan (blueprint) yang lengkap untuk AI lain baca.",
        steps: [
            "Bila brainstorm dah siap di ChatGPT.",
            "Minta ChatGPT: 'Summarize everything we discussed into ONE single master prompt for an AI coding assistant (like Claude 3) to build this app.'",
            "Pastikan prompt tu ada details UI, warna, layout, dan data structure.",
            "Copy Master Prompt tu."
        ],
        linkLabel: "Buka ChatGPT",
        linkUrl: "https://chat.openai.com"
    },
    {
        id: "antigravity-sonnet",
        icon: Rocket,
        title: "Paste Master Prompt ke Antigravity",
        stage: "Vibe Coding",
        summary: "Select the appropriate model dan mula bina aplikasi. Sonnet untuk architect, Gemini untuk visual.",
        eli5: "Antigravity ada banyak AI. Claude 3.5 Sonnet = Senior Engineer (steady). Opus = KrackedDev (power gila). Gemini Pro = Junior (cepat). Gemini Flash = UI Designer. Gemini 3.1 = High-Performance All Rounder.",
        steps: [
            "Buka Antigravity dalam project folder.",
            "Pilih AI model yang sesuai: Claude 3.5 Sonnet atau Gemini 3.1 (all-rounder).",
            "Paste Master Prompt dari ChatGPT tadi.",
            "Tekan Enter dan tunggu AI siapkan struktur website dan component.",
            "Kalau nak tukar warna/padding UI, switch ke Gemini Flash (Designer)."
        ],
        linkLabel: "Buka Antigravity Docs",
        linkUrl: "https://antigravity.id"
    },
    {
        id: "github-repo-setup",
        icon: Github,
        title: "Push Code ke GitHub",
        stage: "Versioning",
        summary: "Save code to the cloud supaya tak hilang dan boleh deploy.",
        eli5: "GitHub ni macam Google Drive tapi khas untuk code. Kau 'push' code ke sana untuk simpan secara kekal.",
        steps: [
            "Buka browser dan create GitHub repo baru.",
            "Dalam terminal VSCode, run: `git init`.",
            "Run: `git add .` lepas tu `git commit -m 'initial commit'`.",
            "Penting: Belajar beza `git pull` (tarik code turun) dan `git fetch`.",
            "Run command `git push -u origin main` untuk upload semua code asal ke branch utama (main)."
        ],
        linkLabel: "Buka GitHub",
        linkUrl: "https://github.com"
    },
    {
        id: "vercel-deploy",
        icon: Rocket,
        title: "Deploy ke Vercel",
        stage: "Launch",
        summary: "Publish your website to the internet. Paste Vercel URL dalam terminal ni untuk dapat Trophy!",
        eli5: "Dalam local, kau je nampak website tu. Vercel akan ambil code dari GitHub dan letak kat server awam.",
        steps: [
            "Create akaun Vercel guna GitHub.",
            "Import repo yang kau baru push tadi.",
            "Biarkan settings default dan tekan Deploy.",
            "Bila dah siap, copy URL `.vercel.app` tu.",
            "PASTE URL TU DALAM TERMINAL INI tekan ENTER untuk complete task!"
        ],
        linkLabel: "Buka Vercel",
        linkUrl: "https://vercel.com"
    },
    {
        id: "vercel-analytics",
        icon: Users,
        title: "Pasang Vercel Analytics",
        stage: "Launch",
        summary: "Track website visitors secara percuma dan mudah.",
        eli5: "Macam pasang CCTV kat kedai, kau boleh nampak berapa orang masuk dan dari mana diorang datang.",
        steps: [
            "Dalam Vercel dashboard, pergi tab Analytics dan klik Enable.",
            "Dalam terminal VSCode, run: `npm i @vercel/analytics`.",
            "Import dan letak component `<Analytics />` dalam fail utama app (contoh: `App.jsx` atau `main.jsx`).",
            "Commit dan push ke GitHub (Vercel akan auto-deploy).",
            "Sekarang kau boleh tengok graf traffic kat Vercel dashboard."
        ],
        linkLabel: "Vercel Analytics Guide",
        linkUrl: "https://vercel.com/docs/analytics/quickstart"
    },
    {
        id: "supabase-setup",
        icon: Database,
        title: "Cipta Database Supabase",
        stage: "Database",
        summary: "Build a cloud database. PENTING: Faham beza Anon Key dan Service Role Key.",
        eli5: "Bila buat akaun login atau simpan data form, kau perlukan backend database. Supabase paling senang untuk mula.",
        steps: [
            "Create a project on Supabase and wait 2-3 minit server setup.",
            "Pergi ke Project Settings > API.",
            "Copy `Project URL` dan `anon - public` key.",
            "AMARAN: Jangan sekali-kali expose `service_role` key! Berbahaya!",
            "Buat file `.env.local` dan masukkan keys tersebut."
        ],
        linkLabel: "Buka Supabase",
        linkUrl: "https://supabase.com"
    },
    {
        id: "supabase-sql",
        icon: Database,
        title: "Run SQL Query & Bina Table",
        stage: "Database",
        summary: "The fastest way to create struktur kotak data guna AI dan SQL.",
        eli5: "Dari buat table satu per satu pakai mouse, suruh AI generate script SQL, paste dalam Supabase, dan siap sepenip mata.",
        steps: [
            "Minta Antigravity: 'Generate a Supabase SQL query to create a users table with name and email'.",
            "Dalam Supabase dashboard, pergi ke SQL Editor (icon terminal kilat).",
            "Klik New Query, paste code tadi dan tekan RUN.",
            "Pergi ke Table Editor untuk confirm table tu dah wujud.",
            "Disable RLS buat masa ni kalau kau sekadar prototype."
        ],
        linkLabel: "Buka Supabase SQL Editor Guide",
        linkUrl: "https://supabase.com/docs/guides/database/sql-editor"
    },
    {
        id: "supabase-connect",
        icon: Database,
        title: "Sambung Database ke Vercel & UI",
        stage: "Database",
        summary: "Fetch data from the cloud masuk ke UI website korang.",
        eli5: "Wayar dah sambung kat local, tapi Vercel tak tau password Supabase. Kena setting environment variable.",
        steps: [
            "Masukkan credentials Supabase dalam `.env` ke dalam Vercel Dashboard > Settings > Environment Variables.",
            "Suruh Antigravity tulis logic fetchData untuk panggil data dari table.",
            "Minta Antigravity map data tu kat atas UI table atau cards.",
            "Push code ke GitHub, tunggu Vercel deploy.",
            "Boom! Website dah bersambung dengan database live."
        ],
        linkLabel: "Environment Variables Supabase",
        linkUrl: "https://vercel.com/docs/environment-variables"
    },
    {
        id: "custom-domain",
        icon: Rocket,
        title: "Bonus: Beli & Pasang Custom Domain",
        stage: "Bonus",
        summary: "Buang hujung .vercel.app dan nampak professional dengan domain .com.",
        eli5: "Beli nama rumah unik, lepastu sambung letrik ke Vercel.",
        steps: [
            "Beli domain (contoh dari Namecheap atau Porkbun).",
            "Dalam Vercel dashboard > Settings > Domains, add domain yang baru dibeli.",
            "Vercel akan bagi setting A Record dan CNAME.",
            "Copy settings tu dan paste dekat DNS settings di tempat beli domain tu.",
            "Tunggu propagate (kadang cepat, kadang beberapa jam)."
        ],
        linkLabel: "Vercel Domains Guide",
        linkUrl: "https://vercel.com/docs/custom-domains"
    }
    ,

    {
        id: 'install-node-antigravity',
        icon: Sparkles,
        title: 'Install Node.js and Antigravity (Initial Setup)',
        stage: 'Extended Toolkit',
        summary: 'Complete this setup first to ensure your vibe-coding workflow runs smoothly.',
        eli5: 'Node.js is the engine. Antigravity is your AI co-pilot. You need both before driving.',
        steps: [
            'Install Node.js LTS from the official site.',
            'Verify with `node -v` and `npm -v` in terminal.',
            'Install/open Antigravity for your environment.',
            'Run `npm install` in the project folder.',
            'Run `npm run dev` and confirm the app starts.'
        ],
        linkLabel: 'Open Node.js Download',
        linkUrl: 'https://nodejs.org/en/download'
    },
    {
        id: 'setup-ai-api-key-v2',
        icon: Brain,
        title: 'Obtain an AI API Key & Configure Antigravity',
        stage: 'Extended Toolkit',
        summary: 'Without an API key, the AI cannot process requests. This connects Antigravity to its intelligence.',
        eli5: 'An API Key is like a VIP pass. You show it to the AI server so they know you are authorized to use their brain.',
        steps: [
            'Navigate to your preferred AI platform (e.g., Groq, Gemini, OpenAI).',
            'Create an account and locate the "API Keys" dashboard.',
            'Generate a new API key and copy the sequence.',
            'Open your editor\'s Antigravity settings/extension page.',
            'Paste the API key and select your preferred model.'
        ],
        linkLabel: 'Get Groq API Key (Fast & Free)',
        linkUrl: 'https://console.groq.com/keys'
    },
    {
        id: 'the-4-step-flow',
        icon: Rocket,
        title: 'The Blueprint: 4-Step App Workflow',
        stage: 'Extended Toolkit',
        summary: 'Building an app is repeatable. Master these 4 fundamental steps first.',
        eli5: 'You brainstorm the map, you build the house in Antigravity, you open it to the public via Vercel, and you track the visitors with Supabase.',
        steps: [
            'Idea Generation & Brainstorming.',
            'Vibe Coding within Antigravity.',
            'Publishing live to the web via Vercel.',
            'Connecting a Database (Supabase) for persistent memory.'
        ],
        linkLabel: 'Read the Builder Guide',
        linkUrl: '#'
    },
    {
        id: 'ai-tech-stack',
        icon: Brain,
        title: 'AI Tech Stack: Choose the Right Tools',
        stage: 'Extended Toolkit',
        summary: 'Understand the specific specialties of different AI tools in your workflow.',
        eli5: 'ChatGPT is your conversational whiteboard. Gemini is your artistic illustrator. Antigravity is your construction crew.',
        steps: [
            'Use ChatGPT for high-level technical discussions and brainstorming.',
            'Use Gemini to generate images, assets, and creative references.',
            'Use Antigravity as your primary IDE coding co-pilot.',
            'Avoid relying on a single AI model for everything.'
        ],
        linkLabel: 'Open ChatGPT for Brainstorming',
        linkUrl: 'https://chat.openai.com'
    },
    {
        id: 'skill-md-basics',
        icon: BookOpen,
        title: 'Step 1: Understand `.md` Files and Skill Creator',
        stage: 'Extended Toolkit',
        summary: 'Before building, learn how `SKILL.md` guides AI behavior and workflow.',
        eli5: 'A markdown file is an instruction booklet. If the booklet is clear, the assistant follows correctly.',
        steps: [
            'Open and review a `SKILL.md` file.',
            'Understand required frontmatter: `name` and `description`.',
            'Write concise, explicit instructions.',
            'Organize reusable files into `scripts/`, `references/`, and `assets/`.',
            'Validate with a small test task first.'
        ],
        linkLabel: 'Review Skill Creator Docs',
        linkUrl: 'https://platform.openai.com/docs'
    },
    {
        id: 'style-direction',
        icon: BookOpen,
        title: 'Choose a Distinct Design Direction',
        stage: 'Extended Toolkit',
        summary: 'A clear visual direction prevents your website from looking generic.',
        eli5: 'If everyone wears the same uniform, nobody stands out. Your design direction is your identity.',
        steps: [
            'Select 3 mood keywords (e.g. bold, warm, playful).',
            'Collect 2 reference websites.',
            'Borrow principles, not exact layouts.',
            'Choose one heading font and one body font.',
            'Set one primary color and one accent color.'
        ],
        linkLabel: 'Open Design Inspiration',
        linkUrl: 'https://www.behance.net/',
        designExamples: [
            { label: 'Glassmorphism', url: 'https://dribbble.com/tags/glassmorphism' },
            { label: 'Neo-Brutalism', url: 'https://dribbble.com/tags/neo-brutalism' },
            { label: 'Minimal', url: 'https://dribbble.com/tags/minimal_web_design' },
            { label: 'Bento UI', url: 'https://dribbble.com/tags/bento_ui' },
            { label: 'Editorial Style', url: 'https://dribbble.com/tags/editorial_web_design' }
        ]
    },
    {
        id: 'ai-refer-design',
        icon: Brain,
        title: 'After Choosing a Design, Ask AI to Reference It',
        stage: 'Extended Toolkit',
        summary: 'Use concrete references so AI output matches your style direction.',
        eli5: 'If you show a clear example, the assistant can follow your taste more accurately.',
        steps: [
            'Select 1-2 strong reference websites.',
            'Tell AI exactly which design traits you want to keep.',
            'Ask for style principles, not exact copies.',
            'Generate one section at a time.',
            'Check typography, spacing, and color consistency.'
        ],
        linkLabel: 'Open AI Design Referencing',
        linkUrl: 'https://www.youtube.com/results?search_query=how+to+use+ai+with+design+references'
    },
    {
        id: 'container-frame-element',
        icon: BookOpen,
        title: 'Container, Frame, and Element (Visual Fundamentals)',
        stage: 'Extended Toolkit',
        summary: 'Learn core visual structure so your layout stays clean and intentional.',
        eli5: 'A container is a big box, frames are shelves, and elements are items on those shelves.',
        steps: [
            'Define one primary container for each section.',
            'Break each container into frames (header, body, footer).',
            'Place elements by hierarchy: title, content, action.',
            'Keep spacing consistent between frames and elements.',
            'Review scanability: clear or cluttered?'
        ],
        linkLabel: 'Open Layout Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=ui+layout+container+frame+element+basics'
    },
    {
        id: 'move-elements',
        icon: Rocket,
        title: 'How to Move Elements with Proper Visual Balance',
        stage: 'Extended Toolkit',
        summary: 'Element movement should follow grid, alignment, and spacing logic.',
        eli5: 'Moving furniture works best when pathways stay clear. UI placement works the same way.',
        steps: [
            'Move elements according to a layout grid.',
            'Use intentional alignment (left, center, right).',
            'Check horizontal and vertical spacing consistency.',
            'Validate on desktop and mobile.',
            'Compare before/after screenshots.'
        ],
        linkLabel: 'Open Visual Alignment Guide',
        linkUrl: 'https://www.youtube.com/results?search_query=how+to+align+ui+elements+properly'
    },
    {
        id: 'asset-format-basics',
        icon: BookOpen,
        title: 'JPG, PNG, SVG: When to Use Each',
        stage: 'Extended Toolkit',
        summary: 'Choose the correct format so visuals stay sharp and pages remain fast.',
        eli5: 'Use JPG for photos, PNG for transparency, and SVG for crisp icons and logos.',
        steps: [
            'Use JPG for photographic images and large backgrounds.',
            'Use PNG when transparency is required.',
            'Use SVG for logos, icons, and vector illustrations.',
            'Check file size before upload.',
            'Validate quality on both desktop and mobile.'
        ],
        linkLabel: 'Open Image Format Lesson',
        linkUrl: 'https://www.youtube.com/results?search_query=jpg+png+svg+explained+for+web+design'
    },
    {
        id: 'generate-assets-ai',
        icon: Sparkles,
        title: 'Generate Assets with AI (Images, Icons, Mockups)',
        stage: 'Extended Toolkit',
        summary: 'Create useful visual assets quickly without generic-looking output.',
        eli5: 'AI is your design assistant: clear direction in, faster useful drafts out.',
        steps: [
            'Prompt with brand style, color, and usage context.',
            'Generate multiple variations.',
            'Pick assets that match your layout and hierarchy.',
            'Refine prompts to fix details.',
            'Export in the right format: PNG, SVG, or JPG.'
        ],
        linkLabel: 'Open AI Asset Generation',
        linkUrl: 'https://www.youtube.com/results?search_query=ai+image+generation+for+website+assets'
    },
    {
        id: 'generate-3d-assets',
        icon: Sparkles,
        title: 'Generate 3D Assets for Web Experiences',
        stage: 'Extended Toolkit',
        summary: 'Use 3D assets to add depth while keeping performance healthy.',
        eli5: '3D should support the story, not slow down the page.',
        steps: [
            'Limit 3D to 1-2 key sections.',
            'Use glTF/GLB where possible for web delivery.',
            'Compress 3D assets before shipping.',
            'Test performance and responsiveness.',
            'Provide a static fallback for low-end devices.'
        ],
        linkLabel: 'Open 3D for Web Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=3d+assets+for+web+beginners+gltf+glb'
    },
    {
        id: 'ai-build-website',
        icon: Brain,
        title: 'Use AI to Build Websites Effectively',
        stage: 'Extended Toolkit',
        summary: 'Good prompts produce usable first drafts faster.',
        eli5: 'AI is like a delivery rider: with a precise address, it reaches the right place quickly.',
        steps: [
            'Provide audience, objective, and style context.',
            'Generate page structure before visual styling.',
            'Build one section at a time.',
            'Review output against a checklist.',
            'Run short iteration cycles.'
        ],
        linkLabel: 'Open AI Builder',
        linkUrl: 'https://v0.dev/'
    },
    {
        id: 'basic-prompting',
        icon: Brain,
        title: 'Basic Prompting: Give Better AI Instructions',
        stage: 'Extended Toolkit',
        summary: 'Learn a simple prompt format so AI outputs are accurate and usable.',
        eli5: 'A prompt is an address. The clearer the address, the faster AI reaches the right result.',
        steps: [
            'Use a simple format: Goal + Context + Output format.',
            'Specify the style and constraints.',
            'Add a short example when needed.',
            'Ask AI to clarify missing inputs.',
            'Iterate quickly with v2 and v3 prompts.'
        ],
        linkLabel: 'Open Prompting Basics',
        linkUrl: 'https://platform.openai.com/docs/guides/prompt-engineering'
    },
    {
        id: 'ai-implementation-planning',
        icon: Brain,
        title: 'Discuss with AI to Create an Implementation Plan',
        stage: 'Extended Toolkit',
        summary: 'Before coding, use AI to break features into clear, executable phases.',
        eli5: 'Planning first saves time and prevents rework.',
        steps: [
            'Describe the feature objective clearly.',
            'Ask AI to split work into phases: UI, data, testing, deployment.',
            'Request risks and fallback options.',
            'Ask for prioritization: must-have vs nice-to-have.',
            'Use the output as your execution checklist.'
        ],
        linkLabel: 'Open AI Planning Workflow',
        linkUrl: 'https://www.youtube.com/results?search_query=ai+implementation+planning+for+developers'
    },
    {
        id: 'ux-flow',
        icon: Users,
        title: 'Design for Usability and Clarity',
        stage: 'Extended Toolkit',
        summary: 'Beauty alone is not enough; users must understand what to do next.',
        eli5: 'A beautiful house is frustrating if the front door is hard to find.',
        steps: [
            'Ensure hero section answers what, who, and why.',
            'Keep navigation concise.',
            'Use clear action-oriented CTA labels.',
            'Give each section one purpose.',
            'Remove elements that do not support decisions.'
        ],
        linkLabel: 'Open UX Basics',
        linkUrl: 'https://www.nngroup.com/articles/'
    },
    {
        id: 'content-copy',
        icon: BookOpen,
        title: 'Write Conversion-Focused Website Copy',
        stage: 'Extended Toolkit',
        summary: 'Clear copy increases trust and action.',
        eli5: 'If a shop sign is confusing, people walk away.',
        steps: [
            'Use a problem + promise headline.',
            'Use a plain-language subheadline.',
            'Add social proof or outcomes.',
            'Avoid technical jargon for general users.',
            'Use one primary CTA per page.'
        ],
        linkLabel: 'Open Landing Copy Tips',
        linkUrl: 'https://www.copyhackers.com/blog/'
    },
    {
        id: 'inspect-mobile-view',
        icon: Rocket,
        title: 'Inspect Element for Mobile View Validation',
        stage: 'Extended Toolkit',
        summary: 'Use browser DevTools to validate mobile layout before release.',
        eli5: 'Inspect mode lets you preview your website like different phones.',
        steps: [
            'Start from mobile-first width before desktop refinements.',
            'Open the website in Chrome.',
            'Press `F12` to open DevTools.',
            'Enable Device Toolbar (phone/tablet icon).',
            'Test multiple device presets and orientations.',
            'Adjust spacing, typography, and tap targets based on findings.'
        ],
        linkLabel: 'Open Chrome Device Mode Guide',
        linkUrl: 'https://developer.chrome.com/docs/devtools/device-mode'
    },
    {
        id: 'file-structure-basics',
        icon: BookOpen,
        title: 'File Structure Basics (Keep Projects Maintainable)',
        stage: 'Extended Toolkit',
        summary: 'Good folder structure reduces confusion as your project grows.',
        eli5: 'Organized folders are like labeled drawers: you find things faster.',
        steps: [
            'Split by purpose: pages, components, styles, lib, assets.',
            'Use clear and consistent file naming.',
            'Keep reusable UI in components.',
            'Keep helpers and API logic in lib/utils.',
            'Refactor structure regularly as the project scales.'
        ],
        linkLabel: 'Open Project Structure Guide',
        linkUrl: 'https://www.youtube.com/results?search_query=react+project+folder+structure+for+beginners'
    },
    {
        id: 'ask-ai-code-comments',
        icon: Brain,
        title: 'Want to Understand Code? Ask AI to Add Comments',
        stage: 'Extended Toolkit',
        summary: 'Use AI to annotate code so beginners can read it with confidence.',
        eli5: 'Comments are subtitles for code behavior.',
        steps: [
            'Copy the function/component you do not understand.',
            'Ask AI for a line-by-line explanation in plain language.',
            'Ask AI to insert comments without changing behavior.',
            'Re-read the commented version and compare.',
            'Remove extra comments after you understand the logic.'
        ],
        linkLabel: 'Open Code Explanation Workflow',
        linkUrl: 'https://www.youtube.com/results?search_query=understand+code+with+ai+comments'
    },
    {
        id: 'user-retention',
        icon: Users,
        title: 'User Retention: Bring Users Back Consistently',
        stage: 'Extended Toolkit',
        summary: 'Retention keeps your app useful over time, not just during launch hype.',
        eli5: 'Retention means people return because your app keeps helping them.',
        steps: [
            'Identify the user “aha moment” early.',
            'Reduce onboarding friction.',
            'Add habit loops (reminders, progress cues).',
            'Measure and fix drop-off points.',
            'Iterate quickly from active-user feedback.'
        ],
        linkLabel: 'Open User Retention Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=user+retention+for+web+apps+beginners'
    },
    {
        id: 'scale-your-app',
        icon: Rocket,
        title: 'Scale Your App for Growth',
        stage: 'Extended Toolkit',
        summary: 'As usage increases, your app must stay fast, reliable, and maintainable.',
        eli5: 'Scaling is upgrading systems before traffic overloads your app.',
        steps: [
            'Track core performance and error metrics.',
            'Optimize assets, queries, and frontend bundle size.',
            'Cache frequently accessed data.',
            'Split services when complexity increases.',
            'Set monitoring and incident alerts.'
        ],
        linkLabel: 'Open App Scaling Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=how+to+scale+web+application+beginners'
    },
    {
        id: 'monetize-app',
        icon: Sparkles,
        title: 'Monetize Your App Sustainably',
        stage: 'Extended Toolkit',
        summary: 'Choose a monetization model that matches product value and user maturity.',
        eli5: 'Monetization is how your app earns while continuing to deliver value.',
        steps: [
            'Pick an initial model: subscription, one-time, or freemium.',
            'Ensure free tier still delivers clear value.',
            'Price based on outcomes, not guesswork.',
            'Test pricing with a small segment first.',
            'Track free-to-paid conversion metrics.'
        ],
        linkLabel: 'Open App Monetization Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=app+monetization+for+beginners+saas'
    },
    {
        id: 'visual-troubleshooting',
        icon: Sparkles,
        title: 'Visual Troubleshooting (Copy-Paste Debug Workflow)',
        stage: 'Extended Toolkit',
        summary: 'Fix layout issues faster using a focused, repeatable troubleshooting loop.',
        eli5: 'Repair one part at a time, test it, then move to the next part.',
        steps: [
            'Capture the issue with screenshot and short problem statement.',
            'Copy only the relevant code block.',
            'Paste into AI with: problem, expected result, and snippet.',
            'Apply one small fix and re-test.',
            'Keep good changes, revert bad ones, and iterate.'
        ],
        linkLabel: 'Open Frontend Debugging Basics',
        linkUrl: 'https://www.youtube.com/results?search_query=frontend+debugging+workflow+for+beginners'
    },
    {
        id: 'connect-database',
        icon: Database,
        title: 'Connect Your Website to a Database',
        stage: 'Extended Toolkit',
        summary: 'Data storage enables personalized and persistent experiences.',
        eli5: 'A database is a labeled storage box for information.',
        steps: [
            'Create a Supabase project.',
            'Create essential tables first.',
            'Set URL + anon key in `.env`.',
            'Test one insert action.',
            'Test one read action.'
        ],
        linkLabel: 'Open Supabase Guide',
        linkUrl: 'https://supabase.com/docs/guides/getting-started'
    },
    {
        id: 'api-basics',
        icon: Brain,
        title: 'API Fundamentals for Beginners',
        stage: 'Extended Toolkit',
        summary: 'APIs allow your app to exchange data with external services.',
        eli5: 'An API is like a waiter: you place an order, the waiter brings your response back.',
        steps: [
            'Identify the data you need to send or receive.',
            'Review API endpoints and expected inputs.',
            'Understand request and response format.',
            'Test with sample data first.',
            'Handle API failure states clearly.'
        ],
        linkLabel: 'Open API Introduction',
        linkUrl: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Introduction'
    },
    {
        id: 'fetching-basics',
        icon: Brain,
        title: 'Fetching Data in Practice',
        stage: 'Extended Toolkit',
        summary: 'Fetching is how your UI retrieves live data from APIs or databases.',
        eli5: 'You open a tap (request), water comes out (response), then you use it (render in UI).',
        steps: [
            'Define the data you need.',
            'Request data from the correct endpoint.',
            'Show loading state while waiting.',
            'Handle failed requests clearly.',
            'Render results in clean UI blocks.'
        ],
        linkLabel: 'Open Fetch API Guide',
        linkUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch'
    },
    {
        id: 'web-scraping-basics',
        icon: BookOpen,
        title: 'Web Scraping (Ethical Beginner Intro)',
        stage: 'Extended Toolkit',
        summary: 'Use scraping for research and references while respecting platform rules.',
        eli5: 'Scraping is like copying notes from a board, but you still must follow classroom rules.',
        steps: [
            'Check the site terms before scraping.',
            'Collect only publicly available information.',
            'Avoid aggressive request frequency.',
            'Store source URLs for attribution.',
            'Use output for insights, not blind duplication.'
        ],
        linkLabel: 'Open Web Scraping Intro',
        linkUrl: 'https://developer.mozilla.org/en-US/docs/Glossary/Web_scraping'
    },
    {
        id: 'supabase-keys',
        icon: Database,
        title: 'Supabase Keys and Security Basics',
        stage: 'Extended Toolkit',
        summary: 'Know which keys are safe for frontend and which must remain private.',
        eli5: 'You have a guest key and a master key. Never hand out the master key publicly.',
        steps: [
            'Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in frontend.',
            'Never expose `service_role` key in client code.',
            'Store credentials in `.env` files only.',
            'Ensure `.env` is excluded from Git commits.',
            'Apply RLS policies for safe data access.'
        ],
        linkLabel: 'Open Supabase API Keys Docs',
        linkUrl: 'https://supabase.com/docs/guides/api/api-keys'
    },
    {
        id: 'github-flow',
        icon: Github,
        title: 'Publish and Manage Project on GitHub',
        stage: 'Extended Toolkit',
        summary: 'Version control protects your work and supports collaboration.',
        eli5: 'Think of GitHub as a cloud folder with time machine history.',
        steps: [
            'Create a repository.',
            'Initialize git and make first commit.',
            'Connect remote URL.',
            'Push to GitHub.',
            'Commit frequently in small units.'
        ],
        linkLabel: 'Open GitHub Quickstart',
        linkUrl: 'https://docs.github.com/en/get-started/start-your-journey/hello-world'
    },
    {
        id: 'github-antigravity',
        icon: Github,
        title: 'GitHub and Antigravity Workflow',
        stage: 'Extended Toolkit',
        summary: 'Use Antigravity for acceleration and GitHub for controlled version history.',
        eli5: 'Antigravity helps you build faster; GitHub keeps a reliable history of each step.',
        steps: [
            'Connect local project to a GitHub repository.',
            'Use Antigravity for scoped feature generation.',
            'Review outputs before committing.',
            'Commit in small task-focused chunks.',
            'Push frequently to keep remote backup current.'
        ],
        linkLabel: 'Open GitHub Flow Guide',
        linkUrl: 'https://docs.github.com/en/get-started/using-github/github-flow'
    },
    {
        id: 'deploy-live',
        icon: Rocket,
        title: 'Deploy Your Website to Production',
        stage: 'Extended Toolkit',
        summary: 'Deployment makes your product accessible to real users.',
        eli5: 'Before deployment, your website lives in your room. After deployment, it lives on a public street.',
        steps: [
            'Create a Vercel account.',
            'Import your GitHub repository.',
            'Configure environment variables.',
            'Run deployment.',
            'Validate live user flows.'
        ],
        linkLabel: 'Open Vercel Guide',
        linkUrl: 'https://vercel.com/docs/getting-started-with-vercel'
    },
    {
        id: 'vercel-production',
        icon: Rocket,
        title: 'Vercel Preview vs Production',
        stage: 'Extended Toolkit',
        summary: 'Test in preview first, then release safely to production.',
        eli5: 'Preview is rehearsal; production is the real public show.',
        steps: [
            'Import GitHub repository into Vercel.',
            'Configure environment variables by environment.',
            'Validate core flows in preview URL.',
            'Check API, forms, and mobile behavior.',
            'Promote/deploy to production only after checks pass.'
        ],
        linkLabel: 'Open Vercel Deployment Docs',
        linkUrl: 'https://vercel.com/docs/deployments/overview'
    },
    {
        id: 'install-skills',
        icon: Sparkles,
        title: 'Install Skills and Starter Resources',
        stage: 'Extended Toolkit',
        summary: 'Skills and templates accelerate beginner workflows.',
        eli5: 'Skills are like equipment presets that make each mission easier.',
        steps: [
            'Pick one skill based on current goal.',
            'Install via your chosen assistant/tool.',
            'Run a tiny test task.',
            'Save reusable prompt templates.',
            'Add new skills gradually.'
        ],
        linkLabel: 'Open Skill Guide',
        linkUrl: 'https://platform.openai.com/docs'
    },
    {
        id: 'creative-motion',
        icon: Sparkles,
        title: 'Creative Mode: Motion and Interaction',
        stage: 'Extended Toolkit',
        summary: 'After launch, use motion to improve delight and guidance.',
        eli5: 'Animation is seasoning: a small amount improves everything.',
        steps: [
            'Choose 2-3 motion patterns only.',
            'Prioritize reveal, hover, and feedback states.',
            'Use motion to guide attention.',
            'Check performance impact.',
            'Support reduced-motion settings.'
        ],
        linkLabel: 'Open Motion Inspiration',
        linkUrl: 'https://www.awwwards.com/websites/animations/'
    },
    {
        id: 'ai-imagination',
        icon: Brain,
        title: 'Creative Imagination with AI',
        stage: 'Extended Toolkit',
        summary: 'Use AI to explore original ideas while keeping human direction.',
        eli5: 'AI can build quickly, but you still decide the destination.',
        steps: [
            'Start with one ambitious but useful idea.',
            'Break it into small features.',
            'Prototype quickly with AI.',
            'Test with real users.',
            'Improve based on feedback.'
        ],
        linkLabel: 'Open AI Product Inspiration',
        linkUrl: 'https://www.producthunt.com/'
    }
];

const COPY_BY_TONE = {
    ijam: {
        title: 'Resource Path Ala Ijam',
        subtitle: 'Santai je. Semua aku explain macam borak dengan beginner total. Kita jalan step by step: guna AI, sambung database, upload GitHub, pastu deploy live.',
        libraryHint: 'Aku tunjuk satu resource sekali je supaya kepala tak serabut.',
        tip: 'Tip Ijam: settle satu lesson dulu, baru pergi next. Slow-slow pun takpe.'
    },
    formal: {
        title: 'Beginner Resource Path',
        subtitle: 'This learning path is designed for complete beginners. Follow each step in order: AI tools, database setup, GitHub workflow, and deployment.',
        libraryHint: 'Only one community resource is shown at a time to keep learning focused.',
        tip: 'Beginner tip: complete one lesson before moving to the next.'
    }
};

const LESSON_TIPS_BY_TONE = {
    ijam: {
        'function-over-form': ['Jangan gatal pergi adjust warna butang selagi data tak simpan dalam DB!', 'Biar app nampak buruk asalkan berfungsi dulu.', 'Tulis logic, lepas tu baru fikir pasal style.'],
        'app-vibe-quality': ['Loading state tu wajib. Kalau tak user ingat app kau hang.', 'Warna hover button tu biar terang.'],
        'system-thinking': ['Jangan prompt 10 muka surat kat ChatGPT. Satu-satu.', 'Siapkan frontend, pastu move on to database schema.'],
        'user-centric-empathy': ['Uji guna telefon sendiri dulu sebelum suruh kawan test.', 'Simpan satu list benda yang kau sendiri menyampah pakai kat web orang lain.'],
        'creativity-constraints': ['Copy kod error merah kat terminal dan lempar kat AI.', 'Guna Tailwind classes kalau tak reti CSS module.'],
        'setup-environment': ['Guna Node LTS, elak version experimental.', 'Lepas install, restart terminal sebelum check `node -v`.', 'Kalau ada error, screenshot terus untuk debug cepat.'],
        'setup-ai-api-key': ['Groq API sangat pantas kalau nak test feature.', 'Simpan key kat tempat selamat, bukan hardcode.', 'OpenRouter paling chill sebab satu wallet cover semua.'],
        'chatgpt-personality': ['Tulis role dia, bagi contoh.', 'Bincang panjang lebar kat ChatGPT dulu, sebelum sentuh code.', 'Bagi dia critique idea kau.'],
        'chatgpt-master-prompt': ['Ini trick rahsia. JANGAN type satu-satu kat Antigravity, bagi MASTER PROMPT terus.', 'Tekankan UI design sistem yang jelas.', 'Pastikan SQL schema ada dalam tu kalau perlukan backend.'],
        'antigravity-sonnet': ['Pilih Claude 3.5 Sonnet untuk kestabilan logic.', 'Guna Gemini Flash kalau design lari.', 'Boleh switch model ikut task.'],
        'github-repo-setup': ['Commit kecil tapi kerap.', 'Penting: Faham beza `git pull` dengan `git fetch`.', 'Push setiap habis satu feature.'],
        'vercel-deploy': ['Check env vars sebelum deploy.', 'Test flow utama selepas live.', 'PASTE URL VERCEL DALAM TERMINAL UNTUK DAPAT TROPHY!', 'Simpan checklist deployment.'],
        'vercel-analytics': ['Letak tag Analytis kat root (App.js).', 'Kalau pakai Next.js, ada Vercel Analytics wrapper.', 'Tengok log live kat dashboard.'],
        'supabase-setup': ['Anon key untuk frontend je.', 'Service role key JANGAN expose dalam code frontend.', 'Letak kat `.env` dan `.gitignore` fail tu.'],
        'supabase-sql': ['Guna AI untuk generate Table creation command.', 'Copy SQL dari ChatGPT, paste kat browser Supabase.', 'Run test data dari editor terus.'],
        'supabase-connect': ['Masukkan environment variables Supabase tu ke Vercel setting.', 'Jangan hard-code URL.', 'Bind variable VITE_SUPABASE_URL.'],
        'custom-domain': ['Domain CNAME setting kat portal domain (CTH: Namecheap).', 'Ping DNS checker untuk tengok dah propagate.', 'Vercel urus SSL automatik.'],
        'install-node-antigravity': ['Guna Node LTS, elak version experimental.', 'Lepas install, restart terminal sebelum check `node -v`.', 'Kalau ada error, screenshot terus untuk debug cepat.'],
        'the-4-step-flow': ['Ingat langkah ni supaya tak sesat di tengah jalan.', 'Jangan lari ke Vercel kalau tahap Vibe Coding lum siap.', 'Idea brainstormed baik menjimatkan masa coding.'],
        'ai-tech-stack': ['Bookmark tool ni siap-siap.', 'Bila buntu idea, campak ke ChatGPT, bukan terus paksa Antigravity buat kod.', 'Gemini 3.1 paling mantap buat overall architecture.'],
        'skill-md-basics': ['Mulakan dengan instruction pendek dan specific.', 'Satu skill fokus satu objective.', 'Test skill guna task kecil dulu.'],
        'style-direction': ['Pilih 1 primary style, bukan campur 5 style.', 'Buat moodboard ringkas sebelum generate UI.', 'Pastikan warna dan font konsisten.'],
        'ai-refer-design': ['Bagi AI 1-2 reference je supaya direction clear.', 'Cakap elemen apa yang kau nak tiru (spacing/typography).', 'Minta AI elak copy 100%.', 'Gaya kau: minta theme match dengan identity site sedia ada.'],
        'container-frame-element': ['Bina container dulu, baru isi content.', 'Jangan letak terlalu banyak element dalam satu frame.', 'Semak hierarchy: apa paling penting user kena nampak dulu.'],
        'move-elements': ['Guna grid untuk align element.', 'Semak jarak minimum antara button.', 'Bandingkan before/after screenshot.'],
        'asset-format-basics': ['SVG untuk icon/logo, paling tajam.', 'Compress JPG/PNG sebelum upload.', 'Elak guna image besar kalau boleh crop dulu.'],
        'generate-assets-ai': ['Prompt jelas: style, warna, usage.', 'Generate banyak option, pilih best.', 'Edit sikit manually bagi nampak original.'],
        'generate-3d-assets': ['Guna 3D pada section penting sahaja.', 'Optimize GLB supaya page tak berat.', 'Sediakan fallback image untuk phone lama.'],
        'ai-build-website': ['Prompt ikut structure page dulu.', 'Minta AI output section by section.', 'Review setiap output sebelum continue.'],
        'basic-prompting': ['Format simple: Goal + Context + Output.', 'Letak contoh output kalau perlu.', 'Iterate prompt v2 cepat.', 'Gaya kau: terus suruh AI proceed selepas plan, jangan terlalu banyak teori.'],
        'ai-implementation-planning': ['Minta AI bagi plan ikut fasa dan priority.', 'Minta AI list blockers dan assumption awal.', 'Gaya kau: plan mesti ada langkah practical dan terus executable.'],
        'ux-flow': ['Setiap section mesti ada tujuan.', 'CTA kena jelas dan action-based.', 'Buang elemen yang tak bantu user.'],
        'content-copy': ['Headline kena terus explain value.', 'Gunakan bahasa user, bukan jargon.', 'Pastikan satu page satu CTA utama.'],
        'inspect-mobile-view': ['Start 375px dulu (mobile-first).', 'Check button size senang tap.', 'Test portrait + landscape.', 'Gaya kau: verify view dulu sebelum polish details desktop.'],
        'file-structure-basics': ['Folder ikut fungsi, bukan ikut suka-suka.', 'Nama fail konsisten dari awal.', 'Refactor structure bila project membesar.'],
        'ask-ai-code-comments': ['Paste code kecil dulu, jangan terlalu panjang.', 'Minta AI explain line-by-line.', 'Delete komen berlebihan bila dah faham.'],
        'visual-troubleshooting': ['Fix satu issue satu masa.', 'Simpan sebelum test fix baru.', 'Revert cepat kalau patch tak jadi.', 'Gaya kau: attach screenshot + snippet masa report issue untuk diagnosis cepat.'],
        'connect-database': ['Bina table minimum viable dulu.', 'Test insert/read awal.', 'Pastikan `.env` betul sebelum blame code.'],
        'api-basics': ['Semak endpoint dan method betul.', 'Validate response shape.', 'Handle error message untuk user.'],
        'fetching-basics': ['Wajib ada loading state.', 'Wajib ada error state.', 'Jangan fetch data tak perlu.'],
        'web-scraping-basics': ['Semak terms website dulu.', 'Jangan scrape terlalu laju.', 'Simpan source untuk rujukan.'],
        'supabase-keys': ['Anon key untuk frontend je.', 'Service role key jangan expose.', 'Semak RLS sebelum production.'],
        'github-flow': ['Commit kecil tapi kerap.', 'Nama commit mesti jelas.', 'Push selepas milestone kecil.'],
        'github-antigravity': ['Review AI output sebelum commit.', 'Satu feature satu commit.', 'Elak auto-merge tanpa test.'],
        'deploy-live': ['Check env vars sebelum deploy.', 'Test flow utama selepas live.', 'Simpan checklist deployment.'],
        'vercel-production': ['Guna preview URL untuk QA dulu.', 'Semak API + form di preview.', 'Baru promote ke production.'],
        'install-skills': ['Install skill ikut keperluan semasa.', 'Jangan pasang terlalu banyak sekaligus.', 'Simpan prompt template untuk repeat task.'],
        'creative-motion': ['Animation mesti bantu fokus, bukan ganggu.', 'Gunakan duration ringkas 150-300ms.', 'Support reduced motion.'],
        'ai-imagination': ['Mulakan idea kecil tapi unik.', 'Uji dengan user sebenar.', 'Iterate ikut feedback, bukan ego.']
    },
    formal: {
        'function-over-form': ['Focus purely on data and state first.', 'Inject styles only when the flow is flawless.'],
        'app-vibe-quality': ['Enforce strict loading and disabled states.', 'Maintain a unified design token system.'],
        'system-thinking': ['Deconstruct before querying the AI.', 'Build frontend shells, then connect data stores.'],
        'user-centric-empathy': ['Validate assumptions via mobile layout.', 'Eliminate friction points in forms.'],
        'creativity-constraints': ['Leverage constraints to enforce simplicity.', 'Lean into component libraries heavily.'],
        'setup-environment': ['Use Node LTS.', 'Restart your terminal.'],
        'setup-ai-api-key': ['Groq API is fast.', 'Keep keys secure.'],
        'chatgpt-personality': ['Set explicit persona context first.'],
        'chatgpt-master-prompt': ['Summarize context into ONE strong prompt.'],
        'antigravity-sonnet': ['Select Claude 3.5 Sonnet for logic stability.', 'Use Gemini Flash for aesthetic adjustments.'],
        'github-repo-setup': ['Commit in small blocks.', 'Understand pull vs fetch.'],
        'vercel-deploy': ['Check env vars before deploy.', 'Verify functionality after pushing live.'],
        'vercel-analytics': ['Place analytics component in the app root.'],
        'supabase-setup': ['Protect your service role key always.'],
        'supabase-sql': ['Validate AI generated SQL before execution in the editor.'],
        'supabase-connect': ['Configure environment variables carefully within Vercel pipeline.'],
        'custom-domain': ['Link CNAME and A records.', 'SSL is automatically provisioned.'],
        'install-node-antigravity': ['Use Node.js LTS for stability.', 'Restart terminal after installation.', 'Capture exact error logs for faster debugging.'],
        'the-4-step-flow': ['Memorizing this flow prevents getting overwhelmed later.', 'Complete Vibe Coding locally before worrying about Vercel deployments.', 'A strong ChatGPT brainstorm session limits Antigravity context switch.'],
        'ai-tech-stack': ['Bookmark your tools so they are easily accessible.', 'Delegate complex ideation strictly to ChatGPT before throwing code at Antigravity.', 'Use Gemini 3.1 for high-performance references and prompt engineering.'],
        'skill-md-basics': ['Keep instructions concise and explicit.', 'One skill should target one clear objective.', 'Validate with a small test task first.'],
        'style-direction': ['Choose one primary style direction.', 'Create a lightweight moodboard first.', 'Keep typography and color tokens consistent.'],
        'ai-refer-design': ['Provide 1-2 reference links only.', 'Specify which traits to emulate.', 'Avoid direct copying of full layouts.', 'Your workflow favors theme alignment with the existing site identity.'],
        'container-frame-element': ['Define containers before details.', 'Avoid overcrowding one frame.', 'Prioritize visual hierarchy.'],
        'move-elements': ['Align elements on a grid.', 'Maintain consistent spacing.', 'Compare before/after snapshots.'],
        'asset-format-basics': ['Use SVG for icons and logos.', 'Compress JPG/PNG before upload.', 'Resize assets to actual render dimensions.'],
        'generate-assets-ai': ['Prompt with style and usage context.', 'Generate multiple variants.', 'Refine manually for originality.'],
        'generate-3d-assets': ['Limit 3D to key moments.', 'Optimize GLB/glTF payload size.', 'Provide fallback assets for low-end devices.'],
        'ai-build-website': ['Generate structure before polish.', 'Work section-by-section.', 'Review each iteration with a checklist.'],
        'basic-prompting': ['Use Goal + Context + Output format.', 'Include constraints explicitly.', 'Iterate quickly with prompt versions.', 'Your workflow prefers fast execution after planning, not long theory loops.'],
        'ai-implementation-planning': ['Ask AI for phase-based priorities.', 'Request risks, assumptions, and fallback paths.', 'Keep outputs directly actionable for immediate implementation.'],
        'ux-flow': ['Ensure each section has one purpose.', 'Use clear action labels for CTAs.', 'Remove non-essential UI noise.'],
        'content-copy': ['Lead with value in the headline.', 'Use plain user language.', 'Keep one primary CTA per page.'],
        'inspect-mobile-view': ['Start with mobile-first width (375px).', 'Verify tap targets and legibility.', 'Test multiple device presets.', 'Validate phone experience before desktop polish.'],
        'file-structure-basics': ['Organize by responsibility.', 'Use consistent naming conventions.', 'Refactor structure as complexity grows.'],
        'ask-ai-code-comments': ['Share focused code snippets.', 'Request line-by-line plain explanations.', 'Remove redundant comments after learning.'],
        'visual-troubleshooting': ['Change one variable at a time.', 'Capture baseline before patching.', 'Revert quickly when a fix fails.', 'Provide screenshot + code snippet for faster diagnosis.'],
        'connect-database': ['Start with minimal schema.', 'Test insert/read immediately.', 'Verify environment configuration first.'],
        'api-basics': ['Confirm method and endpoint.', 'Validate response contracts.', 'Implement user-friendly error handling.'],
        'fetching-basics': ['Implement loading and error states.', 'Avoid unnecessary requests.', 'Cache where appropriate.'],
        'web-scraping-basics': ['Respect terms and robots guidance.', 'Throttle requests responsibly.', 'Keep source attribution.'],
        'supabase-keys': ['Expose only anon key in frontend.', 'Never ship service role key.', 'Enforce RLS before launch.'],
        'github-flow': ['Commit in small logical units.', 'Write clear commit messages.', 'Push frequently after stable checkpoints.'],
        'github-antigravity': ['Review AI-generated changes before commit.', 'Keep changes scoped per feature.', 'Do not merge without verification.'],
        'deploy-live': ['Validate env vars before deployment.', 'Test critical user flows after launch.', 'Use a repeatable release checklist.'],
        'vercel-production': ['QA thoroughly on preview URLs.', 'Validate APIs and forms in preview.', 'Promote only after checks pass.'],
        'install-skills': ['Install skills based on current needs.', 'Avoid tool overload early.', 'Keep reusable prompt templates.'],
        'creative-motion': ['Use motion to guide attention.', 'Keep transitions short and intentional.', 'Respect reduced-motion preferences.'],
        'ai-imagination': ['Start with focused creative hypotheses.', 'Test with real users early.', 'Iterate based on evidence.']
    }
};

const TOOL_REFERENCES = [
    {
        name: 'Vercel',
        purpose: 'Deploy and host your website',
        links: [
            { label: 'Getting Started', url: 'https://vercel.com/docs/getting-started-with-vercel' },
            { label: 'Environments (Local / Preview / Production)', url: 'https://vercel.com/docs/deployments/environments' },
            { label: 'Environment Variables', url: 'https://vercel.com/docs/environment-variables' }
        ]
    },
    {
        name: 'Supabase',
        purpose: 'Database, auth, and backend services',
        links: [
            { label: 'Get Started', url: 'https://supabase.com/docs/guides/getting-started' },
            { label: 'JavaScript Client Init', url: 'https://supabase.com/docs/reference/javascript/v1/initializing' },
            { label: 'API Keys (anon vs service role)', url: 'https://supabase.com/docs/guides/api/api-keys' },
            { label: 'Row Level Security (RLS)', url: 'https://supabase.com/docs/guides/database/postgres/row-level-security' }
        ]
    },
    {
        name: 'GitHub',
        purpose: 'Version control and collaboration',
        links: [
            { label: 'Hello World (Repo -> Branch -> PR)', url: 'https://docs.github.com/get-started/start-your-journey/hello-world' },
            { label: 'GitHub Flow', url: 'https://docs.github.com/en/get-started/using-github/github-flow' }
        ]
    },
    {
        name: 'Node.js',
        purpose: 'Runtime needed to run modern JavaScript projects',
        links: [
            { label: 'Download Node.js LTS', url: 'https://nodejs.org/en/download/' }
        ]
    },
    {
        name: 'Antigravity',
        purpose: 'AI-assisted building workflow',
        links: [
            { label: 'Antigravity Website', url: 'https://antigravity.id' }
        ]
    }
];

const TECH_TERMS = [
    {
        term: 'AI Agent',
        explain: 'AI yang boleh ambil task dan buat langkah-langkah untuk capai goal, bukan sekadar jawab soalan.'
    },
    {
        term: 'Agentic AI',
        explain: 'Style AI yang lebih autonomous: boleh plan, decide next step, guna tools, dan loop sampai task siap.'
    },
    {
        term: 'LLM',
        explain: 'Large Language Model. Otak bahasa yang faham prompt dan generate jawapan/code/content.'
    },
    {
        term: 'API',
        explain: 'Jalan komunikasi antara app dan service lain. App request data, API bagi response.'
    },
    {
        term: 'Frontend',
        explain: 'Bahagian yang user nampak dan klik (UI website).'
    },
    {
        term: 'Backend',
        explain: 'Bahagian belakang tabir yang urus data, auth, logic, dan server actions.'
    },
    {
        term: 'Environment Variables',
        explain: 'Setting rahsia/config seperti keys dan URLs yang disimpan luar code, biasanya dalam `.env`.'
    },
    {
        term: 'Supabase Anon Key',
        explain: 'Client key untuk frontend. Boleh expose, tapi access tetap dikawal oleh RLS policy.'
    },
    {
        term: 'Supabase Service Role Key',
        explain: 'Master key untuk server-only. Jangan letak dalam frontend/browser.'
    },
    {
        term: 'RLS (Row Level Security)',
        explain: 'Rules dalam database untuk tentukan siapa boleh baca/tulis row tertentu.'
    },
    {
        term: 'Deployment',
        explain: 'Proses publish app ke internet supaya orang lain boleh guna.'
    },
    {
        term: 'Preview vs Production',
        explain: 'Preview untuk test sebelum live. Production untuk users sebenar.'
    }
];

const LESSON_MEDIA = {
    'install-node-antigravity': {
        visual: '/lesson-visuals/install-node-antigravity.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=install+nodejs+lts+for+beginners+and+setup+dev+environment',
        youtubeLabel: 'Watch Node.js + Setup Tutorial'
    },
    'skill-md-basics': {
        visual: '/lesson-visuals/skill-md-basics.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=markdown+files+for+beginners+skill+documentation',
        youtubeLabel: 'Watch Markdown / SKILL.md Tutorial'
    },
    'style-direction': {
        visual: '/lesson-visuals/style-direction.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=web+design+styles+glassmorphism+neo+brutalism+examples',
        youtubeLabel: 'Watch Web Design Style Tutorial'
    },
    'container-frame-element': {
        visual: '/lesson-visuals/style-direction.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=container+frame+element+ui+design+for+beginners',
        youtubeLabel: 'Watch Container / Frame / Element Tutorial'
    },
    'move-elements': {
        visual: '/lesson-visuals/ux-flow.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=move+elements+in+ui+design+alignment+spacing',
        youtubeLabel: 'Watch Move Elements Tutorial'
    },
    'asset-format-basics': {
        visual: '/lesson-visuals/style-direction.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=jpg+png+svg+for+web+design+beginners',
        youtubeLabel: 'Watch Asset Format Basics'
    },
    'generate-assets-ai': {
        visual: '/lesson-visuals/ai-build-website.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=generate+website+assets+with+ai',
        youtubeLabel: 'Watch AI Asset Generation'
    },
    'generate-3d-assets': {
        visual: '/lesson-visuals/creative-motion.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=3d+assets+for+web+gltf+glb+beginners',
        youtubeLabel: 'Watch 3D Assets for Web'
    },
    'ai-build-website': {
        visual: '/lesson-visuals/ai-build-website.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=build+website+with+ai+for+beginners',
        youtubeLabel: 'Watch AI Website Build Tutorial'
    },
    'ai-refer-design': {
        visual: '/lesson-visuals/style-direction.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=using+ai+with+website+design+references',
        youtubeLabel: 'Watch AI Design Referencing Tutorial'
    },
    'basic-prompting': {
        visual: '/lesson-visuals/ai-build-website.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=prompt+engineering+for+beginners+web+building',
        youtubeLabel: 'Watch Basic Prompting Tutorial'
    },
    'ai-implementation-planning': {
        visual: '/lesson-visuals/ai-build-website.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=ai+implementation+planning+for+developers',
        youtubeLabel: 'Watch AI Implementation Planning'
    },
    'ux-flow': {
        visual: '/lesson-visuals/ux-flow.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=website+ux+flow+for+beginners',
        youtubeLabel: 'Watch UX Flow Tutorial'
    },
    'content-copy': {
        visual: '/lesson-visuals/content-copy.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=website+copywriting+for+beginners+landing+page',
        youtubeLabel: 'Watch Copywriting Tutorial'
    },
    'inspect-mobile-view': {
        visual: '/lesson-visuals/inspect-mobile-view.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=chrome+devtools+device+mode+mobile+testing',
        youtubeLabel: 'Watch Inspect Element Mobile Tutorial'
    },
    'file-structure-basics': {
        visual: '/lesson-visuals/skill-md-basics.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=react+project+folder+structure+for+beginners',
        youtubeLabel: 'Watch File Structure Basics'
    },
    'ask-ai-code-comments': {
        visual: '/lesson-visuals/skill-md-basics.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=ask+ai+to+explain+code+with+comments',
        youtubeLabel: 'Watch AI Code Comment Workflow'
    },
    'user-retention': {
        visual: '/lesson-visuals/ux-flow.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=user+retention+for+web+apps+beginners',
        youtubeLabel: 'Watch User Retention Basics'
    },
    'scale-your-app': {
        visual: '/lesson-visuals/deploy-live.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=how+to+scale+web+application+beginners',
        youtubeLabel: 'Watch App Scaling Basics'
    },
    'monetize-app': {
        visual: '/lesson-visuals/content-copy.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=app+monetization+for+beginners+saas',
        youtubeLabel: 'Watch App Monetization Basics'
    },
    'visual-troubleshooting': {
        visual: '/lesson-visuals/inspect-mobile-view.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=frontend+visual+debugging+for+beginners',
        youtubeLabel: 'Watch Visual Troubleshooting Tutorial'
    },
    'connect-database': {
        visual: '/lesson-visuals/connect-database.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=supabase+connect+database+to+frontend+beginner',
        youtubeLabel: 'Watch Database Connection Tutorial'
    },
    'api-basics': {
        visual: '/lesson-visuals/api-basics.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=api+explained+for+beginners+web+development',
        youtubeLabel: 'Watch API Basics Tutorial'
    },
    'fetching-basics': {
        visual: '/lesson-visuals/fetching-basics.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=javascript+fetch+api+for+beginners',
        youtubeLabel: 'Watch Fetching Tutorial'
    },
    'web-scraping-basics': {
        visual: '/lesson-visuals/web-scraping-basics.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=web+scraping+for+beginners+ethical+guide',
        youtubeLabel: 'Watch Web Scraping Tutorial'
    },
    'supabase-keys': {
        visual: '/lesson-visuals/supabase-keys.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=supabase+anon+key+service+role+explained',
        youtubeLabel: 'Watch Supabase Keys Tutorial'
    },
    'github-flow': {
        visual: '/lesson-visuals/github-flow.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=github+flow+for+beginners',
        youtubeLabel: 'Watch GitHub Flow Tutorial'
    },
    'github-antigravity': {
        visual: '/lesson-visuals/github-antigravity.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=ai+coding+workflow+with+github+best+practices',
        youtubeLabel: 'Watch GitHub + AI Workflow Tutorial'
    },
    'deploy-live': {
        visual: '/lesson-visuals/deploy-live.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=deploy+website+to+vercel+for+beginners',
        youtubeLabel: 'Watch Deploy Tutorial'
    },
    'vercel-production': {
        visual: '/lesson-visuals/vercel-production.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=vercel+preview+vs+production+deployment',
        youtubeLabel: 'Watch Vercel Production Tutorial'
    },
    'install-skills': {
        visual: '/lesson-visuals/install-skills.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=ai+skills+workflow+for+beginners',
        youtubeLabel: 'Watch Skills Setup Tutorial'
    },
    'creative-motion': {
        visual: '/lesson-visuals/creative-motion.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=web+animation+for+beginners+ui+motion',
        youtubeLabel: 'Watch Creative Motion Tutorial'
    },
    'ai-imagination': {
        visual: '/lesson-visuals/ai-imagination.svg',
        youtubeUrl: 'https://www.youtube.com/results?search_query=creative+ai+product+design+workflow',
        youtubeLabel: 'Watch AI Creativity Tutorial'
    }
};

const sectionStyle = {
    paddingTop: 0,
    paddingBottom: 0,
    minHeight: '100vh',
    background: 'radial-gradient(circle at 10% 10%, #fff8dc 0%, #fff0b3 40%, #ffe6d5 100%)'
};

const BOT_CLICK_RESPONSES = [
    { text: 'Eh! Jangan kacau aku! 😤', emotion: 'frustrated' },
    { text: 'You are making me angry! 🔴', emotion: 'frustrated' },
    { text: 'Okay okay... chill! 😅', emotion: 'surprised' },
    { text: "Let's START the journey! 🚀", emotion: 'excited' },
    { text: "Siap ke? Let's VIBE! ✨", emotion: 'motivated' },
    { text: 'Assalamualaikum Builder! 👋', emotion: 'celebrating' },
];

const panelStyle = {
    border: '3px solid black',
    boxShadow: '8px 8px 0 black',
    borderRadius: '14px',
    background: 'white',
    position: 'relative'
};

const DRIBBBLE_TAGS_BY_STAGE = {
    Design: [
        { label: 'Neo Brutalism', url: 'https://dribbble.com/tags/neo-brutalism' },
        { label: 'Glassmorphism', url: 'https://dribbble.com/tags/glassmorphism' },
        { label: 'Bento UI', url: 'https://dribbble.com/tags/bento_ui' },
        { label: 'Landing Page', url: 'https://dribbble.com/tags/landing_page' }
    ],
    UX: [
        { label: 'Mobile App UX', url: 'https://dribbble.com/tags/mobile_app_design' },
        { label: 'Dashboard UI', url: 'https://dribbble.com/tags/dashboard_ui' },
        { label: 'SaaS UI', url: 'https://dribbble.com/tags/saas' },
        { label: 'User Flow', url: 'https://dribbble.com/tags/user_flow' }
    ],
    Content: [
        { label: 'Hero Section', url: 'https://dribbble.com/tags/hero_section' },
        { label: 'Typography', url: 'https://dribbble.com/tags/typography' },
        { label: 'Brand Identity', url: 'https://dribbble.com/tags/branding' },
        { label: 'Portfolio', url: 'https://dribbble.com/tags/portfolio' }
    ],
    Creative: [
        { label: 'Web Animation', url: 'https://dribbble.com/tags/animation' },
        { label: 'Micro Interaction', url: 'https://dribbble.com/tags/microinteraction' },
        { label: 'Creative Website', url: 'https://dribbble.com/tags/creative_website' },
        { label: 'Experimental UI', url: 'https://dribbble.com/tags/experimental' }
    ]
};

const DRIBBBLE_DEFAULT_TAGS = [
    { label: 'Web Design', url: 'https://dribbble.com/tags/web_design' },
    { label: 'UI Design', url: 'https://dribbble.com/tags/ui_design' },
    { label: 'Responsive Design', url: 'https://dribbble.com/tags/responsive_design' },
    { label: 'Website', url: 'https://dribbble.com/tags/website' }
];

const SoonSticker = () => (
    <svg viewBox="0 0 190 66" aria-hidden="true" style={{ width: '96px', height: '34px' }}>
        <rect x="3" y="3" width="184" height="60" rx="16" fill="#fde047" stroke="#111827" strokeWidth="4" />
        <circle cx="24" cy="33" r="10" fill="#ef4444" stroke="#111827" strokeWidth="3" />
        <polygon points="21,26 31,33 21,40" fill="#fff" />
        <text x="42" y="29" fontSize="13" fontWeight="900" fill="#111827" fontFamily="system-ui, sans-serif">
            IJAM LESSONS
        </text>
        <text x="42" y="46" fontSize="11" fontWeight="900" fill="#111827" fontFamily="system-ui, sans-serif">
            COMING SOON
        </text>
    </svg>
);

const RESOURCE_AI_MODES = [
    { id: 'explain', label: 'Explain' },
    { id: 'next_actions', label: 'Next 3 Actions' },
    { id: 'troubleshoot', label: 'Troubleshoot' },
    { id: 'plan', label: 'Implementation Plan' }
];

const trackResourceEvent = (eventName, meta = {}) => {
    try {
        const key = 'resource_ai_telemetry';
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        current.push({ eventName, meta, ts: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(current.slice(-200)));
    } catch (error) {
        console.warn('Resource telemetry failed:', error);
    }
};

const buildResourceAiPrompt = ({ mode, lesson, teachingTone, userInput, tips }) => {
    const modeInstruction = {
        explain: 'Explain this lesson in beginner-friendly steps with practical examples.',
        next_actions: 'Give exactly 3 clear next actions with checkboxes.',
        troubleshoot: 'Diagnose likely causes and provide a minimal step-by-step fix path.',
        plan: 'Create a phased implementation plan: UI, Data, QA, Deploy with priorities.'
    }[mode] || 'Help the user complete this lesson.';

    return [
        `Mode: ${mode}`,
        `Tone: ${teachingTone}`,
        `Lesson: ${lesson.title} (${lesson.stage})`,
        `Summary: ${lesson.summary}`,
        `Core steps: ${lesson.steps.join(' | ')}`,
        `Known tips: ${tips.join(' | ')}`,
        `User input: ${userInput || 'No extra input provided.'}`,
        `Instruction: ${modeInstruction}`,
        'Output format: Short sections with actionable bullets. Keep concise and practical.'
    ].join('\n');
};

const getStageGreeting = (stage, tone) => {
    if (tone === 'formal') {
        switch (stage) {
            case 'Foundation': return 'System Initialization Sequence:';
            case 'Ideation': return 'Strategic Planning Phase:';
            case 'Vibe Coding': return 'Development Environment Active:';
            case 'Versioning': return 'Source Control Management:';
            case 'Launch': return 'Deployment Protocol Initiated:';
            case 'Database': return 'Data Architecture Setup:';
            default: return 'Module Objective:';
        }
    } else {
        switch (stage) {
            case 'Foundation': return 'yo kita setup tapak rumah dulu ni:';
            case 'Ideation': return 'masa untuk perah otak, chief:';
            case 'Vibe Coding': return 'time untuk vibe coding, chill & code:';
            case 'Versioning': return 'save progress kau kat awan:';
            case 'Launch': return 'jom terbang ke bulan (live deployment):';
            case 'Database': return 'bina memori bot otak kau:';
            default: return 'lesson baru unlock:';
        }
    }
};

const buildIjamBotLessonBrief = ({ lesson, tips, tone }) => {
    const stageGreeting = getStageGreeting(lesson.stage, tone);
    const intro = `${stageGreeting} ${lesson.title}`;
    const why = tone === 'ijam'
        ? `kenapa penting: ${lesson.summary}`
        : `Why it matters: ${lesson.summary}`;
    const explain = tone === 'ijam'
        ? `penerangan ijam: ${lesson.eli5}`
        : `Simple explanation: ${lesson.eli5}`;
    const steps = (lesson.steps || []).slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n');
    const tipsBlock = (tips || []).slice(0, 4).map((t) => `- ${t}`).join('\n');

    return [
        intro,
        why,
        explain,
        '',
        tone === 'ijam' ? 'klik "> show next step" untuk mula.' : 'Click "> show next step" to begin.',
        tone === 'ijam' ? '\nkalau stuck, terus type: debug <isu kau> (¬‿¬)' : ''
    ].join('\n');
};

// ─── IjamOS v3 App Registry ─────────────────────────────────────────────────
// ─── Wallpaper Gallery Data ───────────────────────────────────────────────────
const WALLPAPER_GALLERY = [
    // Malaysia-Themed Wallpapers
    { id: 'merdeka', name: 'Merdeka Red', type: 'gradient', colors: ['#DC2626', '#FFFFFF', '#FF0000'] },
    { id: 'jalur', name: 'Jalur Gemilang', type: 'animated-gradient', colors: ['#010066', '#FFFFFF', '#CC0000'] },
    { id: 'wau', name: 'Wau Kuning', type: 'gradient', colors: ['#FFCC00', '#FFD700', '#FFFAC0'] },
    { id: 'kebaya', name: 'Kebaya', type: 'gradient', colors: ['#004488', '#0066CC', '#0099FF'] },
    { id: 'tropic-rain', name: 'Tropic Rain', type: 'animated-gradient', colors: ['#0891B2', '#10B981', '#34D399'] },
    { id: 'hibiscus', name: 'Hibiscus Morning', type: 'gradient', colors: ['#FF6B6B', '#FFE4E1', '#FFF0F5'] },
    { id: 'sunset', name: 'Tropical Sunset', type: 'gradient', colors: ['#F97316', '#FDBA74', '#FCD34D'] },
    { id: 'night', name: 'Tropical Night', type: 'gradient', colors: ['#0C1220', '#1E3A8A', '#3B82F6'] },
    // Time-based Malaysia Wallpapers
    { id: 'pagi-morning', name: 'Pagi (Morning)', type: 'time-based', times: '6-12', colors: ['#87CEEB', '#FFD166', '#FFF7ED'] },
    { id: 'tengahari', name: 'Tengahari (Afternoon)', type: 'time-based', times: '12-15', colors: ['#FDBA74', '#FCD34D', '#FBBF24'] },
    { id: 'petang', name: 'Petang (Evening)', type: 'time-based', times: '18-21', colors: ['#F97316', '#F59E0B', '#FBBF24'] },
    { id: 'malam', name: 'Malam (Night)', type: 'time-based', times: '21-6', colors: ['#0C1220', '#1E3A8A', '#3B82F6'] },
];

// ─── IjamOS v3 Draggable Window Frame ───────────────────────────────────────
const WindowFrame = ({
    winState,
    title,
    AppIcon,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    onMove,
    onResize,
    children,
    mobileMode = false,
    mobileInset = '58px 8px 14px 8px',
    mobileMaxInset = '48px 0px 74px 0px'
}) => {
    const frameRef = useRef(null);
    const dragRef = useRef(null);
    const resizeRef = useRef(null); // { edge, sx, sy, ow, oh }
    const mobileInsets = useMemo(() => ([
        '102px 16px 148px 16px',
        '82px 12px 116px 12px',
        mobileInset
    ]), [mobileInset]);
    const [mobileInsetIndex, setMobileInsetIndex] = useState(2);

    useEffect(() => {
        if (mobileMode) return () => { };
        const onMM = (e) => {
            if (dragRef.current) {
                const dx = e.clientX - dragRef.current.sx;
                const dy = e.clientY - dragRef.current.sy;
                if (frameRef.current) {
                    frameRef.current.style.left = `${dragRef.current.wx + dx}px`;
                    frameRef.current.style.top = `${dragRef.current.wy + dy}px`;
                }
            }
            if (resizeRef.current) {
                const { edge, sx, sy, ow, oh } = resizeRef.current;
                const dx = e.clientX - sx;
                const dy = e.clientY - sy;
                let nw = ow, nh = oh;
                if (edge.includes('e')) nw = Math.max(320, ow + dx);
                if (edge.includes('s')) nh = Math.max(220, oh + dy);
                if (edge.includes('w')) nw = Math.max(320, ow - dx);
                if (edge.includes('n')) nh = Math.max(220, oh - dy);
                if (frameRef.current) {
                    if (edge.includes('e') || edge.includes('w')) frameRef.current.style.width = `${nw}px`;
                    if (edge.includes('s') || edge.includes('n')) frameRef.current.style.height = `${nh}px`;
                }
            }
        };
        const onMU = (e) => {
            if (dragRef.current) {
                const dx = e.clientX - dragRef.current.sx;
                const dy = e.clientY - dragRef.current.sy;
                onMove(dragRef.current.wx + dx, dragRef.current.wy + dy);
                dragRef.current = null;
            }
            if (resizeRef.current) {
                const { edge, sx, sy, ow, oh } = resizeRef.current;
                const dx = e.clientX - sx;
                const dy = e.clientY - sy;
                let nw = ow, nh = oh;
                if (edge.includes('e')) nw = Math.max(320, ow + dx);
                if (edge.includes('s')) nh = Math.max(220, oh + dy);
                if (edge.includes('w')) nw = Math.max(320, ow - dx);
                if (edge.includes('n')) nh = Math.max(220, oh - dy);
                if (onResize) onResize(nw, nh);
                resizeRef.current = null;
            }
        };
        document.addEventListener('mousemove', onMM);
        document.addEventListener('mouseup', onMU);
        return () => { document.removeEventListener('mousemove', onMM); document.removeEventListener('mouseup', onMU); };
    }, [mobileMode, onMove, onResize]);

    useEffect(() => {
        setMobileInsetIndex(2);
    }, [mobileInset]);

    if (!winState?.isOpen || winState?.isMinimized) return null;
    const isMax = !!winState.isMaximized;

    const boxStyle = mobileMode
        ? {
            position: 'absolute',
            inset: isMax ? mobileMaxInset : (mobileInsets[mobileInsetIndex] || mobileInset),
            zIndex: winState.zIndex,
            borderRadius: isMax ? '0px' : '18px'
        }
        : isMax
            ? { position: 'absolute', inset: '28px 0 0 0', zIndex: winState.zIndex, borderRadius: 0 }
            : { position: 'absolute', left: winState.x, top: winState.y, width: winState.w, height: winState.h, zIndex: winState.zIndex, borderRadius: '10px' };

    const RESIZE_HANDLES = [
        { edge: 'e', s: { right: 0, top: '8px', width: '6px', height: 'calc(100% - 16px)', cursor: 'ew-resize' } },
        { edge: 's', s: { bottom: 0, left: '8px', height: '6px', width: 'calc(100% - 16px)', cursor: 'ns-resize' } },
        { edge: 'w', s: { left: 0, top: '8px', width: '6px', height: 'calc(100% - 16px)', cursor: 'ew-resize' } },
        { edge: 'n', s: { top: 0, left: '8px', height: '6px', width: 'calc(100% - 16px)', cursor: 'ns-resize' } },
        { edge: 'se', s: { right: 0, bottom: 0, width: '14px', height: '14px', cursor: 'nwse-resize' } },
        { edge: 'sw', s: { left: 0, bottom: 0, width: '14px', height: '14px', cursor: 'nesw-resize' } },
        { edge: 'ne', s: { right: 0, top: 0, width: '14px', height: '14px', cursor: 'nesw-resize' } },
        { edge: 'nw', s: { left: 0, top: 0, width: '14px', height: '14px', cursor: 'nwse-resize' } },
    ];

    return (
        <div ref={frameRef} onMouseDown={onFocus}
            style={{ ...boxStyle, display: 'flex', flexDirection: 'column', background: '#111827', overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)' }}>
            {/* ── Title bar ── */}
            <div
                onMouseDown={(e) => {
                    if (isMax || mobileMode) return;
                    e.stopPropagation();
                    dragRef.current = { sx: e.clientX, sy: e.clientY, wx: winState.x, wy: winState.y };
                }}
                onDoubleClick={onMaximize}
                style={{ background: '#f5d000', padding: '7px 12px', display: 'flex', alignItems: 'center', cursor: (isMax || mobileMode) ? 'default' : 'grab', userSelect: 'none', flexShrink: 0, position: 'relative', borderBottom: '2px solid rgba(0,0,0,0.15)' }}
            >
                {/* Traffic lights */}
                <div style={{ display: 'flex', gap: '6px', zIndex: 1 }}>
                    {[['#ef4444', 'x', onClose], ['#f59e0b', '-', onMinimize], ['#22c55e', isMax ? '+' : 'o', onMaximize]].map(([bg, sym, fn]) => (
                        <button key={`${bg}-${sym}`} onClick={(e) => { e.stopPropagation(); fn(); }}
                            style={{ width: 13, height: 13, borderRadius: '50%', background: bg, border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '8px', color: mobileMode ? '#111827' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontWeight: 900, transition: 'color 0.1s' }}
                            onMouseEnter={e => { if (!mobileMode) e.currentTarget.style.color = '#000'; }}
                            onMouseLeave={e => { if (!mobileMode) e.currentTarget.style.color = 'transparent'; }}
                        >{sym}</button>
                    ))}
                </div>
                {/* Centered title */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: 'monospace', fontWeight: 900, fontSize: '13px', color: '#0b1220', pointerEvents: 'none' }}>
                    {AppIcon && <AppIcon size={14} />}
                    {title}
                </div>
                {mobileMode && !isMax && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMobileInsetIndex((prev) => (prev + 1) % mobileInsets.length);
                        }}
                        style={{
                            marginLeft: 'auto',
                            zIndex: 1,
                            border: '1px solid rgba(15,23,42,0.35)',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.72)',
                            color: '#0b1220',
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            padding: '3px 7px',
                            lineHeight: 1
                        }}
                    >
                        SIZE
                    </button>
                )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
            {/* ── Resize handles (hidden when maximized) ── */}
            {!mobileMode && !isMax && onResize && RESIZE_HANDLES.map(({ edge, s }) => (
                <div key={edge}
                    style={{ position: 'absolute', zIndex: 10, ...s }}
                    onMouseDown={(e) => { e.stopPropagation(); resizeRef.current = { edge, sx: e.clientX, sy: e.clientY, ow: winState.w, oh: winState.h }; }}
                />
            ))}
        </div>
    );
};


const DesktopIcon = ({
    label,
    icon: Icon,
    imageSrc,
    iconScale = 1,
    onClick,
    color = '#f5d000',
    isPhoneMode = false,
    isTabletMode = false,
    draggable = false,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDropTarget = false
}) => (
    <button
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isPhoneMode ? '0px' : '1px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: isPhoneMode ? '8px 6px' : (isTabletMode ? '10px' : '12px'),
            borderRadius: '12px',
            transition: 'background 0.2s',
            outline: isDropTarget ? '2px dashed rgba(245,208,0,0.85)' : 'none',
            outlineOffset: isDropTarget ? '3px' : 0
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245,208,0,0.12)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
        <div style={{
            background: 'transparent',
            border: 'none',
            color,
            padding: 0,
            borderRadius: '14px',
            boxShadow: 'none',
            width: isPhoneMode ? '56px' : '68px',
            height: isPhoneMode ? '56px' : '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={`${label} icon`}
                    style={{
                        width: isPhoneMode ? '50px' : '64px',
                        height: isPhoneMode ? '50px' : '64px',
                        objectFit: 'contain',
                        imageRendering: 'auto',
                        transform: `scale(${iconScale})`,
                        transformOrigin: 'center center'
                    }}
                />
            ) : (
                <Icon size={isPhoneMode ? 34 : 42} />
            )}
        </div>
        <span style={{ color: '#fff', fontSize: isPhoneMode ? '10px' : '11px', fontWeight: 800, fontFamily: 'monospace', textShadow: '1px 1px 4px #000' }}>{label}</span>
    </button>
);

const StartMenuApp = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '12px', borderRadius: '8px', transition: 'background 0.2s' }}
        onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
        <Icon size={24} color="#f8fafc" />
        <span style={{ color: '#f8fafc', fontSize: '10px', fontWeight: 600, fontFamily: 'monospace' }}>{label}</span>
    </button>
);

const getInitialDesktopGridMetrics = () => {
    if (typeof window === 'undefined') return { columns: 1, rows: 1 };
    const COL_WIDTH = 100;
    const COL_GAP = 12;
    const ROW_HEIGHT = 86;
    const ROW_GAP = 12;
    const width = Math.max(320, window.innerWidth - 40);
    const height = Math.max(220, window.innerHeight - 28 - 12 - 24);
    const columns = Math.max(1, Math.floor((width + COL_GAP) / (COL_WIDTH + COL_GAP)));
    const rows = Math.max(1, Math.floor((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));
    return { columns, rows };
};

const IjamOSWorkspace = ({ session, currentUser, isMobileView, deviceMode = 'desktop', ijamOsMode = 'mac_desktop', setPublicPage, setCurrentUser }) => {
    const isMacMode = ijamOsMode === 'mac_desktop';
    const isPhoneMode = ijamOsMode === 'ios_phone';
    const isTabletMode = ijamOsMode === 'ios_tablet';
    const isTouchIjamMode = isPhoneMode || isTabletMode;
    const mobileWindowProps = isTouchIjamMode
        ? {
            mobileMode: true,
            mobileInset: isPhoneMode ? '86px 8px 96px 8px' : '92px 12px 104px 12px',
            mobileMaxInset: isPhoneMode ? '46px 0px 72px 0px' : '50px 0px 80px 0px'
        }
        : {};
    const [activeIndex, setActiveIndex] = useState(0);
    const [search, setSearch] = useState('');
    const [communityResources, setCommunityResources] = useState([]);
    const [libraryIndex, setLibraryIndex] = useState(0);
    const [teachingTone, setTeachingTone] = useState('ijam');
    const [assistantMode, setAssistantMode] = useState('explain');
    const [assistantInput, setAssistantInput] = useState('');
    const [assistantLoading, setAssistantLoading] = useState(false);
    const [assistantOpen, setAssistantOpen] = useState(true);
    const [slideIndex, setSlideIndex] = useState(-1);
    const [showTips, setShowTips] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState([
        { role: 'assistant', content: 'KRACKED_BOT ready. Pick a mode and ask about this lesson.' }
    ]);

    const [activeTab, setActiveTab] = useState('lessons'); // 'lessons', 'ai', 'cloud', 'social'
    const [searchQuery, setSearchQuery] = useState('');
    // ── IjamOS v3 Window & Dock State ────────────────────────────────────────
    const [windowStates, setWindowStates] = useState({});      // { [type]: { isOpen, isMinimized, isMaximized, x, y, w, h, zIndex } }
    const [focusedWindow, setFocusedWindow] = useState(null);
    const [zCounter, setZCounter] = useState(100);
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [startMenuSearch, setStartMenuSearch] = useState('');
    const [missionEvents, setMissionEvents] = useState([]);
    const [latestMissionEvent, setLatestMissionEvent] = useState(null);
    const [batteryPct, setBatteryPct] = useState('--%');
    const [desktopIconSlots, setDesktopIconSlots] = useState([]);
    const [draggedIconType, setDraggedIconType] = useState(null);
    const [dropTargetSlotIndex, setDropTargetSlotIndex] = useState(null);
    const [isDraggingDesktopIcon, setIsDraggingDesktopIcon] = useState(false);
    const desktopSlotsLoadedRef = useRef(false);
    const desktopSlotsHydratedRef = useRef(false);
    const desktopIconsContainerRef = useRef(null);
    const [desktopGridMetrics, setDesktopGridMetrics] = useState(getInitialDesktopGridMetrics);
    const [activeMacMenu, setActiveMacMenu] = useState(null);
    const [showBatteryPopup, setShowBatteryPopup] = useState(false);
    const [showControlCenter, setShowControlCenter] = useState(false);
    const [uiBrightness, setUiBrightness] = useState(100);
    const [uiVolume, setUiVolume] = useState(100);
    const [wifiEnabled, setWifiEnabled] = useState(true);
    const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
    const [airdropEnabled, setAirdropEnabled] = useState(false);
    const [focusModeEnabled, setFocusModeEnabled] = useState(false);
    const getRoleHintFromApp = useCallback((appType) => {
        if (appType === 'terminal' || appType === 'prompt_forge') return 'engineer';
        if (appType === 'files' || appType === 'mind_mapper') return 'analyst';
        if (appType === 'settings' || appType === 'trash') return 'security';
        if (appType === 'progress' || appType === 'mission') return 'master';
        return 'devops';
    }, []);
    const emitMissionEvent = useCallback((type, message, meta = {}) => {
        const evt = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            message,
            meta,
            ts: new Date().toISOString()
        };
        setLatestMissionEvent(evt);
        setMissionEvents((prev) => [evt, ...prev].slice(0, 24));
    }, []);
    const triggerHaptic = useCallback(() => {
        if (
            typeof navigator !== 'undefined' &&
            (navigator.userActivation?.hasBeenActive ?? true) &&
            navigator.vibrate
        ) navigator.vibrate(10);
    }, []);

    const openApp = useCallback((type) => {
        const appCfg = APP_REGISTRY.find(a => a.type === type);
        if (!appCfg) return;
        emitMissionEvent('app_open', `Opened ${appCfg.label}`, { appType: type, roleHint: getRoleHintFromApp(type) });
        setZCounter(z => {
            const newZ = z + 1;
            setWindowStates(prev => {
                if (isTouchIjamMode) {
                    const vw = typeof window !== 'undefined' ? window.innerWidth : 430;
                    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
                    const reset = {};
                    APP_REGISTRY.forEach((app) => {
                        reset[app.type] = { ...(prev[app.type] || {}), isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0 };
                    });
                    return {
                        ...reset,
                        [type]: {
                            ...(prev[type] || {}),
                            isOpen: true,
                            isMinimized: false,
                            isMaximized: false,
                            x: 10,
                            y: 58,
                            w: Math.max(320, vw - 20),
                            h: Math.max(400, vh - 84),
                            zIndex: newZ
                        }
                    };
                }
                if (prev[type]?.isOpen) {
                    return { ...prev, [type]: { ...prev[type], isMinimized: false, zIndex: newZ } };
                }
                const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                const openCount = Object.values(prev).filter(w => w.isOpen).length;
                const w = Math.min(appCfg.defaultW, vw - 60);
                const h = Math.min(appCfg.defaultH, vh - 140);
                return { ...prev, [type]: { isOpen: true, isMinimized: false, isMaximized: false, x: Math.max(16, (vw - w) / 2 + openCount * 22 - 44), y: Math.max(10, 30 + openCount * 22), w, h, zIndex: newZ } };
            });
            setFocusedWindow(type);
            return newZ;
        });
    }, [emitMissionEvent, getRoleHintFromApp, isTouchIjamMode]);

    const closeApp = useCallback((type) => {
        setWindowStates(prev => ({ ...prev, [type]: { ...(prev[type] || {}), isOpen: false } }));
        setFocusedWindow(f => f === type ? null : f);
    }, []);
    const closeAllApps = useCallback(() => {
        setWindowStates((prev) => {
            const next = { ...prev };
            APP_REGISTRY.forEach((app) => {
                next[app.type] = { ...(next[app.type] || {}), isOpen: false, isMinimized: false };
            });
            return next;
        });
        setFocusedWindow(null);
    }, []);
    const exitIjamOS = useCallback(() => {
        triggerHaptic();
        closeAllApps();
        if (setPublicPage) setPublicPage('home');
    }, [closeAllApps, setPublicPage, triggerHaptic]);

    const minimizeApp = useCallback((type) => {
        setWindowStates(prev => ({ ...prev, [type]: { ...prev[type], isMinimized: true } }));
        setFocusedWindow(f => f === type ? null : f);
    }, []);

    const maximizeApp = useCallback((type) => {
        setWindowStates(prev => ({ ...prev, [type]: { ...prev[type], isMaximized: !prev[type]?.isMaximized } }));
    }, []);

    const focusApp = useCallback((type) => {
        const appCfg = APP_REGISTRY.find(a => a.type === type);
        emitMissionEvent('focus_change', `Focus switched to ${appCfg?.label || type}`, { appType: type, roleHint: getRoleHintFromApp(type) });
        setZCounter(z => {
            const newZ = z + 1;
            setWindowStates(prev => ({ ...prev, [type]: { ...prev[type], zIndex: newZ } }));
            setFocusedWindow(type);
            return newZ;
        });
    }, [emitMissionEvent, getRoleHintFromApp]);

    const moveApp = useCallback((type, x, y) => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        setWindowStates(prev => ({ ...prev, [type]: { ...prev[type], x: Math.max(0, Math.min(x, vw - 100)), y: Math.max(0, Math.min(y, vh - 60)) } }));
    }, []);

    const resizeApp = useCallback((type, w, h) => {
        setWindowStates(prev => ({
            ...prev,
            [type]: { ...prev[type], w: Math.max(320, w), h: Math.max(220, h) }
        }));
    }, []);

    // Convenience: which type is currently open/focused (for backward compat in content)
    const activeWindow = focusedWindow;

    const [chatMessages, setChatMessages] = useState([
        { role: 'bot', text: 'KRACKED_OS_INITIALIZED: Greetings, Builder. I am Antigravity. Type your command or click on the lessons above to begin.' }
    ]);

    // --- Computer Experience States ---
    const [isBooted, setIsBooted] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [collapsedStages, setCollapsedStages] = useState(new Set());
    // File Explorer state
    const [explorerPath, setExplorerPath] = useState([]);
    const [explorerSearch, setExplorerSearch] = useState('');
    const [explorerSelected, setExplorerSelected] = useState(null);
    const [explorerView, setExplorerView] = useState('icons');
    const toggleStage = (stageName) => setCollapsedStages(prev => {
        const next = new Set(prev);
        next.has(stageName) ? next.delete(stageName) : next.add(stageName);
        return next;
    });
    const [bootText, setBootText] = useState('');
    const [isBooting, setIsBooting] = useState(false);
    const [bootPhase, setBootPhase] = useState('idle'); // 'idle' | 'waking' | 'booting' | 'welcome' | 'ready'
    const [botEmotion, setBotEmotion] = useState('sleepy');
    const [bootLines, setBootLines] = useState([]);
    const [bootProgress, setBootProgress] = useState(0);
    const [bootMousePos, setBootMousePos] = useState(null);
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdIntervalRef = useRef(null);
    const [speechBubble, setSpeechBubble] = useState('');
    // Bot free-roaming state
    const [botPos, setBotPos] = useState({ x: 40, y: 260, duration: 0 });
    const [botWalking, setBotWalking] = useState(false);
    const [botFacing, setBotFacing] = useState(1);
    const [botClickIdx, setBotClickIdx] = useState(0);
    const walkTimerRef = useRef(null);
    const [systemTime, setSystemTime] = useState('');
    const [systemDate, setSystemDate] = useState('');

    // Wallpaper state
    const [currentWallpaper, setCurrentWallpaper] = useState(() => {
        const saved = localStorage.getItem('vibe_wallpaper');
        if (saved) return saved;
        // Check for time-based wallpaper
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'day';
        if (hour >= 18 && hour < 21) return 'evening';
        return 'night';
    });

    // Update time-based wallpaper hourly
    useEffect(() => {
        const wallpaperData = WALLPAPER_GALLERY.find(w => w.id === currentWallpaper);
        if (wallpaperData?.type === 'time-based') {
            const interval = setInterval(() => {
                const hour = new Date().getHours();
                let newWallpaper = 'night';
                if (hour >= 6 && hour < 12) newWallpaper = 'morning';
                else if (hour >= 12 && hour < 18) newWallpaper = 'day';
                else if (hour >= 18 && hour < 21) newWallpaper = 'evening';

                if (newWallpaper !== currentWallpaper) {
                    setCurrentWallpaper(newWallpaper);
                }
            }, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [currentWallpaper]);

    const kdacademyUrl = 'https://kdacademy.up.railway.app/';

    useEffect(() => {
        let battery = null;
        const handleBatteryUpdate = () => {
            if (!battery) return;
            setBatteryPct(`${Math.round((battery.level || 0) * 100)}%`);
        };

        if (typeof navigator === 'undefined' || !navigator.getBattery) {
            setBatteryPct('--%');
            return undefined;
        }

        navigator.getBattery().then((manager) => {
            battery = manager;
            handleBatteryUpdate();
            battery.addEventListener('levelchange', handleBatteryUpdate);
            battery.addEventListener('chargingchange', handleBatteryUpdate);
        }).catch(() => setBatteryPct('--%'));

        return () => {
            if (!battery) return;
            battery.removeEventListener('levelchange', handleBatteryUpdate);
            battery.removeEventListener('chargingchange', handleBatteryUpdate);
        };
    }, []);

    const [profileForm, setProfileForm] = useState({
        username: '',
        district: '',
        ideaTitle: '',
        problemStatement: '',
        threadsHandle: '',
        whatsappContact: '',
        discordTag: '',
        aboutYourself: '',
        programGoal: ''
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // --- Stats Showcase States ---
    const [isUploading, setIsUploading] = useState(false);
    const [showcaseUrl, setShowcaseUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    const { speakText, playKeystroke, playSuccess, playError } = useSoundEffects();

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                username: currentUser.name || '',
                district: currentUser.district || '',
                ideaTitle: currentUser.idea_title || '',
                problemStatement: currentUser.problem_statement || '',
                threadsHandle: currentUser.threads_handle || '',
                whatsappContact: currentUser.whatsapp_contact || '',
                discordTag: currentUser.discord_tag || '',
                aboutYourself: currentUser.about_yourself || '',
                programGoal: currentUser.program_goal || ''
            });
            setShowcaseUrl(currentUser.showcase_image || localStorage.getItem('ijamos_showcase_url') || '');
            setWebsiteUrl(currentUser.website_url || localStorage.getItem('ijamos_website_url') || '');
        }
    }, [currentUser]);

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();

        setIsSavingSettings(true);
        try {
            const nextUser = {
                ...(currentUser || {}),
                name: profileForm.username,
                district: profileForm.district,
                idea_title: profileForm.ideaTitle,
                problem_statement: profileForm.problemStatement,
                threads_handle: profileForm.threadsHandle,
                whatsapp_contact: profileForm.whatsappContact,
                discord_tag: profileForm.discordTag,
                about_yourself: profileForm.aboutYourself,
                program_goal: profileForm.programGoal,
                showcase_image: showcaseUrl,
                website_url: websiteUrl,
                updated_at: new Date().toISOString()
            };

            localStorage.setItem('ijamos_profile', JSON.stringify(nextUser));
            if (setCurrentUser) setCurrentUser(nextUser);

            appendTerminal('system', '[?] Profile configurations saved locally.');
            alert('Settings saved successfully (local mode)!');
        } catch (err) {
            console.error('Save failed:', err);
            appendTerminal('system', '[!] Failed to save local configs.');
            alert('Save failed: ' + err.message);
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSetWallpaper = (wallpaperId) => {
        setCurrentWallpaper(wallpaperId);
        localStorage.setItem('vibe_wallpaper', wallpaperId);
        playSuccess();
        appendTerminal('system', `[✓] Wallpaper changed to: ${wallpaperId}`);
    };

    const getWallpaperStyle = (wallpaper) => {
        if (!wallpaper) return {};

        switch (wallpaper.type) {
            case 'image':
                return {
                    backgroundImage: `url(${wallpaper.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            case 'gradient':
            case 'animated-gradient':
                const colors = wallpaper.colors || [];
                return {
                    background: `linear-gradient(135deg, ${colors.join(', ')})`,
                    ...(wallpaper.type === 'animated-gradient' && {
                        animation: 'gradientShift 10s ease infinite'
                    })
                };
            case 'time-based':
                return {
                    background: `linear-gradient(135deg, ${(wallpaper.colors || []).join(', ')})`,
                    transition: 'background 1s ease'
                };
            default:
                return {};
        }
    };

    const handleImageUpload = async (event) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            setIsUploading(true);
            const file = event.target.files[0];

            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read image file.'));
                reader.readAsDataURL(file);
            });

            setShowcaseUrl(dataUrl);
            localStorage.setItem('ijamos_showcase_url', dataUrl);

            const savedProfileRaw = localStorage.getItem('ijamos_profile');
            const savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : {};
            const nextUser = {
                ...(currentUser || {}),
                ...savedProfile,
                showcase_image: dataUrl,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem('ijamos_profile', JSON.stringify(nextUser));
            if (setCurrentUser) setCurrentUser(nextUser);

            appendTerminal('system', '[?] Showcase image saved to local storage.');
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Error saving image locally: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveWebsiteUrl = async () => {
        try {
            localStorage.setItem('ijamos_website_url', websiteUrl || '');

            const savedProfileRaw = localStorage.getItem('ijamos_profile');
            const savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : {};
            const nextUser = {
                ...(currentUser || {}),
                ...savedProfile,
                website_url: websiteUrl || '',
                updated_at: new Date().toISOString()
            };
            localStorage.setItem('ijamos_profile', JSON.stringify(nextUser));
            if (setCurrentUser) setCurrentUser(nextUser);

            alert('Website URL saved locally!');
        } catch (e) {
            alert('Error saving URL: ' + e.message);
        }
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            setSystemTime(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`);

            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
            setSystemDate(now.toLocaleDateString('en-US', options));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const { weather, isLoading: isWeatherLoading } = useWeather();

    // --- Gamification State ---
    const [userVibes, setUserVibes] = useState(0);

    const userRank = useMemo(() => {
        if (userVibes < 50) return 'L1 NOVICE';
        if (userVibes < 150) return 'L2 PROMPTER';
        return 'L3 VIBE CODER';
    }, [userVibes]);
    const focusedWindowLabel = useMemo(
        () => APP_REGISTRY.find((app) => app.type === focusedWindow)?.label || null,
        [focusedWindow]
    );
    const openWindowsCount = useMemo(
        () => Object.values(windowStates).filter((state) => state?.isOpen && !state?.isMinimized).length,
        [windowStates]
    );
    const appTypeList = useMemo(() => APP_REGISTRY.map((app) => app.type), []);
    const appByType = useMemo(
        () => Object.fromEntries(APP_REGISTRY.map((app) => [app.type, app])),
        []
    );
    const desktopSlotCount = useMemo(() => {
        if (isMacMode && !isTouchIjamMode) {
            return Math.max(appTypeList.length, desktopGridMetrics.columns * desktopGridMetrics.rows);
        }
        return Math.max(24, appTypeList.length + 8);
    }, [isMacMode, isTouchIjamMode, appTypeList.length, desktopGridMetrics.columns, desktopGridMetrics.rows]);
    const batteryLevel = useMemo(() => {
        const parsed = Number.parseInt(String(batteryPct).replace('%', ''), 10);
        if (Number.isNaN(parsed)) return 100;
        return Math.max(0, Math.min(parsed, 100));
    }, [batteryPct]);
    const currentDesktopAppLabel = useMemo(
        () => APP_REGISTRY.find((app) => app.type === focusedWindow)?.label || 'KRACKED_OS v3.0',
        [focusedWindow]
    );
    const recentApps = useMemo(
        () => APP_REGISTRY.filter((app) => windowStates[app.type]?.isOpen).slice(0, 4),
        [windowStates]
    );

    useEffect(() => {
        const handleGlobalPointer = (e) => {
            if (e.target.closest('[data-mac-menu-root]')) return;
            setActiveMacMenu(null);
            setShowBatteryPopup(false);
            setShowControlCenter(false);
        };
        document.addEventListener('mousedown', handleGlobalPointer);
        return () => document.removeEventListener('mousedown', handleGlobalPointer);
    }, []);

    useEffect(() => {
        if (!isMacMode || isTouchIjamMode || !desktopIconsContainerRef.current) return;

        const COL_WIDTH = 100;
        const COL_GAP = 12;
        const ROW_HEIGHT = 86;
        const ROW_GAP = 12;

        const updateMetrics = () => {
            const el = desktopIconsContainerRef.current;
            const width = el?.clientWidth || Math.max(320, window.innerWidth - 40);
            const height = el?.clientHeight || Math.max(220, window.innerHeight - 28 - 12 - 24);
            const columns = Math.max(1, Math.floor((width + COL_GAP) / (COL_WIDTH + COL_GAP)));
            const rows = Math.max(1, Math.floor((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));
            setDesktopGridMetrics((prev) => (
                prev.columns === columns && prev.rows === rows
                    ? prev
                    : { columns, rows }
            ));
        };

        updateMetrics();
        let observer = null;
        if (typeof ResizeObserver !== 'undefined' && desktopIconsContainerRef.current) {
            observer = new ResizeObserver(updateMetrics);
            observer.observe(desktopIconsContainerRef.current);
        }
        window.addEventListener('resize', updateMetrics);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', updateMetrics);
        };
    }, [isMacMode, isTouchIjamMode]);

    const normalizeDesktopSlots = useCallback((slots, desiredCount) => {
        const normalized = Array.from({ length: Math.max(1, desiredCount) }, () => null);
        const seen = new Set();
        (Array.isArray(slots) ? slots : []).forEach((type, index) => {
            if (index >= normalized.length) return;
            if (!appTypeList.includes(type)) return;
            if (seen.has(type)) return;
            normalized[index] = type;
            seen.add(type);
        });
        const missing = appTypeList.filter((type) => !seen.has(type));
        let cursor = 0;
        for (const type of missing) {
            while (cursor < normalized.length && normalized[cursor] !== null) cursor += 1;
            if (cursor >= normalized.length) break;
            normalized[cursor] = type;
        }
        return normalized;
    }, [appTypeList]);

    useEffect(() => {
        if (desktopSlotsLoadedRef.current) return;
        try {
            const rawSlots = localStorage.getItem('ijamos_desktop_icon_slots');
            if (rawSlots) {
                const parsedSlots = JSON.parse(rawSlots);
                if (Array.isArray(parsedSlots)) {
                    setDesktopIconSlots(normalizeDesktopSlots(parsedSlots, Math.max(desktopSlotCount, parsedSlots.length)));
                    desktopSlotsLoadedRef.current = true;
                    desktopSlotsHydratedRef.current = true;
                    return;
                }
            }
            const rawOrder = localStorage.getItem('ijamos_desktop_icon_order');
            if (!rawOrder) {
                setDesktopIconSlots(normalizeDesktopSlots([], desktopSlotCount));
                desktopSlotsLoadedRef.current = true;
                desktopSlotsHydratedRef.current = true;
                return;
            }
            const parsedOrder = JSON.parse(rawOrder);
            if (Array.isArray(parsedOrder) && parsedOrder.length) {
                setDesktopIconSlots(normalizeDesktopSlots(parsedOrder, desktopSlotCount));
            } else {
                setDesktopIconSlots(normalizeDesktopSlots([], desktopSlotCount));
            }
            desktopSlotsLoadedRef.current = true;
            desktopSlotsHydratedRef.current = true;
        } catch {
            // Ignore broken local storage payloads.
            setDesktopIconSlots(normalizeDesktopSlots([], desktopSlotCount));
            desktopSlotsLoadedRef.current = true;
            desktopSlotsHydratedRef.current = true;
        }
    }, [desktopSlotCount, normalizeDesktopSlots]);

    useEffect(() => {
        if (!desktopSlotsHydratedRef.current) return;
        try {
            localStorage.setItem('ijamos_desktop_icon_slots', JSON.stringify(desktopIconSlots));
        } catch {
            // Ignore storage failures.
        }
    }, [desktopIconSlots]);

    useEffect(() => {
        setDesktopIconSlots((prev) => normalizeDesktopSlots(prev, desktopSlotCount));
    }, [desktopSlotCount, normalizeDesktopSlots]);

    const moveDesktopIconToSlot = useCallback((fromType, slotIndex) => {
        if (!fromType || slotIndex == null) return;
        setDesktopIconSlots((prev) => {
            const slots = normalizeDesktopSlots(prev, desktopSlotCount);
            const fromIndex = slots.indexOf(fromType);
            if (fromIndex < 0) return prev;
            const clampedIndex = Math.max(0, Math.min(slotIndex, slots.length - 1));
            const targetType = slots[clampedIndex];
            slots[fromIndex] = targetType ?? null;
            slots[clampedIndex] = fromType;
            return slots;
        });
    }, [desktopSlotCount, normalizeDesktopSlots]);

    const addVibes = (amount, reason) => {
        setUserVibes(prev => prev + amount);
        appendTerminal('system', `[+] Earned ${amount} Vibes: ${reason}`);
    };

    const lessons = teachingTone === 'formal' ? LESSONS_FORMAL : LESSONS_IJAM;

    useEffect(() => {
        try {
            const raw = localStorage.getItem('ijamos_community_resources');
            if (raw) {
                const parsed = JSON.parse(raw);
                setCommunityResources(Array.isArray(parsed) ? parsed : []);
            } else {
                setCommunityResources([]);
            }
        } catch {
            setCommunityResources([]);
        }
    }, []);

    const filteredLessons = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return lessons;
        return lessons.filter((item) =>
            item.title.toLowerCase().includes(query) ||
            item.summary.toLowerCase().includes(query) ||
            item.stage.toLowerCase().includes(query)
        );
    }, [search, lessons]);
    const navigableLessons = filteredLessons.length ? filteredLessons : lessons;

    const groupedLessons = useMemo(() => {
        const groups = {};
        navigableLessons.forEach((lesson, originalIndex) => {
            const stage = lesson.stage || 'Uncategorized';
            if (!groups[stage]) {
                groups[stage] = [];
            }
            groups[stage].push({ ...lesson, originalIndex });
        });
        return groups;
    }, [navigableLessons]);

    useEffect(() => {
        if (activeIndex > navigableLessons.length - 1) {
            setActiveIndex(0);
        }
    }, [navigableLessons, activeIndex]);

    const activeLesson = navigableLessons[activeIndex] || lessons[0];
    const activeMedia = LESSON_MEDIA[activeLesson.id] || null;
    const activeLessonTips = LESSON_TIPS_BY_TONE[teachingTone]?.[activeLesson.id] || [];
    const previousLessonIdRef = useRef(null);

    const academyPaths = useMemo(() => {
        const frontendKeywords = ['ui', 'design', 'layout', 'style', 'color', 'user', 'motion', 'frontend', 'visual', 'component'];
        const backendKeywords = ['api', 'database', 'supabase', 'deploy', 'vercel', 'backend', 'sql', 'auth', 'storage', 'fetch'];

        const scoreLesson = (lesson, keywords) => {
            const text = `${lesson.title} ${lesson.summary} ${lesson.stage} ${(lesson.steps || []).join(' ')}`.toLowerCase();
            return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
        };

        const pickLessons = (keywords, fallbackStart) => {
            const ranked = lessons
                .map((lesson) => ({ lesson, score: scoreLesson(lesson, keywords) }))
                .filter((item) => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map((item) => item.lesson);

            if (ranked.length >= 4) {
                return ranked.slice(0, 6);
            }

            return lessons.slice(fallbackStart, fallbackStart + 6);
        };

        return {
            frontend: pickLessons(frontendKeywords, 0),
            backend: pickLessons(backendKeywords, Math.min(6, Math.max(0, lessons.length - 6)))
        };
    }, [lessons]);

    const openLessonInKdacademy = useCallback((lessonId, tab = 'workshop') => {
        const lesson = lessons.find((item) => item.id === lessonId);
        const idx = lessons.findIndex((item) => item.id === lessonId);
        if (!lesson || idx < 0) return;

        setSearch('');
        setActiveIndex(idx);
        setSlideIndex(-1);
        setTerminalLog([
            { role: 'system', text: 'Terminal cleared for new lesson.' },
            { role: 'system', text: `Opened lesson: ${lesson.id}` },
            {
                role: 'assistant',
                text: buildIjamBotLessonBrief({
                    lesson,
                    tips: LESSON_TIPS_BY_TONE[teachingTone]?.[lesson.id] || [],
                    tone: teachingTone
                })
            }
        ]);
        setKdacademyTab(tab);
        openApp('kdacademy');
    }, [lessons, teachingTone, openApp, setSearch]);

    useEffect(() => {
        if (!activeLesson?.id) return;
        if (previousLessonIdRef.current === activeLesson.id) return;
        previousLessonIdRef.current = activeLesson.id;
        emitMissionEvent('lesson_change', `Lesson active: ${activeLesson.title}`, {
            lessonId: activeLesson.id,
            roleHint: 'analyst'
        });
    }, [activeLesson?.id, activeLesson?.title, emitMissionEvent]);

    const openExternal = (url) => {
        if (!url) return;
        const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        window.open(normalized, '_blank', 'noopener,noreferrer');
        addVibes(10, "Resource Studied");
    };

    useEffect(() => {
        setAssistantMessages([
            {
                role: 'assistant',
                content: buildIjamBotLessonBrief({
                    lesson: activeLesson,
                    tips: activeLessonTips,
                    tone: teachingTone
                })
            }
        ]);
        setAssistantInput('');
        setSlideIndex(-1);
        setShowTips(false);
    }, [activeLesson.id, teachingTone, activeLessonTips]);

    const runAssistant = async (seedInput = '') => {
        const userMessage = (seedInput || assistantInput).trim();
        if (!userMessage) return;

        const userTurn = { role: 'user', content: userMessage };
        setAssistantMessages((prev) => [...prev, userTurn]);
        setAssistantLoading(true);
        trackResourceEvent('assistant_mode_used', { mode: assistantMode, lessonId: activeLesson.id });

        const prompt = buildResourceAiPrompt({
            mode: assistantMode,
            lesson: activeLesson,
            teachingTone,
            userInput: userMessage,
            tips: activeLessonTips
        });

        try {
            const history = assistantMessages.map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }));
            const fullSystemPrompt = `${ZARULIJAM_SYSTEM_PROMPT}\n\nYou are helping inside ResourcePage. Stay grounded to the active lesson and provide practical actions.`;
            const response = await callNvidiaLLM(fullSystemPrompt, prompt, 'meta/llama-3.3-70b-instruct', [...history, userTurn]);
            setAssistantMessages((prev) => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            const fallback = localIntelligence(userMessage, assistantMessages.map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            })));
            setAssistantMessages((prev) => [...prev, {
                role: 'assistant',
                content: `(fallback) ${fallback}`
            }]);
        } finally {
            setAssistantLoading(false);
            setAssistantInput('');
        }
    };

    const lessonLibraryItems = useMemo(() => (
        lessons.map((lesson) => ({
            id: `lesson-${lesson.id}`,
            title: lesson.title,
            description: lesson.summary,
            url: lesson.linkUrl,
            source: 'Lesson Plan'
        }))
    ), [lessons]);

    const dbLibraryItems = useMemo(() => (
        (communityResources || []).map((item) => ({
            id: `db-${item.id}`,
            title: item.title || 'Untitled Resource',
            description: item.description || 'No description provided.',
            url: item.url || '',
            source: 'Community'
        }))
    ), [communityResources]);

    const libraryItems = useMemo(() => [...lessonLibraryItems, ...dbLibraryItems], [lessonLibraryItems, dbLibraryItems]);

    useEffect(() => {
        if (!libraryItems.length) {
            setLibraryIndex(0);
            return;
        }
        if (libraryIndex > libraryItems.length - 1) {
            setLibraryIndex(0);
        }
    }, [libraryItems, libraryIndex]);

    const currentCommunity = libraryItems[libraryIndex] || null;
    const [terminalInput, setTerminalInput] = useState('');
    const [terminalBusy, setTerminalBusy] = useState(false);
    const [ijamChatPrefill, setIjamChatPrefill] = useState('');
    const [kdacademyTab, setKdacademyTab] = useState('overview');
    const [completedLessons, setCompletedLessons] = useState([]);
    const [isNarrowScreen, setIsNarrowScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 980 : false);
    const terminalOutputRef = useRef(null);
    const [terminalLog, setTerminalLog] = useState([
        { role: 'system', text: 'KRACKED_TERMINAL booted.' },
        { role: 'assistant', text: 'yo aku KRACKED_BOT. kita buat step by step je, chill.\ntanya je apa-apa pasal lesson ni.' }
    ]);

    useEffect(() => {
        if (terminalOutputRef.current) {
            terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
        }
    }, [terminalLog, terminalBusy]);

    useEffect(() => {
        const onResize = () => setIsNarrowScreen(window.innerWidth < 980);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const appendTerminal = (role, text) => {
        setTerminalLog((prev) => [...prev, { role, text }]);
    };

    const runTerminalAi = async (mode, userInput) => {
        setTerminalBusy(true);
        emitMissionEvent('terminal_request', `Terminal request (${mode})`, { roleHint: 'engineer' });
        if (userInput && userInput.length > 50) {
            addVibes(20, "Complex Prompting");
        }
        try {
            const prompt = buildResourceAiPrompt({
                mode,
                lesson: activeLesson,
                teachingTone,
                userInput,
                tips: activeLessonTips
            });
            const fullSystemPrompt = `${ZARULIJAM_SYSTEM_PROMPT}\n\nYou are running inside KRACKED_TERMINAL. Keep output concise and actionable for this active lesson only.`;
            const response = await callNvidiaLLM(fullSystemPrompt, prompt, 'meta/llama-3.3-70b-instruct', []);
            const normalized = String(response || '')
                .slice(0, 2400)
                .split('\n')
                .slice(0, 40)
                .join('\n');
            appendTerminal('assistant', normalized);
            emitMissionEvent('terminal_response', 'Terminal response delivered', { roleHint: 'master' });
        } catch (error) {
            const fallback = localIntelligence(userInput || `help with ${activeLesson.title}`, []);
            const normalizedFallback = String(fallback || '').slice(0, 1200);
            appendTerminal('assistant', `(fallback) ${normalizedFallback}`);
            emitMissionEvent('terminal_response', 'Fallback response delivered', { roleHint: 'master' });
        } finally {
            setTerminalBusy(false);
        }
    };

    const handleBoot = async () => {
        setIsBooting(true);
        setBootText('');
        setBootLines([]);
        setBootProgress(0);

        // Phase 1 — Wake up IJAM_BOT
        setBootPhase('waking');
        setBotEmotion('sleepy');
        setSpeechBubble('zzz...');
        playKeystroke();
        speakText('Initializing IJAM OS version 3', { isSystem: true });
        await new Promise(r => setTimeout(r, 900));

        setBotEmotion('surprised');
        setSpeechBubble('Wh— huh?! OH! A new builder!');
        await new Promise(r => setTimeout(r, 1000));

        // Phase 2 — Boot sequence with IJAM_BOT reacting
        setBootPhase('booting');
        setBotEmotion('focused');
        setSpeechBubble('Let me boot up the system...');

        const seq = [
            { text: '> KRACKED_OS v3.0 — KERNEL LOADED', emotion: 'focused', progress: 12, bubble: 'Kernel... check ✓' },
            { text: '> LOADING CURRICULUM MODULES [7/7]', emotion: 'thinking', progress: 28, bubble: 'Pulling in the lessons...' },
            { text: '> SYNCING ANTIGRAVITY CO-PILOT', emotion: 'thinking', progress: 44, bubble: 'AI co-pilot coming online!' },
            { text: '> VERIFYING BUILDER CREDENTIALS', emotion: 'focused', progress: 60, bubble: 'Who are you? Oh wait—', delay: 700 },
            { text: '> CALIBRATING VIBE ENGINE ████████', emotion: 'excited', progress: 76, bubble: 'The vibe is strong with this one 🔥' },
            { text: '> DEPLOYING KRACKED_BOT INSTANCE', emotion: 'motivated', progress: 90, bubble: "That's me! I'm awake!", delay: 600 },
            { text: '> ALL SYSTEMS NOMINAL. READY.', emotion: 'happy', progress: 100, bubble: null },
        ];

        for (const step of seq) {
            setBootLines(prev => [...prev, step.text]);
            setBootProgress(step.progress);
            setBotEmotion(step.emotion);
            if (step.bubble) setSpeechBubble(step.bubble);
            playKeystroke();
            await new Promise(r => setTimeout(r, step.delay || 560));
        }

        // Phase 3 — Welcome
        setBootPhase('welcome');
        setBotEmotion('celebrating');
        setSpeechBubble(`Assalamualaikum, Builder! 👋\nKRACKED_OS v3.0 is ready.\nLet's build something awesome!`);
        speakText('Assalamualaikum! Welcome, Builder! I am IJAM BOT. Let us build something awesome together!', { emotion: 'excited' });
        await new Promise(r => setTimeout(r, 1800));

        // Phase 4 — Ready
        setBootPhase('ready');
        setBotEmotion('excited');
        setSpeechBubble('Click START MY JOURNEY when ready! 🚀');
        setBootText('READY TO START');
        setIsBooting(false);
    };

    const confirmBoot = () => {
        setIsBooted(true);
        setIsOnboarding(true);
        setOnboardingStep(1);
        if (typeof window !== 'undefined') {
            localStorage.setItem('vibe_os_booted', 'true');
        }
        setTerminalLog([
            { role: 'system', text: 'SYSTEM ONLINE. ONBOARDING SEQUENCE INITIATED.' },
            { role: 'assistant', text: 'yo WELCOME BRO! aku KRACKED_BOT. sebelum kita start, aku nak check vibe kau sikit.' },
            { role: 'assistant', text: 'QUESTION 1: Kalau nak AI buat UI lawa, kau kena bagi "Master Prompt" yang detail atau suruh dia "buat web lawa" saje?' }
        ]);
    };

    // ── Bot free-roaming interactions ──────────────────────────────────────────

    const moveBotTo = useCallback((tx, ty) => {
        setBotPos(prev => {
            const dist = Math.hypot(tx - prev.x, ty - prev.y);
            if (dist < 20) return prev;
            const dur = Math.min(Math.max(dist / 280, 0.3), 4);
            setBotFacing(tx >= prev.x ? 1 : -1);
            setBotWalking(true);
            if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
            walkTimerRef.current = setTimeout(() => setBotWalking(false), dur * 1000 + 150);
            return { x: tx, y: ty, duration: dur };
        });
    }, []);

    const handleBotClick = useCallback((e) => {
        e.stopPropagation();
        setBotClickIdx(prev => {
            const resp = BOT_CLICK_RESPONSES[prev % BOT_CLICK_RESPONSES.length];
            setBotEmotion(resp.emotion);
            setSpeechBubble(resp.text);
            if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
            setBotWalking(false);
            setTimeout(() => setSpeechBubble(cur => cur === resp.text ? '' : cur), 2500);
            return prev + 1;
        });
    }, []);

    const handleScreenClick = useCallback((e) => {
        if (bootPhase === 'idle') return;
        if (e.target.closest('[data-ijambot]')) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const BOT_W = 103, BOT_H = 180; // size=180 → w=round(180*100/175)=103
        const tx = Math.max(0, Math.min(e.clientX - rect.left - BOT_W / 2, rect.width - BOT_W));
        const ty = Math.max(0, Math.min(e.clientY - rect.top - BOT_H / 2, rect.height - BOT_H));
        moveBotTo(tx, ty);
    }, [bootPhase, moveBotTo]);

    const executeTerminalCommand = async (rawCommand) => {
        const raw = rawCommand.trim();
        if (!raw) return;

        appendTerminal('user', raw);
        emitMissionEvent('terminal_command', `Command: ${raw.slice(0, 60)}`, { roleHint: 'engineer' });

        if (activeLesson.id === 'vercel-deploy' && raw.includes('vercel.app')) {
            addVibes(100, "Live Deployment Verified - ASCII TROPHY UNLOCKED!");
            appendTerminal('assistant', `
    ___________
   '._==_==_=_.'
   .-\\:      /-.
  | (|:.     |) |
   '-|:.     |-'
     \\::.    /
      '::. .'
        ) (
      _.' '._
     \`"""""""\`
YOU DID IT. APP DEPLOYED!`);
            return;
        }

        if (isOnboarding) {
            handleOnboarding(raw);
            return;
        }

        await runTerminalAi('chat', raw);
    };

    const handleOnboarding = (input) => {
        const text = input.toLowerCase();

        if (onboardingStep === 1) {
            if (text.includes('master') || text.includes('detail')) {
                appendTerminal('assistant', 'Steady! Context is king. Next question...');
                appendTerminal('assistant', 'QUESTION 2: Code kau kat local dah siap. Nak simpan kat GitHub kena guna command "git push" atau "git pull"?');
                setOnboardingStep(2);
                addVibes(20, 'Onboarding Progress ✨');
            } else {
                appendTerminal('assistant', 'Hmm, tak tepat tu. Kena bagi detail (Master Prompt) baru AI faham. Try again?');
            }
        } else if (onboardingStep === 2) {
            if (text.includes('push')) {
                appendTerminal('assistant', 'Betul! Push untuk hantar, Pull untuk ambil. Last one...');
                appendTerminal('assistant', 'QUESTION 3: Lepas push ke GitHub, tool apa kita guna untuk bagi website tu LIVE kat internet?\n(A) Vercel\n(B) Supabase\n(C) Antigravity');
                setOnboardingStep(3);
                addVibes(20, 'Onboarding Progress ✨');
            } else {
                appendTerminal('assistant', 'Eh silap tu. "git pull" tu untuk tarik code orang lain. Kita nak hantar (push) code kita.');
            }
        } else if (onboardingStep === 3) {
            if (text.includes('vercel') || text.includes('a')) {
                appendTerminal('assistant', 'MANTAP! Kau dah ready jadi Vibe Coder.');
                appendTerminal('assistant', 'VIBE_OS UNLOCKED. Semua lesson dah terbuka untuk kau.');
                setIsOnboarding(false);
                setOnboardingStep(0);
                addVibes(50, 'Onboarding Completed 🏆');

                // Show first lesson brief
                const firstLesson = lessons[0];
                appendTerminal('system', `Opened lesson: ${firstLesson.id}`);
                appendTerminal('assistant', buildIjamBotLessonBrief({
                    lesson: firstLesson,
                    tips: LESSON_TIPS_BY_TONE[teachingTone]?.[firstLesson.id] || [],
                    tone: teachingTone
                }));
            } else {
                appendTerminal('assistant', 'Hampir tepat! Supabase tu database. Antigravity tu editor. Kita nak host kat Vercel.');
            }
        }
    };

    const HOLD_DURATION = 1500;
    const onHoldStart = () => {
        setIsHolding(true);
        setHoldProgress(0);
        const start = Date.now();
        holdIntervalRef.current = setInterval(() => {
            const pct = Math.min(100, ((Date.now() - start) / HOLD_DURATION) * 100);
            setHoldProgress(pct);
            if (pct >= 100) {
                clearInterval(holdIntervalRef.current);
                setIsHolding(false);
                setHoldProgress(0);
                confirmBoot();
            }
        }, 16);
    };
    const onHoldEnd = () => {
        clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(0);
    };

    // Get wallpaper background style for desktop (must be called before any conditional returns)
    const wallpaperStyle = useMemo(() => {
        if (!isMacMode) return {};
        const wallpaper = WALLPAPER_GALLERY.find(w => w.id === currentWallpaper);
        if (!wallpaper) return { background: '#0b131e' };

        switch (wallpaper.type) {
            case 'image':
                return {
                    backgroundImage: `url(${wallpaper.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            case 'gradient':
                return {
                    background: `linear-gradient(135deg, ${wallpaper.colors.join(', ')})`
                };
            case 'animated-gradient':
                return {
                    background: `linear-gradient(135deg, ${wallpaper.colors.join(', ')})`,
                    backgroundSize: '200% 200%',
                    animation: 'gradientShift 10s ease infinite'
                };
            case 'time-based':
                return {
                    background: `linear-gradient(135deg, ${wallpaper.colors.join(', ')})`
                };
            default:
                return { background: '#0b131e' };
        }
    }, [isMacMode, currentWallpaper]);
    const macMenus = useMemo(() => ([
        {
            id: 'system',
            label: '⚡ KRACKED_OS',
            accent: '#f5d000',
            items: [
                { label: 'About This Mac', action: () => { setIsStartMenuOpen(true); setStartMenuSearch(''); } },
                { label: 'System Preferences', action: () => openApp('settings') },
                { label: 'Recent Items', action: () => openApp('files') },
                { label: 'Force Quit Finder', action: () => closeAllApps() },
                { separator: true },
                { label: 'Sleep', action: () => closeAllApps() },
                { label: 'Restart', action: () => window.location.reload() },
                { label: 'Shut Down', action: () => { localStorage.removeItem('vibe_os_booted'); window.location.reload(); } },
                { separator: true },
                { label: 'Lock Screen', action: () => { localStorage.removeItem('vibe_os_booted'); window.location.reload(); } },
                { label: 'Log Out', action: () => exitIjamOS() }
            ]
        },
        ...recentApps.map((app) => ({
            id: `recent-${app.type}`,
            label: app.label,
            items: [
                { label: `Focus ${app.label}`, action: () => focusApp(app.type) },
                { label: `Minimize ${app.label}`, action: () => minimizeApp(app.type) },
                { label: `Close ${app.label}`, action: () => closeApp(app.type) }
            ]
        })),
        {
            id: 'finder',
            label: focusedWindow ? currentDesktopAppLabel : 'Finder',
            bold: true,
            items: [
                { label: 'Open Files', action: () => openApp('files') },
                { label: 'Open Stats', action: () => openApp('progress') },
                { label: 'Empty Trash', action: () => openApp('trash') }
            ]
        },
        {
            id: 'files',
            label: 'Files',
            items: [
                { label: 'New Window', action: () => openApp('files') },
                { label: 'Open File Explorer', action: () => openApp('files') },
                { label: 'Search Files', action: () => { openApp('files'); setExplorerSearch(''); } },
                { label: 'File Properties', action: () => openApp('files') },
                { label: 'Exit', action: () => closeApp('files') }
            ]
        },
        {
            id: 'view',
            label: 'View',
            items: [
                { label: 'Open Wallpaper Gallery', action: () => openApp('wallpaper') },
                { label: 'Open Simulator', action: () => openApp('simulator') },
                { label: 'Open Mind Map', action: () => openApp('mind_mapper') }
            ]
        },
        {
            id: 'window',
            label: 'Window',
            items: [
                { label: 'Show Academy', action: () => { setKdacademyTab('overview'); openApp('kdacademy'); } },
                { label: 'Show Mission', action: () => openApp('mission') },
                { label: 'Close All Windows', action: () => closeAllApps() }
            ]
        },
        {
            id: 'help',
            label: 'Help',
            items: [
                { label: 'Open Prompt Forge', action: () => openApp('prompt_forge') },
                { label: 'Builder Arcade', action: () => openApp('arcade') },
                { label: 'Search Apps', action: () => { setIsStartMenuOpen(true); setStartMenuSearch(''); } }
            ]
        }
    ]), [recentApps, focusedWindow, currentDesktopAppLabel, openApp, closeAllApps, focusApp, minimizeApp, closeApp, exitIjamOS, setKdacademyTab]);

    if (!isBooted) {
        return (
            <div
                onMouseMove={e => setBootMousePos({ x: e.clientX, y: e.clientY })}
                onTouchMove={e => { const t = e.touches[0]; if (t) setBootMousePos({ x: t.clientX, y: t.clientY }); }}
            >
                <KrackedInteractiveLoading
                    bootPhase={bootPhase}
                    bootProgress={bootProgress}








                    onConfirmBoot={confirmBoot}
                    systemTime={systemTime}
                    systemDate={systemDate}
                />
            </div>
        );
    }

    return (
        <section
            id="resources-page"
            style={{
                ...sectionStyle,
                ...wallpaperStyle,
                width: '100%',
                minWidth: '100%',
                height: '100vh',
                minHeight: '100vh',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {isTouchIjamMode && (
                <div style={{ position: 'absolute', top: 'max(2px, env(safe-area-inset-top, 0px))', left: 10, right: 10, zIndex: 1200 }}>
                    <MobileStatusBar
                        timeLabel={systemTime}
                        batteryPct={batteryPct}
                        marginBottom={0}
                        centerContent={(
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: isPhoneMode ? 'min(58%, 246px)' : 'min(46%, 290px)',
                                    background: 'rgba(10,10,10,0.95)',
                                    color: '#fff',
                                    borderRadius: 14,
                                    padding: '5px 8px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    lineHeight: 1.15,
                                    boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
                                    pointerEvents: 'auto',
                                    overflow: 'hidden'
                                }}
                            >
                                <span style={{ pointerEvents: 'none', flex: 1, minWidth: 0, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {activeWindow ? (APP_REGISTRY.find((a) => a.type === activeWindow)?.label || 'KRACKED_OS') : 'KRACKED_OS'}
                                </span>
                                <button
                                    type="button"
                                    onClick={exitIjamOS}
                                    style={{
                                        border: '1px solid rgba(239,68,68,0.45)',
                                        borderRadius: 999,
                                        background: 'rgba(239,68,68,0.22)',
                                        color: '#fff',
                                        fontSize: 9,
                                        fontWeight: 600,
                                        padding: '3px 7px',
                                        lineHeight: 1
                                    }}
                                >
                                    Exit
                                </button>
                            </div>
                        )}
                    />
                </div>
            )}

            {/* Desktop Wallpaper - Grid Pattern */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#f5d000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

            {/* Desktop Icons Container */}
            <div
                ref={desktopIconsContainerRef}
                style={{
                position: 'absolute',
                top: isMacMode ? '28px' : 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                maxWidth: '100%',
                margin: 0,
                padding: isPhoneMode ? '58px 10px 96px' : (isTabletMode ? '62px 14px 104px' : '12px 20px 24px'),
                height: isMacMode ? 'calc(100vh - 28px)' : '100%',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: isMacMode
                    ? `repeat(${desktopGridMetrics.columns}, minmax(0, 1fr))`
                    : (isTabletMode ? 'repeat(auto-fill, minmax(92px, 1fr))' : 'repeat(4, minmax(0, 1fr))'),
                gap: isMacMode ? '12px' : '12px',
                gridAutoRows: isMacMode ? '86px' : 'auto',
                alignItems: 'start',
                alignContent: 'start',
                contentVisibility: 'auto'
            }}
                onDragOver={(e) => {
                    if (!isTouchIjamMode && draggedIconType) {
                        e.preventDefault();
                    }
                }}
                onDrop={(e) => {
                    if (isTouchIjamMode || !draggedIconType) return;
                    e.preventDefault();
                    setDraggedIconType(null);
                    setDropTargetSlotIndex(null);
                    setTimeout(() => setIsDraggingDesktopIcon(false), 80);
            }}>
                {Array.from({ length: desktopSlotCount }).map((_, slotIndex) => {
                    const appType = desktopIconSlots[slotIndex] || null;
                    const app = appType ? appByType[appType] : null;
                    return (
                        <div
                            key={`desktop-slot-${slotIndex}`}
                            onDragOver={(e) => {
                                if (isTouchIjamMode || !draggedIconType) return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDropTargetSlotIndex(slotIndex);
                            }}
                            onDrop={(e) => {
                                if (isTouchIjamMode || !draggedIconType) return;
                                e.preventDefault();
                                const sourceType = e.dataTransfer.getData('text/plain') || draggedIconType;
                                moveDesktopIconToSlot(sourceType, slotIndex);
                                setDraggedIconType(null);
                                setDropTargetSlotIndex(null);
                                setTimeout(() => setIsDraggingDesktopIcon(false), 80);
                            }}
                            style={{
                                minHeight: isPhoneMode ? '78px' : '86px',
                                height: isMacMode ? '86px' : 'auto',
                                borderRadius: '12px',
                                border: dropTargetSlotIndex === slotIndex
                                    ? '1px dashed rgba(245,208,0,0.8)'
                                    : '1px solid transparent',
                                background: dropTargetSlotIndex === slotIndex
                                    ? 'rgba(245,208,0,0.08)'
                                    : 'transparent',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start'
                            }}
                        >
                            {app ? (
                                <DesktopIcon
                                    label={app.label}
                                    icon={app.icon}
                                    imageSrc={app.desktopIconImage}
                                    iconScale={app.desktopIconScale || 1}
                                    color={app.color}
                                    onClick={() => {
                                        if (isDraggingDesktopIcon) return;
                                        openApp(app.type);
                                    }}
                                    isPhoneMode={isPhoneMode}
                                    isTabletMode={isTabletMode}
                                    draggable={!isTouchIjamMode}
                                    onDragStart={(e) => {
                                        setIsDraggingDesktopIcon(true);
                                        setDraggedIconType(app.type);
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData('text/plain', app.type);
                                    }}
                                    onDragOver={(e) => {
                                        if (isTouchIjamMode || draggedIconType === app.type) return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={(e) => {
                                        if (isTouchIjamMode || !draggedIconType) return;
                                        e.preventDefault();
                                        const sourceType = e.dataTransfer.getData('text/plain') || draggedIconType;
                                        moveDesktopIconToSlot(sourceType, slotIndex);
                                        setDraggedIconType(null);
                                        setDropTargetSlotIndex(null);
                                        setTimeout(() => setIsDraggingDesktopIcon(false), 80);
                                    }}
                                    onDragEnd={() => {
                                        setDraggedIconType(null);
                                        setDropTargetSlotIndex(null);
                                        setTimeout(() => setIsDraggingDesktopIcon(false), 80);
                                    }}
                                    isDropTarget={dropTargetSlotIndex === slotIndex}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Application Windows */}

            {/* 1. Terminal Window */}
            {windowStates.terminal?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.terminal} title="KRACKED_TERMINAL // KRACKED_OS v3" AppIcon={Bot} onClose={() => closeApp('terminal')} onMinimize={() => minimizeApp('terminal')} onMaximize={() => maximizeApp('terminal')} onFocus={() => focusApp('terminal')} onMove={(x, y) => moveApp('terminal', x, y)} onResize={(w, h) => resizeApp('terminal', w, h)}>
                    <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : (sidebarVisible ? 'minmax(220px, 320px) 1fr' : '0 1fr'), gridTemplateRows: isNarrowScreen ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)', flex: 1, minHeight: 0 }}>
                        <aside style={{ borderRight: (isNarrowScreen || !sidebarVisible) ? 'none' : '3px solid #0b1220', borderBottom: isNarrowScreen ? '3px solid #0b1220' : 'none', padding: sidebarVisible || isNarrowScreen ? '10px' : '0', background: '#0b1220', minHeight: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '13px', color: '#93c5fd' }}>LESSON TREE</div>
                                {!isNarrowScreen && (
                                    <button
                                        onClick={() => setSidebarVisible(false)}
                                        style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}
                                    >
                                        [COLLAPSE]
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: isNarrowScreen ? '24vh' : '56vh', overflowY: 'auto', paddingRight: '4px' }}>
                                {Object.entries(groupedLessons).map(([stageName, stageLessons]) => {
                                    const isCollapsed = collapsedStages.has(stageName);
                                    return (
                                        <div key={stageName}>
                                            <button
                                                type="button"
                                                onClick={() => toggleStage(stageName)}
                                                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', marginBottom: isCollapsed ? '0' : '6px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}
                                            >
                                                <span style={{ color: '#f5d000', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stageName}</span>
                                                <span style={{ color: '#f5d000', fontSize: '11px', fontWeight: 900 }}>{isCollapsed ? '▸' : '▾'}</span>
                                            </button>
                                            {!isCollapsed && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {stageLessons.map((lesson) => {
                                                        const isActive = lesson.id === activeLesson.id;
                                                        const isDone = completedLessons.includes(lesson.id);
                                                        return (
                                                            <button
                                                                key={lesson.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveIndex(lesson.originalIndex);
                                                                    setSlideIndex(-1);
                                                                    setTerminalLog([
                                                                        { role: 'system', text: 'Terminal cleared for new lesson.' },
                                                                        { role: 'system', text: `Opened lesson: ${lesson.id}` },
                                                                        {
                                                                            role: 'assistant', text: buildIjamBotLessonBrief({
                                                                                lesson,
                                                                                tips: LESSON_TIPS_BY_TONE[teachingTone]?.[lesson.id] || [],
                                                                                tone: teachingTone
                                                                            })
                                                                        }
                                                                    ]);
                                                                }}
                                                                style={{
                                                                    textAlign: 'left',
                                                                    background: isActive ? '#c8102e' : 'transparent',
                                                                    border: isActive ? '1px solid #ef4444' : '1px solid transparent',
                                                                    color: isActive ? '#f8fafc' : isDone ? '#86efac' : '#94a3b8',
                                                                    borderRadius: '6px',
                                                                    padding: '6px 8px',
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '13px',
                                                                    fontWeight: isActive ? 800 : 600,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s ease',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isActive) {
                                                                        e.currentTarget.style.background = '#1e293b';
                                                                        e.currentTarget.style.color = '#e2e8f0';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isActive) {
                                                                        e.currentTarget.style.background = 'transparent';
                                                                        e.currentTarget.style.color = isDone ? '#86efac' : '#94a3b8';
                                                                    }
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '10px', flexShrink: 0 }}>{isDone ? '✓' : '○'}</span>
                                                                {lesson.title}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '13px', color: '#fcd34d' }}>
                                completed: {completedLessons.length}/{lessons.length}
                            </div>
                            <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }}>
                                disclaimer: lessons are co-written with AI
                            </div>
                        </aside>
                        <main style={{ padding: '10px', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: '8px', minHeight: 0 }}>

                            <div style={{ position: 'relative', border: '2px solid #334155', borderRadius: '8px', padding: '8px', fontFamily: 'monospace', fontSize: '12px', background: '#0b1220', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                {!sidebarVisible && !isNarrowScreen && (
                                    <button
                                        onClick={() => setSidebarVisible(true)}
                                        style={{ background: '#0b1220', color: '#f5d000', border: '1px solid #f5d000', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        SHOW TREE
                                    </button>
                                )}
                                <div>
                                    <div style={{ color: '#f5d000', fontWeight: 900 }}>ACTIVE LESSON: {activeLesson.id}</div>
                                    <div style={{ color: '#bfdbfe' }}>{activeLesson.title}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowTips(!showTips)}
                                            style={{
                                                background: showTips ? '#f5d000' : '#1e293b',
                                                border: `3px solid #0b1220`,
                                                borderRadius: '8px',
                                                padding: '8px',
                                                cursor: 'pointer',
                                                color: showTips ? '#0b1220' : '#000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '4px 4px 0 #0b1220'
                                            }}
                                            title="KRACKED_BOT Tips"
                                        >
                                            <Bot size={20} strokeWidth={2.5} />
                                        </button>

                                        {showTips && activeLessonTips && activeLessonTips.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '120%',
                                                right: 0,
                                                background: '#f8fafc',
                                                border: '3px solid #0b1220',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                width: '280px',
                                                zIndex: 50,
                                                boxShadow: '8px 8px 0 #0b1220',
                                                color: '#0f172a'
                                            }}>
                                                {/* Speech Bubble Arrow pointing Top-Right towards the Bot */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-12px',
                                                    right: '16px',
                                                    width: '0',
                                                    height: '0',
                                                    borderLeft: '12px solid transparent',
                                                    borderRight: '12px solid transparent',
                                                    borderBottom: '12px solid #0b1220'
                                                }}></div>
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '16px',
                                                    width: '0',
                                                    height: '0',
                                                    borderLeft: '12px solid transparent',
                                                    borderRight: '12px solid transparent',
                                                    borderBottom: '12px solid #f8fafc'
                                                }}></div>

                                                <div style={{ color: '#c8102e', fontWeight: 900, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <Lightbulb size={16} strokeWidth={3} /> {teachingTone === 'ijam' ? 'IJAM CAKAP:' : 'LESSON INSIGHTS:'}
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155', fontSize: '12px', lineHeight: 1.6, fontWeight: 600 }}>
                                                    {activeLessonTips.map((tip, i) => (
                                                        <li key={i} style={{ marginBottom: i < activeLessonTips.length - 1 ? '10px' : '0' }}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ border: '2px solid #334155', borderRadius: '8px', background: '#0b1220', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', maxHeight: isNarrowScreen ? '60vh' : 'none', overflow: 'hidden' }}>
                                <div ref={terminalOutputRef} style={{ padding: '8px', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5 }}>
                                    {activeMedia?.visual && (
                                        <div style={{ marginBottom: '16px', border: '2px solid #334155', borderRadius: '8px', overflow: 'hidden', background: '#111827' }}>
                                            <img
                                                src={activeMedia.visual}
                                                alt={activeLesson.title}
                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    )}
                                    {terminalLog.map((entry, idx) => (
                                        <div key={`${entry.role}-${idx}`} style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                                            {entry.role !== 'system' && (
                                                <span style={{ color: entry.role === 'assistant' ? '#f5d000' : '#86efac', fontWeight: 900 }}>
                                                    {entry.role === 'assistant' ? 'KRACKED_BOT>' : `[${userRank} | ${userVibes}] YOU>`}
                                                </span>
                                            )}
                                            {entry.role !== 'system' && ' '}
                                            <span style={{ color: entry.role === 'system' ? '#93c5fd' : '#e5e7eb', fontStyle: entry.role === 'system' ? 'italic' : 'normal' }}>
                                                {entry.text}
                                            </span>
                                        </div>
                                    ))}
                                    {terminalBusy && (
                                        <div><span style={{ color: '#f5d000', fontWeight: 900 }}>KRACKED_BOT&gt;</span> processing...</div>
                                    )}
                                    {!terminalBusy && terminalLog.length > 0 && (
                                        <div style={{ marginTop: '12px', cursor: 'pointer', color: '#f5d000', textDecoration: 'underline', fontWeight: 'bold' }}
                                            onClick={() => {
                                                if (slideIndex < activeLesson.steps.length) {
                                                    const next = slideIndex + 1;
                                                    setSlideIndex(next);
                                                    if (next === activeLesson.steps.length) {
                                                        appendTerminal('assistant', teachingTone === 'ijam' ? '[LESSON COMPLETE]\npadu gila! klik "> proceed to next lesson" untuk sambung.' : '[LESSON COMPLETE]\nGreat job! Click "> proceed to next lesson" to continue.');
                                                    } else {
                                                        appendTerminal('assistant', `[STEP ${next + 1} OF ${activeLesson.steps.length}]\n${activeLesson.steps[next]}`);
                                                    }
                                                } else {
                                                    const nextLessonIdx = (activeIndex + 1) % navigableLessons.length;
                                                    const nextLesson = navigableLessons[nextLessonIdx];
                                                    setActiveIndex(nextLessonIdx);
                                                    setSlideIndex(-1);
                                                    setTerminalLog([
                                                        { role: 'system', text: 'Terminal cleared for new lesson.' },
                                                        { role: 'system', text: `Opened lesson: ${nextLesson.id}` },
                                                        {
                                                            role: 'assistant', text: buildIjamBotLessonBrief({
                                                                lesson: nextLesson,
                                                                tips: LESSON_TIPS_BY_TONE[teachingTone]?.[nextLesson.id] || [],
                                                                tone: teachingTone
                                                            })
                                                        }
                                                    ]);
                                                }
                                            }}>
                                            &gt; {slideIndex >= activeLesson.steps.length ? 'proceed to next lesson' : 'show next step'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ border: '2px solid #334155', borderRadius: '8px', padding: '8px', background: '#0b1220' }}>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const command = terminalInput;
                                        setTerminalInput('');
                                        await executeTerminalCommand(command);
                                    }}
                                    style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}
                                >
                                    <input
                                        value={terminalInput}
                                        onChange={(e) => setTerminalInput(e.target.value)}
                                        placeholder='minta tolong sini...'
                                        style={{ border: '2px solid #f5d000', borderRadius: '8px', background: '#111827', color: '#f8fafc', padding: '10px', fontFamily: 'monospace', fontWeight: 800, minWidth: 0, width: '100%' }}
                                    />
                                    <button type="submit" className="btn btn-red" disabled={terminalBusy} style={{ fontFamily: 'monospace' }}>
                                        RUN
                                    </button>
                                </form>
                            </div>
                        </main>
                    </div>
                </WindowFrame>
            )}

            {/* 2. Resource Explorer Window */}
            {windowStates.files?.isOpen && (() => {
                const allStages = [...new Set(lessons.map(l => l.stage).filter(Boolean))];

                const navTo = (path) => { setExplorerPath(path); setExplorerSelected(null); setExplorerSearch(''); };

                const getItems = () => {
                    if (explorerSearch.trim()) {
                        const q = explorerSearch.toLowerCase();
                        return [
                            ...lessons.filter(l => l.title.toLowerCase().includes(q) || (l.summary || '').toLowerCase().includes(q))
                                .map(l => ({ id: `lesson-${l.id}`, name: l.title, type: 'lesson', ext: '.lesson', data: l })),
                            ...dbLibraryItems.filter(r => (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
                                .map(r => ({ id: `url-${r.id}`, name: r.title, type: 'url', ext: '.url', data: r }))
                        ];
                    }
                    if (explorerPath.length === 0) return [{ id: 'drive-C', name: 'C:\\', type: 'drive', label: 'KRACKED_OS System Drive' }];
                    if (explorerPath.length === 1) return [
                        ...allStages.map(s => ({ id: `folder-${s}`, name: s, type: 'folder' })),
                        ...(dbLibraryItems.length ? [{ id: 'folder-COMMUNITY', name: 'COMMUNITY_RESOURCES', type: 'folder' }] : [])
                    ];
                    if (explorerPath.length === 2) {
                        const f = explorerPath[1];
                        if (f === 'COMMUNITY_RESOURCES') return dbLibraryItems.map(r => ({ id: `url-${r.id}`, name: r.title, type: 'url', ext: '.url', data: r }));
                        return lessons.filter(l => l.stage === f).map(l => ({ id: `lesson-${l.id}`, name: l.title, type: 'lesson', ext: '.lesson', data: l }));
                    }
                    return [];
                };

                const items = getItems();

                const handleClick = (item) => {
                    if (item.type === 'drive') { navTo(['C:']); return; }
                    if (item.type === 'folder') { navTo([...explorerPath, item.name]); return; }
                    setExplorerSelected(prev => prev?.id === item.id ? null : item);
                };

                const openItem = (item) => {
                    if (!item) return;
                    if (item.type === 'lesson') {
                        openLessonInKdacademy(item.data.id, 'workshop');
                    }
                    if (item.type === 'url') openExternal(item.data.url);
                };

                const ICON = { drive: '💾', folder: '📁', lesson: '📄', url: '🔗' };
                const TYPE_LABEL = { drive: 'Local Disk', folder: 'File Folder', lesson: 'Lesson File', url: 'URL Shortcut' };

                const sidebarBtnStyle = (active) => ({
                    width: '100%', textAlign: 'left', background: active ? '#1e293b' : 'transparent',
                    border: 'none', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer',
                    fontFamily: 'monospace', fontSize: '12px', color: active ? '#f5d000' : '#94a3b8',
                    display: 'flex', alignItems: 'center', gap: '7px', lineHeight: 1.3
                });

                const itemIsSelected = (item) => explorerSelected?.id === item.id;

                return (
                    <WindowFrame {...mobileWindowProps} winState={windowStates.files} title="FILE_EXPLORER // KRACKED_OS v3" AppIcon={Folder} onClose={() => { closeApp('files'); setExplorerPath([]); setExplorerSearch(''); setExplorerSelected(null); }} onMinimize={() => minimizeApp('files')} onMaximize={() => maximizeApp('files')} onFocus={() => focusApp('files')} onMove={(x, y) => moveApp('files', x, y)} onResize={(w, h) => resizeApp('files', w, h)}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                            {/* ── TOOLBAR ── */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderBottom: '2px solid #1e293b', background: '#0b1220', flexShrink: 0, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                    <button onClick={() => navTo(explorerPath.slice(0, -1))} disabled={!explorerPath.length}
                                        style={{ background: 'none', border: '1px solid #1e293b', borderRadius: '4px', padding: '4px 8px', color: explorerPath.length ? '#94a3b8' : '#1e3a5f', cursor: explorerPath.length ? 'pointer' : 'default', fontSize: '14px', lineHeight: 1 }}>←</button>
                                    <button onClick={() => navTo([])}
                                        style={{ background: 'none', border: '1px solid #1e293b', borderRadius: '4px', padding: '4px 8px', color: '#f5d000', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>⌂</button>
                                </div>
                                {/* Address bar */}
                                <div style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace', fontSize: '12px', minWidth: 0, overflow: 'hidden' }}>
                                    <span style={{ color: '#f5d000', fontWeight: 900, flexShrink: 0 }}>KRACKED_OS</span>
                                    {explorerPath.map((seg, i) => (
                                        <React.Fragment key={i}>
                                            <span style={{ color: '#334155', flexShrink: 0 }}>›</span>
                                            <button onClick={() => navTo(explorerPath.slice(0, i + 1))}
                                                style={{ background: 'none', border: 'none', color: '#bfdbfe', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', padding: 0, flexShrink: 0 }}>{seg}</button>
                                        </React.Fragment>
                                    ))}
                                </div>
                                {/* Search */}
                                <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', gap: '5px' }}>
                                    <Search size={12} color="#64748b" />
                                    <input value={explorerSearch} onChange={e => { setExplorerSearch(e.target.value); setExplorerSelected(null); }} placeholder="Search files..."
                                        style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '12px', width: '120px' }} />
                                    {explorerSearch && <button onClick={() => setExplorerSearch('')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px', padding: 0, lineHeight: 1 }}>✕</button>}
                                </div>
                                {/* View toggle */}
                                <div style={{ display: 'flex', border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden' }}>
                                    {['icons', 'list'].map(v => (
                                        <button key={v} onClick={() => setExplorerView(v)}
                                            style={{ background: explorerView === v ? '#334155' : 'transparent', border: 'none', color: explorerView === v ? '#f5d000' : '#475569', padding: '4px 9px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>
                                            {v === 'icons' ? '⊞' : '≡'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── BODY ── */}
                            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

                                {/* Left sidebar */}
                                {!isNarrowScreen && (
                                    <aside style={{ width: '168px', flexShrink: 0, borderRight: '2px solid #1e293b', background: '#06111a', padding: '8px 6px', overflowY: 'auto' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#334155', letterSpacing: '0.12em', padding: '2px 8px 5px', textTransform: 'uppercase' }}>Quick Access</div>
                                        <button onClick={() => navTo([])} style={sidebarBtnStyle(explorerPath.length === 0 && !explorerSearch)}>⌂ My Computer</button>

                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#334155', letterSpacing: '0.12em', padding: '10px 8px 4px', textTransform: 'uppercase' }}>Drives</div>
                                        <button onClick={() => navTo(['C:'])} style={sidebarBtnStyle(explorerPath[0] === 'C:' && explorerPath.length === 1)}>💾 C:\ KRACKED_OS</button>

                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#334155', letterSpacing: '0.12em', padding: '10px 8px 4px', textTransform: 'uppercase' }}>Folders</div>
                                        {allStages.map(stage => (
                                            <button key={stage} onClick={() => navTo(['C:', stage])} style={sidebarBtnStyle(explorerPath[1] === stage)}>
                                                📁 {stage.length > 15 ? stage.slice(0, 14) + '…' : stage}
                                            </button>
                                        ))}
                                        {dbLibraryItems.length > 0 && (
                                            <button onClick={() => navTo(['C:', 'COMMUNITY_RESOURCES'])} style={sidebarBtnStyle(explorerPath[1] === 'COMMUNITY_RESOURCES')}>🌐 Community</button>
                                        )}
                                    </aside>
                                )}

                                {/* Main content + detail panel */}
                                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>

                                    {/* File area */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        {explorerView === 'list' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px', borderBottom: '1px solid #1e293b', padding: '4px 14px', background: '#06111a', flexShrink: 0 }}>
                                                {['Name', 'Type', 'Location'].map(h => (
                                                    <div key={h} style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, overflowY: 'auto', padding: explorerView === 'icons' ? '14px' : '0' }}>
                                            {explorerSearch && (
                                                <div style={{ padding: '6px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#475569', borderBottom: '1px solid #1e293b' }}>
                                                    Search results for <span style={{ color: '#f5d000' }}>"{explorerSearch}"</span> — {items.length} file{items.length !== 1 ? 's' : ''} found
                                                </div>
                                            )}
                                            {items.length === 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: '#1e293b', fontFamily: 'monospace', fontSize: '13px', gap: '10px' }}>
                                                    <Folder size={48} strokeWidth={1} />
                                                    {explorerSearch ? 'No files match your search.' : 'This folder is empty.'}
                                                </div>
                                            ) : explorerView === 'icons' ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: '4px' }}>
                                                    {items.map(item => (
                                                        <button key={item.id} onClick={() => handleClick(item)}
                                                            style={{ background: itemIsSelected(item) ? '#1e3a5f' : 'transparent', border: `1px solid ${itemIsSelected(item) ? '#3b82f6' : 'transparent'}`, borderRadius: '8px', padding: '10px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                                                            onMouseEnter={e => { if (!itemIsSelected(item)) e.currentTarget.style.background = '#0f2039'; }}
                                                            onMouseLeave={e => { if (!itemIsSelected(item)) e.currentTarget.style.background = 'transparent'; }}>
                                                            <span style={{ fontSize: '28px', lineHeight: 1 }}>{ICON[item.type]}</span>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e2e8f0', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3, maxWidth: '80px' }}>
                                                                {item.name.length > 28 ? item.name.slice(0, 26) + '…' : item.name}
                                                            </span>
                                                            {item.ext && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#334155' }}>{item.ext}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div>
                                                    {items.map((item, i) => (
                                                        <button key={item.id} onClick={() => handleClick(item)}
                                                            style={{ width: '100%', textAlign: 'left', background: itemIsSelected(item) ? '#1e3a5f' : i % 2 === 0 ? 'rgba(6,17,26,0.7)' : 'transparent', border: 'none', borderLeft: `3px solid ${itemIsSelected(item) ? '#3b82f6' : 'transparent'}`, padding: '7px 14px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 90px 130px', alignItems: 'center', gap: '8px' }}
                                                            onMouseEnter={e => { if (!itemIsSelected(item)) e.currentTarget.style.background = '#0f2039'; }}
                                                            onMouseLeave={e => { if (!itemIsSelected(item)) e.currentTarget.style.background = i % 2 === 0 ? 'rgba(6,17,26,0.7)' : 'transparent'; }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                                                <span style={{ fontSize: '15px', flexShrink: 0 }}>{ICON[item.type]}</span>
                                                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                                            </div>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#334155' }}>{TYPE_LABEL[item.type]}</span>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {item.data?.stage || (item.type === 'url' ? 'Community' : item.type === 'folder' ? `${lessons.filter(l => l.stage === item.name).length} items` : 'C:\\')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right detail panel */}
                                    {explorerSelected && !isNarrowScreen && (
                                        <aside style={{ width: '210px', flexShrink: 0, borderLeft: '2px solid #1e293b', background: '#06111a', padding: '16px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div style={{ textAlign: 'center', fontSize: '44px', lineHeight: 1 }}>{ICON[explorerSelected.type]}</div>
                                            <div>
                                                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 900, color: '#e2e8f0', wordBreak: 'break-word', lineHeight: 1.4 }}>{explorerSelected.name}</div>
                                                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#334155', marginTop: '3px' }}>{explorerSelected.ext || TYPE_LABEL[explorerSelected.type]}</div>
                                            </div>
                                            {explorerSelected.data?.stage && (
                                                <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: '4px' }}>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Stage</div>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#f5d000', fontWeight: 700 }}>{explorerSelected.data.stage}</div>
                                                </div>
                                            )}
                                            {(explorerSelected.data?.summary || explorerSelected.data?.description) && (
                                                <div>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Summary</div>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                                                        {((explorerSelected.data.summary || explorerSelected.data.description) ?? '').slice(0, 180)}
                                                        {((explorerSelected.data.summary || explorerSelected.data.description) ?? '').length > 180 ? '…' : ''}
                                                    </div>
                                                </div>
                                            )}
                                            {explorerSelected.data?.steps && (
                                                <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: '4px' }}>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Contents</div>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86efac' }}>{explorerSelected.data.steps.length} steps</div>
                                                </div>
                                            )}
                                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {explorerSelected.type === 'lesson' && (
                                                    <button onClick={() => openItem(explorerSelected)}
                                                        style={{ background: '#f5d000', border: '2px solid #0b1220', color: '#0b1220', padding: '9px', fontWeight: 900, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <Terminal size={12} /> OPEN IN TERMINAL
                                                    </button>
                                                )}
                                                {explorerSelected.type === 'url' && explorerSelected.data?.url && (
                                                    <button onClick={() => openItem(explorerSelected)}
                                                        style={{ background: '#86efac', border: '2px solid #0b1220', color: '#0b1220', padding: '9px', fontWeight: 900, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                        <ExternalLink size={12} /> OPEN EXTERNAL
                                                    </button>
                                                )}
                                            </div>
                                        </aside>
                                    )}
                                </div>
                            </div>

                            {/* ── STATUS BAR ── */}
                            <div style={{ borderTop: '2px solid #1e293b', padding: '4px 12px', background: '#06111a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#334155' }}>
                                    {items.length} item{items.length !== 1 ? 's' : ''}
                                    {explorerSelected ? ` · ${explorerSelected.name}${explorerSelected.ext || ''} selected` : ''}
                                </span>
                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1e3a5f' }}>
                                    KRACKED_OS{explorerPath.length ? '\\' + explorerPath.join('\\') : ''}
                                </span>
                            </div>
                        </div>
                    </WindowFrame>
                );
            })()}

            {/* 3. Settings/Stats Window */}
            {windowStates.progress?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.progress} title="BUILDER_STATS // PROGRESS" AppIcon={User} onClose={() => closeApp('progress')} onMinimize={() => minimizeApp('progress')} onMaximize={() => maximizeApp('progress')} onFocus={() => focusApp('progress')} onMove={(x, y) => moveApp('progress', x, y)} onResize={(w, h) => resizeApp('progress', w, h)}>
                    <div style={{ padding: '24px', color: '#fff', overflowY: 'auto', height: '100%' }}>
                        {/* Builder Identity Card */}
                        <div style={{ background: 'linear-gradient(45deg, #0b1220 0%, #1e293b 100%)', border: '3px solid #f5d000', borderRadius: '16px', padding: '24px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '8px 8px 0 #0b1220' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#f5d000', border: '4px solid #0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#0b1220', flexShrink: 0 }}>
                                {(currentUser?.name || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#f5d000', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '4px' }}>VERIFIED_BUILDER</div>
                                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{currentUser?.name || 'Anonymous Builder'}</div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 800 }}>DARI {currentUser?.district || 'Selangor'} // {userRank}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            {/* Rank Card */}
                            <div style={{ background: '#0b1220', padding: '24px', border: '3px solid #f5d000', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>RANK</div>
                                <div style={{ fontSize: '24px', fontWeight: 900, color: '#f5d000' }}>{userRank}</div>
                                <div style={{ fontSize: '14px', color: '#86efac', marginTop: '4px', fontWeight: 800 }}>{userVibes} VIBES</div>
                            </div>
                            {/* Completion Card */}
                            <div style={{ background: '#0b1220', padding: '24px', border: '3px solid #334155', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>COMPLETION</div>
                                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                                    {Math.round((completedLessons.length / lessons.length) * 100)}%
                                </div>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                                    {completedLessons.length} / {lessons.length} Modules
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 900, fontFamily: 'monospace' }}>
                                <span>SYSTEM_READY_INDEX</span>
                                <span>{Math.round((completedLessons.length / lessons.length) * 100)}%</span>
                            </div>
                            <div style={{ height: '12px', background: '#0b1220', border: '2px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(completedLessons.length / lessons.length) * 100}%`,
                                    background: '#f5d000',
                                    boxShadow: '0 0 12px rgba(245, 208, 0, 0.4)',
                                    transition: 'width 1s ease-out'
                                }} />
                            </div>
                        </div>

                        {/* Stage Checklist */}
                        <div style={{ background: '#0b1220', padding: '20px', borderRadius: '12px', border: '2px solid #1e293b' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#f5d000', marginBottom: '16px', fontFamily: 'monospace' }}>ROADMAP_CHECKLIST</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.keys(groupedLessons).map(stage => {
                                    const stageLessons = groupedLessons[stage];
                                    const completedInStage = stageLessons.filter(l => completedLessons.includes(l.id)).length;
                                    const isStageDone = completedInStage === stageLessons.length;

                                    return (
                                        <div key={stage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isStageDone ? 'rgba(134, 239, 172, 0.05)' : 'rgba(255,255,255,0.02)', border: isStageDone ? '1px solid #86efac' : '1px solid #1e293b', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '18px', height: '18px', border: '2px solid', borderColor: isStageDone ? '#86efac' : '#334155', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86efac' }}>
                                                    {isStageDone && "✓"}
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: isStageDone ? '#86efac' : '#fff' }}>{stage.toUpperCase()}</span>
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 900 }}>{completedInStage}/{stageLessons.length}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* WEBSITE SHOWCASE UPLOADER */}
                        <div style={{ background: '#0b1220', padding: '24px', borderRadius: '12px', border: '3px solid #f5d000', marginTop: '30px', boxShadow: '8px 8px 0 #0b1220' }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#f5d000', marginBottom: '16px', fontFamily: 'monospace' }}>[ WEBSITE_SHOWCASE ]</div>

                            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr', gap: '24px' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ background: '#1e293b', border: '2px dashed #475569', borderRadius: '8px', padding: '20px', textAlign: 'center', position: 'relative' }}>
                                        {showcaseUrl ? (
                                            <img src={showcaseUrl} alt="Showcase" style={{ width: '100%', borderRadius: '4px', display: 'block' }} />
                                        ) : (
                                            <div style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>No image uploaded.</div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                            style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                        <button style={{ marginTop: '12px', background: '#f5d000', color: '#0b1220', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 900, fontFamily: 'monospace', cursor: 'pointer' }}>
                                            {isUploading ? 'UPLOADING...' : (showcaseUrl ? 'CHANGE_IMAGE' : 'UPLOAD_IMAGE')}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                                        Upload a screenshot of your website here to show off to the community alongside your rank and vibes.
                                    </p>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#f5d000', marginBottom: '8px', fontWeight: 900, fontFamily: 'monospace' }}>LIVE_URL</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                value={websiteUrl}
                                                onChange={e => setWebsiteUrl(e.target.value)}
                                                placeholder="https://mywebsite.vercel.app"
                                                style={{ flex: 1, background: '#111827', border: '2px solid #334155', padding: '10px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}
                                            />
                                            <button onClick={handleSaveWebsiteUrl} style={{ background: '#f5d000', color: '#0b1220', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>SAVE</button>
                                        </div>
                                    </div>
                                    {websiteUrl && (
                                        <button
                                            onClick={() => openExternal(websiteUrl)}
                                            style={{ background: 'transparent', border: '2px solid #f5d000', color: '#f5d000', padding: '10px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', fontFamily: 'monospace' }}
                                        >
                                            OPEN_LIVE_SITE <ExternalLink size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </WindowFrame>
            )}

            {windowStates.mission?.isOpen && (
                <WindowFrame
                    {...mobileWindowProps}
                    winState={windowStates.mission}
                    title="MISSION_CONSOLE // KRACKED_OS"
                    AppIcon={APP_REGISTRY.find((app) => app.type === 'mission')?.icon || Bot}
                    onClose={() => closeApp('mission')}
                    onMinimize={() => minimizeApp('mission')}
                    onMaximize={() => maximizeApp('mission')}
                    onFocus={() => focusApp('mission')}
                    onMove={(x, y) => moveApp('mission', x, y)}
                    onResize={(w, h) => resizeApp('mission', w, h)}
                >
                    <div style={{ padding: '14px', color: '#fff', overflowY: 'auto', height: '100%' }}>
                        <Suspense fallback={<WindowModuleLoader label="MISSION_CONSOLE" />}>
                            <KrackedMissionConsole
                                currentUser={currentUser}
                                userRank={userRank}
                                userVibes={userVibes}
                                completedLessonsCount={completedLessons.length}
                                totalLessons={lessons.length}
                                focusedWindowLabel={focusedWindowLabel}
                                openWindowsCount={openWindowsCount}
                                missionEvents={missionEvents}
                                latestMissionEvent={latestMissionEvent}
                            />
                        </Suspense>
                    </div>
                </WindowFrame>
            )}
            {/* Wallpaper Gallery Window */}
            {windowStates.wallpaper?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.wallpaper} title="WALLPAPER_GALLERY // PERSONALIZE" AppIcon={Sparkles} onClose={() => closeApp('wallpaper')} onMinimize={() => minimizeApp('wallpaper')} onMaximize={() => maximizeApp('wallpaper')} onFocus={() => focusApp('wallpaper')} onMove={(x, y) => moveApp('wallpaper', x, y)} onResize={(w, h) => resizeApp('wallpaper', w, h)}>
                    <div style={{ padding: '24px', color: '#fff', overflowY: 'auto', height: '100%' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#f5d000', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '8px' }}>CURRENT_WALLPAPER</div>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>
                                {WALLPAPER_GALLERY.find(w => w.id === currentWallpaper)?.name || 'Unknown'}
                            </div>
                        </div>

                        <div className="wallpaper-grid">
                            {WALLPAPER_GALLERY.map((wallpaper, index) => {
                                const isSelected = currentWallpaper === wallpaper.id;
                                const wallpaperStyle = getWallpaperStyle(wallpaper);

                                return (
                                    <div
                                        key={wallpaper.id}
                                        className={`wallpaper-thumb ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSetWallpaper(wallpaper.id)}
                                        style={{
                                            ...wallpaperStyle,
                                            position: 'relative'
                                        }}
                                    >
                                        {wallpaper.type === 'time-based' && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '6px',
                                                right: '6px',
                                                background: 'rgba(0,0,0,0.6)',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                color: '#fff',
                                                fontFamily: 'monospace'
                                            }}>
                                                {wallpaper.times}
                                            </div>
                                        )}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: '8px',
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                                                {wallpaper.name}
                                            </div>
                                            {wallpaper.type === 'animated-gradient' && (
                                                <div style={{ fontSize: '8px', color: '#fbbf24', marginTop: '2px' }}>ANIMATED</div>
                                            )}
                                            {wallpaper.type === 'time-based' && (
                                                <div style={{ fontSize: '8px', color: '#86efac', marginTop: '2px' }}>AUTO</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </WindowFrame>
            )}

            {/* KDAcademy Window */}
            {windowStates.kdacademy?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.kdacademy} title="KDACADEMY // LEARN + BUILD" AppIcon={Globe} onClose={() => closeApp('kdacademy')} onMinimize={() => minimizeApp('kdacademy')} onMaximize={() => maximizeApp('kdacademy')} onFocus={() => focusApp('kdacademy')} onMove={(x, y) => moveApp('kdacademy', x, y)} onResize={(w, h) => resizeApp('kdacademy', w, h)}>
                    <Suspense fallback={<WindowModuleLoader label="KDACADEMY" />}>
                        <KrackedKdAcademy
                            activeTab={kdacademyTab}
                            onTabChange={setKdacademyTab}
                            activeLesson={activeLesson}
                            frontendLessons={academyPaths.frontend}
                            backendLessons={academyPaths.backend}
                            onOpenLesson={(lessonId) => openLessonInKdacademy(lessonId, 'workshop')}
                            onOpenLiveSite={() => openExternal(kdacademyUrl)}
                            userRank={userRank}
                            userVibes={userVibes}
                            completedLessonsCount={completedLessons.length}
                            builderName={profileForm.username}
                            workshopPane={(
                                <Suspense fallback={<WindowModuleLoader label="IJAM_TERMINAL" />}>
                                    <KrackedIjamTerminal
                                        terminalLog={terminalLog}
                                        terminalBusy={terminalBusy}
                                        terminalInput={terminalInput}
                                        setTerminalInput={setTerminalInput}
                                        executeTerminalCommand={executeTerminalCommand}
                                        terminalOutputRef={terminalOutputRef}
                                        userRank={userRank}
                                        userVibes={userVibes}
                                        chatPrefill={ijamChatPrefill}
                                        onChatPrefill={setIjamChatPrefill}
                                        onChatPrefillConsumed={() => setIjamChatPrefill('')}
                                    />
                                </Suspense>
                            )}
                        />
                    </Suspense>
                </WindowFrame>
            )}

            {windowStates.settings?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.settings} title="SYSTEM_SETTINGS // CONFIG" AppIcon={Settings} onClose={() => closeApp('settings')} onMinimize={() => minimizeApp('settings')} onMaximize={() => maximizeApp('settings')} onFocus={() => focusApp('settings')} onMove={(x, y) => moveApp('settings', x, y)} onResize={(w, h) => resizeApp('settings', w, h)}>
                    <div style={{ padding: '24px', color: '#fff', overflowY: 'auto', height: '100%' }}>
                        <form onSubmit={handleSaveSettings} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Profile Visual Preview */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid #1e293b' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#334155', border: '2px solid #f5d000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#f5d000' }}>
                                    {(profileForm.username || 'A')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '14px', color: '#f5d000', margin: 0, fontWeight: 900, fontFamily: 'monospace' }}>[ USER_PROFILE ]</h3>
                                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>Configure your identity across KRACKED_OS</p>
                                </div>
                            </div>

                            <div>

                                <h3 style={{ fontSize: '14px', color: '#f5d000', marginBottom: '16px', fontWeight: 900, fontFamily: 'monospace' }}>[ USER_PROFILE ]</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>FULL_NAME</label>
                                        <input
                                            value={profileForm.username}
                                            onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>DISTRICT</label>
                                        <input
                                            value={profileForm.district}
                                            onChange={e => setProfileForm(p => ({ ...p, district: e.target.value }))}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Project Section */}
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#f5d000', marginBottom: '16px', fontWeight: 900, fontFamily: 'monospace' }}>[ PROJECT_CORE ]</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>IDEA_TITLE</label>
                                        <input
                                            value={profileForm.ideaTitle}
                                            onChange={e => setProfileForm(p => ({ ...p, ideaTitle: e.target.value }))}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>PROBLEM_STATEMENT</label>
                                        <textarea
                                            value={profileForm.problemStatement}
                                            onChange={e => setProfileForm(p => ({ ...p, problemStatement: e.target.value }))}
                                            rows={2}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>ABOUT_YOURSELF</label>
                                            <textarea
                                                value={profileForm.aboutYourself}
                                                onChange={e => setProfileForm(p => ({ ...p, aboutYourself: e.target.value }))}
                                                rows={2}
                                                style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>PROGRAM_GOAL</label>
                                            <textarea
                                                value={profileForm.programGoal}
                                                onChange={e => setProfileForm(p => ({ ...p, programGoal: e.target.value }))}
                                                rows={2}
                                                style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', resize: 'vertical' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#f5d000', marginBottom: '16px', fontWeight: 900, fontFamily: 'monospace' }}>[ SOCIAL_CONTACT ]</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : '1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>WHATSAPP_NO</label>
                                        <input
                                            value={profileForm.whatsappContact}
                                            onChange={e => setProfileForm(p => ({ ...p, whatsappContact: e.target.value }))}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>DISCORD_TAG</label>
                                        <input
                                            value={profileForm.discordTag}
                                            onChange={e => setProfileForm(p => ({ ...p, discordTag: e.target.value }))}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 900 }}>THREADS_HANDLE</label>
                                        <input
                                            value={profileForm.threadsHandle}
                                            onChange={e => setProfileForm(p => ({ ...p, threadsHandle: e.target.value }))}
                                            style={{ width: '100%', background: '#0b1220', border: '2px solid #334155', padding: '12px', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingSettings}
                                style={{
                                    background: '#f5d000',
                                    color: '#0b1220',
                                    padding: '16px',
                                    fontWeight: 950,
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginTop: '10px',
                                    boxShadow: '4px 4px 0 #0b1220',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {isSavingSettings ? 'SYNCING...' : 'SAVE CONFIGURATION'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Clear local OS session?')) {
                                        localStorage.removeItem('vibe_os_booted');
                                        window.location.reload();
                                    }
                                }}
                                style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b', padding: '10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}
                            >
                                [ X ] FACTORY_RESET_OS
                            </button>
                        </form>
                    </div>
                </WindowFrame>
            )}

            {/* 6. Arcade Window */}
            {windowStates.arcade?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.arcade} title="BUILDER_ARCADE // STUDIO" AppIcon={Gamepad2} onClose={() => closeApp('arcade')} onMinimize={() => minimizeApp('arcade')} onMaximize={() => maximizeApp('arcade')} onFocus={() => focusApp('arcade')} onMove={(x, y) => moveApp('arcade', x, y)} onResize={(w, h) => resizeApp('arcade', w, h)}>
                    <div style={{ flex: 1, minHeight: 0, background: '#f3f4f6', overflowY: 'auto' }}>
                        <Suspense fallback={<WindowModuleLoader label="BUILDER_ARCADE" background="#f3f4f6" />}>
                            <BuilderStudioLocal />
                        </Suspense>
                    </div>
                </WindowFrame>
            )}

            {/* 7. Simulator Window */}
            {windowStates.simulator?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.simulator} title="VIBE_SIMULATOR // ARCHITECTURE" AppIcon={Activity} onClose={() => closeApp('simulator')} onMinimize={() => minimizeApp('simulator')} onMaximize={() => maximizeApp('simulator')} onFocus={() => focusApp('simulator')} onMove={(x, y) => moveApp('simulator', x, y)} onResize={(w, h) => resizeApp('simulator', w, h)}>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        <Suspense fallback={<WindowModuleLoader label="VIBE_SIMULATOR" />}>
                            <VibeSimulator />
                        </Suspense>
                    </div>
                </WindowFrame>
            )}

            {/* 8. Mind Mapper Window */}
            {windowStates.mind_mapper?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.mind_mapper} title="MIND_MAPPER // IDEATION" AppIcon={Waypoints} onClose={() => closeApp('mind_mapper')} onMinimize={() => minimizeApp('mind_mapper')} onMaximize={() => maximizeApp('mind_mapper')} onFocus={() => focusApp('mind_mapper')} onMove={(x, y) => moveApp('mind_mapper', x, y)} onResize={(w, h) => resizeApp('mind_mapper', w, h)}>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        <Suspense fallback={<WindowModuleLoader label="MIND_MAPPER" />}>
                            <MindMapperApp />
                        </Suspense>
                    </div>
                </WindowFrame>
            )}

            {/* 9. Prompt Forge Window */}
            {windowStates.prompt_forge?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.prompt_forge} title="PROMPT_FORGE // MASTER PROMPT" AppIcon={Wand2} onClose={() => closeApp('prompt_forge')} onMinimize={() => minimizeApp('prompt_forge')} onMaximize={() => maximizeApp('prompt_forge')} onFocus={() => focusApp('prompt_forge')} onMove={(x, y) => moveApp('prompt_forge', x, y)} onResize={(w, h) => resizeApp('prompt_forge', w, h)}>
                    <div style={{ flex: 1, minHeight: 0, background: '#0b1220', overflow: 'hidden' }}>
                        <Suspense fallback={<WindowModuleLoader label="PROMPT_FORGE" />}>
                            <PromptForgeApp />
                        </Suspense>
                    </div>
                </WindowFrame>
            )}

            {/* 4. Recycle Bin Window */}
            {windowStates.trash?.isOpen && (
                <WindowFrame {...mobileWindowProps} winState={windowStates.trash} title="RECYCLE_BIN // DELETED CONTENT" AppIcon={Trash2} onClose={() => closeApp('trash')} onMinimize={() => minimizeApp('trash')} onMaximize={() => maximizeApp('trash')} onFocus={() => focusApp('trash')} onMove={(x, y) => moveApp('trash', x, y)} onResize={(w, h) => resizeApp('trash', w, h)}>
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                        <Trash2 size={48} style={{ marginBottom: '20px', opacity: 0.3 }} />
                        <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '14px' }}>BOX IS CURRENTLY EMPTY</div>
                        <div style={{ fontSize: '11px', marginTop: '10px' }}>[ No deleted vibes or failed projects found ]</div>
                    </div>
                </WindowFrame>
            )}

            {/* App Drawer Overlay (v3) */}
            {isStartMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div onClick={() => setIsStartMenuOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 9998 }} />
                    <div style={{
                        position: 'absolute',
                        top: '28px',
                        left: '16px',
                        width: '400px',
                        maxWidth: 'calc(100vw - 32px)',
                        maxHeight: 'calc(100vh - 200px)',
                        background: 'rgba(7,11,20,0.96)',
                        backdropFilter: 'blur(28px) saturate(1.8)',
                        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
                        border: '1px solid rgba(245,208,0,0.25)',
                        borderRadius: '16px',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,208,0,0.08)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: 'monospace',
                        color: '#fff',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: '#f5d000', letterSpacing: '0.06em' }}>KRACKED_OS v3.0</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{currentUser?.name || 'Administrator'} · Local Session</div>
                            </div>
                            <button
                                aria-label="Power off"
                                onClick={() => { if (window.confirm('Power off KRACKED_OS session?')) { localStorage.removeItem('vibe_os_booted'); window.location.reload(); } }}
                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                            >
                                <Power size={15} />
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                                <input
                                    type="text"
                                    placeholder="Search apps..."
                                    value={startMenuSearch}
                                    onChange={(e) => setStartMenuSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* App Grid */}
                        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', fontWeight: 900, letterSpacing: '0.1em' }}>ALL APPS</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {APP_REGISTRY.filter(app => !startMenuSearch || app.label.toLowerCase().includes(startMenuSearch.toLowerCase())).map(app => (
                                    <button key={app.type}
                                        onClick={() => { openApp(app.type); setIsStartMenuOpen(false); }}
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,208,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(245,208,0,0.3)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                                    >
                                        <div style={{ width: '38px', height: '38px', background: '#0b1220', border: `1.5px solid ${app.color}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <app.icon size={20} color={app.color} />
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.2 }}>{app.label}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => { window.open('https://antigravity.id', '_blank'); setIsStartMenuOpen(false); }}
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,208,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(245,208,0,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                                >
                                    <div style={{ width: '38px', height: '38px', background: '#0b1220', border: '1.5px solid #a78bfa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BookOpen size={20} color="#a78bfa" />
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.2 }}>DOCS</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}


            {isTouchIjamMode && (
                <div
                    style={{
                        position: 'absolute',
                        left: 10,
                        right: 10,
                        bottom: 10,
                        zIndex: 1200,
                        borderRadius: 18,
                        border: '1px solid rgba(255,255,255,0.24)',
                        background: 'rgba(255,255,255,0.22)',
                        backdropFilter: 'blur(22px) saturate(1.15)',
                        WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
                        padding: '8px 10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        gap: 8
                    }}
                >
                    {[
                        { id: 'files', label: 'Files', icon: Folder, onTap: () => openApp('files') },
                        { id: 'kdacademy', label: 'Academy', icon: Globe, onTap: () => { setKdacademyTab('overview'); openApp('kdacademy'); } },
                        { id: 'home', label: 'Home', icon: Home, onTap: () => closeAllApps() },
                        { id: 'progress', label: 'Stats', icon: User, onTap: () => openApp('progress') },
                        { id: 'settings', label: 'Settings', icon: Settings, onTap: () => openApp('settings') }
                    ].map((item) => {
                        const active = item.id === activeWindow || (item.id === 'home' && !activeWindow);
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    triggerHaptic();
                                    item.onTap();
                                }}
                                style={{
                                    borderRadius: 12,
                                    border: active ? '1px solid rgba(245,208,0,0.55)' : '1px solid rgba(148,163,184,0.4)',
                                    background: active ? 'rgba(245,208,0,0.18)' : 'rgba(15,23,42,0.42)',
                                    color: '#f8fafc',
                                    minHeight: 46,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3
                                }}
                            >
                                <Icon size={14} />
                                <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1 }}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* macOS-style Menu Bar — top */}
            {isMacMode && (
                <div
                    data-mac-menu-root
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '28px',
                        background: 'rgba(7,11,20,0.92)',
                        borderBottom: '1px solid rgba(245,208,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 10px',
                        zIndex: 500,
                        fontFamily: 'monospace',
                        backdropFilter: `blur(20px) saturate(1.3) brightness(${Math.max(0.7, uiBrightness / 100)})`,
                        WebkitBackdropFilter: `blur(20px) saturate(1.3) brightness(${Math.max(0.7, uiBrightness / 100)})`
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', minWidth: 0 }}>
                        {macMenus.map((menu) => (
                            <div key={menu.id} style={{ position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setActiveMacMenu((prev) => prev === menu.id ? null : menu.id)}
                                    style={{
                                        height: '22px',
                                        padding: '0 8px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: activeMacMenu === menu.id ? 'rgba(255,255,255,0.14)' : 'transparent',
                                        color: menu.accent || '#f8fafc',
                                        fontSize: '11px',
                                        fontWeight: menu.bold || menu.accent ? 800 : 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {menu.label}
                                </button>
                                {activeMacMenu === menu.id && (
                                    <div style={{ position: 'absolute', top: '26px', left: 0, minWidth: '220px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,14,25,0.96)', boxShadow: '0 24px 48px rgba(0,0,0,0.45)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {menu.items.map((item, index) => item.separator ? (
                                            <div key={`${menu.id}-sep-${index}`} style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 2px' }} />
                                        ) : (
                                            <button
                                                key={`${menu.id}-${item.label}`}
                                                type="button"
                                                onClick={() => {
                                                    item.action?.();
                                                    setActiveMacMenu(null);
                                                }}
                                                style={{ border: 'none', background: 'transparent', color: '#e2e8f0', textAlign: 'left', fontSize: '11px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,208,0,0.12)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 800, color: focusedWindow ? (APP_REGISTRY.find((a) => a.type === focusedWindow)?.color ?? '#cbd5e1') : 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                        {currentDesktopAppLabel}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ position: 'relative' }}>
                            <button type="button" onClick={() => { setShowBatteryPopup((prev) => !prev); setShowControlCenter(false); setActiveMacMenu(null); }} style={{ height: '22px', padding: '0 8px', borderRadius: '8px', border: 'none', background: showBatteryPopup ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700 }}>{batteryLevel}%</span>
                                <div style={{ width: '24px', height: '11px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.5)', padding: '1px', position: 'relative' }}>
                                    <div style={{ width: `${batteryLevel}%`, height: '100%', borderRadius: '2px', background: batteryLevel > 50 ? '#22c55e' : batteryLevel > 20 ? '#f59e0b' : '#ef4444' }} />
                                    <div style={{ position: 'absolute', right: '-3px', top: '3px', width: '2px', height: '4px', borderRadius: '0 2px 2px 0', background: 'rgba(255,255,255,0.6)' }} />
                                </div>
                            </button>
                            {showBatteryPopup && (
                                <div style={{ position: 'absolute', top: '26px', right: 0, width: '220px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,14,25,0.96)', boxShadow: '0 24px 48px rgba(0,0,0,0.45)', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}><span>Power</span><span>{batteryLevel}%</span></div>
                                    <div style={{ marginTop: '10px', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}><div style={{ width: `${batteryLevel}%`, height: '100%', background: batteryLevel > 50 ? '#22c55e' : batteryLevel > 20 ? '#f59e0b' : '#ef4444' }} /></div>
                                    <div style={{ marginTop: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Power Source: Local Session</div>
                                    <button type="button" onClick={() => { openApp('settings'); setShowBatteryPopup(false); }} style={{ marginTop: '10px', width: '100%', border: 'none', borderRadius: '8px', padding: '8px 10px', background: 'rgba(245,208,0,0.14)', color: '#f5d000', fontSize: '11px', cursor: 'pointer' }}>Power Preferences</button>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => setWifiEnabled((prev) => !prev)} style={{ height: '22px', width: '24px', borderRadius: '8px', border: 'none', background: wifiEnabled ? 'rgba(96,165,250,0.18)' : 'transparent', color: wifiEnabled ? '#93c5fd' : 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Wifi size={14} /></button>
                        <button type="button" onClick={() => { setIsStartMenuOpen(true); setShowBatteryPopup(false); setShowControlCenter(false); setActiveMacMenu(null); }} style={{ height: '22px', width: '24px', borderRadius: '8px', border: 'none', background: isStartMenuOpen ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Search size={14} /></button>
                        <div style={{ position: 'relative' }}>
                            <button type="button" onClick={() => { setShowControlCenter((prev) => !prev); setShowBatteryPopup(false); setActiveMacMenu(null); }} style={{ height: '22px', width: '24px', borderRadius: '8px', border: 'none', background: showControlCenter ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><SlidersHorizontal size={14} /></button>
                            {showControlCenter && (
                                <div style={{ position: 'absolute', top: '26px', right: 0, width: '292px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,14,25,0.97)', boxShadow: '0 24px 48px rgba(0,0,0,0.45)', padding: '12px', display: 'grid', gap: '10px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                                        {[{ label: 'Wi-Fi', icon: Wifi, active: wifiEnabled, onClick: () => setWifiEnabled((prev) => !prev) }, { label: 'Bluetooth', icon: Bluetooth, active: bluetoothEnabled, onClick: () => setBluetoothEnabled((prev) => !prev) }, { label: 'AirDrop', icon: Sparkles, active: airdropEnabled, onClick: () => setAirdropEnabled((prev) => !prev) }, { label: 'Focus', icon: MoonStar, active: focusModeEnabled, onClick: () => setFocusModeEnabled((prev) => !prev) }].map((item) => {
                                            const Icon = item.icon;
                                            return <button key={item.label} type="button" onClick={item.onClick} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px', background: item.active ? 'rgba(96,165,250,0.18)' : 'rgba(255,255,255,0.04)', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}><Icon size={16} /><span style={{ fontSize: '11px', fontWeight: 700 }}>{item.label}</span></button>;
                                        })}
                                    </div>
                                    <div style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.04)', padding: '10px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}><SunMedium size={16} /><input type="range" min="40" max="100" step="1" value={uiBrightness} onChange={(e) => setUiBrightness(Number(e.target.value))} style={{ flex: 1 }} /><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{uiBrightness}%</span></div></div>
                                    <div style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.04)', padding: '10px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}><Volume2 size={16} /><input type="range" min="0" max="100" step="1" value={uiVolume} onChange={(e) => setUiVolume(Number(e.target.value))} style={{ flex: 1 }} /><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{uiVolume}%</span></div></div>
                                    <button type="button" onClick={() => { openApp('settings'); setShowControlCenter(false); }} style={{ border: 'none', borderRadius: '12px', padding: '10px 12px', background: 'rgba(245,208,0,0.14)', color: '#f5d000', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>Open Control Preferences</button>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', paddingLeft: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{systemDate}</span>
                            <span style={{ fontSize: '11px', fontWeight: 800 }}>{systemTime}</span>
                        </div>
                    </div>
                </div>
            )}

            {false && isMacMode && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '28px', background: 'rgba(7,11,20,0.96)', borderBottom: '1px solid rgba(245,208,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', zIndex: 499, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                    {/* Left: ⚡ IJAM_OS logo + macOS menu items */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
                            style={{ background: isStartMenuOpen ? 'rgba(245,208,0,0.15)' : 'transparent', border: 'none', borderRadius: '4px', color: '#f5d000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 900, padding: '2px 8px', transition: 'background 0.15s', letterSpacing: '0.04em' }}
                        >
                            ⚡ KRACKED_OS
                        </button>
                        {['File', 'View', 'Window', 'Help'].map(item => (
                            <button key={item}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >{item}</button>
                        ))}
                    </div>

                    {/* Center: focused app name */}
                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: focusedWindow ? (APP_REGISTRY.find(a => a.type === focusedWindow)?.color ?? 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {focusedWindow ? APP_REGISTRY.find(a => a.type === focusedWindow)?.label : 'KRACKED_OS v3.0'}
                    </div>

                    {/* Right: weather + clock */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                            {isWeatherLoading ? '●●●' : weather ? `${weather.temperature}°C · ${weather.description}` : 'SELANGOR'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em' }}>
                                {systemTime}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.02em' }}>
                                {systemDate}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );

};

export default IjamOSWorkspace;










