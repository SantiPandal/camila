import { WineAnalysis } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const SOMMELIER_PROMPT = `You are a master sommelier. Analyze this wine bottle image and return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:

{
  "wine_name": "Full name of the wine",
  "wine_type": "red" or "white" or "rosé" or "sparkling",
  "vintage": "year or N/A",
  "region": "Region, Country",
  "region_emoji": "flag emoji of the country (e.g. 🇫🇷, 🇮🇹, 🇪🇸, 🇦🇷)",
  "grape": "Primary grape variety",
  "characteristics": {
    "aromas": ["aroma1", "aroma2"],
    "flavors": ["flavor1", "flavor2"],
    "body": "light" or "medium" or "full",
    "tannins": "low" or "medium" or "high",
    "acidity": "low" or "medium" or "high",
    "finish": "short" or "medium" or "long"
  },
  "decoys": {
    "aromas": ["wrong_aroma1", "wrong_aroma2"],
    "flavors": ["wrong_flavor1", "wrong_flavor2"]
  }
}

Rules:
- characteristics.aromas: exactly 3 aromas CORRECT for this specific wine
- characteristics.flavors: exactly 3 flavors CORRECT for this specific wine
- decoys.aromas: exactly 5 aromas PLAUSIBLE for wine but WRONG for this one
- decoys.flavors: exactly 5 flavors PLAUSIBLE for wine but WRONG for this one
- Make decoys tricky and believable
- Use lowercase for all aromas and flavors
- Be specific (e.g., "black cherry" not "cherry", "toasted oak" not "oak")`;

export async function analyzeWine(imageBase64: string): Promise<WineAnalysis> {
  if (!API_KEY) {
    throw new Error('Set EXPO_PUBLIC_GOOGLE_API_KEY in .env');
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          },
          { text: SOMMELIER_PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse wine analysis');

  return JSON.parse(jsonMatch[0]) as WineAnalysis;
}
