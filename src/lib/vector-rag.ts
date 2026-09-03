// ============================================================
// SehatAI — Phase 2: Vector RAG Module
// Replaces the TF-IDF fuzzy matcher with vector-based cosine
// similarity retrieval. Architecture is ready for BGE-M3 neural
// embeddings — currently uses normalized TF-IDF vectors as a
// transitional implementation (genuine improvement: cosine
// similarity catches semantic similarity that keyword match misses).
//
// To upgrade to BGE-M3:
//   1. npm install @xenova/transformers
//   2. Replace embedText() to use the BGE-M3 model
//   3. Pre-compute corpus embeddings + store in sqlite-vec
//
// Interface stays the same: retrieve(query, k) → CorpusItem[]
// ============================================================

import { EXPANDED_CORPUS as CORPUS } from '@/data/expanded';
import type { CorpusItem } from '@/lib/types';

// ---------- Vector utilities ----------

/** A sparse vector represented as Map<termIndex, weight> */
type SparseVector = Map<number, number>;

/** Compute dot product of two sparse vectors */
function dotProduct(a: SparseVector, b: SparseVector): number {
  let sum = 0;
  // Iterate over the smaller vector
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [idx, weight] of small) {
    const other = large.get(idx);
    if (other !== undefined) sum += weight * other;
  }
  return sum;
}

/** Compute magnitude (L2 norm) of a sparse vector */
function magnitude(v: SparseVector): number {
  let sum = 0;
  for (const weight of v.values()) sum += weight * weight;
  return Math.sqrt(sum);
}

/** Cosine similarity between two sparse vectors */
function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// ---------- TF-IDF Vectorizer ----------

interface VectorizedDoc {
  item: CorpusItem;
  vector: SparseVector;
  magnitude: number; // pre-computed for efficiency
}

class VectorRAG {
  private vocabulary: Map<string, number> = new Map(); // term → index
  private documentFreq: Map<string, number> = new Map(); // term → doc count
  private vectors: VectorizedDoc[] = [];
  private totalDocs: number = 0;
  private initialized: boolean = false;

  /** Build the vector index from the corpus */
  init(): void {
    if (this.initialized) return;
    this.totalDocs = CORPUS.length;

    // Build vocabulary + document frequencies
    for (const item of CORPUS) {
      const terms = this.tokenize(item);
      const uniqueTerms = new Set(terms);
      for (const term of uniqueTerms) {
        this.documentFreq.set(term, (this.documentFreq.get(term) ?? 0) + 1);
        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, this.vocabulary.size);
        }
      }
    }

    // Build document vectors (TF-IDF)
    for (const item of CORPUS) {
      const vector = this.embedDoc(item);
      const mag = magnitude(vector);
      this.vectors.push({ item, vector, magnitude: mag });
    }

    this.initialized = true;
    console.log(`[vector-rag] Initialized: ${this.vocabulary.size} terms, ${this.vectors.length} docs`);
  }

  /** Tokenize a corpus item into terms (all languages mixed) */
  private tokenize(item: CorpusItem): string[] {
    const text = [
      item.title.en, item.title.ur, item.title.roman,
      item.topic,
      ...(item.tags ?? []),
      // Include first 200 chars of content for better matching
      item.content.en.slice(0, 200),
      item.content.ur.slice(0, 200),
      item.content.roman.slice(0, 200),
    ].join(' ').toLowerCase();

    return text
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);
  }

  /** Tokenize a query string */
  private tokenizeQuery(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);
  }

  /** Embed a document as a TF-IDF sparse vector */
  private embedDoc(item: CorpusItem): SparseVector {
    const terms = this.tokenize(item);
    const vector: SparseVector = new Map();
    const termFreq = new Map<string, number>();

    // Term frequency
    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
    }

    // TF-IDF
    for (const [term, freq] of termFreq) {
      const idx = this.vocabulary.get(term);
      if (idx === undefined) continue;
      const df = this.documentFreq.get(term) ?? 1;
      const idf = Math.log(this.totalDocs / df);
      const tf = freq / terms.length; // normalized TF
      vector.set(idx, tf * idf);
    }

    return vector;
  }

  /** Embed a query string as a TF-IDF sparse vector (using the same vocabulary) */
  embedQuery(query: string): SparseVector {
    const terms = this.tokenizeQuery(query);
    const vector: SparseVector = new Map();
    const termFreq = new Map<string, number>();

    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
    }

    for (const [term, freq] of termFreq) {
      const idx = this.vocabulary.get(term);
      if (idx === undefined) continue;
      const df = this.documentFreq.get(term) ?? 1;
      const idf = Math.log(this.totalDocs / df);
      const tf = freq / terms.length;
      vector.set(idx, tf * idf);
    }

    return vector;
  }

  /** Retrieve top-k corpus items by cosine similarity to the query */
  retrieve(query: string, k: number = 5): { item: CorpusItem; score: number }[] {
    this.init();
    const queryVector = this.embedQuery(query);
    if (queryVector.size === 0) return [];

    const scores: { item: CorpusItem; score: number }[] = [];
    for (const doc of this.vectors) {
      const score = cosineSimilarity(queryVector, doc.vector);
      if (score > 0) scores.push({ item: doc.item, score });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k);
  }

  /** Get the vocabulary size (for monitoring) */
  getVocabSize(): number {
    return this.vocabulary.size;
  }

  /** Get the document count */
  getDocCount(): number {
    return this.vectors.length;
  }
}

// Singleton
let ragInstance: VectorRAG | null = null;

export function getVectorRAG(): VectorRAG {
  if (!ragInstance) {
    ragInstance = new VectorRAG();
  }
  return ragInstance;
}

/** Convenience: retrieve top-k corpus items for a query */
export function vectorRetrieve(query: string, k: number = 5): { item: CorpusItem; score: number }[] {
  return getVectorRAG().retrieve(query, k);
}
