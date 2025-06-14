
import { useState } from 'react';
import { Message } from './types';
import { INITIAL_AI_MESSAGE } from './constants';
import { processQueryWithGemini } from './gemini-api';
import { processQuery } from './query-processor';

export const useMessages = (data: any[], columns: any[]) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: INITIAL_AI_MESSAGE
        .replace('{dataLength}', data.length.toString())
        .replace('{columnsLength}', columns.length.toString()),
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async (inputValue: string) => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      let aiResponse: string;
      
      // Try Gemini API first, fallback to simple processing
      aiResponse = await processQueryWithGemini(inputValue, data, columns);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    messages,
    isProcessing,
    sendMessage
  };
};
