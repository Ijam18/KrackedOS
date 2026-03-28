// Enhanced Local Intelligence System
// Advanced conversational AI with memory, context awareness, and dynamic responses

/**
 * FAQ Categories for Smart Fallback
 */
const FAQ_CATEGORIES = {
    SETUP: [
        "macam mana install node.js?",
        "nak setup antigravity?",
        "api key kat mana?",
        "error npm install?"
    ],
    DEPLOYMENT: [
        "deploy ke vercel?",
        "github repo setup?",
        "custom domain?",
        "analytics setup?"
    ],
    DATABASE: [
        "supabase setup?",
        "sql query error?",
        "connect database?",
        "rls apa tu?"
    ],
    TOOLS: [
        "antigravity vs cursor?",
        "model mana bagus?",
        "chatgpt macam mana?",
        "groq vs nvidia?"
    ],
    TROUBLESHOOTING: [
        "error deployment?",
        "build failed?",
        "database tak connect?",
        "api key tak jalan?"
    ],
    PROGRAM: [
        "macam mana nak join?",
        "apa itu sprint 7 hari?",
        "tools apa perlu?",
        "betul ke percuma?"
    ]
};

/**
 * Conversation State Manager
 * Tracks user context, preferences, and conversation history
 */
class ConversationState {
    constructor() {
        this.reset();
    }

    reset() {
        this.userProfile = {
            name: null,
            interests: [],
            progress: 'beginner', // beginner, intermediate, advanced
            goals: [],
            lastTopic: null,
            sentiment: 'neutral'
        };

        this.conversationHistory = [];
        this.topicMemory = new Map(); // topic -> last discussed
        this.userPreferences = new Map();
        this.conversationContext = {
            currentTopic: null,
            topicDepth: 0,
            engagementLevel: 0,
            lastActive: Date.now()
        };
    }

    updateProfile(userInput, detectedTopics) {
        // Extract name if mentioned
        const nameMatch = userInput.match(/\b(?:aku|saya|nama saya)\s+(?:ialah\s+)?(\w+)/i);
        if (nameMatch && nameMatch[1]) {
            this.userProfile.name = nameMatch[1];
        }

        // Update interests based on topics
        detectedTopics.forEach(topic => {
            if (!this.userProfile.interests.includes(topic)) {
                this.userProfile.interests.push(topic);
            }
        });

        // Update last topic
        if (detectedTopics.length > 0) {
            this.userProfile.lastTopic = detectedTopics[0];
        }

        this.conversationContext.lastActive = Date.now();
    }

    updateTopicMemory(topic) {
        this.topicMemory.set(topic, Date.now());
        this.conversationContext.currentTopic = topic;
        this.conversationContext.topicDepth++;
    }

    getRelevantContext() {
        const now = Date.now();
        const recentHistory = this.conversationHistory.slice(-6);

        return {
            recentHistory,
            userProfile: this.userProfile,
            currentTopic: this.conversationContext.currentTopic,
            topicDepth: this.conversationContext.topicDepth,
            userInterests: this.userProfile.interests,
            lastTopic: this.userProfile.lastTopic
        };
    }
}

/**
 * Sentiment and Intent Analyzer
 * Analyzes user messages for emotion and intent
 */
class SentimentAnalyzer {
    constructor() {
        this.positiveWords = [
            'best', 'great', 'awesome', 'amazing', 'love', 'like', 'cool', 'nice', 'perfect',
            'excited', 'happy', 'good', 'wonderful', 'fantastic', 'brilliant', 'super', 'powerful'
        ];

        this.negativeWords = [
            'bad', 'terrible', 'awful', 'hate', 'frustrated', 'angry', 'annoyed', 'confused',
            'stuck', 'can\'t', 'don\'t understand', 'difficult', 'hard', 'problem', 'issue'
        ];

        this.questionWords = [
            'how', 'what', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would',
            'should', 'is', 'are', 'do', 'does', 'did', 'will', 'won\'t', 'can\'t', 'don\'t'
        ];

        this.informationalWords = [
            'explain', 'tell', 'show', 'teach', 'learn', 'understand', 'know', 'info', 'details'
        ];

        this.conversationalWords = [
            'chat', 'talk', 'discuss', 'converse', 'story', 'experience', 'share'
        ];
    }

    analyze(message) {
        const lowerMsg = message.toLowerCase();
        let sentimentScore = 0;
        let intentScore = { informational: 0, conversational: 0, help: 0 };

        // Sentiment analysis
        this.positiveWords.forEach(word => {
            if (lowerMsg.includes(word)) sentimentScore += 1;
        });

        this.negativeWords.forEach(word => {
            if (lowerMsg.includes(word)) sentimentScore -= 1;
        });

        // Intent analysis
        this.questionWords.forEach(word => {
            if (lowerMsg.includes(word)) intentScore.informational += 1;
        });

        this.informationalWords.forEach(word => {
            if (lowerMsg.includes(word)) intentScore.informational += 2;
        });

        this.conversationalWords.forEach(word => {
            if (lowerMsg.includes(word)) intentScore.conversational += 2;
        });

        // Help intent detection
        if (lowerMsg.includes('help') || lowerMsg.includes('tolong') || lowerMsg.includes('bantuan')) {
            intentScore.help += 3;
        }

        const maxIntent = Math.max(intentScore.informational, intentScore.conversational, intentScore.help);
        let intent = 'informational';
        if (intentScore.conversational === maxIntent) intent = 'conversational';
        if (intentScore.help === maxIntent) intent = 'help';

        let sentiment = 'neutral';
        if (sentimentScore > 1) sentiment = 'positive';
        if (sentimentScore < -1) sentiment = 'negative';

        return { sentiment, intent, confidence: Math.abs(sentimentScore) + maxIntent };
    }
}

