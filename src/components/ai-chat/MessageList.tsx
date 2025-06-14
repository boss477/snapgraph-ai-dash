
import React from 'react';
import { Brain, User } from 'lucide-react';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
  isDarkMode: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing, isDarkMode }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${
              message.type === 'user'
                ? isDarkMode 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-100 border border-gray-700'
                  : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="flex items-start space-x-2">
              {message.type === 'ai' && (
                <Brain className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              )}
              {message.type === 'user' && (
                <User className="h-4 w-4 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' 
                    ? isDarkMode ? 'text-blue-300' : 'text-blue-200'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {isProcessing && (
        <div className="flex justify-start">
          <div className={`p-3 rounded-lg max-w-[80%] ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100'}`}>
            <div className="flex items-center space-x-2">
              <Brain className={`h-4 w-4 animate-pulse ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Analyzing with Gemini AI...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
