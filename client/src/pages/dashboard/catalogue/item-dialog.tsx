import { zodResolver } from '@hookform/resolvers/zod'
import { Euro, Link2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { type Path, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { apiErrorMessage, serverErrorsByPath } from '@/api/error-message'
import { useGetApiCategories } from '@/api/generated/categories/categories'
import { useGetApiItemsId, usePostApiItems, usePutApiItemsId } from '@/api/generated/items/items'
import type { ItemDetailsDto } from '@/api/generated/model'
import { errorsShownInline } from '@/api/query-client'
import { FormAlert } from '@/components/form-alert'
import { FormField } from '@/components/form-field'
import { PageLoader } from '@/components/page-loader'
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
import { Input } from '@/components/ui/input'
import {
  type ItemFormInput,
  type ItemFormOutput,
  itemDefaults,
  itemSchema,
  MAX_SPECIFICATIONS,
  toItemRequest,
} from '@/pages/dashboard/catalogue/catalogue-schemas'
import { SelectField, TextareaField } from '@/pages/dashboard/catalogue/form-controls'
import { useCatalogueRefresh } from '@/pages/dashboard/catalogue/use-catalogue-refresh'
import { LoadError, RentalThumb } from '@/pages/dashboard/dashboard-ui'

/** What the dialog is open for: a new item, or the item with this id. */
export type ItemDialogTarget = { mode: 'create' } | { mode: 'edit'; id: number }

const topFields = [
  'categoryId',
  'name',
  'brand',
  'description',
  'imageUrl',
  'dailyPrice',
  'deposit',
  'lateFeePerDay',
] as const

/** A server path the form has a field for: a top-level field or one specification's key or value. */
function isFormPath(path: string): path is Path<ItemFormInput> {
  return (
    (topFields as readonly string[]).includes(path) ||
    /^specifications\.\d+\.(key|value)$/.test(path)
  )
}

/**
 * Adds an item (`POST /api/items`) or edits one (`PUT /api/items/{id}`). Editing loads the full
 * item first, since the list has no description, late fee or specifications.
 */
export function ItemDialog({
  target,
  onClose,
}: {
  target: ItemDialogTarget | null
  onClose: () => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent className="sm:max-w-2xl" closeLabel={t('admin.close')}>
          {target.mode === 'create' ? (
            <ItemForm onClose={onClose} />
          ) : (
            <EditItem key={target.id} id={target.id} onClose={onClose} />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

function EditItem({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useTranslation()
  // Always fresh: the public item page may have cached an older copy.
  const item = useGetApiItemsId(id, { query: { staleTime: 0 } })

  if (item.isPending || (item.isFetching && !item.isError)) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('admin.items.editTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('layout.loading')}</DialogDescription>
        </DialogHeader>
        <PageLoader />
      </>
    )
  }

  if (item.isError) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('admin.items.editTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('admin.items.loadError')}</DialogDescription>
        </DialogHeader>
        <LoadError message={apiErrorMessage(item.error)} onRetry={() => void item.refetch()} />
      </>
    )
  }

  return <ItemForm item={item.data} onClose={onClose} />
}

function ItemForm({ item, onClose }: { item?: ItemDetailsDto; onClose: () => void }) {
  const { t } = useTranslation()
  const id = useId()
  const refresh = useCatalogueRefresh()
  const categories = useGetApiCategories()
  const create = usePostApiItems({ mutation: { meta: errorsShownInline } })
  const update = usePutApiItemsId({ mutation: { meta: errorsShownInline } })
  const mutation = item ? update : create
  const [formError, setFormError] = useState<string>()

  const schema = useMemo(() => itemSchema(t), [t])
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ItemFormInput, unknown, ItemFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: itemDefaults(item),
  })
  const specs = useFieldArray({ control, name: 'specifications' })
  const imageUrl = useWatch({ control, name: 'imageUrl' })

  // Known labels as suggestions, so admins reuse keys the item page already translates.
  const labels: Record<string, string> = t('item.specs.labels', { returnObjects: true })

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined)
    const data = toItemRequest(values)
    const callbacks = {
      onSuccess: (saved: ItemDetailsDto) => {
        toast.success(t(item ? 'admin.items.updated' : 'admin.items.created', { name: saved.name }))
        void refresh(saved.id)
        onClose()
      },
      onError: (error: unknown) => {
        // The server's messages go next to their fields; anything else above the buttons.
        const leftover: string[] = []
        let focused = false
        for (const [path, message] of Object.entries(serverErrorsByPath(error))) {
          if (isFormPath(path)) {
            setError(path, { message }, { shouldFocus: !focused })
            focused = true
          } else if (path === 'specifications') {
            setError('specifications', { message })
          } else {
            leftover.push(message)
          }
        }
        if (!focused) setFormError(leftover[0] ?? apiErrorMessage(error))
        // A 404 while editing: the item was retired meanwhile.
        if (item) void refresh(item.id)
      },
    }
    if (item) update.mutate({ id: item.id, data }, callbacks)
    else create.mutate({ data }, callbacks)
  })

  const specsError = errors.specifications?.root?.message ?? errors.specifications?.message

  return (
    <form noValidate onSubmit={onSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>{t(item ? 'admin.items.editTitle' : 'admin.items.createTitle')}</DialogTitle>
        <DialogDescription>
          {item ? t('admin.items.editText', { name: item.name }) : t('admin.items.createText')}
        </DialogDescription>
      </DialogHeader>

      {formError && <FormAlert>{formError}</FormAlert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('admin.items.name')}
          error={errors.name?.message}
          autoComplete="off"
          {...register('name')}
        />
        <FormField
          label={t('admin.items.brand')}
          error={errors.brand?.message}
          autoComplete="off"
          {...register('brand')}
        />
        <SelectField
          label={t('admin.items.category')}
          error={errors.categoryId?.message}
          disabled={categories.isPending}
          {...register('categoryId')}
        >
          <option value="">{t('admin.items.chooseCategory')}</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <div className="flex items-start gap-3">
          <FormField
            label={t('admin.items.imageUrl')}
            icon={Link2}
            type="url"
            inputMode="url"
            placeholder="https://"
            className="min-w-0 flex-1"
            error={errors.imageUrl?.message}
            {...register('imageUrl')}
          />
          <RentalThumb
            key={imageUrl}
            src={/^https?:\/\//i.test(imageUrl.trim()) ? imageUrl.trim() : null}
            className="mt-[26px] size-9"
          />
        </div>
        <TextareaField
          label={t('admin.items.description')}
          className="sm:col-span-2"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 text-sm font-semibold">{t('admin.items.pricing')}</legend>
        <FormField
          label={t('admin.items.dailyPrice')}
          icon={Euro}
          inputMode="decimal"
          error={errors.dailyPrice?.message}
          {...register('dailyPrice')}
        />
        <FormField
          label={t('admin.items.deposit')}
          icon={Euro}
          inputMode="decimal"
          error={errors.deposit?.message}
          {...register('deposit')}
        />
        <FormField
          label={t('admin.items.lateFeePerDay')}
          icon={Euro}
          inputMode="decimal"
          error={errors.lateFeePerDay?.message}
          {...register('lateFeePerDay')}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">{t('admin.items.specs')}</legend>
        <p className="text-xs text-muted-foreground">{t('admin.items.specsHint')}</p>
        <datalist id={`${id}-keys`}>
          {Object.entries(labels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </datalist>

        {specs.fields.length > 0 && (
          <ul className="flex flex-col gap-3">
            {specs.fields.map((field, index) => {
              const keyError = errors.specifications?.[index]?.key?.message
              const valueError = errors.specifications?.[index]?.value?.message
              return (
                <li
                  key={field.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-start gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <Input
                      aria-label={t('admin.items.specKey', { index: index + 1 })}
                      aria-invalid={keyError ? true : undefined}
                      list={`${id}-keys`}
                      placeholder="cpu"
                      autoComplete="off"
                      className="h-9 bg-background font-mono text-[13px]"
                      {...register(`specifications.${index}.key`)}
                    />
                    {keyError && <p className="text-xs text-destructive">{keyError}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Input
                      aria-label={t('admin.items.specValue', { index: index + 1 })}
                      aria-invalid={valueError ? true : undefined}
                      placeholder={t('admin.items.specValuePlaceholder')}
                      autoComplete="off"
                      className="h-9 bg-background"
                      {...register(`specifications.${index}.value`)}
                    />
                    {valueError && <p className="text-xs text-destructive">{valueError}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => specs.remove(index)}
                  >
                    <Trash2 aria-hidden />
                    <span className="sr-only">
                      {t('admin.items.removeSpec', { index: index + 1 })}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
        {specsError && <p className="text-xs text-destructive">{specsError}</p>}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-fit px-3"
          disabled={specs.fields.length >= MAX_SPECIFICATIONS}
          onClick={() => specs.append({ key: '', value: '' })}
        >
          <Plus aria-hidden />
          {t('admin.items.addSpec')}
        </Button>
      </fieldset>

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
          {t(item ? 'admin.save' : 'admin.items.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}
