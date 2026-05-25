'use client'
import { createContext, useContext } from 'react'

export type TrialStatus = {
  plan: string
  trialDaysLeft: number | null
  isTrialExpired: boolean
  /** true when plan === 'free' AND trial >= 14 days elapsed */
  isBlocked: boolean
}

export const TrialContext = createContext<TrialStatus>({
  plan: 'free',
  trialDaysLeft: null,
  isTrialExpired: false,
  isBlocked: false,
})

export function useTrialStatus(): TrialStatus {
  return useContext(TrialContext)
}
