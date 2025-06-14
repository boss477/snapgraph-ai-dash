import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, User, BarChart3, Table, Lightbulb, Sparkles, Key, AlertCircle, Moon, Sun } from 'lucide-react';

// Your Gemini API Key
const GEMINI_API_KEY = "AIzaSyBaVbqz4lQoVba-PBNQC0mtnEvfBmZAHlI";

interface AIChatProps {
  data: any[];
  columns: any[];
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

export const AIChat: React.FC<AIChatProps> = ({ data, columns }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello! I'm your AI data assistant powered by Gemini. I can help you analyze your data with ${data.length} rows and ${columns.length} columns. 

Try asking me questions like:
• "What are the top 5 values in [column]?"
• "Show me the average of [numeric column]"
• "How many unique values are in [column]?"
• "Find records where [column] is greater than [value]"
• "Analyze trends in my data"
• "Give me insights about this dataset"

What would you like to explore?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced query processing with Gemini API
  const processQueryWithGemini = async (query: string): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      return "Please add your Gemini API key in the code to use AI-powered analysis.";
    }

    try {
      const dataContext = `
Dataset Context:
- Total rows: ${data.length}
- Total columns: ${columns.length}
- Column details: ${columns.map(col => `${col.label} (${col.type})`).join(', ')}
- Sample data: ${JSON.stringify(data.slice(0, 3), null, 2)}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a data scientist analyzing a dataset. Here's the context:

${dataContext}

User question: "${query}"

Please provide a helpful analysis or answer based on the data context provided. If the user is asking for specific calculations, provide the actual calculations. If they want insights, provide meaningful observations about the data structure and potential patterns. Be concise but informative.`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Gemini API error:', error);
      return "Sorry, I encountered an error while processing your request. Please check your API key and try again.";
    }
  };

  // Fallback to simple query processing
  const processQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Find column mentioned in query
    const mentionedColumn = columns.find(col => 
      lowerQuery.includes(col.key.toLowerCase()) || 
      lowerQuery.includes(col.label.toLowerCase())
    );

    try {
      // Count queries
      if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
        if (mentionedColumn) {
          const nonNullValues = data.filter(row => 
            row[mentionedColumn.key] !== null && 
            row[mentionedColumn.key] !== undefined && 
            row[mentionedColumn.key] !== ''
          ).length;
          return `There are ${nonNullValues} non-empty values in "${mentionedColumn.label}" column.`;
        }
        return `Your dataset contains ${data.length} total rows across ${columns.length} columns.`;
      }

      // Average queries
      if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
        if (mentionedColumn && mentionedColumn.type === 'number') {
          const values = data.map(row => Number(row[mentionedColumn.key])).filter(val => !isNaN(val));
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          return `The average value in "${mentionedColumn.label}" is ${avg.toFixed(2)}.`;
        }
        return 'Please specify a numeric column to calculate the average.';
      }

      // Sum queries
      if (lowerQuery.includes('sum') || lowerQuery.includes('total')) {
        if (mentionedColumn && mentionedColumn.type === 'number') {
          const values = data.map(row => Number(row[mentionedColumn.key])).filter(val => !isNaN(val));
          const sum = values.reduce((a, b) => a + b, 0);
          return `The total sum of "${mentionedColumn.label}" is ${sum.toLocaleString()}.`;
        }
        return 'Please specify a numeric column to calculate the sum.';
      }

      // Min/Max queries
      if (lowerQuery.includes('maximum') || lowerQuery.includes('max') || lowerQuery.includes('highest')) {
        if (mentionedColumn && mentionedColumn.type === 'number') {
          const values = data.map(row => Number(row[mentionedColumn.key])).filter(val => !isNaN(val));
          const max = Math.max(...values);
          return `The maximum value in "${mentionedColumn.label}" is ${max.toLocaleString()}.`;
        }
        return 'Please specify a numeric column to find the maximum value.';
      }

      if (lowerQuery.includes('minimum') || lowerQuery.includes('min') || lowerQuery.includes('lowest')) {
        if (mentionedColumn && mentionedColumn.type === 'number') {
          const values = data.map(row => Number(row[mentionedColumn.key])).filter(val => !isNaN(val));
          const min = Math.min(...values);
          return `The minimum value in "${mentionedColumn.label}" is ${min.toLocaleString()}.`;
        }
        return 'Please specify a numeric column to find the minimum value.';
      }

      // Top values queries
      if (lowerQuery.includes('top') || lowerQuery.includes('most common')) {
        if (mentionedColumn) {
          const valueCounts: Record<string, number> = {};
          data.forEach(row => {
            const value = String(row[mentionedColumn.key] || 'Unknown');
            valueCounts[value] = (valueCounts[value] || 0) + 1;
          });
          
          const topValues = Object.entries(valueCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([value, count]) => `${value}: ${count}`)
            .join('\n');
            
          return `Top values in "${mentionedColumn.label}":\n${topValues}`;
        }
        return 'Please specify a column to find the top values.';
      }

      // Unique values queries
      if (lowerQuery.includes('unique') || lowerQuery.includes('distinct')) {
        if (mentionedColumn) {
          const uniqueValues = new Set(data.map(row => row[mentionedColumn.key]).filter(val => 
            val !== null && val !== undefined && val !== ''
          ));
          return `There are ${uniqueValues.size} unique values in "${mentionedColumn.label}" column.`;
        }
        return 'Please specify a column to count unique values.';
      }

      // Column information
      if (lowerQuery.includes('columns') || lowerQuery.includes('fields')) {
        const columnsByType = columns.reduce((acc, col) => {
          acc[col.type] = (acc[col.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const typeInfo = Object.entries(columnsByType)
          .map(([type, count]) => `${count} ${type}`)
          .join(', ');
          
        return `Your dataset has ${columns.length} columns: ${typeInfo}.\n\nColumns: ${columns.map(c => c.label).join(', ')}.`;
      }

      // Data overview
      if (lowerQuery.includes('overview') || lowerQuery.includes('summary') || lowerQuery.includes('describe')) {
        const numericCols = columns.filter(c => c.type === 'number').length;
        const textCols = columns.filter(c => c.type === 'text').length;
        const dateCols = columns.filter(c => c.type === 'date').length;
        
        return `Dataset Overview:
• ${data.length} total rows
• ${columns.length} columns (${numericCols} numeric, ${textCols} text, ${dateCols} date)
• Numeric columns: ${columns.filter(c => c.type === 'number').map(c => c.label).join(', ') || 'None'}
• Text columns: ${columns.filter(c => c.type === 'text').map(c => c.label).join(', ') || 'None'}`;
      }

      // Default response with suggestions
      const availableColumns = columns.map(c => c.label).slice(0, 3).join(', ');
      return `I'd be happy to help! Try asking about specific columns like "${availableColumns}" or ask for an overview of your data. You can also ask for averages, sums, counts, or top values for any column.`;

    } catch (error) {
      console.error('Query processing error:', error);
      return 'I encountered an error processing your question. Please try rephrasing it or ask for help with a specific column.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      let aiResponse: string;
      
      if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
        aiResponse = await processQueryWithGemini(inputValue);
      } else {
        // Fallback to simple processing
        aiResponse = processQuery(inputValue);
      }

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Give me an overview of this data",
    "What columns do we have?",
    "Analyze patterns in my data",
    columns.length > 0 ? `Show unique values in ${columns[0].label}` : "What are the column types?"
  ];

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
        {/* Messages */}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className={`px-4 py-2 ${isDarkMode ? 'border-t border-gray-700' : 'border-t'}`}>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(question)}
                className={`text-xs ${isDarkMode ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : ''}`}
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                {question.length > 30 ? question.substring(0, 30) + '...' : question}
              </Button>
            ))}
          </div>
        </div>

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