/**
 * Response Generator
 * Creates dynamic, context-aware responses
 */
class ResponseGenerator {
    constructor() {
        this.responseTemplates = {
            // Greeting responses
            greeting: [
                "SELAMAT MALAM & GREETINGS! Hai bro! (o^▽^o) Ada apa yang boleh aku bantu hari ni?",
                "SELAMAT MALAM & GREETINGS! Apa khabar? (b ᵔ▽ᵔ)b Ada soalan atau nak sembang pasal project?",
                "SELAMAT MALAM & GREETINGS! Helo! (☆▽☆) Nak tanya pasal KRACKED_OS ke atau ada idea project baru?"
            ],

            // Help responses
            help: [
                "Sure thing bro! (¬‿¬) Cerita sikit apa yang kau nak bantu, nanti aku cari solution terbaik.",
                "Tolong apa ni? (ง •̀_•́)ง Bagi detail sikit, nanti aku guide step by step.",
                "No problem! (✿◠‿◠) Apa yang kau stuck? Kita solve sama-sama."
            ],

            // Informational responses
            informational: [
                "Ni dia info yang kau cari bro ( ˙꒳​˙ ).",
                "Aku explain sikit pasal ni (ﾉ^ヮ^)ﾉ*:・ﾟ✧",
                "Ni detailsnya (o^▽^o), kalau tak faham tanya lagi eh."
            ],

            // Encouragement responses
            encouragement: [
                "Power gila idea kau ni! (b ᵔ▽ᵔ)b Keep it up!",
                "Wah best gila! (☆▽☆) Kau dah dekat sangat nak siap ni.",
                "Awekss! (ง •̀_•́)ง Kau memang builder sejati ni!"
            ],

            // Confusion responses
            confusion: [
                "Eh sikit confuse ni (・_・;) Kau boleh explain lagi detail tak?",
                "Aku tak pasti sangat maksud kau (¬‿¬) Boleh kau ulang sikit?",
                "Sikit blur la (o^▽^o) Kau maksudkan macam mana tu?"
            ],

            // Follow-up responses
            followup: [
                "Oh gitu ke? (✿◠‿◠) Nak tahu lagi tak pasal ni?",
                "Best! (b ᵔ▽ᵔ)b Nak explore lagi aspek lain tak?",
                "Gitulah lebih kurang ( ˙꒳​˙ ). Ada apa lagi yang kau nak tanya?"
            ]
        };

        this.conversationalPrompts = [
            "Cerita sikit pasal project kau, apa problem yang kau nak solve?",
            "Kau dah try tools apa sebelum ni? Antigravity ke ChatGPT?",
            "Apa yang buat kau minat nak buat app ni?",
            "Kau target user type apa? Student ke working adult?",
            "Ada deadline tertentu ke kau nak siap?"
        ];
    }

