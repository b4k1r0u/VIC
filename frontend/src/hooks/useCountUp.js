import { useState, useEffect } from 'react'

// Counts up from 0 to target over `duration` ms with ease-out cubic
export function useCountUp(target, duration = 1300) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const prog = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - prog, 3)
      setVal(target * eased)
      if (prog < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

// Live clock
export function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// Animate bars / progress into view after mount
export function useVisible(delay = 600) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [])
  return visible
}
