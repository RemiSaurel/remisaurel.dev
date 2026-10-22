import type { InjectionKey } from 'vue'

export type CompareVerdict = 'works' | 'partial' | 'fails'

export const COMPARE_VERDICTS: Record<CompareVerdict, { label: string, icon: string }> = {
  works: { label: 'Works', icon: 'lucide:check' },
  partial: { label: 'Partly', icon: 'lucide:minus' },
  fails: { label: 'Fails', icon: 'lucide:x' },
}

export interface CompareEntry {
  id: string
  label: string
  verdict?: CompareVerdict
}

/** What a Compare shares with its takes: who is in it, in order, for the pager under the carousel */
export interface CompareContext {
  register: (entry: CompareEntry) => void
  unregister: (id: string) => void
}

export const COMPARE_KEY: InjectionKey<CompareContext> = Symbol('compare')
