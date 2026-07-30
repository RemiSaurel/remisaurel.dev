<script setup lang="ts">
import type { PieceId } from '~/tetris/tetris'
import { useEventListener } from '@vueuse/core'
import { pieceShape } from '~/tetris/tetris'

const { isOpen, close } = useTetrisEasterEgg()
const {
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
  stop,
  togglePause,
  moveLeft,
  moveRight,
  softDropInput,
  hardDrop,
  holdPiece,
  rotateCW,
  rotateCCW,
} = useTetrisGame()

const panelRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

/**
 * 4x4 preview grid for the Hold/Next boxes. Pieces are centered on their actual
 * cell extent, not their nominal rotation bounding box — several pieces (T, S,
 * Z, J, L) only use 2 of the 3 rows in that box, which would render off-center.
 */
function previewGrid(id: PieceId | null) {
  if (!id)
    return []
  const { cells } = pieceShape(id)
  const rowIndices = cells.map(([r]) => r)
  const colIndices = cells.map(([, c]) => c)
  const minRow = Math.min(...rowIndices)
  const minCol = Math.min(...colIndices)
  const height = Math.max(...rowIndices) - minRow + 1
  const width = Math.max(...colIndices) - minCol + 1
  const rowOffset = Math.floor((4 - height) / 2) - minRow
  const colOffset = Math.floor((4 - width) / 2) - minCol

  const occupied = new Set(cells.map(([r, c]) => `${r + rowOffset}-${c + colOffset}`))
  return Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 4 }, (_, c) => (occupied.has(`${r}-${c}`) ? id : null)))
}

const heldPreview = computed(() => previewGrid(held.value))
const nextPreview = computed(() => previewGrid(next.value))

function pieceVar(id: string) {
  return `--tetris-${id.toLowerCase()}`
}

function cellStyle(cell: { id: string, ghost: boolean } | null) {
  if (!cell)
    return {}
  const token = `var(${pieceVar(cell.id)})`
  return cell.ghost
    ? { backgroundColor: `rgb(${token} / 0.1)`, borderColor: `rgb(${token} / 0.55)` }
    : { backgroundColor: `rgb(${token})`, borderColor: `rgb(${token})` }
}

function handleClose() {
  stopAllRepeats()
  cancelHoldRestart()
  close()
}

// --- Hold-to-restart --------------------------------------------------------
// Restarting discards the current game, so it requires a deliberate 1.5s hold
// (button or the R key) instead of a single press — mirrors a hold-to-delete
// pattern. Restarting from 'ready'/'over', where there's nothing to lose, is instant.
const isHoldingRestart = ref(false)
const canRestartInstantly = computed(() => status.value === 'ready' || status.value === 'over')

function startHoldRestart() {
  if (canRestartInstantly.value) {
    start()
    return
  }
  isHoldingRestart.value = true
}

function cancelHoldRestart() {
  isHoldingRestart.value = false
}

function completeHoldRestart() {
  if (!isHoldingRestart.value)
    return
  isHoldingRestart.value = false
  start()
}

// --- Input handling -------------------------------------------------------
// Left/right/soft-drop use a small DAS/ARR repeat so holding a key (or a touch
// button) feels like classic Tetris instead of moving once per keypress.
const DAS_MS = 170
const ARR_MS = 45
const REPEAT_ACTIONS: Record<string, () => void> = {
  left: moveLeft,
  right: moveRight,
  down: softDropInput,
}
const repeatTimers = new Map<string, { timeout?: ReturnType<typeof setTimeout>, interval?: ReturnType<typeof setInterval> }>()

function startRepeat(action: string) {
  if (repeatTimers.has(action))
    return
  REPEAT_ACTIONS[action]()
  const timeout = setTimeout(() => {
    const interval = setInterval(() => REPEAT_ACTIONS[action](), ARR_MS)
    repeatTimers.set(action, { interval })
  }, DAS_MS)
  repeatTimers.set(action, { timeout })
}

function stopRepeat(action: string) {
  const timers = repeatTimers.get(action)
  if (!timers)
    return
  clearTimeout(timers.timeout)
  clearInterval(timers.interval)
  repeatTimers.delete(action)
}

function stopAllRepeats() {
  repeatTimers.forEach((t) => {
    clearTimeout(t.timeout)
    clearInterval(t.interval)
  })
  repeatTimers.clear()
}

