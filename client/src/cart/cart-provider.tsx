import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CartContextValue, type CartLine } from '@/cart/cart-context'

/** localStorage key of the cart; it lives in this browser only, like a shop's guest basket. */
const STORAGE_KEY = 'prokat-hub.cart'

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false
  const line = value as Record<string, unknown>
  return (
    typeof line.itemId === 'number' &&
    typeof line.name === 'string' &&
    typeof line.from === 'string' &&
    typeof line.to === 'string' &&
    typeof line.dailyPrice === 'number'
  )
}

/** The stored cart, or an empty one when storage is blocked or holds something else. */
function readCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : []
  } catch {
    return []
  }
}

function writeCart(lines: CartLine[]) {
  try {
    if (lines.length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    // Private windows may refuse storage; the cart then lasts until the tab is closed.
  }
}

/** Keeps the cart in localStorage and in step across this site's open tabs. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart)

  // Another tab changed the cart.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) setLines(readCart())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((change: (lines: CartLine[]) => CartLine[]) => {
    setLines((current) => {
      const next = change(current)
      writeCart(next)
      return next
    })
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      add: (line) =>
        update((current) => [...current.filter((l) => l.itemId !== line.itemId), line]),
      remove: (itemId) => update((current) => current.filter((l) => l.itemId !== itemId)),
      clear: () => update(() => []),
      find: (itemId) => lines.find((l) => l.itemId === itemId),
    }),
    [lines, update],
  )

  return <CartContext value={value}>{children}</CartContext>
}
