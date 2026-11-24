import { useQueryClient } from '@tanstack/react-query'
import { getGetApiCategoriesQueryKey } from '@/api/generated/categories/categories'
import { getGetApiItemsIdQueryKey, getGetApiItemsQueryKey } from '@/api/generated/items/items'

/**
 * Reloads what a catalogue change shows up in: the item lists (here and in the public catalogue),
 * the category list with its item counts, and the changed item's own page.
 */
export function useCatalogueRefresh() {
  const queryClient = useQueryClient()
  return (itemId?: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetApiItemsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetApiCategoriesQueryKey() }),
      itemId !== undefined &&
        queryClient.invalidateQueries({ queryKey: getGetApiItemsIdQueryKey(itemId) }),
    ])
}
