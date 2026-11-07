import { useEffect, useRef, useState } from 'react'
import { useUnit } from 'effector-react'
import { ActionIcon, Alert, Button, Group, Modal, TextInput, Tooltip } from '@mantine/core'
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  Menu as MenuIcon,
  Plus,
  Search,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  WifiOff,
  X,
  ChartNoAxesCombined,
} from 'lucide-react'
import {
  $data,
  $search,
  $storageFailed,
  $restoreFailed,
  $view,
  projectDeleted,
  searchChanged,
  viewChanged,
} from './model'
import type { Project, Task, View } from './model/schema'
import { dateKey, shiftDate } from './lib'
import { TaskEditor } from './components/TaskEditor'
import { ProjectEditor } from './components/ProjectEditor'
import { Sidebar } from './components/Sidebar'
import { TaskWorkspace } from './components/TaskWorkspace'
import { FocusTimer } from './components/FocusTimer'
import { Settings } from './components/Settings'
import { Statistics, StatsOverview, WeekChart } from './components/Statistics'
import { usePwa } from './pwa'

const titleMap: Record<string, { title: string; subtitle: string }> = {
  today: { title: 'Сегодня', subtitle: 'Освободите голову. Сосредоточьтесь на главном.' },
  upcoming: { title: 'Предстоящее', subtitle: 'Для хороших планов всегда найдётся время.' },
  all: { title: 'Все задачи', subtitle: 'Большая картина складывается из маленьких шагов.' },
  inbox: { title: 'Входящие', subtitle: 'Место для мыслей, которые скоро станут планами.' },
  completed: { title: 'Выполненное', subtitle: 'Посмотрите, сколько всего уже получилось.' },
  focus: { title: 'В потоке', subtitle: 'Дайте важному немного вашего внимания.' },
  stats: { title: 'Ваш прогресс', subtitle: 'Продуктивность в вашем ритме, без гонки.' },
}