    generateResponse(baseResponse, context, sentiment, intent) {
        let response = baseResponse;

        // Add personalization if we know the user's name
        if (context.userProfile.name) {
            response = `Hai ${context.userProfile.name}! ${response}`;
        }

        // Adjust tone based on sentiment
        if (sentiment === 'positive') {
            response += ` ${this.getRandomEmoticon(['(b ᵔ▽ᵔ)b', '(☆▽☆)', '(ง •̀_•́)ง'])}`;
        } else if (sentiment === 'negative') {
            response += ` Jangan stress bro, kita solve sama-sama (✿◠‿◠)`;
        } else {
            response += ` ${this.getRandomEmoticon(['(o^▽^o)', '(¬‿¬)', '( ˙꒳​˙ )'])}`;
        }

        // Add follow-up question based on intent
        if (intent === 'informational' && context.topicDepth > 1) {
            response += `\n\n${this.getRandomElement(this.responseTemplates.followup)}`;
        }

        return response;
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomEmoticon(exclude = []) {
        const emoticons = ['(o^▽^o)', '(¬‿¬)', '(b ᵔ▽ᵔ)b', '( ˙꒳​˙ )', '(☆▽☆)', '(ง •̀_•́)ง', '(✿◠‿◠)', '(ﾉ^ヮ^)ﾉ*:・ﾟ✧'];
        const available = emoticons.filter(k => !exclude.includes(k));
        return this.getRandomElement(available);
    }
}

/**
 * Enhanced Local Intelligence System
 * Main class that combines all components
 */
export class EnhancedLocalIntelligence {
    constructor() {
        this.conversationState = new ConversationState();
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.responseGenerator = new ResponseGenerator();

        // Extended knowledge base with more conversational responses
        this.LOCAL_KB = [
            {
                keywords: ['join', 'daftar', 'sign up', 'register', 'how to join', 'cara join', 'masuk', 'nak join', 'macam mana nak'],
                answer: `rileks bro, nak join KRACKED_OS ni senang je. kau just klik butang "become a builder" kat header atau sidebar tu, pastu isi sikit details (o^▽^o).\n\nnanti verify email jap then dah boleh start sprint 7 hari. benda ni free gila, necb - now everyone can build.`,
                followUp: `lepas join nanti kau dapat access builder dashboard. boleh track progress, submit log, pastu join live session kat discord krackeddevs (b ᵔ▽ᵔ)b.\n\nsesi live day 1 nanti kita start buat prototype terus.`,
                relatedTopics: ['apa itu 7-day sprint', 'tools apa yang perlu', 'betul ke percuma']
            },
            {
                keywords: ['necb', 'now everyone can build', 'philosophy', 'vision', 'mission', 'falsafah', 'visi'],
                answer: `necb tu faham dia "now everyone can build". dulu orang ingat kena power coding baru boleh buat app, tapi sekarang ai tools macam antigravity dah ada, so semua orang boleh jadi builder (⌐■_■).\n\nyang penting ada idea dengan semangat. tech tu biar ai handle.`,
                followUp: `basically kau tak payah code from scratch. cari problem yang kau nak solve, pastu guna ai untuk execute. visi aku nak tengok builder kat setiap daerah selangor solve local problems guna tech (✿◠‿◠).`,
                relatedTopics: ['macam mana nak join', 'tools apa yang perlu', 'cerita pasal sprint']
            },
            {
                keywords: ['sprint', 'day 1', 'day 2', 'day 3', 'day 4', 'day 5', 'day 6', 'day 7', '7 day', 'seven day', 'program', 'schedule', '7 hari', 'jadual'],
                answer: `7-day sprint KRACKED_OS ni program seminggu aje ( ˙꒳​˙ ).\n\nday 1 concept, day 2 user profile, day 3 value prop, day 4 feature blueprint, day 5 ui vibe, day 6 polish, day 7 showcase live.\n\nsetiap hari kau build sikit-sikit. by day 7 dah ada projek real.`,
                followUp: `day 1 dengan day 7 tu kita buat sesi live kat discord. hari lain kau buat sendiri je ikut guide dalam dashboard. antigravity dengan chatgpt ada tolong (ﾉ^ヮ^)ﾉ*:・ﾟ✧.`,
                relatedTopics: ['tools apa yang perlu', 'macam mana nak join discord', 'apa itu showcase']
            },
            {
                keywords: ['onboarding', 'skill', 'skills', 'learn', 'belajar', 'library', 'vibe coding', 'builder guide', 'skill creator', 'pustaka'],
                answer: `skills canon sekarang duduk dalam MajiOS, tepatnya ` + "`MajiOS/skills/local-skills/`" + `. kat situ ada skill repo-owned untuk workflow macam builder proxy, website config, nilai islamik, community building, dan lain-lain.\n\nkalau nak cari capability yang sesuai, start situ dulu.`,
                followUp: `kalau pattern kerja dah repeat beberapa kali, kita ikut polisi MajiOS: propose dulu skill baru bila context dah cukup, lepas tu baru create bila kau confirm.\n\nuntuk startup dan operating doctrine pula, rujuk ` + "`MajiOS/system/IJAM_UNIFIED.md`" + ` dengan ` + "`MajiOS/index/master-majios.md`" + `.`,
                relatedTopics: ['apa itu vibe coding', 'macam mana guna antigravity', 'apa itu builder guide']
            },
            {
                keywords: ['review growth', 'growth review', 'semak growth', 'check growth'],
                answer: `kalau kau guna ` + "`review growth`" + `, MAJI patut semak growth pada identity, doctrine, workflow maturity, dan runtime alignment.\n\nkalau result dia durable, step seterusnya biasanya ` + "`save`" + ` supaya perubahan tu tak tinggal sebagai sembang je.`,
                followUp: `shortcut dia senang:\n- ` + "`review growth`" + ` untuk semak perkembangan\n- ` + "`save`" + ` untuk preserve perubahan yang patut kekal\n- ` + "`load bmad`" + ` kalau kau nak route kerja dengan lebih structured.`,
                relatedTopics: ['save', 'load bmad', 'skills']
            },
            {
                keywords: ['save', 'autosave', 'auto save', 'simpan', 'simpan session'],
                answer: `dalam runtime chat ni, save paling minimum ialah simpan conversation semasa secara local supaya boleh resume balik.\n\nuntuk semantics penuh MajiOS, ` + "`save`" + ` sepatutnya route perubahan durable ke memory files yang betul.`,
                followUp: `kalau konteks kau memang repo-backed dan bukan sekadar browser chat, ` + "`save`" + ` patut chain sekali hasil ` + "`review growth`" + `, BMAD outcomes, dan session recap.`,
                relatedTopics: ['review growth', 'memory', 'load bmad']
            },
            {
                keywords: ['krackeddevs', 'kracked', 'community', 'discord', 'ambassador', 'komuniti'],
                answer: `krackeddevs tu komuniti builder malaysia yang paling padu sekarang. founder dia aiman. dorang ni movement besar untuk ai builders.\n\naku pun tengah apply nak jadi ambassador selangor. KRACKED_OS ni inisiatif aku sendiri nak support movement dorang ni kat selangor.`,
                followUp: `kalau nak join komuniti dorang, pusing krackeddevs.com. memang style.\n\nsemangat dorang tu yang aku nak bawak ke selangor.`,
                relatedTopics: ['macam mana nak join discord', 'siapa ijam', 'apa itu sprint']
            },
            {
                keywords: ['antigravity', 'ai tool', 'cursor', 'tool', 'tools', 'supabase', 'vercel'],
                answer: `tools yang kita pakai semua standard free tier. antigravity, supabase, cursor, vercel.\n\nantigravity tu ai tool utama. kau describe je apa nak buat, dia codekan :). database pakai supabase, hosting vercel.`,
                followUp: `nak guna antigravity download je kat antigravity.dev. tips dia bagi arahan spesifik. contoh "buat butang merah tulis hantar" lagi okay dari "buat butang" (b ᵔ▽ᵔ)b.`,
                relatedTopics: ['apa itu vibe coding', 'macam mana nak deploy ke vercel', 'apa itu supabase']
            },
            {
                keywords: ['studio', 'game', 'vibe', 'vibes', 'bug squash', 'room', 'shop', 'item', 'level', 'xp', 'bilik', 'kedai'],
                answer: `builder studio tu virtual game room kau. kau earn vibes bila join class, submit log, atau active kat forum. vibes tu mata wang kau (☆▽☆).\n\nguna vibes tu untuk upgrade bilik dari meja buruk sampai jadi server rack. boleh level up jadi legendary builder.`,
                followUp: `level 1 newbie, level 7 legendary. kena rajin aktif la kalau nak naik rank.\n\nmain bug squash pun boleh dapat extra vibes sikit (¬‿¬).`,
                relatedTopics: ['macam mana nak earn lebih vibes', 'apa itu leaderboard', 'macam mana nak level up']
            },
            {
                keywords: ['selangor', 'district', 'daerah', 'kawasan', 'map', 'peta', 'shah alam', 'klang', 'petaling'],
                answer: `KRACKED_OS cover seluruh selangor. shah alam, klang, pj, gombak... semua ada.\n\ncer tengok map kat homepage tu, boleh nampak builder dengan projek ikut daerah masing-masing. kl pun ada.`,
                followUp: `peta tu interactive. kau klik daerah tu, nampak la siapa builder kat situ dengan apa projek dorang. target aku nak setiap daerah ada wakil. kau area mana?`,
                relatedTopics: ['macam mana nak join', 'apa itu showcase', 'macam mana nak submit projek']
            },
            {
                keywords: ['pwa', 'install', 'app', 'download', 'pasang', 'phone', 'mobile', 'homescreen', 'home screen', 'telefon'],
                answer: `KRACKED_OS ni boleh install macam app kat phone. kalau guna chrome android, tekan 3 dot pastu pilih "add to home screen".\n\nkalau iphone safari, tekan button share pastu "add to home screen".`,
                followUp: `kelebihan dia loading laju sebab dia cached. boleh guna offline certain features. icon pun keluar kat home screen macam app betul.`,
                relatedTopics: ['boleh guna offline', 'features mana yang perlu internet', 'macam mana nak update app']
            },
            {
                keywords: ['showcase', 'project', 'projek', 'portfolio', 'demo', 'submit', 'hantar', 'ship log'],
                answer: `showcase tu tempat builder tayang projek. nak submit, pergi kat dashboard cari "ship log station".\n\nisi nama, link, details pastu check in. nanti auto keluar kat showcase public dengan map.`,
                followUp: `letak tajuk yang gempak sikit. link tu make sure boleh bukak. orang lain boleh tengok projek kau so make sure presentable la.`,
                relatedTopics: ['macam mana nak deploy ke vercel', 'apa itu leaderboard', 'macam mana nak join sprint']
            },
            {
                keywords: ['leaderboard', 'ranking', 'top', 'best', 'winner', 'champion', 'kedudukan', 'tangga'],
                answer: `leaderboard tu ranking builder. kita kira based on sprint logs, attendance, forum activity dengan game vibes.\n\nkalau nak naik top rank, kena istiqamah la sikit (ง •̀_•́)ง.`,
                followUp: `cara paling laju naik rank ialah consistency. submit log hari-hari, datang class live, post kat forum. sikit-sikit lama-lama jadi bukit.`,
                relatedTopics: ['macam mana nak earn vibes', 'apa itu studio', 'macam mana nak submit sprint log']
            },
            {
                keywords: ['forum', 'post', 'discuss', 'question', 'soalan', 'help', 'tolong', 'tanya', 'bantuan'],
                answer: `forum tu tempat kau nak tanya soalan atau share progress. boleh mintak tolong member lain kalau stuck.\n\nlogin je pastu post. setiap post kau dapat vibes jugak.`,
                followUp: `kalau tanya soalan bagi detail sikit. error apa, share code atau screenshot. jangan segan tanya, semua tengah belajar.`,
                relatedTopics: ['macam mana nak earn vibes dari forum', 'discord untuk apa', 'macam mana nak join']
            },
            {
                keywords: ['free', 'cost', 'bayar', 'harga', 'price', 'paid', 'percuma', 'kos'],
                answer: `KRACKED_OS ni free je bro. takde bayar-bayar pun. tools yang kita guna pun free plan punya.\n\nsupabase, vercel... semua ada free plan yang power gila. tak payah keluar modal pun boleh ship app.`,
                followUp: `free tier supabase dengan vercel tu dah cukup sangat untuk projek sprint. kalau app kau meletup nanti baru la fikir bayar.`,
                relatedTopics: ['tools apa yang perlu', 'macam mana nak deploy', 'macam mana nak join']
            },
            {
                keywords: ['ijam', 'zarulijam', 'founder', 'who', 'siapa', 'creator', 'pengasas'],
                answer: `aku ijam, founder KRACKED_OS. aku buat ni sebab nak ajar orang memancing, bukan setakat bagi ikan.\n\naku pun tengah pulun nak jadi krackeddevs selangor ambassador. pape roger je kat threads @_zarulijam.`,
                followUp: `aku percaya sesiapa pun boleh buat app kalau tools betul. tak kisah la background apa pun. kalau ada feedback, bagitau je aku.`,
                relatedTopics: ['apa itu necb', 'apa itu krackeddevs', 'macam mana nak contact ijam']
            },
            {
                keywords: ['offline', 'no internet', 'connection', 'network', 'slow', 'internet', 'sambungan'],
                answer: `app ni boleh jalan offline kalau dah install PWA. boleh baca sprint guide, library, dengan tengok dashboard.\n\nbenda live macam chat dengan forum je kena ada internet. yang lain caching jalan.`,
                followUp: `elok install PWA kalau internet tak kuat sangat. sekurang-kurangnya boleh baca content kat rumah.\n\nnanti ada line, dia sync balik.`,
                relatedTopics: ['macam mana nak install sebagai pwa', 'apa itu skills library', 'macam mana dashboard berfungsi']
            },
            // LESSONS: Setup & Environment
            {
                keywords: ['node', 'nodejs', 'install', 'npm', 'setup', 'environment', 'first setup', 'install node'],
                answer: `setup ni step pertama sebelum boleh code. kau kena install node.js untuk run javascript kat computer (o^▽^o).\n\nnode.js ni macam enjin kereta. antigravity pula co-pilot ai kau. kalau enjin takde, kereta tak jalan.`,
                followUp: `lepas install node.js lts dari website rasmi, buka terminal check \`node -v\` dan \`npm -v\`.\n\npastu run \`npm install\` dalam project folder, lepas tu \`npm run dev\`. kalau website boleh hidup, setup kau dah betul (b ᵔ▽ᵔ)b.`,
                relatedTopics: ['api key setup', 'antigravity tools', 'troubleshooting npm'],
                linkUrl: 'https://nodejs.org/en/download'
            },
            {
                keywords: ['api key', 'groq', 'nvidia', 'openrouter', 'token', 'model', 'llm', 'ai key'],
                answer: `api key ni macam kad pengenalan untuk guna ai. korang boleh guna groq (laju & murah), nvidia llm, atau openrouter (jimat).\n\nelakkan guna opus/sonnet untuk benda simple sebab mahal token (¬‿¬).`,
                followUp: `buka platform pilihan, register dan ambil 'api keys'. buka vscode/cursor settings antigravity, paste api key.\n\nguna gemini flash untuk ui design, sonnet untuk architecture. openrouter paling jimat kalau nak guna semua model.`,
                relatedTopics: ['antigravity setup', 'model selection', 'cost optimization'],
                linkUrl: 'https://console.groq.com/keys'
            },
            // LESSONS: Ideation
            {
                keywords: ['chatgpt', 'personality', 'ideation', 'brainstorm', 'planning', 'idea', 'prompt engineer'],
                answer: `chatgpt ni kau kena ajar jadi pakar dulu. macam kau lantik manager - bagi dia title 'senior ui engineer & pm' (✿◠‿◠).\n\nmula-mula bagi role, baru instruction dia mantap.`,
                followUp: `tulis prompt: 'you are an expert react ui engineer and product manager...'. ceritakan idea app kau.\n\nminta dia suggest features dan ux flow. bincang sampai idea solid. chatgpt bagus untuk validate idea sebelum buat.`,
                relatedTopics: ['master prompt', 'antigravity coding', 'product planning'],
                linkUrl: 'https://chat.openai.com'
            },
            {
                keywords: ['master prompt', 'blueprint', 'specification', 'claude', 'prompt', 'arahan lengkap'],
                answer: `master prompt ni satu arahan lengkap untuk antigravity. suruh chatgpt rumuskan jadi blueprint (ﾉ^ヮ^)ﾉ*:・ﾟ✧.\n\nbila idea dah confirm, kau transform jadi one-shot instruction.`,
                followUp: `minta chatgpt: 'summarize everything into ONE master prompt for claude 3 to build this app'.\n\npastikan ada details ui, warna, layout, data structure. copy dan paste dalam antigravity. sekali shot terus.`,
                relatedTopics: ['chatgpt setup', 'vibe coding', 'antigravity'],
                linkUrl: 'https://chat.openai.com'
            },
            // LESSONS: Vibe Coding
            {
                keywords: ['vibe coding', 'antigravity sonnet', 'claude', 'gemini', 'model', 'ai coding', 'which model'],
                answer: `claude 3.5 sonnet = senior engineer (steady). opus = krackeddev (power gila). gemini flash = ui designer. gemini 3.1 = all-rounder (☆▽☆).\n\npilih ikut kerja. jangan guna nuke untuk bunuh nyamuk.`,
                followUp: `pilih model sesuai: sonnet atau gemini 3.1 untuk architecture. paste master prompt.\n\nkalau nak tukar warna/padding UI, switch ke gemini flash sebab dia fokus visual (b ᵔ▽ᵔ)b.`,
                relatedTopics: ['master prompt', 'model comparison', 'api key'],
                linkUrl: 'https://antigravity.id'
            },
            // LESSONS: Version Control
            {
                keywords: ['github', 'git', 'push', 'commit', 'repository', 'version control', 'code', 'simpan code'],
                answer: `github ni macam google drive tapi khas untuk code. kau 'push' code untuk simpan kekal (o^▽^o).\n\nversion control penting kalau nak collaborate atau nak deploy.`,
                followUp: `create github repo. run: \`git init\`, \`git add .\`, \`git commit -m 'initial commit'\`.\n\nbelajar beza \`git pull\` (tarik code turun) dan \`git fetch\`. run \`git push -u origin main\` untuk upload ke branch utama.`,
                relatedTopics: ['vercel deployment', 'git commands', 'collaboration'],
                linkUrl: 'https://github.com'
            },
            // LESSONS: Deployment
            {
                keywords: ['vercel', 'deploy', 'deployment', 'hosting', 'launch', 'live', 'production', 'url'],
                answer: `vercel ambil code dari github dan letak kat server awam (ง •̀_•́)ง.\n\ndalam local, kau je nampak website tu. vercel buat semua orang boleh access.`,
                followUp: `create akaun vercel guna github. import repo yang kau push tadi. settings default tekan deploy.\n\nbila siap, copy url \`.vercel.app\`. paste dalam terminal KRACKED_OS ni untuk dapat trophy!`,
                relatedTopics: ['github setup', 'analytics', 'custom domain'],
                linkUrl: 'https://vercel.com'
            },
            {
                keywords: ['analytics', 'tracking', 'visitor', 'traffic', 'stats', 'vercel analytics', 'data'],
                answer: `analytics ni macam cctv - nampak berapa orang masuk website dari mana ( ˙꒳​˙ ).\n\nvercel analytics percuma dan mudah setup.`,
                followUp: `vercel dashboard > analytics > enable. dalam terminal vscode run: \`npm i @vercel/analytics\`.\n\nimport \`<Analytics />\` dalam app.jsx atau main.jsx. commit push github, auto deploy. lepas tu boleh tengok graf traffic.`,
                relatedTopics: ['vercel deployment', 'metrics', 'user behavior'],
                linkUrl: 'https://vercel.com/docs/analytics/quickstart'
            },
            {
                keywords: ['domain', 'custom domain', 'dns', '.com', 'url sendiri', 'nama domain'],
                answer: `buang .vercel.app, nampak professional dengan domain .com (✿◠‿◠).\n\nbeli nama sendiri, lepastu sambung ke vercel.`,
                followUp: `beli domain (namecheap, porkbun). vercel dashboard > domains > add domain.\n\ncopy a record dan cname ke dns settings tempat beli domain. tunggu propagate (kadang cepat, kadang beberapa jam).`,
                relatedTopics: ['vercel deployment', 'branding', 'seo'],
                linkUrl: 'https://vercel.com/docs/custom-domains'
            },
            // LESSONS: Database
            {
                keywords: ['supabase', 'database', 'backend', 'data', 'storage', 'db', 'simpan data'],
                answer: `supabase paling senang untuk database. faham beza anon key dan service role key! (⌐■_■)\n\nbila buat login atau simpan form data, kau perlukan backend database.`,
                followUp: `buat project supabase, tunggu 2-3 minit server setup. settings > api > copy url dan anon key.\n\nAMARAN: jangan expose service_role key! berbahaya! buat \`.env.local\` untuk simpan credentials.`,
                relatedTopics: ['sql queries', 'security', 'env variables'],
                linkUrl: 'https://supabase.com'
            },
            {
                keywords: ['sql', 'query', 'table', 'create table', 'schema', 'database structure'],
                answer: `suruh ai generate sql script, paste supabase, siap sepenip mata (ﾉ^ヮ^)ﾉ*:・ﾟ✧.\n\ntakyah buat table manual satu-satu.`,
                followUp: `minta antigravity: 'generate supabase sql query to create users table with name and email'.\n\nsupabase dashboard > sql editor (icon terminal kilat) > new query > paste > run. table editor confirm wujud. disable rls kalau prototype je.`,
                relatedTopics: ['supabase setup', 'database design', 'rls security'],
                linkUrl: 'https://supabase.com/docs/guides/database/sql-editor'
            },
            {
                keywords: ['connect database', 'fetch data', 'api call', 'environment variables', 'env', 'supabase client'],
                answer: `vercel tak tau password supabase. kena set environment variable :).\n\nwayar dah sambung local, tapi vercel perlukan credentials.`,
                followUp: `vercel settings > environment variables > paste supabase url dan anon key.\n\nsuruh antigravity tulis fetchdata logic untuk panggil data. map data kat ui table atau cards. push github, vercel auto deploy. boom website dah live dengan database!`,
                relatedTopics: ['supabase setup', 'api integration', 'vercel env'],
                linkUrl: 'https://vercel.com/docs/environment-variables'
            },
            // LESSONS: Troubleshooting
            {
                keywords: ['error', 'bug', 'tidak jalan', 'broken', 'fail', 'stuck', 'troubleshoot', 'debug'],
                answer: `kalau stuck, follow ni: 1) check console error dulu. 2) google exact error message. 3) tanya ai explain error tu ( ˙꒳​˙ ).\n\njangan panic. semua builder mesti jumpa error.`,
                followUp: `kalau npm install error, cuba delete node_modules dan package-lock.json, pastu run lagi.\n\nkalau build error, check syntax. kalau deployment error, check env variables. satu persatu troubleshoot.`,
                relatedTopics: ['supabase setup', 'vercel deployment', 'github push']
            }
        ];
    }

