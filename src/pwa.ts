import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwa() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  )
  const [installHelp, setInstallHelp] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const registration = useRegisterSW()
  useEffect(() => {
    const ready = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPrompt)
    }
    const done = () => {
      setInstalled(true)
      setPrompt(null)
    }
    const connected = () => setOnline(navigator.onLine)
    window.addEventListener('beforeinstallprompt', ready)
    window.addEventListener('appinstalled', done)
    window.addEventListener('online', connected)
    window.addEventListener('offline', connected)
    return () => {
      window.removeEventListener('beforeinstallprompt', ready)
      window.removeEventListener('appinstalled', done)
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', connected)
    }
  }, [])
  const install = async () => {
    if (!prompt) {
      setInstallHelp(true)
      return
    }
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
      setPrompt(null)
    } catch {
      setInstallHelp(true)
    }
  }
  return { ...registration, installed, install, installHelp, setInstallHelp, online }
}

export type PwaState = ReturnType<typeof usePwa>
