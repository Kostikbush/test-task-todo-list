import { Component, StrictMode, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { useUnit } from 'effector-react'
import { Button, createTheme, MantineProvider } from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import App from './App'
import { $data, tick, timerFinished } from './model'
import { playSound } from './sound'
import './fonts.css'
import './styles.css'

const fonts = { manrope: 'Manrope Variable', inter: 'Inter Variable', lora: 'Lora' }
const theme = createTheme({
  primaryColor: 'forest',
  colors: {
    forest: [
      '#edf6f1',
      '#dcece4',
      '#b9d9ca',
      '#91c4ac',
      '#6eae91',
      '#4e967a',
      '#277966',
      '#246a59',
      '#205748',
      '#194738',
    ],
  },
  defaultRadius: 'md',
  primaryShade: 6,
  headings: { fontWeight: '700' },
  components: {
    Button: Button.extend({ defaultProps: { fw: 600 } }),
  },
})

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>Нужен небольшой перерыв</h1>
        <p>Не удалось отобразить приложение. Сохранённые задачи остались в браузере.</p>
        <button onClick={() => window.location.reload()}>Перезагрузить Flowday</button>
      </div>
    ) : (
      this.props.children
    )
  }
}

function Root() {
  const { settings } = useUnit($data)
  const [systemDark, setSystemDark] = useState(
    () => matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const scheme = settings.theme === 'auto' ? (systemDark ? 'dark' : 'light') : settings.theme
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemDark(query.matches)
    query.addEventListener('change', handler)
    const interval = window.setInterval(() => tick(Date.now()), 1000)
    const wake = () => tick(Date.now())
    document.addEventListener('visibilitychange', wake)
    const unsubscribe = timerFinished.watch(() => {
      if ($data.getState().settings.sound) playSound()
      notifications.show({
        title:
          $data.getState().timer.mode === 'focus'
            ? 'Отличная работа! Пора отдохнуть.'
            : 'Перерыв окончен',
        message: 'Выберите следующий шаг в своём темпе.',
        autoClose: 10000,
        color: 'teal',
      })
    })
    return () => {
      query.removeEventListener('change', handler)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', wake)
      unsubscribe()
    }
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = scheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', scheme === 'dark' ? '#1b2523' : '#277966')
    document.documentElement.style.setProperty(
      '--app-font',
      `'${fonts[settings.font]}', sans-serif`,
    )
  }, [scheme, settings.font])
  return (
    <MantineProvider
      theme={{ ...theme, fontFamily: `'${fonts[settings.font]}', sans-serif` }}
      forceColorScheme={scheme}
    >
      <Notifications position="bottom-right" limit={3} />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MantineProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