const MOVE_KEYS: Record<string, string> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
}
const SUPPRESS_SCROLL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '])

function onKeyDown(event: KeyboardEvent) {
  if (!isOpen.value)
    return
  if (SUPPRESS_SCROLL_KEYS.has(event.key))
    event.preventDefault()

  if (status.value === 'ready') {
    start()
    return
  }
  if (event.key === 'Escape') {
    handleClose()
    return
  }
  if (!event.repeat && event.key.toLowerCase() === 'r') {
    startHoldRestart()
    return
  }
  if (status.value === 'over')
    return

  const moveAction = MOVE_KEYS[event.key]
  if (moveAction) {
    if (!event.repeat)
      startRepeat(moveAction)
    return
  }

  if (event.repeat)
    return

  switch (event.key.toLowerCase()) {
    case 'arrowup':
    case 'x':
      rotateCW()
      break
    case 'z':
      rotateCCW()
      break
    case ' ':
      hardDrop()
      break
    case 'c':
    case 'shift':
      holdPiece()
      break
    case 'p':
      togglePause()
      break
  }
}

function onKeyUp(event: KeyboardEvent) {
  const moveAction = MOVE_KEYS[event.key]
  if (moveAction) {
    stopRepeat(moveAction)
    return
  }
  if (event.key.toLowerCase() === 'r')
    cancelHoldRestart()
}

useEventListener(window, 'keydown', onKeyDown)
useEventListener(window, 'keyup', onKeyUp)

