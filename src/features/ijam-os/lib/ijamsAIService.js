// IJAM AI Service
// Multi-model AI service supporting Groq, local models (Ollama), and OpenRouter

import { enhancedLocalIntelligence } from '../../../lib/enhancedLocalIntelligence';

const AI_MODELS = {
  GROQ: 'groq',
  LOCAL: 'ollama',
  OPENROUTER: 'openrouter',
  FALLBACK: 'enhanced-local'
};

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

export { AI_MODELS, getIslamicGreeting };
