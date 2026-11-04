import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/** true cote client apres hydration, false pendant le SSR/hydration. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
