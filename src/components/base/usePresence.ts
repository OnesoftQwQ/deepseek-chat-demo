import { useEffect, useState } from 'react'

/**
 * 浮层关闭后先保留一小段时间播完退出动画再卸载。
 * 期间 exiting 为 true，调用方据此叠加退出动画的 class。
 */
export const usePresence = (open: boolean, duration = 100) => {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    if (!mounted) {
      return
    }
    const timer = setTimeout(() => setMounted(false), duration)
    return () => clearTimeout(timer)
  }, [open, mounted, duration])

  return { mounted, exiting: mounted && !open }
}
