
import { Column } from './types';

export const processQuery = (query: string, data: any[], columns: Column[]): string => {
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
