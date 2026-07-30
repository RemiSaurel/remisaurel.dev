import type { Board, PieceId, PieceState } from '~/tetris/tetris'
import { useDocumentVisibility, useLocalStorage, useRafFn } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  BUFFER_ROWS,
  clearFullRows,
  collides,
  createBag,
  createEmptyBoard,
  gravityIntervalMs,
  hardDropDistance,
  lineScore,
  lockPiece,
  pieceAbsoluteCells,
  spawnPiece,
  tryMove,
  tryRotate,
  VISIBLE_ROWS,
} from '~/tetris/tetris'

export type TetrisStatus = 'ready' | 'playing' | 'paused' | 'clearing' | 'over'

export interface DisplayCell {
  id: PieceId
  ghost: boolean
}

const CLEAR_ANIMATION_MS = 160

export function useTetrisGame() {
  const board = ref<Board>(createEmptyBoard())
  const bag = ref<PieceId[]>([])
  const current = ref<PieceState | null>(null)
  const next = ref<PieceId | null>(null)
  const status = ref<TetrisStatus>('ready')
  const score = ref(0)
  const lines = ref(0)
  const clearingRows = ref<number[]>([])
  const held = ref<PieceId | null>(null)
  /** A piece can only be swapped to hold once per drop, resets when the next piece spawns. */
  const canHold = ref(true)
  const bestScore = useLocalStorage('tetris-best-score', 0)

  const level = computed(() => Math.floor(lines.value / 10) + 1)

  const ghost = computed(() => {
    if (!current.value || status.value !== 'playing')
      return null
    return hardDropDistance(board.value, current.value).piece
  })

  /** Locked board + falling piece + ghost, sliced to the 20 visible rows for rendering. */
  const displayGrid = computed<(DisplayCell | null)[][]>(() => {
    const rows = board.value
      .slice(BUFFER_ROWS)
      .map(row => row.map(id => (id ? { id, ghost: false } : null)))

    const paint = (piece: PieceState | null, isGhost: boolean) => {
      if (!piece)
        return
      for (const [r, c] of pieceAbsoluteCells(piece)) {
        const vr = r - BUFFER_ROWS
        if (vr < 0 || vr >= VISIBLE_ROWS)
          continue
        if (isGhost && rows[vr][c])
          continue
        rows[vr][c] = { id: piece.id, ghost: isGhost }
      }
    }

    paint(ghost.value, true)
    paint(current.value, false)
    return rows
  })

  const clearingRowsVisible = computed(() => clearingRows.value.map(r => r - BUFFER_ROWS))

  let gravityElapsed = 0
  const { pause: pauseLoop, resume: resumeLoop } = useRafFn(({ delta }) => {
    if (status.value !== 'playing')
      return
    gravityElapsed += delta ?? 0
    if (gravityElapsed >= gravityIntervalMs(level.value)) {
      gravityElapsed = 0
      gravityStep()
    }
  }, { immediate: false })

  function drawFromBag(): PieceId {
    if (bag.value.length === 0)
      bag.value = createBag()
    return bag.value.shift()!
  }

  function spawnNext() {
    const id = next.value ?? drawFromBag()
    next.value = drawFromBag()
    const piece = spawnPiece(id)
    canHold.value = true
    if (collides(board.value, piece)) {
      current.value = null
      status.value = 'over'
      if (score.value > bestScore.value)
        bestScore.value = score.value
      pauseLoop()
      return
    }
    current.value = piece
  }

  function holdPiece() {
    if (status.value !== 'playing' || !current.value || !canHold.value)
      return
    const currentId = current.value.id

    if (held.value === null) {
      held.value = currentId
      spawnNext()
    }
    else {
      const swapped = spawnPiece(held.value)
      held.value = currentId
      // The held piece can't fit at spawn — extremely unlikely, but end cleanly rather than corrupt state.
      if (collides(board.value, swapped)) {
        current.value = null
        status.value = 'over'
        if (score.value > bestScore.value)
          bestScore.value = score.value
        pauseLoop()
        return
      }
      current.value = swapped
    }

    // spawnNext() resets this for the freshly spawned piece; a hold-swap itself still counts as used.
    canHold.value = false
  }

  function lockCurrent() {
    if (!current.value)
      return
    board.value = lockPiece(board.value, current.value)
    current.value = null

    const { board: cleared, rows } = clearFullRows(board.value)
    if (rows.length === 0) {
      spawnNext()
      return
    }

    status.value = 'clearing'
    clearingRows.value = rows
    score.value += lineScore(rows.length, level.value)
    lines.value += rows.length

    setTimeout(() => {
      board.value = cleared
      clearingRows.value = []
      status.value = 'playing'
      spawnNext()
    }, CLEAR_ANIMATION_MS)
  }

  function gravityStep() {
    if (status.value !== 'playing' || !current.value)
      return
    const moved = tryMove(board.value, current.value, 1, 0)
    if (moved)
      current.value = moved
    else
      lockCurrent()
  }

  function softDropInput() {
    if (status.value !== 'playing' || !current.value)
      return
    const moved = tryMove(board.value, current.value, 1, 0)
    if (moved) {
      current.value = moved
      score.value += 1
      gravityElapsed = 0
    }
  }

  function moveHorizontal(dir: -1 | 1) {
    if (status.value !== 'playing' || !current.value)
      return
    const moved = tryMove(board.value, current.value, 0, dir)
    if (moved)
      current.value = moved
  }

  function rotate(dir: 1 | -1) {
    if (status.value !== 'playing' || !current.value)
      return
    const rotated = tryRotate(board.value, current.value, dir)
    if (rotated)
      current.value = rotated
  }

  function hardDrop() {
    if (status.value !== 'playing' || !current.value)
      return
    const { piece, distance } = hardDropDistance(board.value, current.value)
    current.value = piece
    score.value += distance * 2
    lockCurrent()
  }

  function start() {
    board.value = createEmptyBoard()
    bag.value = []
    current.value = null
    next.value = drawFromBag()
    held.value = null
    canHold.value = true
    score.value = 0
    lines.value = 0
    clearingRows.value = []
    gravityElapsed = 0
    status.value = 'playing'
    spawnNext()
    resumeLoop()
  }

  function resetToReady() {
    pauseLoop()
    board.value = createEmptyBoard()
    bag.value = []
    current.value = null
    next.value = null
    held.value = null
    canHold.value = true
    score.value = 0
    lines.value = 0
    clearingRows.value = []
    status.value = 'ready'
  }

  function pause() {
    if (status.value !== 'playing')
      return
    status.value = 'paused'
    pauseLoop()
  }

  function resume() {
    if (status.value !== 'paused')
      return
    status.value = 'playing'
    resumeLoop()
  }

  function togglePause() {
    status.value === 'paused' ? resume() : pause()
  }

  /** Unconditionally halts the gravity loop, regardless of status — for when the game is closed/hidden. */
  function stop() {
    pauseLoop()
  }

  // Pieces don't keep falling while the tab is in the background.
  const visibility = useDocumentVisibility()
  watch(visibility, (value) => {
    if (value === 'hidden')
      pause()
  })

  onBeforeUnmount(pauseLoop)

  return {
    status,
    score,
    lines,
    level,
    bestScore,
    displayGrid,
    clearingRowsVisible,
    next,
    held,
    start,
    resetToReady,
    pause,
    resume,
    stop,
    togglePause,
    moveLeft: () => moveHorizontal(-1),
    moveRight: () => moveHorizontal(1),
    softDropInput,
    hardDrop,
    holdPiece,
    rotateCW: () => rotate(1),
    rotateCCW: () => rotate(-1),
  }
}