    /**
     * Main method to get enhanced local intelligence response
     */
    getResponse(userMessage, history = []) {
        // Analyze sentiment and intent
        const analysis = this.sentimentAnalyzer.analyze(userMessage);

        // Update conversation state
        const detectedTopics = this.detectTopics(userMessage);
        this.conversationState.updateProfile(userMessage, detectedTopics);
        this.conversationState.conversationHistory.push({
            message: userMessage,
            timestamp: Date.now(),
            sentiment: analysis.sentiment,
            intent: analysis.intent
        });

        // Get relevant context
        const context = this.conversationState.getRelevantContext();

        // Try to find best match from knowledge base
        let response = this.findBestMatch(userMessage, context, analysis);

        if (!response) {
            // If no match found, generate conversational response
            response = this.generateConversationalResponse(userMessage, context, analysis);
        }

        // Add proactive engagement if appropriate
        if (analysis.intent === 'informational' && context.topicDepth === 0) {
            response += `\n\n${this.responseGenerator.getRandomElement(this.responseGenerator.conversationalPrompts)}`;
        }

        return response;
    }

    detectTopics(message) {
        const lowerMsg = message.toLowerCase();
        const topics = [];

        this.LOCAL_KB.forEach(entry => {
            entry.keywords.forEach(keyword => {
                if (lowerMsg.includes(keyword)) {
                    topics.push(entry.keywords[0]); // Use first keyword as topic identifier
                }
            });
        });

        return [...new Set(topics)]; // Remove duplicates
    }