function Plant() {
  return (
    <svg className="plant" viewBox="0 0 170 140" fill="none" aria-hidden="true">
      <ellipse cx="90" cy="127" rx="47" ry="7" fill="currentColor" opacity=".05" />
      <path
        d="M90 103C91 76 86 55 95 27M89 86C76 69 67 61 52 54M90 72C105 58 115 53 130 49"
        stroke="#769c7a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M94 47C78 34 83 14 103 10C110 25 110 39 94 47Z" fill="#7caa83" />
      <path d="M75 73C54 77 40 64 39 46C61 45 75 55 75 73Z" fill="#a6bca0" />
      <path d="M105 63C105 42 120 32 140 36C137 55 124 66 105 63Z" fill="#90ad89" />
      <path d="M59 97h65l-9 31H69l-10-31Z" fill="#dccbb2" />
      <path d="M57 95h69v9H57z" fill="#e9d9c2" />
      <path
        d="M76 109l3 14M92 109v14M108 109l-3 14"
        stroke="#c2af94"
        strokeWidth="1.5"
        opacity=".5"
      />
      <circle cx="147" cy="20" r="4" fill="#d9ba73" opacity=".8" />
      <path d="M31 22v8m-4-4h8" stroke="#97ae97" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function App() {
  const data = useUnit($data)
  const view = useUnit($view)
  const search = useUnit($search)
  const storageError = useUnit($storageFailed)
  const restoreError = useUnit($restoreFailed)
  const pwa = usePwa()
  const [sidebar, setSidebar] = useState(false)
  const [settings, setSettings] = useState(false)
  const [editor, setEditor] = useState<Task | 'new' | null>(null)
  const [projectEditor, setProjectEditor] = useState<Project | 'new' | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [help, setHelp] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [initialStatus, setInitialStatus] = useState<Task['status']>('todo')
  const searchRef = useRef<HTMLInputElement>(null)
  const project = data.projects.find((p) => view === `project:${p.id}`)
  const isTaskView = view !== 'focus' && view !== 'stats'
  const heading = project
    ? { title: project.name, subtitle: 'Свои цели. Свой темп. Один шаг за другим.' }
    : (titleMap[view] ?? titleMap.all)
  const go = (next: View) => {
    viewChanged(next)
    setSidebar(false)
    setSelectedDay(null)
  }
  const defaultDue =
    view === 'inbox' ? null : (selectedDay ?? (view === 'upcoming' ? shiftDate(1) : dateKey()))
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebar(false)
        return
      }
      const element = event.target as HTMLElement
      if (element.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return
      if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setInitialStatus('todo')
        setEditor('new')
      }
      if (
        event.key === '/' ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')
      ) {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === '?') setHelp(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    if (view.startsWith('project:') && !project) viewChanged('all')
  }, [view, project])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])
  return (
    <div className={`app-shell ${data.settings.compact ? 'compact' : ''}`}>
      {sidebar && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть навигацию"
          onClick={() => setSidebar(false)}
        />
      )}
      <Sidebar
        sidebar={sidebar}
        online={pwa.online}
        go={go}
        setSettings={setSettings}
        setSidebar={setSidebar}
        setProjectEditor={setProjectEditor}
        setDeleteProject={setDeleteProject}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-start">
            <ActionIcon
              className="mobile-menu"
              variant="subtle"
              color="gray"
              onClick={() => setSidebar(true)}
              aria-label="Открыть меню"
            >
              <MenuIcon size={22} />
            </ActionIcon>
            <span className="breadcrumb">
              Моё пространство
              <ChevronRight size={13} />
              <strong>{heading.title}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <TextInput
              ref={searchRef}
              className="global-search"
              placeholder="Найти задачу…"
              aria-label="Поиск задач"
              leftSection={<Search size={16} />}
              rightSection={
                search ? (
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    color="gray"
                    aria-label="Очистить поиск"
                    onClick={() => searchChanged('')}
                  >
                    <X size={13} />
                  </ActionIcon>
                ) : (
                  <kbd>/</kbd>
                )
              }
              value={search}
              onFocus={() => {
                if (!isTaskView) go('all')
              }}
              onChange={(event) => searchChanged(event.currentTarget.value)}
            />
            <Tooltip label="Горячие клавиши">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setHelp(true)}
                aria-label="Помощь и горячие клавиши"
              >
                <CircleHelp size={19} />
              </ActionIcon>
            </Tooltip>
            <button
              className="profile-avatar"
              aria-label="Открыть настройки"
              onClick={() => setSettings(true)}
            >
              М
            </button>
          </div>
        </header>
        <main id="main-content" className={`page ${view === 'focus' ? 'focus-page' : ''}`}>
          {!pwa.online && (
            <Alert mb="md" color="teal" icon={<WifiOff size={17} />}>
              Вы офлайн. Все изменения сохраняются на этом устройстве.
            </Alert>
          )}
          {restoreError && (
            <Alert mb="md" color="orange">
              Предыдущие данные не удалось прочитать. Загружено начальное пространство. Если у вас
              есть резервная копия, восстановите её в настройках.
            </Alert>
          )}
          {storageError && (
            <Alert mb="md" color="orange">
              Не удалось сохранить данные в браузере. Сделайте экспорт в настройках, чтобы не
              потерять изменения.
            </Alert>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />
                ВАШ СПОКОЙНЫЙ ПРОДУКТИВНЫЙ ДЕНЬ
              </div>
              <div className="title-line">
                {view === 'today' && <Sun size={30} className="heading-sun" />}
                <h1>{heading.title}</h1>
                {view === 'today' && (
                  <span className="date-pill">
                    {new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(
                      new Date(),
                    )}
                  </span>
                )}
                {project && (
                  <i className="heading-project-dot" style={{ background: project.color }} />
                )}
              </div>
              <p>{heading.subtitle}</p>
            </div>
            {isTaskView && (
              <Button
                className="new-task-button"
                leftSection={<Plus size={17} />}
                onClick={() => {
                  setInitialStatus('todo')
                  setEditor('new')
                }}
              >
                Новая задача<span className="button-key">N</span>
              </Button>
            )}
          </div>
          {view === 'focus' ? (
            <div className="focus-stage">
              <FocusTimer expanded />
              <div className="focus-stage-caption">
                <Sprout size={18} />
                Не нужно успеть всё. Достаточно сделать важное.
              </div>
            </div>
          ) : view === 'stats' ? (
            <Statistics />
          ) : (
            <>
              {view === 'today' && (
                <>
                  <div className="welcome-banner">
                    <div>
                      <span className="welcome-tag">
                        <Sparkles size={13} />
                        МЕНЬШЕ ШУМА, БОЛЬШЕ СМЫСЛА
                      </span>
                      <h2>
                        Всё начинается с малого<span>.</span>
                      </h2>
                      <p>Не торопитесь. Выберите важное и сделайте первый шаг.</p>
                      <button onClick={() => go('focus')}>
                        Поймать фокус
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <Plant />
                  </div>
                  <StatsOverview />
                </>
              )}
              <div className="workspace-content">
                <TaskWorkspace
                  key={view}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  onNew={(status) => {
                    setInitialStatus(status ?? 'todo')
                    setEditor('new')
                  }}
                  onEdit={setEditor}
                />
                <aside className="right-panel">
                  <FocusTimer />
                  <section className="week-card">
                    <div className="panel-heading">
                      <span>
                        <ChartNoAxesCombined size={16} />
                        Ваш ритм
                      </span>
                      <button onClick={() => go('stats')} aria-label="Открыть статистику">
                        <ArrowUpIcon />
                      </button>
                    </div>
                    <WeekChart />
                  </section>
                  <div className="quote-card">
                    <span>“</span>
                    <p>
                      Секрет движения вперёд —<br />в том, чтобы начать.
                    </p>
                    <small>ОДИН ШАГ ЗА ДРУГИМ</small>
                    <Sprout size={25} strokeWidth={1.3} />
                  </div>
                </aside>
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>Место для важного. Пространство для вас.</span>
            <span>
              flowday<span className="brand-dot">.</span>
            </span>
          </footer>
        </main>
      </div>
      {editor && (
        <TaskEditor
          task={editor === 'new' ? undefined : editor}
          projectId={project?.id}
          due={defaultDue}
          initialStatus={initialStatus}
          onClose={() => setEditor(null)}
        />
      )}
      {projectEditor && (
        <ProjectEditor
          project={projectEditor === 'new' ? undefined : projectEditor}
          onClose={() => setProjectEditor(null)}
        />
      )}
      {settings && <Settings onClose={() => setSettings(false)} pwa={pwa} />}
      <Modal
        opened={help}
        onClose={() => setHelp(false)}
        title="Чуть быстрее, чуть спокойнее"
        centered
        size="sm"
      >
        <div className="shortcuts">
          <div>
            <span>Новая задача</span>
            <kbd>N</kbd>
          </div>
          <div>
            <span>Поиск задач</span>
            <kbd>/</kbd>
            <span>или</span>
            <kbd>Ctrl K</kbd>
          </div>
          <div>
            <span>Эта подсказка</span>
            <kbd>?</kbd>
          </div>
          <div>
            <span>Закрыть окно</span>
            <kbd>Esc</kbd>
          </div>
        </div>
        <p className="muted">
          На доске перетаскивайте карточки между колонками, чтобы менять статус. На телефоне статус
          можно изменить в меню задачи.
        </p>
        <p className="muted">
          При первом запуске вас встречают примеры. Их можно изменить или очистить в настройках.
        </p>
      </Modal>
      <Modal
        opened={Boolean(deleteProject)}
        onClose={() => setDeleteProject(null)}
        title="Удалить проект?"
        centered
        size="sm"
      >
        <p className="muted">
          Проект «{deleteProject?.name}» будет удалён. Его задачи сохранятся во «Входящих».
        </p>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleteProject(null)}>
            Отмена
          </Button>
          <Button
            color="red"
            leftSection={<Trash2 size={14} />}
            onClick={() => {
              if (deleteProject) projectDeleted(deleteProject.id)
              setDeleteProject(null)
            }}
          >
            Удалить проект
          </Button>
        </Group>
      </Modal>
      {pwa.needRefresh[0] && !settings && (
        <div className="update-toast">
          <Sparkles size={18} />
          <span>Flowday стал ещё лучше</span>
          <Button size="compact-xs" onClick={() => void pwa.updateServiceWorker(true)}>
            Обновить
          </Button>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            aria-label="Позже"
            onClick={() => pwa.needRefresh[1](false)}
          >
            <X size={13} />
          </ActionIcon>
        </div>
      )}
    </div>
  )
}

function ArrowUpIcon() {
  return <ChevronRight size={17} />
}
