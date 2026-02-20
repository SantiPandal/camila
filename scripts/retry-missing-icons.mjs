import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.argv[2];
const OUT_DIR = path.resolve('assets/icons');
const MODEL = 'gemini-2.5-flash-image';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const STYLE = 'The background is white. Make the icon in a colorful and tactile 3D claymorphism style, soft matte finish, rounded shapes, subtle shadows. No text. No labels.';

const icons = [
  { name: 'icon-camera', prompt: `An icon representing a vintage camera. ${STYLE}` },
  { name: 'icon-wine-red', prompt: `An icon representing an elegant red wine glass with deep red wine inside. ${STYLE}` },
];

async function generateIcon(icon) {
  console.log(`  Generating: ${icon.name}...`);

  const response = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: icon.prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { aspectRatio: '1:1' },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);

  if (!imagePart) {
    throw new Error(`No image in response for ${icon.name}`);
  }

  const rawPath = path.join(OUT_DIR, `${icon.name}-raw.png`);
  const finalPath = path.join(OUT_DIR, `${icon.name}.png`);

  fs.writeFileSync(rawPath, Buffer.from(imagePart.inlineData.data, 'base64'));

  try {
    execSync(`magick "${rawPath}" -fuzz 18% -transparent white -trim +repage -resize 512x512 "${finalPath}"`);
    fs.unlinkSync(rawPath);
    console.log(`  Done: ${icon.name}.png (bg removed)`);
  } catch {
    fs.renameSync(rawPath, finalPath);
    console.log(`  Done: ${icon.name}.png (raw)`);
  }
}

async function main() {
  if (!API_KEY) {
    console.error('No API key found');
    process.exit(1);
  }
  console.log(`Retrying ${icons.length} missing icons...\n`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const icon of icons) {
    try {
      await generateIcon(icon);
    } catch (err) {
      console.error(`  FAIL ${icon.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone!');
}

main();
