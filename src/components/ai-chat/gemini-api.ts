
import { GEMINI_API_KEY } from './constants';

export const processQueryWithGemini = async (query: string, data: any[], columns: any[]): Promise<string> => {
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
