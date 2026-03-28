// IJAM Conversation Management Hook
// Manages conversation state for IJAM with resume capability and Islamic greetings

import { useState } from 'react';

export function useIJAMConversation() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [resumedMessage, setResumedMessage] = useState(null);

  const getIslamicGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Assalamualaikum, selamat pagi :)';
    if (hour >= 12 && hour < 17) return 'Assalamualaikum, selamat tengah hari :)';
    if (hour >= 17 && hour < 20) return 'Assalamualaikum, selamat petang :)';
    return 'Assalamualaikum, selamat malam :)';
  };

  const resumeConversation = (conversationId) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    setCurrentConversationId(conversationId);
    setResumedMessage('Assalamualaikum! Jumpa lagi kita terus dari mana tadi :)');

    try {
      const saved = localStorage.getItem(`ijam_conversation_${conversationId}`);
      if (saved) {
        const savedData = JSON.parse(saved);
        setConversations(savedData.messages || []);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
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
    console.log('Conversation saved:', conversationData);
  };

  return {
    conversations,
    currentConversationId,
    startNewConversation: () => {
      setCurrentConversationId(null);
      setConversations([]);
      setResumedMessage(null);
    },
    resumeConversation,
    saveCurrentConversation,
    getIslamicGreeting
  };
}
