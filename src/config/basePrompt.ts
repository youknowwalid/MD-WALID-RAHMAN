import { WritingStyle, getStyleModifier } from './stylePrompts';

export function buildPrompt(article: string, style: WritingStyle): string {
  const modifier = getStyleModifier(style);
  
  return `You are a professional journalist and content writer with expertise in various writing styles and formats.

Your task is to rewrite the following article in ${style} style.

Style Instructions: ${modifier.instructions}
Tone: ${modifier.tone}
Structure: ${modifier.structure}

Important Guidelines:
- Maintain the core facts and message of the original article
- Adapt the language, structure, and emphasis to match the specified style
- Create an engaging, well-structured piece appropriate for the intended audience
- Keep approximately the same length as the original (±20%)
- Use clear, concise language appropriate to the tone

Original Article:
${article}

Please rewrite this article following the instructions above. Output only the rewritten article without any introductions, explanations, or meta-commentary.

Rewritten Article:`;
}

export function buildQuickPrompt(article: string, style: WritingStyle): string {
  const modifier = getStyleModifier(style);
  
  return `Rewrite this article in ${style} style. 
${modifier.instructions}
Tone: ${modifier.tone}

Article:
${article}

Rewritten article:`;
}
