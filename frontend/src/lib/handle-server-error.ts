import { AxiosError } from 'axios'
import { toast } from 'sonner'

/**
 * Extract user-friendly error message from server/axios errors.
 * Also shows a toast. Returns the message for optional use.
 */
export function handleServerError(error: unknown): string {
  // eslint-disable-next-line no-console
  console.error(error)

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data
    if (typeof data === 'object' && data !== null) {
      // DRF validation errors: { field: ["msg"], ... } or { detail: "msg" }
      if ('detail' in data && typeof data.detail === 'string') {
        errMsg = data.detail
      } else if (Array.isArray(data.detail)) {
        errMsg = (data.detail as string[]).join(' ')
      } else if (typeof data === 'object') {
        const msgs = Object.entries(data)
          .filter(([, v]) => Array.isArray(v) && v.length)
          .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
        if (msgs.length) errMsg = msgs.join('; ')
      }
    }
  }

  toast.error(errMsg)
  return errMsg
}
