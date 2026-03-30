// IJAM Conversation Management Hook
// Manages conversation state for IJAM with resume capability and local diary persistence.

import { useState } from 'react';

const CONVERSATION_INDEX_KEY = 'ijam_conversations_index';
const DIARY_META_KEY = 'ijam_diary_meta';
const DIARY_ENTRIES_KEY = 'ijam_diary_entries';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error);
  }
}

function normalizeCommand(value = '') {
  return String(value).trim().toLowerCase().replace(/^["'`]+|["'`]+$/g, '');
}

function formatDiaryDateLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatDiaryTimeLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function getSessionType(messages = []) {
  const normalizedMessages = messages
    .filter((message) => message?.role === 'user')
    .map((message) => normalizeCommand(message.content));

  if (normalizedMessages.some((message) => message.startsWith('bmad'))) {
    return 'Work / BMAD';
  }

  if (normalizedMessages.some((message) => message.includes('maji') || message.includes('diary'))) {
    return 'Work / MAJI System';
  }

  return 'Work / General';
}

function buildDiaryEntry(messages = []) {
  const now = new Date();
  const userMessages = messages
    .filter((message) => message?.role === 'user')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);

  const assistantMessages = messages
    .filter((message) => message?.role === 'assistant')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);

  const topics = userMessages.slice(-3);
  const highlights = assistantMessages.slice(-2);

  return {
    id: `diary-${now.getTime()}`,
    createdAt: now.toISOString(),
    dateKey: now.toISOString().slice(0, 10),
    monthKey: now.toISOString().slice(0, 7),
    title: topics[0] || 'Session diary entry',
    sessionType: getSessionType(messages),
    messageCount: messages.length,
    topics,
    highlights,
    summary:
      topics.length > 0
        ? `Topik utama: ${topics.join(' | ')}`
        : 'Tiada topik panjang, tapi sesi ini tetap dipreserve sebagai checkpoint.',
    transcriptPreview: messages.slice(-6)
  };
}

