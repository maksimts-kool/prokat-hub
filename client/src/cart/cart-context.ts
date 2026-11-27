import { createContext, useContext } from 'react'

/**
 * One item the user means to book, with its dates. The item's details are copied in when it is
 * added, so the cart can draw itself before the server answers; prices are quoted again on the
 * cart page, so a stale copy never decides what is paid.
 */
export interface CartLine {
  itemId: number
  name: string
  brand: string
  categoryId: number
  categoryName: string
  imageUrl: string | null
  dailyPrice: number
  deposit: number
  /** ISO dates (`yyyy-mm-dd`), both days included. */
  from: string
  to: string
}

export interface CartContextValue {
  lines: CartLine[]
  /** Adds the item, or moves it to new dates when it is in the cart already (one line per item). */
  add: (line: CartLine) => void
  remove: (itemId: number) => void
  /** Empties the cart, e.g. after everything in it was booked. */
  clear: () => void
  /** The line for this item, if it is in the cart. */
  find: (itemId: number) => CartLine | undefined
}

export const CartContext = createContext<CartContextValue | null>(null)

/** The cart kept in this browser. Must be used inside `CartProvider`. */
export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside CartProvider.')
  }
  return context
}
