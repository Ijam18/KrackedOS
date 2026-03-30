// IJAM AI Service
// Multi-model AI service supporting Groq, local models (Ollama), and OpenRouter

import { enhancedLocalIntelligence } from '../../../lib/enhancedLocalIntelligence';

const AI_MODELS = {
  GROQ: 'groq',
  LOCAL: 'ollama',
  OPENROUTER: 'openrouter',
  FALLBACK: 'enhanced-local'
};

function normalizeCommand(value = '') {
  return String(value).trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, '');
}

function inferRuntimePhase() {
  return {
    phase: 'hardening',
    label: 'Phase 4: Hardening',
    immediate: 'kemaskan doctrine, runtime alignment, dan command semantics supaya MajiOS behavior lagi konsisten',
    support: 'guna `save` lepas perubahan durable supaya repo-backed memory card terisi, kemudian `bmad review` untuk cari drift seterusnya',
    caution: 'bezakan antara browser-local session state dengan repo-backed MAJI memory card supaya save semantics tak bercampur'
  };
}

function getCommandHelpText() {
  return `command MAJI yang available sekarang:\n\nMAJI core:\n- \`MAJI\`\n- \`save\` / \`maji save\`\n- \`load bmad\`\n- \`update memory\`\n- \`review growth\`\n\nDiary:\n- \`load diary archive\`\n- \`load save-diary\`\n- \`save diary\`\n- \`review diary\`\n\nBMAD:\n- \`bmad help\`\n- \`bmad brainstorm\`\n- \`bmad plan\`\n- \`bmad review\`\n- \`bmad edge-cases\`\n- \`bmad distill\``;
}

