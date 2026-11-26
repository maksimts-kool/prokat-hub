import { ShoppingCart, CircleCheck, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { ItemDetailsDto } from '@/api/generated/model'
import { useCart } from '@/cart/cart-context'
import { Button } from '@/components/ui/button'
import type { BookingAccess } from '@/components/booking/use-book-item'
import { useFormat } from '@/i18n/format'
import { cn } from '@/lib/utils'

interface AddToCartProps {
  item: ItemDetailsDto
  access: BookingAccess
  from: string | undefined
  to: string | undefined
  /** True when the dates cannot be booked: the same rule as the Book button. */
  blocked: boolean
  /** Phones: a square icon button beside Book in the bar at the bottom. */
  compact?: boolean
  className?: string
}

/**
 * Puts the item with the chosen dates in the cart, to book together with other items later. Once
 * it is there with these dates the button leads to the cart; with other dates it moves the line.
 * Staff accounts cannot book, so they get no button.
 */
export function AddToCart({ item, access, from, to, blocked, compact, className }: AddToCartProps) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  const navigate = useNavigate()
  const cart = useCart()

  if (access === 'staff' || access === 'loading') return null

  const line = cart.find(item.id)
  const inCart = line !== undefined && line.from === from && line.to === to
  const label = inCart
    ? t('item.booking.inCart')
    : line
      ? t('item.booking.moveInCart')
      : t('item.booking.addToCart')
  const Icon = inCart ? CircleCheck : line ? RefreshCw : ShoppingCart

  if (inCart) {
    return (
      <Button
        asChild
        variant="outline"
        size={compact ? 'icon-lg' : 'lg'}
        className={cn(!compact && 'w-full', className)}
      >
        <Link to="/cart" aria-label={compact ? label : undefined}>
          <Icon className="text-success-strong dark:text-success" aria-hidden />
          {!compact && label}
        </Link>
      </Button>
    )
  }

  function add() {
    if (!from || !to) return
    cart.add({
      itemId: item.id,
      name: item.name,
      brand: item.brand,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      imageUrl: item.imageUrls[0] ?? null,
      dailyPrice: item.dailyPrice,
      deposit: item.deposit,
      from,
      to,
    })
    toast.success(t('item.booking.addedToCart', { item: item.name }), {
      description: t('catalogue.dateRange', { from: formatDate(from), to: formatDate(to) }),
      action: { label: t('item.booking.viewCart'), onClick: () => void navigate('/cart') },
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon-lg' : 'lg'}
      className={cn(!compact && 'w-full', className)}
      disabled={blocked}
      aria-label={compact ? label : undefined}
      onClick={add}
    >
      <Icon aria-hidden />
      {!compact && label}
    </Button>
  )
}
