import * as FileSystem from 'expo-file-system';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const FEEDBACK_PROMPT = `You are processing a voice memo from a user of "Camila", a wine guessing game app.

The user is reporting a bug, suggesting an improvement, or giving general feedback.

Listen to this audio and write a clear, actionable summary in plain English. Format it as:

**Type**: [Bug Report / Feature Request / General Feedback]
**Summary**: [1-2 sentence description]
**Details**: [Bullet points of specifics mentioned]
**Steps to Reproduce** (if bug): [Numbered steps if applicable]

Keep it concise and developer-friendly so a coding agent can act on it directly.`;

export async function processVoiceFeedback(audioUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: 'base64',
  });

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'audio/m4a',
              data: base64,
            },
          },
          { text: FEEDBACK_PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
