import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, Loader2, Lock, Mail, Percent, Search, User } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { apiErrorMessage, serverFieldErrors } from '@/api/error-message'
import { usePostApiAuthRegister } from '@/api/generated/auth/auth'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { useAuth } from '@/auth/auth-context'
import { AuthCard } from '@/components/auth-card'
import { FormAlert } from '@/components/form-alert'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'

const fields = ['fullName', 'email', 'password'] as const

/**
 * Create an account (`POST /api/auth/register`). The API signs the new Customer in straight away,
 * so this stores the token like a login and the `GuestOnly` route guard moves on.
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const location = useLocation()
  const registerAccount = usePostApiAuthRegister({ mutation: { meta: errorsShownInline } })

  // Same rules as RegisterRequestValidator and the Identity password options on the server.
  const schema = useMemo(() => {
    const passwordRule = t('register.passwordRule')
    return z.object({
      fullName: z
        .string()
        .trim()
        .min(1, t('register.validation.nameRequired'))
        .min(2, t('register.validation.nameShort'))
        .max(120, t('register.validation.nameLong')),
      email: z
        .string()
        .trim()
        .min(1, t('auth.validation.emailRequired'))
        .max(256, t('auth.validation.emailInvalid'))
        .pipe(z.email(t('auth.validation.emailInvalid'))),
      password: z
        .string()
        .min(8, passwordRule)
        .max(100, t('register.validation.passwordLong'))
        .regex(/[A-Z]/, passwordRule)
        .regex(/[a-z]/, passwordRule)
        .regex(/[0-9]/, passwordRule),
    })
  }, [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit((values) => {
    registerAccount.mutate(
      { data: values },
      {
        onSuccess: (response) => {
          signIn(response)
          toast.success(t('register.success', { name: response.user.fullName }))
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) {
            setError('email', { message: t('register.emailTaken') }, { shouldFocus: true })
            return
          }
          // The server's own rules (e.g. a password Identity rejects) go next to their fields.
          for (const [field, message] of Object.entries(serverFieldErrors(error, fields))) {
            setError(field as (typeof fields)[number], { message })
          }
        },
      },
    )
  })

  // Errors shown next to a field don't need the alert as well.
  const error = registerAccount.error
  const shownOnFields =
    isApiError(error) &&
    (error.status === 409 || Object.keys(serverFieldErrors(error, fields)).length > 0)
  const formError = error && !shownOnFields ? apiErrorMessage(error) : undefined

  return (
    <AuthCard
      title={t('register.title')}
      description={t('register.description')}
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <Link
            to={{ pathname: '/login', search: location.search }}
            className="font-medium text-primary hover:underline dark:text-accent-foreground"
          >
            {t('register.logIn')}
          </Link>
        </>
      }
      aside={{
        title: t('register.aside.title'),
        perks: [
          {
            icon: Percent,
            title: t('register.aside.discount'),
            text: t('register.aside.discountText'),
          },
          { icon: Search, title: t('register.aside.free'), text: t('register.aside.freeText') },
          {
            icon: CircleCheck,
            title: t('register.aside.quote'),
            text: t('register.aside.quoteText'),
          },
        ],
      }}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="flex flex-col gap-4">
          <FormField
            label={t('register.fullName')}
            icon={User}
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <FormField
            label={t('auth.email')}
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />
          <FormField
            label={t('auth.password')}
            type="password"
            icon={Lock}
            autoComplete="new-password"
            hint={t('register.passwordRule')}
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={registerAccount.isPending}>
          {registerAccount.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {t('register.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