    findBestMatch(userMessage, context, analysis) {
        const msg = userMessage.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const entry of this.LOCAL_KB) {
            let score = 0;

            // Keyword matching
            for (const keyword of entry.keywords) {
                if (msg.includes(keyword)) {
                    score += keyword.length * 2;
                }
            }

            // Context bonus
            if (context.userInterests.some(interest => entry.keywords.includes(interest))) {
                score += 10;
            }

            // Topic continuity bonus
            if (context.currentTopic && entry.keywords.includes(context.currentTopic)) {
                score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }

        if (bestMatch && bestScore > 0) {
            this.conversationState.updateTopicMemory(bestMatch.keywords[0]);

            let response = bestMatch.answer;

            // Add follow-up if available and appropriate
            if (bestMatch.followUp && analysis.intent === 'informational') {
                response += `\n\n${bestMatch.followUp}`;
            }

            // Add related topics
            if (bestMatch.relatedTopics?.length) {
                response += `\n\nboleh tanya pasal: ${bestMatch.relatedTopics.map(t => `"${t}"`).join(', ')}`;
            }

            return this.responseGenerator.generateResponse(response, context, analysis.sentiment, analysis.intent);
        }

        return null;
    }

    generateConversationalResponse(userMessage, context, analysis) {
        const lowerMsg = userMessage.toLowerCase();

        // Handle different types of messages
        if (lowerMsg.includes('hello') || lowerMsg.includes('hai') || lowerMsg.includes('hi')) {
            return this.responseGenerator.generateResponse(
                this.responseGenerator.getRandomElement(this.responseGenerator.responseTemplates.greeting),
                context, analysis.sentiment, analysis.intent
            );
        }

        if (analysis.intent === 'help') {
            return this.responseGenerator.generateResponse(
                this.responseGenerator.getRandomElement(this.responseGenerator.responseTemplates.help),
                context, analysis.sentiment, analysis.intent
            );
        }

        if (analysis.sentiment === 'negative') {
            return this.responseGenerator.generateResponse(
                this.responseGenerator.getRandomElement(this.responseGenerator.responseTemplates.confusion),
                context, analysis.sentiment, analysis.intent
            );
        }

        // Enhanced fallback responses for random/ununderstood messages
        return this.generateFallbackResponse(userMessage, context, analysis);
    }

