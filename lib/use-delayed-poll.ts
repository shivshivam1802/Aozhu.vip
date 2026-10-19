"use client"

import { useEffect, useRef } from "react"

const HIDDEN_RESUME_MS = 1500
const MAX_BACKOFF_MS = 60_000

export function useDelayedPoll(task: (signal: AbortSignal) => Promise<void>, delayMs: number) {
  const taskRef = useRef(task)
  const pauseRef = useRef<() => void>(() => {})
  taskRef.current = task

  useEffect(() => {
    const lifetime = new AbortController()
    let timer = 0
    let request: AbortController | null = null
    let attempt = 0

    const arm = (wait: number) => {
      window.clearTimeout(timer)
      if (lifetime.signal.aborted || document.visibilityState === "hidden") return
      timer = window.setTimeout(() => {
        void run()
      }, wait)
    }

    const run = async () => {
      if (lifetime.signal.aborted || document.visibilityState === "hidden") return
      request = new AbortController()
      const signal = request.signal
      try {
        await taskRef.current(signal)
      } catch (error) {
        if (lifetime.signal.aborted || isAbort(error)) {
          if (!lifetime.signal.aborted) arm(delayMs)
          return
        }
        attempt += 1
        arm(Math.min(delayMs * 2 ** attempt, MAX_BACKOFF_MS))
        return
      }
      if (lifetime.signal.aborted) return
      attempt = 0
      arm(delayMs)
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        window.clearTimeout(timer)
        request?.abort()
        return
      }
      arm(HIDDEN_RESUME_MS)
    }

    pauseRef.current = () => {
      request?.abort()
      arm(delayMs)
    }

    document.addEventListener("visibilitychange", onVisibility)
    arm(delayMs)

    return () => {
      pauseRef.current = () => {}
      lifetime.abort()
      request?.abort()
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [delayMs])

  return () => pauseRef.current()
}

function isAbort(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}
