import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { getProfile, updateProfile, type ProfileUpdatePayload } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'

const profileFormSchema = z.object({
  first_name: z.string().max(150),
  last_name: z.string().max(150),
  phone_number: z.string().max(32).optional().nullable(),
  badge_number: z.string().max(64).optional(),
  rank: z.string().max(64).optional(),
  precinct: z.string().max(64).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => updateProfile(payload),
    onSuccess: (updated) => {
      setUser(updated)
      queryClient.setQueryData(['profile'], updated)
      toast.success('Profile updated successfully')
    },
    onError: (err) => {
      handleServerError(err)
    },
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: profile
      ? {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? '',
          phone_number: profile.phone_number ?? '',
          badge_number: profile.badge_number ?? '',
          rank: profile.rank ?? '',
          precinct: profile.precinct ?? '',
        }
      : undefined,
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_number: '',
      badge_number: '',
      rank: '',
      precinct: '',
    },
  })

  if (isLoading) {
    return <div className='text-sm text-muted-foreground'>Loading profile...</div>
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          updateMutation.mutate({
            first_name: data.first_name || undefined,
            last_name: data.last_name || undefined,
            phone_number: data.phone_number || undefined,
            badge_number: data.badge_number || undefined,
            rank: data.rank || undefined,
            precinct: data.precinct || undefined,
          })
        })}
        className='space-y-6'
      >
        <FormField
          control={form.control}
          name='first_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder='First name' {...field} />
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
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder='Last name' {...field} />
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
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder='Phone number' {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Your contact phone number.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='badge_number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Badge Number</FormLabel>
              <FormControl>
                <Input placeholder='Badge number' {...field} />
              </FormControl>
              <FormDescription>Your department badge number.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='rank'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <FormControl>
                <Input placeholder='Rank' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='precinct'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precinct</FormLabel>
              <FormControl>
                <Input placeholder='Precinct' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Update profile'}
        </Button>
      </form>
    </Form>
  )
}
