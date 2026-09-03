// SehatAI — Expanded Corpus Index
// Merges all category-specific corpus files with the main corpus
// This allows the offline engine to search all topics

import { CORPUS } from '../corpus';
import { CARDIO_RESPIRATORY } from './cardio-respiratory';
import { GI_HEPATIC } from './gi-hepatic';
import { NEUROLOGY } from './neurology';

// Merge all corpus arrays
export const EXPANDED_CORPUS = [
  ...CORPUS,
  ...CARDIO_RESPIRATORY,
  ...GI_HEPATIC,
  ...NEUROLOGY,
];

// Re-export for convenience
export { CORPUS } from '../corpus';