watch(isOpen, (open) => {
  if (open) {
    resetToReady()
    previouslyFocused = document.activeElement as HTMLElement | null
    nextTick(() => panelRef.value?.focus())
  }
  else {
    stop()
    stopAllRepeats()
    cancelHoldRestart()
    previouslyFocused?.focus?.()
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="tetris-root fixed inset-0 z-100 flex items-center justify-center p-4">
      <Transition name="tetris-backdrop" appear>
        <div class="backdrop-blur-sm fixed inset-0 bg-black/40" />
      </Transition>

      <Transition name="tetris-panel" appear>
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          aria-label="Tetris"
          tabindex="-1"
          class="relative max-h-[90dvh] max-w-md w-full flex flex-col overflow-y-auto border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        >
          <!-- Header -->
          <header class="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <span class="uppercase text-xs text-neutral-400 font-medium tracking-[0.15em] dark:text-neutral-500">
              Tetris
            </span>
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-end leading-tight">
                <span class="uppercase text-[0.6rem] text-neutral-400 tracking-wide dark:text-neutral-500">Score</span>
                <span class="tabular-nums text-sm font-medium">{{ score }}</span>
              </div>
              <div class="flex flex-col items-end leading-tight">
                <span class="uppercase text-[0.6rem] text-neutral-400 tracking-wide dark:text-neutral-500">Best</span>
                <span class="tabular-nums text-sm font-medium">{{ Math.max(score, bestScore) }}</span>
              </div>
              <button
                aria-label="Hold to restart"
                class="restart-hold-btn size-8 flex pressable items-center justify-center bg-neutral-100 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
                @pointerdown="startHoldRestart"
                @pointerup="cancelHoldRestart"
                @pointerleave="cancelHoldRestart"
              >
                <span
                  class="restart-hold-fill"
                  :class="{ 'is-filling': isHoldingRestart }"
                  @transitionend="completeHoldRestart"
                />
                <Icon name="uil:refresh" class="relative z-1 size-4" />
              </button>
              <button
                aria-label="Close"
                class="size-8 flex pressable items-center justify-center bg-neutral-100 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
                @click="handleClose"
              >
                <Icon name="uil:times" class="size-4" />
              </button>
            </div>
          </header>

          <!-- Body -->
          <div class="game-body flex flex-col gap-4 p-4 sm:flex-row" :class="{ 'is-restart-holding': isHoldingRestart }">
            <!-- Board -->
            <div class="tetris-board-wrap relative mx-auto shrink-0">
              <div class="tetris-board border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <template v-for="(row, r) in displayGrid" :key="r">
                  <div
                    v-for="(cell, c) in row"
                    :key="c"
                    class="tetris-cell"
                    :class="{
                      'tetris-cell--filled': cell && !cell.ghost,
                      'tetris-cell--clearing': clearingRowsVisible.includes(r),
                    }"
                    :style="cellStyle(cell)"
                  />
                </template>
              </div>

              <Transition name="tetris-fade">
                <div v-if="status !== 'playing' && status !== 'clearing'" class="tetris-overlay">
                  <template v-if="status === 'ready'">
                    <p class="overlay-title">
                      Ready?
                    </p>
                    <p class="overlay-hint">
                      Press any key to start
                    </p>
                  </template>
                  <template v-else-if="status === 'paused'">
                    <p class="overlay-title">
                      Paused
                    </p>
                    <p class="overlay-hint">
                      Press P to resume
                    </p>
                  </template>
                  <template v-else-if="status === 'over'">
                    <p class="overlay-title">
                      Game over
                    </p>
                    <p class="overlay-hint">
                      Score {{ score }}<template v-if="score > 0 && score >= bestScore">
                        — new best!
                      </template>
                    </p>
                    <button class="restart-btn pressable" @click="start">
                      Play again
                    </button>
                  </template>
                </div>
              </Transition>
            </div>

            <!-- Side panel -->
            <aside class="w-full flex flex-col gap-4 sm:w-32">
              <div>
                <p class="stat-label">
                  Hold
                </p>
                <div class="piece-preview border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                  <template v-for="(row, r) in heldPreview" :key="r">
                    <div
                      v-for="(id, c) in row"
                      :key="c"
                      class="piece-preview-cell"
                      :style="id ? { backgroundColor: `rgb(var(${pieceVar(id)}))` } : {}"
                    />
                  </template>
                </div>
              </div>

              <div>
                <p class="stat-label">
                  Next
                </p>
                <div class="piece-preview border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                  <template v-for="(row, r) in nextPreview" :key="r">
                    <div
                      v-for="(id, c) in row"
                      :key="c"
                      class="piece-preview-cell"
                      :style="id ? { backgroundColor: `rgb(var(${pieceVar(id)}))` } : {}"
                    />
                  </template>
                </div>
              </div>

              <div class="flex gap-4">
                <div>
                  <p class="stat-label">
                    Lines
                  </p>
                  <p class="tabular-nums text-sm font-medium">
                    {{ lines }}
                  </p>
                </div>
                <div>
                  <p class="stat-label">
                    Level
                  </p>
                  <p class="tabular-nums text-sm font-medium">
                    {{ level }}
                  </p>
                </div>
              </div>

              <div>
                <p class="stat-label">
                  Controls
                </p>
                <ul class="flex flex-col gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <li class="flex items-center justify-between gap-2">
                    <span>Move</span>
                    <span class="flex gap-1"><kbd class="key">←</kbd><kbd class="key">→</kbd></span>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Soft drop</span><kbd class="key">↓</kbd>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Rotate</span><kbd class="key">↑</kbd>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Hard drop</span><kbd class="key">Space</kbd>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Hold</span><kbd class="key">C</kbd>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Pause</span><kbd class="key">P</kbd>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Restart</span><kbd class="key">R</kbd>
                  </li>
                  <li class="flex items-center justify-between gap-2">
                    <span>Close</span><kbd class="key">Esc</kbd>
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          <!-- Touch controls (small screens only) -->
          <div class="flex items-center justify-center gap-2 border-t border-neutral-200 p-3 sm:hidden dark:border-neutral-800">
            <button
              class="ctrl-btn pressable" aria-label="Move left"
              @pointerdown="startRepeat('left')" @pointerup="stopRepeat('left')" @pointerleave="stopRepeat('left')"
            >
              <Icon name="uil:arrow-left" class="size-4" />
            </button>
            <button class="ctrl-btn pressable" aria-label="Rotate" @click="rotateCW">
              <Icon name="uil:redo" class="size-4" />
            </button>
            <button
              class="ctrl-btn pressable" aria-label="Soft drop"
              @pointerdown="startRepeat('down')" @pointerup="stopRepeat('down')" @pointerleave="stopRepeat('down')"
            >
              <Icon name="uil:arrow-down" class="size-4" />
            </button>
            <button class="ctrl-btn pressable" aria-label="Hard drop" @click="hardDrop">
              <Icon name="uil:angle-double-down" class="size-4" />
            </button>
            <button
              class="ctrl-btn pressable" aria-label="Move right"
              @pointerdown="startRepeat('right')" @pointerup="stopRepeat('right')" @pointerleave="stopRepeat('right')"
            >
              <Icon name="uil:arrow-right" class="size-4" />
            </button>
            <button class="ctrl-btn pressable" aria-label="Hold" @click="holdPiece">
              <Icon name="uil:exchange-alt" class="size-4" />
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.tetris-board {
  display: grid;
  grid-template-columns: repeat(10, clamp(14px, 3.4dvh, 22px));
  grid-auto-rows: clamp(14px, 3.4dvh, 22px);
}

.tetris-cell {
  border: 1px solid transparent;
  outline: 1px solid rgb(0 0 0 / 0.04);
  outline-offset: -1px;
  transition: background-color 80ms var(--ease-out), border-color 80ms var(--ease-out);
}

.dark .tetris-cell {
  outline-color: rgb(255 255 255 / 0.04);
}

/* Piece colors are always light/pastel-ish in both themes, so a dark separator
   reads more clearly between blocks than the faint theme-aware grid line above. */
.tetris-cell--filled {
  outline-color: rgb(0 0 0 / 0.22);
}

.dark .tetris-cell--filled {
  outline-color: rgb(0 0 0 / 0.35);
}

.tetris-cell--clearing {
  animation: tetris-flash 160ms ease-out;
}

@keyframes tetris-flash {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.9);
  }
}

