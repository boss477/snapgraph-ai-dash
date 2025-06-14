
import React from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface QuickQuestionsProps {
  columns: any[];
  isDarkMode: boolean;
  onQuestionClick: (question: string) => void;
}

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({ columns, isDarkMode, onQuestionClick }) => {
  const quickQuestions = [
    "Give me an overview of this data",
    "What columns do we have?",
    "Analyze patterns in my data",
    columns.length > 0 ? `Show unique values in ${columns[0].label}` : "What are the column types?"
  ];

  return (
    <div className={`px-4 py-2 ${isDarkMode ? 'border-t border-gray-700' : 'border-t'}`}>
      <div className="flex flex-wrap gap-2 mb-3">
        {quickQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onQuestionClick(question)}
            className={`text-xs ${isDarkMode ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : ''}`}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            {question.length > 30 ? question.substring(0, 30) + '...' : question}
          </Button>
        ))}
      </div>
    </div>
  );
};