function getMajiRuntimeCommandResponse(userMessage, history = []) {
  const command = normalizeCommand(userMessage);
  const totalMessages = Array.isArray(history) ? history.length : 0;
  const phaseInfo = inferRuntimePhase();

  if (command === 'maji') {
    return `MAJI aktif pada doctrine semasa.\n\nstate semasa:\n- bahasa melayu dulu\n- muslim-friendly dengan adab\n- MajiOS ialah layer canonical untuk memory, method, dan skills\n- shared core + user overlay ialah model memory semasa\n- first-use flow sepatutnya minta nama user sebelum load penuh\n\n${getCommandHelpText()}`;
  }

  if (command === 'load bmad') {
    return `BMAD loaded dalam context runtime.\n\nmode yang available:\n- \`bmad help\`\n- \`bmad brainstorm\`\n- \`bmad plan\`\n- \`bmad review\`\n- \`bmad edge-cases\`\n- \`bmad distill\`\n\nfasa paling masuk akal sekarang: ${phaseInfo.label}.\nfocus semasa: ${phaseInfo.immediate}.`;
  }

  if (command === 'bmad help') {
    return `bmad help:\n\nfasa semasa: ${phaseInfo.label}\n\nimmediate next step:\n- ${phaseInfo.immediate}\n\noptional supporting step:\n- ${phaseInfo.support}\n\ncaution:\n- ${phaseInfo.caution}`;
  }

  if (command === 'bmad brainstorm') {
    return `bmad brainstorm:\n\narah brainstorm paling berguna sekarang:\n1. macam mana nak jadikan command semantics MAJI lebih deterministic dalam runtime\n2. macam mana nak bezakan repo-backed memory dengan browser-local session state dengan lebih jelas\n3. macam mana nak buat layer command response yang reusable tanpa duplicate doctrine dalam banyak tempat\n\nkalau nak, lepas ni paling natural ialah \`bmad plan\` atau \`bmad review\`.`;
  }

  if (command === 'bmad plan') {
    return `bmad plan:\n\n1. lock source of truth command dari MajiOS docs\n2. route command utama secara deterministic dalam runtime layer\n3. pastikan fallback still guna model bila bukan command exact\n4. verify build\n5. guna \`save\` kalau perubahan tu durable untuk future sessions`;
  }

  if (command === 'bmad review') {
    return `bmad review:\n\nfocus review untuk state sekarang:\n- adakah runtime command reply match doctrine MajiOS\n- adakah user boleh keliru antara browser-local session save dan repo-backed MAJI save\n- adakah command coverage cukup untuk command utama MAJI dan BMAD\n- adakah fallback masih masuk bila input bukan exact command\n\nkalau nak risk hunting, terus guna \`bmad edge-cases\`.`;
  }

  if (command === 'bmad edge-cases') {
    return `bmad edge-cases:\n\nedge cases yang patut dijaga:\n- user taip command dengan huruf besar/kecil berbeza\n- user tambah quote atau spacing pelik pada command\n- user guna command yang hampir sama tapi bukan exact match\n- user pertama kali run \`MAJI\` tapi belum ada overlay nama\n- user anggap \`save\` masih local-only walaupun semantics baru ialah repo-backed memory card\n\ndefault sekarang patut: exact command route dulu, selain tu fall back ke AI biasa.`;
  }

  if (command === 'bmad distill') {
    return `bmad distill:\n\nringkasan context semasa:\n- MajiOS ialah canonical layer untuk memory, method, dan skills\n- BMAD ialah workflow engine dalam MajiOS\n- memory card model sekarang ialah shared core + user overlays\n- benda paling penting untuk preserve ialah beza antara doctrine repo-backed dengan state runtime local\n\nkalau nak persist perubahan yang durable, next command ialah \`save\`.`;
  }

  if (command === 'review growth') {
    return `review growth ringkas:\n\n1. identity MAJI sekarang lebih konsisten: bahasa melayu dulu, muslim-friendly, dan lebih jelas sebagai operator KRACKED_OS.\n2. doctrine makin kemas: MajiOS sekarang lebih jelas sebagai layer canonical untuk memory, method, dan skills.\n3. workflow maturity naik: BMAD, skill promotion, dan boundary dengan tooling luar macam KD dah lebih tersusun.\n4. runtime alignment bertambah baik dengan model portable memory card untuk shared core + user overlays.\n\nnext best move: guna \`save\` bila kau nak preserve perubahan yang durable.`;
  }

  if (command === 'load diary archive') {
    return `load diary archive:\n\nstatus semasa:\n- layer diary archive memang wujud dalam doctrine MajiOS\n- struktur baru guna \`daily-diary/current/\` untuk entry aktif dan \`daily-diary/archived/\` untuk bulan lama\n- repo semasa dah ada entry aktif bertarikh \`2026-03-29\`\n- archive history sebenar masih nipis, jadi benda paling berguna sekarang ialah \`review diary\`\n\nnota runtime:\n- command ini sekarang beri guided access dalam chat\n- pembacaan fail repo sebenar masih bergantung pada session agent yang ada akses fail`;
  }

  if (command === 'load save-diary') {
    return `load save-diary:\n\ndiary system aktif dalam doctrine semasa.\n\napa yang available:\n- struktur \`daily-diary/current/\` untuk entry harian append-only\n- struktur \`daily-diary/archived/\` untuk archive bulanan\n- flow semasa: \`save diary\` untuk rekod sesi, \`review diary\` untuk recap\n\nnota penting:\n- dalam runtime chat, command ini bertindak sebagai activation/guide layer\n- persistence ke fail repo sebenar masih perlukan session yang ada akses fail`;
  }

  if (command === 'save diary') {
    return `save diary:\n\nstate semasa:\n- semantics diary dah aktif dalam runtime\n- source of truth repo sekarang guna fail harian dalam \`daily-diary/current/\`\n- entry bertarikh \`2026-03-29\` dah wujud sebagai rekod sesi pertama untuk struktur baru\n\ncaution:\n- chat runtime sendiri tak terus menulis fail repo\n- untuk save repo-backed yang sebenar, session agent dengan akses fail masih diperlukan`;
  }

  if (command === 'review diary') {
    return `review diary:\n\nringkasan diary semasa:\n- struktur diary baru sudah dimulakan dengan fail harian bertarikh \`2026-03-29\`\n- entry itu merakam aktivasi MAJI/BMAD, semakan \`load diary archive\`, dan kickoff save-diary flow\n\ninsight utama:\n- layer diary sekarang dah ada bentuk repo-backed yang lebih kemas\n- command diary dalam runtime dah lebih jelas, tapi operasi fail sebenar masih berasingan daripada browser-local chat state\n\nnext best move:\n- teruskan sesi dan guna \`save diary\` lagi bila ada milestone baru yang patut dipreserve`;
  }

  if (command === 'save') {
    return `save sekarang sepatutnya route ke repo-backed MAJI memory card.\n\napa yang patut berlaku:\n- action log user ditambah dalam overlay repo\n- current summary user direfresh\n- shared core kekal canonical dan tak dioverwrite sesuka hati\n- browser-local conversation save kekal berasingan sebagai convenience layer\n\njumlah mesej dalam session ni sekarang: ${totalMessages}.`;
  }

  if (command === 'update memory') {
    return `update memory:\n\nuntuk runtime layer, maksud paling dekat ialah refresh cara jawab supaya ikut doctrine semasa MajiOS.\n\nuntuk persistence sebenar, arah yang betul sekarang ialah repo-backed memory card dengan model shared core + user overlay. kalau perubahan sekarang memang durable, biasanya flow paling betul ialah:\n1. \`review growth\`\n2. \`save\``;
  }

  return null;
}

