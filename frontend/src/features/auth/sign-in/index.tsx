import { Link, useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
          <CardDescription>
            Enter your username, email, phone, or national code and password to
            access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter className='flex flex-col gap-2'>
          <p className='text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link to='/sign-up' className='font-medium text-primary hover:underline'>
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
