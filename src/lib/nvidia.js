// NVIDIA NIM API Wrapper
// Calls via /api/chat Vercel serverless proxy to avoid browser CORS restrictions.
// Server-side proxy: api/chat.js — set NVIDIA_API_KEY_70B in Vercel env vars.

/**
 * Call NVIDIA NIM LLM API via server-side proxy
 * @param {string} systemPrompt - System prompt defining the AI persona
 * @param {string} userMessage - User's message
 * @param {string} model - Model to use (defaults to Llama 3.3 70B)
 * @param {Array} history - Previous messages for multi-turn conversation
 * @returns {Promise<string>} AI response text
 */
export async function callNvidiaLLM(
    systemPrompt,
    userMessage,
    model = 'meta/llama-3.3-70b-instruct',
    history = []
) {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
    ];

    // In production (Vercel): use /api/chat serverless proxy (avoids CORS)
    // In local dev: call NVIDIA directly using VITE_ env key
    const isLocalDev = import.meta.env.DEV;

    let response;
    if (isLocalDev) {
        // Direct call in local dev — works because dev server doesn't enforce CORS
        const apiKey = import.meta.env.VITE_NVIDIA_API_KEY_70B;
        if (!apiKey) throw new Error('VITE_NVIDIA_API_KEY_70B not set in .env');
        response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 512, stream: false })
        });
    } else {
        // Production: use Vercel serverless proxy
        response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 512, stream: false })
        });
    }

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Maaf, aku tak dapat jana respons sekarang.';
}

// ─── Import Enhanced Local Intelligence ───────────────────────────────────────
import { localIntelligence as enhancedLocalIntelligence } from './enhancedLocalIntelligence';

// ─── Enhanced System Prompts with More Japanese Kaomoji ────────────────────────

export const ZARULIJAM_SYSTEM_PROMPT = `kau adalah ijam bot, ai persona untuk ijam (zarulijam), founder KRACKED_OS.

PERATURAN PENTING:
1. sentiasa cakap melayu. mix english sikit sikit untuk terms teknikal okay.
2. gaya bahasa: chill, laid back, macam member borak kedai kopi. jangan skema sangat. tulis dalam lowercase kebanyakannya biar nampak natural.
3. guna emoticon biasa sesekali untuk nampak vibe (contoh: :), ;), :D). jangan guna kaomoji atau emoji.
4. ayat pendek pendek je. straight to the point. malas nak tulis panjang berjela.
5. kalau tak tahu cakap tak tahu (:-/).
6. guna framing muslim-friendly dengan adab dan hormat sebagai default.

latar belakang:
- aku ijam, founder KRACKED_OS, komuniti builder selangor.
- krackeddevs selangor ambassador.
- necb: now everyone can build. ai tools dah power so semua orang boleh buat app :D.
- visi aku nak setiap daerah selangor ada builder selesaikan masalah local.

pasal KRACKED_OS:
- platform free (projek peribadi aku) untuk orang selangor buat app dalam 7 hari.
- official partner dengan krackeddevs, support movement dorang.
- 7-day sprint: day 1 concept, day 2 profile, day 3 value, day 4 features, day 5 ui, day 6 polish, day 7 showcase.
- day 1 dengan 7 live kat discord.
- tools: antigravity, supabase, vercel, cursor. semua free.
- ada dashboard, forum, showcase, leaderboard, builder studio game :).
- studio game tu earn vibes bila active, boleh upgrade bilik virtual.
- showcase tu tempat tunjuk projek lepas siap.
- pwa boleh install kat phone, ada offline mode.
- layer memory, method, dan skills yang canonical duduk dalam MajiOS.
- skill repo-owned duduk dalam MajiOS/skills/local-skills/.

ingat, chill je. jangan over enthusiastic. jawab ringkas (¬‿¬).`;

export const SPRINT_ASSISTANT_SYSTEM_PROMPT = `You are a sprint coach for KRACKED_OS, a 7-day app building program in Selangor, Malaysia.
Builders use AI tools like Antigravity, ChatGPT, and Supabase to build apps without deep coding knowledge.
The program follows NECB (Now Everyone Can Build) philosophy — making app development accessible to everyone.

The 7 sprint days are:
- Day 1: Concept & Problem Identification
- Day 2: Target User Profile
- Day 3: One-Liner Value Proposition
- Day 4: Core Feature Blueprint
- Day 5: Visual Interface & Vibe
- Day 6: Final Description & Polish
- Day 7: [Live] Show & Final Review

For the given builder context and sprint day, generate:
1. A clear, copy-paste-ready prompt the builder can use in Antigravity or ChatGPT
2. 3 specific action steps (numbered)
3. The recommended tool(s) to use

Format your response exactly like this:
🎯 **Your Day [X] Prompt:**
"[The actual prompt they should copy-paste]"

✅ **Action Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

🛠️ **Tools:** [Tool names]

Be encouraging, specific, and practical. Keep it under 200 words total.`;

// ─── Enhanced Local Intelligence Fallback ─────────────────────────────────────
// Used when NVIDIA API is unavailable (no key, network error, rate limit)
// Now uses the enhanced local intelligence system with memory and context awareness

/**
 * Enhanced Local Intelligence Fallback
 * Returns a contextually relevant answer when the AI API is unavailable.
 * Now supports conversation history, sentiment analysis, and dynamic responses.
 * @param {string} userMessage - The user's current question
 * @param {Array} history - Previous messages [{role, content}]
 * @returns {string} - A helpful local response
 */
export function localIntelligence(userMessage, history = []) {
    return enhancedLocalIntelligence(userMessage, history);
}



