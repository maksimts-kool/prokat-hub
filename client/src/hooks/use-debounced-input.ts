import { useEffect, useRef, useState } from 'react'

/**
 * Local state for a text input whose value is committed after the user stops typing.
 * `value` is the committed value (e.g. from the URL); when it changes from outside, such as
 * a reset or the back button, the input follows it.
 */
export function useDebouncedInput(value: string, commit: (value: string) => void, delay = 300) {
  const [text, setText] = useState(value)
  const [committed, setCommitted] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const commitRef = useRef(commit)

  useEffect(() => {
    commitRef.current = commit
  }, [commit])

  // Follow outside changes during render rather than in an effect, so there is no flash.
  if (value !== committed) {
    setCommitted(value)
    setText(value)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  function onChange(next: string) {
    setText(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => commitRef.current(next), delay)
  }

  /** Commits the current text at once, e.g. on Enter. */
  function flush() {
    clearTimeout(timer.current)
    if (text !== value) commitRef.current(text)
  }

  return { text, onChange, flush }
}
