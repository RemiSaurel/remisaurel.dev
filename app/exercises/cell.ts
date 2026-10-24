import type { ExpectedPart } from '~/utils/labelMatch'

// The exercise of the exploration on drawing as an answer: a biology question where a drawing is the
// natural answer. The parts are my choice for an animal cell, not a curriculum.
export const CELL_PROMPT = 'Draw a living cell and its main parts.'

// The app of the learners is in French, so each part also accepts its French name
export const CELL_PARTS: ExpectedPart[] = [
  { id: 'membrane', name: 'Cell membrane', accepts: ['cell membrane', 'plasma membrane', 'membrane', 'membrane plasmique', 'membrane cellulaire'] },
  { id: 'cytoplasm', name: 'Cytoplasm', accepts: ['cytoplasm', 'cytosol', 'cytoplasme'] },
  { id: 'nucleus', name: 'Nucleus', accepts: ['nucleus', 'noyau'] },
  { id: 'mitochondria', name: 'Mitochondria', accepts: ['mitochondria', 'mitochondrion', 'mitochondrie', 'mitochondries'] },
]
