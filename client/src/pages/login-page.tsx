import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarCheck, Clock, Loader2, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { z } from 'zod'
import { apiErrorMessage } from '@/api/error-message'
import { usePostApiAuthLogin } from '@/api/generated/auth/auth'
import { isApiError } from '@/api/http-client'
import { errorsShownInline } from '@/api/query-client'
import { useAuth } from '@/auth/auth-context'
import { AuthCard } from '@/components/auth-card'
import { FormAlert } from '@/components/form-alert'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'

/**
 * Log in (`POST /api/auth/login`). On success the token is stored and the `GuestOnly` route guard
 * sends the user back to the page they came from.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const location = useLocation()
  const login = usePostApiAuthLogin({ mutation: { meta: errorsShownInline } })

  // Same rules as LoginRequestValidator on the server.
  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t('auth.validation.emailRequired'))
          .pipe(z.email(t('auth.validation.emailInvalid'))),
        password: z.string().min(1, t('auth.validation.passwordRequired')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit((values) => {
    login.mutate({ data: values }, { onSuccess: signIn })
  })

  const formError = login.error
    ? isApiError(login.error) && login.error.status === 401
      ? t('login.invalidCredentials')
      : apiErrorMessage(login.error)
    : undefined

  return (
    <AuthCard
      title={t('login.title')}
      description={t('login.description')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          {/* Pass the return page along, so registering also leads back to it. */}
          <Link
            to={{ pathname: '/register', search: location.search }}
            className="font-medium text-primary hover:underline dark:text-accent-foreground"
          >
            {t('login.createAccount')}
          </Link>
        </>
      }
      aside={{
        title: t('login.aside.title'),
        perks: [
          { icon: CalendarCheck, title: t('login.aside.book'), text: t('login.aside.bookText') },
          { icon: Clock, title: t('login.aside.due'), text: t('login.aside.dueText') },
          {
            icon: ShieldCheck,
            title: t('login.aside.deposit'),
            text: t('login.aside.depositText'),
          },
        ],
        note: (
          <>
            <b className="font-semibold">{t('login.aside.noteTitle')}</b> {t('login.aside.note')}
          </>
        ),
      }}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="flex flex-col gap-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
          {login.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <LogIn aria-hidden />
          )}
          {t('login.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
