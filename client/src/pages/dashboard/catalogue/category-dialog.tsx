import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { apiErrorMessage, serverFieldErrors } from '@/api/error-message'
import { usePostApiCategories, usePutApiCategoriesId } from '@/api/generated/categories/categories'
import type { CategoryDto } from '@/api/generated/model'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { FormAlert } from '@/components/form-alert'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  type CategoryFormInput,
  type CategoryFormOutput,
  categoryDefaults,
  categorySchema,
  toSlug,
} from '@/pages/dashboard/catalogue/catalogue-schemas'
import { TextareaField } from '@/pages/dashboard/catalogue/form-controls'
import { useCatalogueRefresh } from '@/pages/dashboard/catalogue/use-catalogue-refresh'

const fields = ['name', 'slug', 'description'] as const

/** What the dialog is open for: a new category, or this one. */
export type CategoryDialogTarget = { mode: 'create' } | { mode: 'edit'; category: CategoryDto }

/** Adds a category (`POST /api/categories`) or edits one (`PUT /api/categories/{id}`). */
export function CategoryDialog({
  target,
  onClose,
}: {
  target: CategoryDialogTarget | null
  onClose: () => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent closeLabel={t('admin.close')}>
          <CategoryForm
            key={target.mode === 'edit' ? target.category.id : 'new'}
            category={target.mode === 'edit' ? target.category : undefined}
            onClose={onClose}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}

function CategoryForm({ category, onClose }: { category?: CategoryDto; onClose: () => void }) {
  const { t } = useTranslation()
  const refresh = useCatalogueRefresh()
  const create = usePostApiCategories({ mutation: { meta: errorsShownInline } })
  const update = usePutApiCategoriesId({ mutation: { meta: errorsShownInline } })
  const mutation = category ? update : create
  const [formError, setFormError] = useState<string>()

  const schema = useMemo(() => categorySchema(t), [t])
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: categoryDefaults(category),
  })
  const generatedSlug = toSlug(useWatch({ control, name: 'name' }))

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined)
    const data = {
      name: values.name,
      slug: values.slug || null,
      description: values.description || null,
    }
    const callbacks = {
      onSuccess: (saved: CategoryDto) => {
        toast.success(
          t(category ? 'admin.categories.updated' : 'admin.categories.created', {
            name: saved.name,
          }),
        )
        void refresh()
        onClose()
      },
      onError: (error: unknown) => {
        // A 400 with field rules, or a 409 for a name or slug another category has.
        const byField = serverFieldErrors(error, fields)
        if (isApiError(error) && error.status === 409) {
          if (byField.name) byField.name = t('admin.categories.nameTaken')
          if (byField.slug) byField.slug = t('admin.categories.slugTaken')
        }
        const entries = Object.entries(byField) as [(typeof fields)[number], string][]
        entries.forEach(([field, message], index) =>
          setError(field, { message }, { shouldFocus: index === 0 }),
        )
        if (entries.length === 0) setFormError(apiErrorMessage(error))
      },
    }
    if (category) update.mutate({ id: category.id, data }, callbacks)
    else create.mutate({ data }, callbacks)
  })

  return (
    <form noValidate onSubmit={onSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>
          {t(category ? 'admin.categories.editTitle' : 'admin.categories.createTitle')}
        </DialogTitle>
        <DialogDescription>
          {category
            ? t('admin.categories.editText', { name: category.name })
            : t('admin.categories.createText')}
        </DialogDescription>
      </DialogHeader>

      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="flex flex-col gap-4">
        <FormField
          label={t('admin.categories.name')}
          autoComplete="off"
          error={errors.name?.message}
          {...register('name')}
        />
        <FormField
          label={t('admin.categories.slug')}
          autoComplete="off"
          placeholder={generatedSlug || 'gaming-consoles'}
          hint={
            generatedSlug
              ? t('admin.categories.slugHint', { slug: generatedSlug })
              : t('admin.categories.slugRule')
          }
          className="[&_input]:font-mono [&_input]:text-[13px]"
          error={errors.slug?.message}
          {...register('slug')}
        />
        <TextareaField
          label={t('admin.categories.description')}
          rows={3}
          hint={t('admin.optional')}
          error={errors.description?.message}
          {...register('description')}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="px-4"
            disabled={mutation.isPending}
          >
            {t('admin.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" size="lg" className="px-4" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {t(category ? 'admin.save' : 'admin.categories.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}