    generateFallbackResponse(userMessage, context, analysis) {
        const lowerMsg = userMessage.toLowerCase();
        const msgLength = userMessage.trim().length;

        // NEW: Detect FAQ category and suggest relevant questions
        let category = null;
        if (lowerMsg.includes('setup') || lowerMsg.includes('install') || lowerMsg.includes('npm')) {
            category = 'SETUP';
        } else if (lowerMsg.includes('deploy') || lowerMsg.includes('vercel') || lowerMsg.includes('host')) {
            category = 'DEPLOYMENT';
        } else if (lowerMsg.includes('database') || lowerMsg.includes('supabase') || lowerMsg.includes('data')) {
            category = 'DATABASE';
        } else if (lowerMsg.includes('tool') || lowerMsg.includes('ai') || lowerMsg.includes('model') || lowerMsg.includes('antigravity')) {
            category = 'TOOLS';
        } else if (lowerMsg.includes('error') || lowerMsg.includes('fail') || lowerMsg.includes('stuck') || lowerMsg.includes('broken')) {
            category = 'TROUBLESHOOTING';
        } else if (lowerMsg.includes('join') || lowerMsg.includes('sprint') || lowerMsg.includes('program') || lowerMsg.includes('free')) {
            category = 'PROGRAM';
        }

        if (category && FAQ_CATEGORIES[category]) {
            const suggestions = FAQ_CATEGORIES[category];
            return this.responseGenerator.generateResponse(
                `aku detect kau nak tanya pasal ${category.toLowerCase()} (o^▽^o)\n\nni beberapa soalan popular:\n\n${suggestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n\ncuba tanya salah satu! atau type keyword lagi spesifik.`,
                context, 'neutral', 'informational'
            );
        }

        // Handle very short or random inputs
        if (msgLength < 3 || this.isRandomInput(userMessage)) {
            return this.responseGenerator.generateResponse(
                `eh sikit blur ni (・_・;) kau ni nak tanya pasal apa sebenarnya?\n\nni ada beberapa benda yang aku boleh bantu:\n\n💡 **Pertanyaan Popular:**\n• "macam mana nak join KRACKED_OS?"\n• "apa itu 7-day sprint?"\n• "nak buat app free macam mana?"\n\natau just type "help" kalau kau pening sangat (✿◠‿◠)`,
                context, 'neutral', 'informational'
            );
        }

        // Handle potential typos or unclear messages
        if (this.isUnclearMessage(userMessage)) {
            return this.responseGenerator.generateResponse(
                `aku nampak macam kau nak tanya sesuatu tapi sikit confuse (¬‿¬)\n\nboleh kau clarify sikit:\n\n🔍 **Mungkin kau maksudkan:**\n• "macam mana nak install PWA?"\n• "nak join sprint macam mana?"\n• "tools apa yang perlu?"\n\natau kau boleh type keyword macam "join", "sprint", "PWA" untuk aku bantu lebih spesifik!`,
                context, 'neutral', 'informational'
            );
        }

        // Handle topic switching or new topics
        if (context.currentTopic && this.isTopicSwitch(userMessage, context)) {
            return this.responseGenerator.generateResponse(
                `oh gitu ke? (o^▽^o) tadi kita tengah sembang pasal "${context.currentTopic}" tapi nampak macam kau nak tukar topik.\n\nnak tanya pasal:\n\n🎯 **Topik Lain:**\n• "macam mana nak earn vibes lebih?"\n• "nak level up studio macam mana?"\n• "discord krackeddevs link mana?"\n\natau just type "back" kalau kau nak sambung topik tadi.`,
                context, 'neutral', 'informational'
            );
        }

        // Handle complex or multi-topic messages
        if (this.isComplexMessage(userMessage)) {
            return this.responseGenerator.generateResponse(
                `wah banyak benda kau tanya sekali (b ᵔ▽ᵔ)b baik aku breakdown sikit:\n\n📝 **Aku nampak kau tanya pasal:**\n• ${this.extractKeyTopics(userMessage).join('\n• ')}\n\nnak aku explain satu-satu ke? atau kau nak fokus kat satu benda dulu?\n\njust type "explain [topic]" kalau kau nak detail pasal satu benda je.`,
                context, 'positive', 'informational'
            );
        }

        // Default comprehensive fallback
        return this.responseGenerator.generateResponse(
            `aku try paham apa yang kau tanya (・_・;)\n\nni ada beberapa option yang mungkin kau cari:\n\n💡 **Pertanyaan Biasa:**\n• "macam mana nak join?"\n• "apa itu necb?"\n• "7-day sprint schedule?"\n• "tools apa yang perlu?"\n• "nak install PWA macam mana?"\n\n🎯 **Atau kau boleh:**\n• Type keyword spesifik\n• Type "help" untuk list semua option\n• Type "menu" untuk quick access\n\nkalau masih tak jumpa, DM ijam kat threads @_zarulijam (✿◠‿◠)`,
            context, 'neutral', 'informational'
        );
    }

