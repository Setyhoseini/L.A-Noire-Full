import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { login } from '@/api/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Enter your username, email, phone, or national code'),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(7, 'Password must be at least 7 characters'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const res = await login(data.identifier, data.password)
      setUser(res.user)
      setAccessToken(res.access)
      const target = redirectTo || '/'
      navigate({ to: target, replace: true })
      toast.success(`Welcome back, ${res.user.first_name || res.user.username}!`)
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : null
      const msg =
        typeof data === 'object' && data && 'detail' in data
          ? (data as { detail: string | string[] }).detail
          : null
      const message =
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg) && msg[0]
            ? String(msg[0])
            : 'Sign in failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='identifier'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username, email, phone, or national code</FormLabel>
              <FormControl>
                <Input
                  placeholder='Enter your identifier'
                  autoComplete='username'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  autoComplete='current-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' type='submit' disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <LogIn className='size-4' />
          )}
          Sign in
        </Button>
      </form>
    </Form>
  )
}
