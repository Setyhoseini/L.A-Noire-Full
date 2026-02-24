import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { register as registerApi } from '@/api/auth'
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

const formSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email'),
    phone_number: z
      .string()
      .min(1, 'Phone number is required')
      .max(32, 'Phone number too long'),
    national_id: z
      .string()
      .min(1, 'National code is required')
      .regex(/^\d+$/, 'National code must contain only digits')
      .refine((v) => v.length >= 10 && v.length <= 32, 'National code: 10–32 digits'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(7, 'Password must be at least 7 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      phone_number: '',
      national_id: '',
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await registerApi({
        username: data.username,
        email: data.email,
        phone_number: data.phone_number,
        national_id: data.national_id,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      })
      toast.success('Account created. Please sign in.')
      navigate({ to: '/sign-in', replace: true })
    } catch (err: unknown) {
      // Log full error for debugging
      if (import.meta.env.DEV) {
        console.error('Registration error:', err)
      }
      const res =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown; status?: number } }).response
              ?.data
          : null
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : 0

      let message = 'Registration failed'
      if (res && typeof res === 'object') {
        const data = res as Record<string, unknown>
        if (typeof data.detail === 'string') {
          message = data.detail
        } else if (Array.isArray(data.detail)) {
          message = String(data.detail[0] ?? message)
        } else {
          const firstMsg = Object.values(data)
            .flat()
            .find((v) => typeof v === 'string' || (Array.isArray(v) && v[0]))
          message = Array.isArray(firstMsg)
            ? String(firstMsg[0])
            : typeof firstMsg === 'string'
              ? firstMsg
              : message
        }
      } else if (status === 0) {
        message = 'Cannot reach server. Is the backend running?'
      }
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
        <div className='grid grid-cols-2 gap-3'>
          <FormField
            control={form.control}
            name='first_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input placeholder='John' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='last_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input placeholder='Doe' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='johndoe' autoComplete='username' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='name@example.com'
                  autoComplete='email'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='phone_number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder='09123456789' autoComplete='tel' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='national_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>National code</FormLabel>
              <FormControl>
                <Input placeholder='1234567890' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' type='submit' disabled={isLoading}>
          {isLoading && <Loader2 className='me-2 size-4 animate-spin' />}
          Create account
        </Button>
      </form>
    </Form>
  )
}
