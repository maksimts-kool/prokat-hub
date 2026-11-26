import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/api/error-message'
import { useDeleteApiCategoriesId } from '@/api/generated/categories/categories'
import { useDeleteApiItemsId } from '@/api/generated/items/items'
import type { CategoryDto, ItemSummaryDto } from '@/api/generated/model'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { FormAlert } from '@/components/form-alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useCatalogueRefresh } from '@/pages/dashboard/catalogue/use-catalogue-refresh'

export type DeleteTarget =
  { kind: 'item'; item: ItemSummaryDto } | { kind: 'category'; category: CategoryDto }

const destructive =
  'bg-destructive px-4 text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_14%)]'

/**
 * Confirms retiring an item (`DELETE /api/items/{id}`: it leaves the catalogue but stays in rental
 * history) or deleting an empty category (`DELETE /api/categories/{id}`).
 */
export function DeleteDialog({
  target,
  onClose,
}: {
  target: DeleteTarget | null
  onClose: () => void
}) {
  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <Body
          key={target.kind === 'item' ? `item-${target.item.id}` : `category-${target.category.id}`}
          target={target}
          onClose={onClose}
        />
      )}
    </AlertDialog>
  )
}

function Body({ target, onClose }: { target: DeleteTarget; onClose: () => void }) {
  const { t } = useTranslation()
  const refresh = useCatalogueRefresh()
  const retireItem = useDeleteApiItemsId({ mutation: { meta: errorsShownInline } })
  const deleteCategory = useDeleteApiCategoriesId({ mutation: { meta: errorsShownInline } })
  const mutation = target.kind === 'item' ? retireItem : deleteCategory
  const name = target.kind === 'item' ? target.item.name : target.category.name
  // A category with items in the catalogue can't go; say so rather than offer a button that fails.
  const blocked = target.kind === 'category' && target.category.itemCount > 0

  const text =
    target.kind === 'item'
      ? {
          title: t('admin.items.retireTitle', { name }),
          body: t('admin.items.retireText'),
          button: t('admin.items.retire'),
          done: t('admin.items.retired', { name }),
          conflict: t('admin.items.retireConflict'),
        }
      : {
          title: t('admin.categories.deleteTitle', { name }),
          body: blocked
            ? t('admin.categories.deleteBlocked', { count: target.category.itemCount })
            : t('admin.categories.deleteText'),
          button: t('admin.categories.delete'),
          done: t('admin.categories.deleted', { name }),
          conflict: t('admin.categories.deleteConflict'),
        }

  function confirm() {
    if (mutation.isPending) return
    const callbacks = {
      onSuccess: () => {
        toast.success(text.done)
        onClose()
      },
      onSettled: () => refresh(target.kind === 'item' ? target.item.id : undefined),
    }
    if (target.kind === 'item') retireItem.mutate({ id: target.item.id }, callbacks)
    else deleteCategory.mutate({ id: target.category.id }, callbacks)
  }

  const error = mutation.error

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{text.title}</AlertDialogTitle>
        <AlertDialogDescription>{text.body}</AlertDialogDescription>
      </AlertDialogHeader>

      {error && (
        <FormAlert>
          {isApiError(error) && error.status === 409 ? text.conflict : apiErrorMessage(error)}
        </FormAlert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={mutation.isPending}>
          {blocked ? t('admin.close') : t('admin.cancel')}
        </AlertDialogCancel>
        {!blocked && (
          // A plain button, not AlertDialogAction: the dialog stays open until the request is done.
          <Button size="lg" className={destructive} disabled={mutation.isPending} onClick={confirm}>
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {text.button}
          </Button>
        )}
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
