import { useEffect, useState } from 'react'
import { useAppStore } from './index.ts'
import { DEFAULT_SCENARIO_ID, fetchScenario } from './seed.ts'

export type BootstrapStatus = 'ready' | 'loading' | 'error'

/**
 * On a first visit, or after bad storage was discarded, no scenario is
 * loaded: fetch the default one (section 21). Returns the status and a retry.
 */
export function useBootstrapScenario(): {
  status: BootstrapStatus
  retry: () => void
} {
  const scenarioId = useAppStore((state) => state.mission.scenarioId)
  const loadScenario = useAppStore((state) => state.loadScenario)
  const [failedAttempt, setFailedAttempt] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (scenarioId !== null) return
    let cancelled = false
    fetchScenario(DEFAULT_SCENARIO_ID)
      .then((scenario) => {
        if (!cancelled) loadScenario(scenario)
      })
      .catch(() => {
        if (!cancelled) setFailedAttempt(attempt)
      })
    return () => {
      cancelled = true
    }
  }, [scenarioId, loadScenario, attempt])

  if (scenarioId !== null) return { status: 'ready', retry: () => undefined }
  return {
    status: failedAttempt === attempt ? 'error' : 'loading',
    retry: () => setAttempt((count) => count + 1),
  }
}
