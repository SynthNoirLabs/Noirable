import { create } from 'zustand'
import { A2UIComponent } from '@/lib/protocol/schema'

interface A2UIState {
  evidence: A2UIComponent | null
  setEvidence: (evidence: A2UIComponent) => void
}

export const useA2UIStore = create<A2UIState>((set) => ({
  evidence: null,
  setEvidence: (evidence) => set({ evidence }),
}))
