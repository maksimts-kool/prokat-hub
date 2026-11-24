import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useGetApiItems } from '@/api/generated/items/items'
import type { CategoryDto, ItemSummaryDto } from '@/api/generated/model'
import { CategoriesPanel } from '@/pages/dashboard/catalogue/categories-panel'
import {
  CategoryDialog,
  type CategoryDialogTarget,
} from '@/pages/dashboard/catalogue/category-dialog'
import { DeleteDialog, type DeleteTarget } from '@/pages/dashboard/catalogue/delete-dialog'
import { ItemDialog, type ItemDialogTarget } from '@/pages/dashboard/catalogue/item-dialog'
import { ItemsPanel } from '@/pages/dashboard/catalogue/items-panel'
import { PillTabs } from '@/pages/dashboard/dashboard-ui'

type Tab = 'items' | 'categories'

/**
 * Catalogue management for admins: the items table and the categories, each with add, edit and
 * delete dialogs. The tab, search, category filter and page live in the URL.
 */
export function CatalogueAdminPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useSearchParams()
  const tab: Tab = search.get('tab') === 'categories' ? 'categories' : 'items'

  const [itemTarget, setItemTarget] = useState<ItemDialogTarget | null>(null)
  const [categoryTarget, setCategoryTarget] = useState<CategoryDialogTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // Totals for the tab chips.
  const itemCount = useGetApiItems({ Page: 1, PageSize: 1 }).data?.totalCount
  const categoryCount = useGetApiCategories().data?.length

  /** Changes URL params; any change but the page itself starts again at page 1. */
  const update = useCallback(
    (changes: Record<string, string | undefined>) =>
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined) next.delete(key)
            else next.set(key, value)
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      ),
    [setSearch],
  )

  const editItem = useCallback(
    (item: ItemSummaryDto) => setItemTarget({ mode: 'edit', id: item.id }),
    [],
  )
  const retireItem = useCallback(
    (item: ItemSummaryDto) => setDeleteTarget({ kind: 'item', item }),
    [],
  )
  const editCategory = useCallback(
    (category: CategoryDto) => setCategoryTarget({ mode: 'edit', category }),
    [],
  )
  const deleteCategory = useCallback(
    (category: CategoryDto) => setDeleteTarget({ kind: 'category', category }),
    [],
  )

  return (
    <div>
      <PillTabs
        label={t('admin.tabsLabel')}
        tabs={[
          { key: 'items', label: t('admin.tabs.items'), count: itemCount },
          { key: 'categories', label: t('admin.tabs.categories'), count: categoryCount },
        ]}
        active={tab}
        onChange={(next) =>
          // Each tab starts clean: the items filters don't apply to categories.
          setSearch(next === 'items' ? {} : { tab: next }, { replace: true })
        }
        className="mb-5 w-fit"
      />

      <div role="tabpanel">
        {tab === 'items' ? (
          <ItemsPanel
            search={search}
            update={update}
            onCreate={() => setItemTarget({ mode: 'create' })}
            onEdit={editItem}
            onRetire={retireItem}
          />
        ) : (
          <CategoriesPanel
            onCreate={() => setCategoryTarget({ mode: 'create' })}
            onEdit={editCategory}
            onDelete={deleteCategory}
          />
        )}
      </div>

      <ItemDialog target={itemTarget} onClose={() => setItemTarget(null)} />
      <CategoryDialog target={categoryTarget} onClose={() => setCategoryTarget(null)} />
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  )
}
