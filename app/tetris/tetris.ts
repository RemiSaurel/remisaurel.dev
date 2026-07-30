export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export type Cell = readonly [row: number, col: number]

export interface PieceState {
  id: PieceId
  rotation: 0 | 1 | 2 | 3
  row: number
  col: number
}

export type Board = (PieceId | null)[][]

export const BOARD_COLS = 10
export const VISIBLE_ROWS = 20
export const BUFFER_ROWS = 2
export const BOARD_ROWS = VISIBLE_ROWS + BUFFER_ROWS

interface PieceDef {
  size: number
  cells: Cell[]
}

/**
 * Spawn-orientation cells within an N x N bounding box (N = def.size). The other
 * three rotation states are derived from these at runtime via `rotatedCells`,
 * rather than hand-transcribed, so every state is guaranteed geometrically consistent.
 */
const PIECE_DEFS: Record<PieceId, PieceDef> = {
  I: { size: 4, cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
  O: { size: 2, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  T: { size: 3, cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  S: { size: 3, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  J: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  L: { size: 3, cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },
}

export const PIECE_IDS = Object.keys(PIECE_DEFS) as PieceId[]

export function pieceShape(id: PieceId): PieceDef {
  return PIECE_DEFS[id]
}

function rotateCellsCW(cells: Cell[], size: number): Cell[] {
  return cells.map(([r, c]) => [c, size - 1 - r] as Cell)
}

function rotatedCells(id: PieceId, rotation: number): Cell[] {
  const def = PIECE_DEFS[id]
  let cells = def.cells
  for (let i = 0; i < rotation; i++)
    cells = rotateCellsCW(cells, def.size)
  return cells
}

export function pieceAbsoluteCells(piece: PieceState): Cell[] {
  return rotatedCells(piece.id, piece.rotation).map(([r, c]) => [piece.row + r, piece.col + c] as Cell)
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLS }).fill(null))
}

/** Fisher-Yates shuffle of one of each piece, guildeline "7-bag" randomizer. */
export function createBag(): PieceId[] {
  const bag = [...PIECE_IDS]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

export function spawnPiece(id: PieceId): PieceState {
  const { size } = PIECE_DEFS[id]
  return { id, rotation: 0, row: 0, col: Math.floor((BOARD_COLS - size) / 2) }
}

export function collides(board: Board, piece: PieceState): boolean {
  return pieceAbsoluteCells(piece).some(([r, c]) => {
    if (c < 0 || c >= BOARD_COLS || r >= BOARD_ROWS)
      return true
    if (r < 0)
      return false
    return board[r][c] !== null
  })
}

export function tryMove(board: Board, piece: PieceState, dr: number, dc: number): PieceState | null {
  const candidate: PieceState = { ...piece, row: piece.row + dr, col: piece.col + dc }
  return collides(board, candidate) ? null : candidate
}

/** Naive wall kick: try the natural rotation, then nudge up to two columns either way. */
const KICK_OFFSETS = [0, -1, 1, -2, 2]

export function tryRotate(board: Board, piece: PieceState, dir: 1 | -1): PieceState | null {
  const rotation = ((piece.rotation + dir + 4) % 4) as PieceState['rotation']
  for (const dc of KICK_OFFSETS) {
    const candidate: PieceState = { ...piece, rotation, col: piece.col + dc }
    if (!collides(board, candidate))
      return candidate
  }
  return null
}

export function hardDropDistance(board: Board, piece: PieceState): { piece: PieceState, distance: number } {
  let current = piece
  let distance = 0
  while (true) {
    const moved = tryMove(board, current, 1, 0)
    if (!moved)
      break
    current = moved
    distance++
  }
  return { piece: current, distance }
}

export function lockPiece(board: Board, piece: PieceState): Board {
  const next = board.map(row => [...row])
  for (const [r, c] of pieceAbsoluteCells(piece)) {
    if (r >= 0 && r < BOARD_ROWS)
      next[r][c] = piece.id
  }
  return next
}

export function clearFullRows(board: Board): { board: Board, rows: number[] } {
  const rows: number[] = []
  board.forEach((row, index) => {
    if (row.every(cell => cell !== null))
      rows.push(index)
  })
  if (rows.length === 0)
    return { board, rows }

  const remaining = board.filter((_, index) => !rows.includes(index))
  const cleared = Array.from({ length: rows.length }, () => Array.from({ length: BOARD_COLS }).fill(null))
  return { board: [...cleared, ...remaining], rows }
}

const LINE_SCORES = [0, 100, 300, 500, 800]

export function lineScore(clearedLines: number, level: number): number {
  return (LINE_SCORES[clearedLines] ?? 0) * level
}

export function gravityIntervalMs(level: number): number {
  return Math.max(80, 1000 - (level - 1) * 75)
}