    isRandomInput(message) {
        const patterns = [
            /^[a-z]{1,3}$/, // Very short random letters
            /^(abc|qwe|asd|zxc|123|test|lol|haha)+$/i, // Common random strings
            /^[a-z]{4,}[\s!@#$%^&*()]+$/i, // Letters with random symbols
            /^(.)\1{3,}/, // Repeated characters
        ];

        return patterns.some(pattern => pattern.test(message.trim()));
    }

    isUnclearMessage(message) {
        const unclearPatterns = [
            /apa itu/i, /macam mana/i, /nak/i, /boleh/i, /tak/i, /kenapa/i,
            /saya/i, /aku/i, /kau/i, /dia/i, /mereka/i
        ];

        // If message contains question words but is too vague
        const hasQuestionWords = unclearPatterns.some(pattern => pattern.test(message.toLowerCase()));
        const isTooShort = message.trim().length < 10;

        return hasQuestionWords && isTooShort;
    }

    isTopicSwitch(message, context) {
        // If user is asking about something completely different from current topic
        const currentTopic = context.currentTopic;
        if (!currentTopic) return false;

        const messageTopics = this.detectTopics(message);
        return messageTopics.length > 0 && !messageTopics.includes(currentTopic);
    }

    isComplexMessage(message) {
        // Check for multiple questions or topics
        const questionCount = (message.match(/\?/g) || []).length;
        const topicCount = this.detectTopics(message).length;

        return questionCount > 1 || topicCount > 2;
    }

    extractKeyTopics(message) {
        const topics = this.detectTopics(message);
        if (topics.length === 0) {
            return ['general help'];
        }
        return topics.slice(0, 3); // Return max 3 topics
    }

    /**
     * Reset conversation state (for new users or testing)
     */
    reset() {
        this.conversationState.reset();
    }
}

// Export singleton instance
export const enhancedLocalIntelligence = new EnhancedLocalIntelligence();

// Backward compatibility - export the main function
export function localIntelligence(userMessage, history = []) {
    return enhancedLocalIntelligence.getResponse(userMessage, history);
}
