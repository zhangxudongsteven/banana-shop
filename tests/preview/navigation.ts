import { useSyncExternalStore } from 'react'
let path = '/dashboard/customPrompt'
const subscribers = new Set<() => void>()
const router = {
  push(next: string) {
    path = next
    subscribers.forEach((fn) => fn())
  },
  replace(next: string) {
    this.push(next)
  },
}
export function usePathname() {
  return useSyncExternalStore(
    (fn) => {
      subscribers.add(fn)
      return () => {
        subscribers.delete(fn)
      }
    },
    () => path
  )
}
export function useParams() {
  return { style: usePathname().split('/')[2] || 'customPrompt' }
}
export function useRouter() {
  return router
}
