/**
 * topicScreen — which response family a note asks for.
 *
 * Runs only AFTER `safetyScreen` has declined to flag the note. It can
 * never override safety, and it never returns anything that changes the
 * gentle-mode contract.
 *
 * Deterministic in full: priority order decides between competing
 * topics, and within a topic the first phrase in the list decides. The
 * same note always yields the same topic.
 */
import { normalize } from "../safety/screen";
import { TOPIC_LEXICON, TOPIC_PRIORITY, type TopicKey } from "./lexicon";

export interface TopicMatch {
  topic: TopicKey;
  matched: string;
}

function findPhrase(words: string[], phraseWords: string[]): boolean {
  outer: for (let i = 0; i + phraseWords.length <= words.length; i++) {
    for (let j = 0; j < phraseWords.length; j++) {
      if (words[i + j] !== phraseWords[j]) continue outer;
    }
    return true;
  }
  return false;
}

export function topicScreen(note?: string): TopicMatch | null {
  if (!note || !note.trim()) return null;
  const words = normalize(note).split(" ").filter(Boolean);
  if (words.length === 0) return null;

  for (const topic of TOPIC_PRIORITY) {
    for (const phrase of TOPIC_LEXICON[topic]) {
      if (findPhrase(words, normalize(phrase).split(" "))) {
        return { topic, matched: phrase };
      }
    }
  }
  return null;
}
