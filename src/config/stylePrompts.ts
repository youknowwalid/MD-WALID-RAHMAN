export interface StyleModifier {
  instructions: string;
  tone: string;
  structure: string;
}

export type WritingStyle = 'editorial' | 'breaking-news' | 'opinion' | 'feature' | 'analysis';

export const styleModifiers: Record<WritingStyle, StyleModifier> = {
  editorial: {
    instructions: 'Write in editorial voice with balanced perspective, presenting multiple viewpoints fairly. Include context about why this matters.',
    tone: 'professional, thoughtful, objective',
    structure: 'Strong opening hook, provide context, analyze different perspectives, discuss implications, balanced conclusion'
  },
  'breaking-news': {
    instructions: 'Concise and immediate. Lead with the most important facts first. Focus on the core story. Update format - what happened, why it matters, what\'s next.',
    tone: 'urgent, factual, direct, compelling',
    structure: 'Lead with 5Ws+H (Who, What, When, Where, Why, How), then supporting details, key quotes, latest developments'
  },
  opinion: {
    instructions: 'Present a clear argument with supporting evidence. Include personal perspective but remain credible. Build a persuasive case with specific examples.',
    tone: 'persuasive, authoritative, engaging, confident',
    structure: 'Strong thesis, establish credibility, present main arguments with evidence, address counterarguments, powerful conclusion'
  },
  feature: {
    instructions: 'Narrative-driven with human interest. Tell a compelling story with specific details, anecdotes, and quotes. Make readers connect emotionally.',
    tone: 'engaging, descriptive, immersive, personal',
    structure: 'Compelling hook/scene, introduce characters and context, develop narrative with specific details and dialogue, insights and resolution'
  },
  analysis: {
    instructions: 'Provide deep analysis with data, trends, and implications. Explain complex topics clearly. Reference specific facts and evidence.',
    tone: 'analytical, evidence-based, informed, nuanced',
    structure: 'Clear explanation of context, present data and trends, interpret what it means, discuss broader implications and future outlook'
  }
};

export function getStyleModifier(style: WritingStyle): StyleModifier {
  return styleModifiers[style] || styleModifiers.editorial;
}
