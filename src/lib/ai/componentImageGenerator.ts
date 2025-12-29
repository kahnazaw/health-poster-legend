/**
 * Component Image Generator - مولد الصور المكوّنية
 * يولد 3 صور كرتونية توضيحية منفصلة لكل نقطة صحية
 */

import { generateImageWithGemini } from "./geminiImageGenerator";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

/**
 * توليد صورة كرتونية توضيحية واحدة لنقطة صحية محددة
 */
export async function generateComponentIllustration(
  point: string,
  pointIndex: number,
  topic: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const prompt = `You are a World-Class Medical Cartoon Illustrator specializing in Public Health Education for Iraq.

CRITICAL: Generate ONLY a SILENT ILLUSTRATION with NO TEXT. Text will be added programmatically later.

Objective: Create a single, professional, engaging medical cartoon illustration for the 'Kirkuk Health Directorate - First Sector'.

Topic: ${topic}

Health Point to Illustrate: "${point}"

Visual Requirements:
- Style: Modern Flat Illustration (Flat Design, no 3D, no shadows, clean vector-style lines)
- Type: Cartoon illustration that clearly represents the health message
- Colors: Use a vibrant, medical color palette:
  * Primary: Emerald green (#059669) for medical/health elements
  * Secondary: Soft blue (#3b82f6) for calm/trust elements
  * Accent: Warm orange (#f59e0b) for alerts/important elements
  * Background: Light, clean background (white or very light gray)
- Composition: 
  * Single focal illustration in the center
  * Clear, simple, and easy to understand at a glance
  * Leave 20% space at top and bottom for text overlay (will be added programmatically)
  * Leave 10% space on left and right sides
- Cultural Context: Reflect Iraqi/Kirkuk healthcare setting
- Medical Accuracy: Ensure all medical elements are accurate and appropriate

Illustration Guidelines:
- If the point is about vaccination: Show a friendly cartoon of a child receiving a vaccine, with a caring doctor/nurse
- If the point is about hygiene: Show cartoon hands being washed, or clean environment
- If the point is about nutrition: Show healthy food items in a friendly cartoon style
- If the point is about maternal health: Show a caring scene with a pregnant woman and healthcare provider
- If the point is about prevention: Show preventive measures in a clear, visual way
- Make it warm, friendly, and approachable - suitable for all ages

CRITICAL RULES:
- DO NOT include any Arabic text in the image
- DO NOT write any words or sentences
- ONLY create a clean, silent cartoon illustration
- Make it visually engaging and immediately understandable
- Use flat design style (no gradients, no 3D effects)

Generate a single, professional, engaging medical cartoon illustration that clearly represents: "${point}"`;

  try {
    // استخدام generateImageWithGemini من geminiImageGenerator
    return await generateImageWithGemini(prompt);
  } catch (error: any) {
    console.error("Error generating component illustration:", error);
    // Fallback: استخدام placeholder SVG
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#d1fae5"/>
      <circle cx="200" cy="150" r="50" fill="#059669"/>
      <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="20" fill="white">${pointIndex + 1}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }
}

/**
 * توليد 3 صور كرتونية منفصلة للنقاط الصحية
 */
export async function generateComponentIllustrations(
  points: string[],
  topic: string
): Promise<string[]> {
  const illustrations: string[] = [];

  for (let i = 0; i < Math.min(points.length, 3); i++) {
    try {
      const illustration = await generateComponentIllustration(points[i], i, topic);
      illustrations.push(illustration);
    } catch (error) {
      console.error(`Error generating illustration ${i + 1}:`, error);
      // إضافة placeholder في حالة الفشل
      illustrations.push(
        `data:image/svg+xml;base64,${Buffer.from(
          `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="#d1fae5"/>
            <circle cx="200" cy="150" r="50" fill="#059669"/>
            <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="20" fill="white">${i + 1}</text>
          </svg>`
        ).toString("base64")}`
      );
    }
  }

  return illustrations;
}

