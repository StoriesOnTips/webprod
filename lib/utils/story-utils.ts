// lib/utils/story-utils.ts

export interface StoryChapter {
  chapterNumber: number;
  chapterTitle: string;
  storyText: string | { [language: string]: string };
  imagePrompt?: string;
  imageText?: string;
  difficultWords?: {
    word: string;
    meaning: string;
    pronunciation?: string;
    language?: string; // TODO: Make required in future versions to avoid fallback logic
  }[];
  vocabulary?: {
    word: string;
    translation: string;
    pronunciation?: string;
  }[];
  culturalNotes?: string;
}

// Get all difficult words from a story
export function extractDifficultWords(chapters: StoryChapter[]): Array<{ word: string; meaning: string; pronunciation?: string }> {
  const allWords: Array<{ word: string; meaning: string; pronunciation?: string }> = [];
  
  chapters.forEach(chapter => {
    if (chapter.difficultWords) {
      allWords.push(...chapter.difficultWords);
    }
    if (chapter.vocabulary) {
      // Convert vocabulary to difficult words format
      chapter.vocabulary.forEach(vocab => {
        allWords.push({
          word: vocab.word,
          meaning: vocab.translation,
          pronunciation: vocab.pronunciation,
        });
      });
    }
  });
  
  // Remove duplicates based on word
  const uniqueWords = allWords.filter((word, index, array) => 
    index === array.findIndex(w => w.word.toLowerCase() === word.word.toLowerCase())
  );
  
  return uniqueWords;
}

// Get story text for a specific language
export function getStoryTextForLanguage(
  storyText: string | { [language: string]: string },
  preferredLanguage?: string
): string {
  if (typeof storyText === "string") {
    return storyText;
  }
  
  if (preferredLanguage && storyText[preferredLanguage]) {
    return storyText[preferredLanguage];
  }
  
  // Fallback to first available language
  const languages = Object.keys(storyText);
  return languages.length > 0 ? storyText[languages[0]] : "";
}

// Get moral text for a specific language
export function getMoralForLanguage(
  moral: string | { [language: string]: string } | undefined,
  preferredLanguage?: string
): string {
  if (!moral) return "";
  
  if (typeof moral === "string") {
    return moral;
  }
  
  if (preferredLanguage && moral[preferredLanguage]) {
    return moral[preferredLanguage];
  }
  
  // Fallback to first available language
  const languages = Object.keys(moral);
  return languages.length > 0 ? moral[languages[0]] : "";
}

/**
 * Extracts the book title from a story, handling both string and locale-keyed object forms
 */
export function extractBookTitle(
  bookTitle: string | Record<string, string>,
  preferredLanguage?: string
): string {
  if (typeof bookTitle === "string") {
    return bookTitle;
  }

  // If it's an object, try to get the title in the preferred language first
  if (preferredLanguage && bookTitle[preferredLanguage]) {
    return bookTitle[preferredLanguage];
  }

  // Fallback to the first available title
  const firstValue = Object.values(bookTitle)[0];
  if (firstValue) {
    return firstValue;
  }

  // Final fallback
  return "Untitled Story";
}