.piece-preview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: 4.5rem;
  aspect-ratio: 1;
}

.piece-preview-cell {
  outline: 1px solid rgb(0 0 0 / 0.04);
  outline-offset: -1px;
}

.dark .piece-preview-cell {
  outline-color: rgb(255 255 255 / 0.04);
}

.stat-label {
  margin: 0 0 0.25rem;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(163 163 163);
}

.dark .stat-label {
  color: rgb(115 115 115);
}

.key {
  display: inline-flex;
  min-width: 1.35rem;
  height: 1.35rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  border-radius: 3px;
  border: 1px solid rgb(212 212 212);
  background: rgb(245 245 245);
  font-size: 0.65rem;
  font-weight: 500;
  color: rgb(82 82 82);
}

.dark .key {
  border-color: rgb(64 64 64);
  background: rgb(38 38 38);
  color: rgb(212 212 212);
}

.ctrl-btn {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  background: rgb(245 245 245);
  color: rgb(82 82 82);
  touch-action: none;
}

.dark .ctrl-btn {
  background: rgb(38 38 38);
  color: rgb(212 212 212);
}

.tetris-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  background: rgb(255 255 255 / 0.85);
  backdrop-filter: blur(2px);
  text-align: center;
}

.dark .tetris-overlay {
  background: rgb(23 23 23 / 0.85);
}

.overlay-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.overlay-hint {
  margin: 0;
  font-size: 0.75rem;
  color: rgb(115 115 115);
}

.dark .overlay-hint {
  color: rgb(163 163 163);
}

.game-body {
  transition: filter var(--duration-short) var(--ease-out);
  filter: blur(0px);
}

.game-body.is-restart-holding {
  filter: blur(6px);
  transition: filter 1500ms linear;
}

.restart-hold-btn {
  position: relative;
  overflow: hidden;
}

.restart-hold-fill {
  position: absolute;
  inset: 0;
  background: rgb(217 119 6 / 0.55);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out);
  pointer-events: none;
}

.restart-hold-fill.is-filling {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1500ms linear;
}

.restart-btn {
  margin-top: 0.5rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid rgb(23 23 23);
  background: rgb(23 23 23);
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
}

.dark .restart-btn {
  border-color: rgb(245 245 245);
  background: rgb(245 245 245);
  color: rgb(23 23 23);
}

.tetris-backdrop-enter-active,
.tetris-backdrop-leave-active {
  transition: opacity var(--duration-short) var(--ease-out);
}

.tetris-backdrop-enter-from,
.tetris-backdrop-leave-to {
  opacity: 0;
}

.tetris-panel-enter-active,
.tetris-panel-leave-active {
  transition: opacity var(--duration-short) var(--ease-out), transform var(--duration-short) var(--ease-out);
  transform-origin: center;
}

.tetris-panel-enter-from,
.tetris-panel-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.tetris-fade-enter-active,
.tetris-fade-leave-active {
  transition: opacity var(--duration-micro) var(--ease-out);
}

.tetris-fade-enter-from,
.tetris-fade-leave-to {
  opacity: 0;
}
</style>
