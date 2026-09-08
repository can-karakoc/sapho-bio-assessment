import fs from 'fs';
import path from 'path';

/**
 * Knowledge base loader
 *
 * For MVP: Simple keyword matching to select relevant KB files
 * TODO: Replace with pgvector-based semantic retrieval for better relevance
 */

const KB_DIR = path.join(process.cwd(), 'knowledge');

interface KBFile {
  name: string;
  content: string;
  keywords: string[];
}

// Load all KB files on module initialization
let kbFiles: KBFile[] | null = null;

function loadKBFiles(): KBFile[] {
  if (kbFiles) return kbFiles;

  try {
    const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));

    kbFiles = files.map(filename => {
      const content = fs.readFileSync(path.join(KB_DIR, filename), 'utf-8');

      // Extract keywords from filename (simple heuristic)
      const keywords = filename
        .replace('.md', '')
        .split('-')
        .filter(k => k.length > 2); // Ignore very short words

      return { name: filename, content, keywords };
    });

    return kbFiles;
  } catch (error) {
    console.warn('Failed to load KB files:', error);
    return [];
  }
}

/**
 * Get relevant knowledge base context for a post
 *
 * @param postText - The LinkedIn post text to find relevant context for
 * @returns Concatenated relevant KB content
 */
export function getRelevantContext(postText: string): {
  context: string;
  sources: string[];
} {
  const files = loadKBFiles();
  const postLower = postText.toLowerCase();

  // Score each KB file by keyword matches
  const scoredFiles = files.map(file => {
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of file.keywords) {
      if (postLower.includes(keyword.toLowerCase())) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Boost score for content matches (partial relevance)
    const contentKeywords = ['503b', 'compounding', 'sterile', 'fda', 'usp', 'quality'];
    for (const kw of contentKeywords) {
      if (postLower.includes(kw)) {
        score += 0.5;
      }
    }

    return { file, score, matchedKeywords };
  });

  // Sort by score and take top matches
  scoredFiles.sort((a, b) => b.score - a.score);

  // Always include company facts and brand voice
  const mustInclude = ['sapho-bio-facts.md', 'brand-voice.md'];
  const topMatches = scoredFiles
    .filter(sf => sf.score > 0 || mustInclude.includes(sf.file.name))
    .slice(0, 3); // Limit to top 3 to keep context manageable

  const context = topMatches
    .map(sf => `\n--- ${sf.file.name} ---\n${sf.file.content}`)
    .join('\n\n');

  const sources = topMatches.map(sf => sf.file.name);

  return { context, sources };
}

/**
 * Get all knowledge base content (for when we want everything)
 */
export function getAllContext(): {
  context: string;
  sources: string[];
} {
  const files = loadKBFiles();

  const context = files
    .map(file => `\n--- ${file.name} ---\n${file.content}`)
    .join('\n\n');

  const sources = files.map(f => f.name);

  return { context, sources };
}
