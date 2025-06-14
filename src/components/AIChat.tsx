
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Brain, User, BarChart3, Table, Lightbulb, Sparkles } from 'lucide-react';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello! I'm your AI data assistant. I can help you analyze your data with ${data.length} rows and ${columns.length} columns. Try asking me questions like:

• "What are the top 5 values in [column]?"
• "Show me the average of [numeric column]"
• "How many unique values are in [column]?"
• "Find records where [column] is greater than [value]"

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

  // Simple query processing (in a real app, this would use a proper NLP service)
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

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: processQuery(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1000);
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
    `How many rows are there?`,
    columns.length > 0 ? `Show me unique values in ${columns[0].label}` : "What are the column types?"
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Data Assistant</span>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Sparkles className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        </CardTitle>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && (
                    <Brain className="h-4 w-4 mt-0.5 text-purple-600" />
                  )}
                  {message.type === 'user' && (
                    <User className="h-4 w-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
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
              <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
                  <div className="text-sm text-gray-600">Analyzing your data...</div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-4 py-2 border-t">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(question)}
                className="text-xs"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                {question.length > 30 ? question.substring(0, 30) + '...' : question}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white/50">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your data... (e.g., 'What's the average sales?')"
              disabled={isProcessing}
              className="flex-1"
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
