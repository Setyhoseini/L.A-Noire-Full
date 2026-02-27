import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Loader2, Pencil } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  getPermissions,
  getRoles,
  getUsers,
  assignUserRoles,
  type AdminUser,
  type Role,
  type Permission,
} from '@/api/admin'
import { useState } from 'react'
import { toast } from 'sonner'

export function UsersManagement() {
  const queryClient = useQueryClient()
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='h-5 w-5' />
          مدیریت کاربران
        </CardTitle>
        <CardDescription>
          رول‌ها و پرمیشن‌های اضافی هر کاربر را تنظیم کنید. پرمیشن‌های اضافی علاوه بر رول اعمال می‌شوند.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>رول‌ها</TableHead>
                <TableHead>پرمیشن‌های اضافی</TableHead>
                <TableHead className='w-[80px]' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className='font-medium'>
                        {user.first_name} {user.last_name}
                      </p>
                      <p className='text-sm text-muted-foreground'>{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {(user.roles ?? []).map((r) => (
                        <Badge key={r} variant='secondary'>
                          {r}
                        </Badge>
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <span className='text-muted-foreground text-sm'>—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {(user.extra_permissions ?? []).map((p) => (
                        <Badge key={p} variant='outline'>
                          {p}
                        </Badge>
                      ))}
                      {(!user.extra_permissions || user.extra_permissions.length === 0) && (
                        <span className='text-muted-foreground text-sm'>—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <UserEditDialog user={user} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function UserEditDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: getRoles })
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: getPermissions })

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(user.role_ids ?? [])
  const [selectedExtraPerms, setSelectedExtraPerms] = useState<string[]>(user.extra_permissions ?? [])

  const assignMutation = useMutation({
    mutationFn: (payload: { role_ids: number[]; extra_permissions: string[] }) =>
      assignUserRoles(user.id, payload.role_ids, payload.extra_permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('دسترسی‌های کاربر به‌روزرسانی شد')
      setOpen(false)
    },
    onError: () => toast.error('خطا در به‌روزرسانی'),
  })

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedRoleIds(user.role_ids ?? [])
      setSelectedExtraPerms(user.extra_permissions ?? [])
    }
    setOpen(isOpen)
  }

  const toggleRole = (id: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const toggleExtraPerm = (code: string) => {
    setSelectedExtraPerms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    )
  }

  const handleSave = () => {
    assignMutation.mutate({ role_ids: selectedRoleIds, extra_permissions: selectedExtraPerms })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Pencil className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>تنظیم دسترسی‌ها</DialogTitle>
          <DialogDescription>
            {user.first_name} {user.last_name} — رول‌ها و پرمیشن‌های اضافی را انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6 py-4'>
          <div className='space-y-2'>
            <Label>رول‌ها</Label>
            <p className='text-sm text-muted-foreground'>
              کاربر دسترسی‌های رول‌های انتخاب‌شده را به ارث می‌برد.
            </p>
            <div className='grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded border p-3'>
              {roles.map((r) => (
                <label key={r.id} className='flex items-center gap-2 cursor-pointer'>
                  <Checkbox
                    checked={selectedRoleIds.includes(r.id)}
                    onCheckedChange={() => toggleRole(r.id)}
                  />
                  <span className='text-sm'>{r.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Label>پرمیشن‌های اضافی</Label>
            <p className='text-sm text-muted-foreground'>
              دسترسی‌های بیشتر برای این کاربر (علاوه بر رول‌ها).
            </p>
            <div className='grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded border p-3'>
              {permissions.map((p) => (
                <label key={p.code} className='flex items-center gap-2 cursor-pointer'>
                  <Checkbox
                    checked={selectedExtraPerms.includes(p.code)}
                    onCheckedChange={() => toggleExtraPerm(p.code)}
                  />
                  <span className='text-sm'>{p.label_fa}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={assignMutation.isPending}>
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
