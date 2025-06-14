
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, Sparkles, Key, Moon, Sun } from 'lucide-react';
import { AIChatProps } from './ai-chat/types';
import { useMessages } from './ai-chat/useMessages';
import { MessageList } from './ai-chat/MessageList';
import { QuickQuestions } from './ai-chat/QuickQuestions';

export const AIChat: React.FC<AIChatProps> = ({ data, columns }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isProcessing, sendMessage } = useMessages(data, columns);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const themeClasses = isDarkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-white/70 backdrop-blur-sm text-gray-900';

  return (
    <Card className={`${themeClasses} border-0 shadow-lg h-[600px] flex flex-col transition-colors duration-200`}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span>AI Data Assistant</span>
            <Badge variant="secondary" className={`${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
              <Sparkles className="h-3 w-3 mr-1" />
              Gemini
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode ? 'border-gray-600 hover:bg-gray-800' : ''}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className={`${isDarkMode ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-50 text-green-700 border-green-200'}`}>
              <Key className="h-3 w-3 mr-1" />
              API Connected
            </Badge>
          </div>
        </CardTitle>

        {/* API Key Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Key className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">
              ✅ Gemini API Key Configured
            </span>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            AI-powered analysis is ready!
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <MessageList 
          messages={messages} 
          isProcessing={isProcessing} 
          isDarkMode={isDarkMode} 
        />
        <div ref={messagesEndRef} />

        <QuickQuestions 
          columns={columns} 
          isDarkMode={isDarkMode} 
          onQuestionClick={setInputValue} 
        />

        {/* Input */}
        <div className={`p-4 ${isDarkMode ? 'border-t border-gray-700 bg-gray-900/50' : 'border-t bg-white/50'}`}>
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your data... (e.g., 'What's the average sales?')"
              disabled={isProcessing}
              className={`flex-1 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : ''}`}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