async function callGroqAPI(systemPrompt, userMessage, history = []) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    console.warn('VITE_GROQ_API_KEY not set, falling back to local intelligence');
    return enhancedLocalIntelligence.getResponse(userMessage, history);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return enhancedLocalIntelligence.getResponse(userMessage, history);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Maaf, aku tak dapat jana respons sekarang.';
  } catch (error) {
    console.error('Groq API call failed:', error);
    return enhancedLocalIntelligence.getResponse(userMessage, history);
  }
}

async function callOllama(model = 'phi-3', prompt, history = []) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: formatPrompt(prompt, history),
        stream: false
      })
    });

    if (!response.ok) {
      console.error('Ollama API error:', response.status);
      return enhancedLocalIntelligence.getResponse(prompt, history);
    }

    const data = await response.json();
    return data.response || 'Maaf, model tak jalan sekarang.';
  } catch (error) {
    console.error('Ollama call failed:', error);
    return enhancedLocalIntelligence.getResponse(prompt, history);
  }
}

function formatPrompt(userPrompt, history) {
  const historyText = history.map((msg) => `${msg.role}: ${msg.content}`).join('\n');

  return `System: You are IJAM, the Malay-first and Muslim-friendly AI assistant for KRACKED_OS.
Keep tone ringkas, practical, dan respectful.
Treat MajiOS as the canonical memory, method, and skill layer for KRACKED_OS.

Conversation History:
${historyText}

Current Request: ${userPrompt}`;
}

export async function callIJAMAI(mode = AI_MODELS.GROQ, userMessage, history = []) {
  console.log(`IJAM AI called with mode: ${mode}, message:`, userMessage);

  const commandResponse = getMajiRuntimeCommandResponse(userMessage, history);
  if (commandResponse) {
    return commandResponse;
  }

  switch (mode) {
    case AI_MODELS.GROQ:
      return callGroqAPI(getIslamicGreeting(), userMessage, history);
    case AI_MODELS.LOCAL:
      return callOllama('phi-3', userMessage, history);
    case AI_MODELS.OPENROUTER:
      return callGroqAPI(getIslamicGreeting(), userMessage, history);
    case AI_MODELS.FALLBACK:
      return enhancedLocalIntelligence.getResponse(userMessage, history);
    default:
      return callGroqAPI(getIslamicGreeting(), userMessage, history);
  }
}

function getIslamicGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Assalamualaikum, selamat pagi :)';
  if (hour >= 12 && hour < 17) return 'Assalamualaikum, selamat tengah hari :)';
  if (hour >= 17 && hour < 20) return 'Assalamualaikum, selamat petang :)';
  return 'Assalamualaikum, selamat malam :)';
}

export { AI_MODELS, getIslamicGreeting, getMajiRuntimeCommandResponse };
