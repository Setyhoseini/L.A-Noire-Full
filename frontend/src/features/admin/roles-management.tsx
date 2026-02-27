import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getPermissions, getRoles, updateRole, createRole, type Role, type Permission } from '@/api/admin'
import { useState } from 'react'
import { toast } from 'sonner'

export function RolesManagement() {
  const queryClient = useQueryClient()
  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  })
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Role> }) => updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('رول با موفقیت به‌روزرسانی شد')
    },
    onError: () => toast.error('خطا در به‌روزرسانی رول'),
  })

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('رول جدید ایجاد شد')
    },
    onError: () => toast.error('خطا در ایجاد رول'),
  })

  const handlePermissionToggle = (role: Role, permCode: string, checked: boolean) => {
    const current = role.permissions ?? []
    const next = checked ? [...current, permCode] : current.filter((p) => p !== permCode)
    updateMutation.mutate({ id: role.id, payload: { permissions: next } })
  }

  const isLoading = permsLoading || rolesLoading

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
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            مدیریت رول‌ها و دسترسی‌ها
          </CardTitle>
          <CardDescription>
            پرمیشن‌های هر رول را انتخاب کنید. کاربران با آن رول، دسترسی‌های رول را به ارث می‌برند.
          </CardDescription>
        </div>
        <CreateRoleDialog permissions={permissions} onCreate={createMutation.mutate} />
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='min-w-[180px] font-semibold'>رول</TableHead>
                {permissions.map((p) => (
                  <TableHead key={p.code} className='text-center min-w-[100px]'>
                    <span className='block truncate max-w-[90px]' title={p.label_fa}>
                      {p.label_fa}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  {permissions.map((p) => (
                    <TableCell key={p.code} className='text-center'>
                      <Checkbox
                        checked={(role.permissions ?? []).includes(p.code)}
                        onCheckedChange={(checked) =>
                          handlePermissionToggle(role, p.code, checked === true)
                        }
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateRoleDialog({
  permissions,
  onCreate,
}: {
  permissions: Permission[]
  onCreate: (payload: { name: string; description: string; permissions: string[] }) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), description: description.trim(), permissions: selectedPerms })
    setOpen(false)
    setName('')
    setDescription('')
    setSelectedPerms([])
  }

  const togglePerm = (code: string) => {
    setSelectedPerms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>رول جدید</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>ایجاد رول جدید</DialogTitle>
          <DialogDescription>نام و پرمیشن‌های رول را وارد کنید.</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='role-name'>نام رول</Label>
            <Input
              id='role-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='مثال: Detective'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='role-desc'>توضیحات</Label>
            <Input
              id='role-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='توضیح کوتاه'
            />
          </div>
          <div className='space-y-2'>
            <Label>پرمیشن‌ها</Label>
            <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded border p-3'>
              {permissions.map((p) => (
                <label key={p.code} className='flex items-center gap-2 cursor-pointer'>
                  <Checkbox
                    checked={selectedPerms.includes(p.code)}
                    onCheckedChange={() => togglePerm(p.code)}
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
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            ایجاد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