export function useIJAMConversation() {
  const [conversations, setConversations] = useState(() => readJson(CONVERSATION_INDEX_KEY, []));
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [resumedMessage, setResumedMessage] = useState(null);
  const [diaryMeta, setDiaryMeta] = useState(() => readJson(DIARY_META_KEY, null));
  const [diaryEntries, setDiaryEntries] = useState(() => readJson(DIARY_ENTRIES_KEY, []));

  const getIslamicGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Assalamualaikum, selamat pagi :)';
    if (hour >= 12 && hour < 17) return 'Assalamualaikum, selamat tengah hari :)';
    if (hour >= 17 && hour < 20) return 'Assalamualaikum, selamat petang :)';
    return 'Assalamualaikum, selamat malam :)';
  };

  const resumeConversation = (conversationId) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return [];

    setCurrentConversationId(conversationId);
    setResumedMessage('Assalamualaikum! Jumpa lagi kita terus dari mana tadi :)');

    try {
      const saved = localStorage.getItem(`ijam_conversation_${conversationId}`);
      if (saved) {
        const savedData = JSON.parse(saved);
        return savedData.messages || [];
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }

    return [];
  };

  const saveCurrentConversation = (messagesToSave = conversations) => {
    if (!Array.isArray(messagesToSave) || messagesToSave.length === 0) return;

    const conversationId = currentConversationId || Date.now();
    const conversationData = {
      id: conversationId,
      timestamp: new Date().toISOString(),
      messages: messagesToSave,
      resumedFrom: resumedMessage
    };

    localStorage.setItem(`ijam_conversation_${conversationId}`, JSON.stringify(conversationData));
    setCurrentConversationId(conversationId);

    const nextIndex = [
      {
        id: conversationId,
        timestamp: conversationData.timestamp,
        messageCount: messagesToSave.length
      },
      ...conversations.filter((conversation) => conversation.id !== conversationId)
    ].slice(0, 20);

    setConversations(nextIndex);
    writeJson(CONVERSATION_INDEX_KEY, nextIndex);
    console.log('Conversation saved:', conversationData);
  };

  const ensureDiarySystem = () => {
    const meta = diaryMeta || readJson(DIARY_META_KEY, null);
    const entries = Array.isArray(diaryEntries) ? diaryEntries : readJson(DIARY_ENTRIES_KEY, []);

    if (meta) {
      return { meta, entries };
    }

    const nextMeta = {
      name: 'Session Diary',
      initializedAt: new Date().toISOString(),
      version: 1
    };

    writeJson(DIARY_META_KEY, nextMeta);
    setDiaryMeta(nextMeta);

    const normalizedEntries = Array.isArray(entries) ? entries : [];
    if (!Array.isArray(entries)) {
      writeJson(DIARY_ENTRIES_KEY, []);
      setDiaryEntries([]);
    }

    return { meta: nextMeta, entries: normalizedEntries };
  };

  const saveDiaryEntry = (messagesToSave = []) => {
    const { meta, entries } = ensureDiarySystem();
    const entry = buildDiaryEntry(messagesToSave);
    const nextEntries = [...entries, entry];
    writeJson(DIARY_ENTRIES_KEY, nextEntries);
    setDiaryEntries(nextEntries);

    return `save diary:\n\nsession berjaya dipreserve dalam local diary browser.\n\napa yang disimpan:\n- nama diary: \`${meta.name}\`\n- jumlah entry terkumpul: ${nextEntries.length}\n- entry terbaru: ${entry.dateKey} (${formatDiaryTimeLabel(new Date(entry.createdAt))})\n- mesej dalam snapshot sesi ini: ${entry.messageCount}\n\nnota:\n- ini ialah persistence sebenar pada app layer melalui localStorage\n- ia masih berbeza daripada repo-backed memory files`;
  };

  const reviewDiaryEntries = () => {
    const { meta, entries } = ensureDiarySystem();

    if (!entries.length) {
      return `review diary:\n\n\`${meta.name}\` belum ada entry lagi.\n\nnext best move:\n- guna \`save diary\` bila kau nak preserve sesi semasa`;
    }

    const recentEntries = [...entries].slice(-3).reverse();
    const recentSummary = recentEntries
      .map((entry, index) => `${index + 1}. ${entry.dateKey} - ${entry.summary}`)
      .join('\n');

    return `review diary:\n\nringkasan \`${meta.name}\`:\n- jumlah entry: ${entries.length}\n- entry paling baru: ${recentEntries[0].dateKey}\n\nrecent entries:\n${recentSummary}`;
  };

  const loadDiaryArchive = () => {
    const { meta, entries } = ensureDiarySystem();

    if (!entries.length) {
      return `load diary archive:\n\n\`${meta.name}\` sudah diaktifkan, tapi archive masih kosong.\n\napa maksudnya:\n- belum ada entry terdahulu untuk digroup sebagai sejarah\n- langkah paling berguna sekarang ialah \`save diary\``;
    }

    const groupedByMonth = entries.reduce((accumulator, entry) => {
      accumulator[entry.monthKey] = (accumulator[entry.monthKey] || 0) + 1;
      return accumulator;
    }, {});

    const archiveSummary = Object.entries(groupedByMonth)
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([monthKey, count]) => `- ${monthKey}: ${count} entry`)
      .join('\n');

    return `load diary archive:\n\nstatus archive untuk \`${meta.name}\`:\n- jumlah entry tersimpan: ${entries.length}\n- bulan aktif pertama: ${entries[0].monthKey}\n\npecahan bulan:\n${archiveSummary}`;
  };

  const loadSaveDiary = () => {
    const { meta, entries } = ensureDiarySystem();

    return `load save-diary:\n\ndiary system browser-layer aktif.\n\nstatus semasa:\n- nama diary: \`${meta.name}\`\n- initialized: ${formatDiaryDateLabel(new Date(meta.initializedAt))}\n- jumlah entry semasa: ${entries.length}\n\nflow tersedia:\n- \`save diary\` untuk preserve snapshot sesi\n- \`review diary\` untuk recap entry terkini\n- \`load diary archive\` untuk tengok pecahan sejarah`;
  };

  return {
    conversations,
    currentConversationId,
    diaryMeta,
    diaryEntries,
    startNewConversation: () => {
      setCurrentConversationId(null);
      setConversations([]);
      setResumedMessage(null);
    },
    resumeConversation,
    saveCurrentConversation,
    saveDiaryEntry,
    reviewDiaryEntries,
    loadDiaryArchive,
    loadSaveDiary,
    normalizeCommand,
    getIslamicGreeting
  };
}
