import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useFocusTrap, useMediaQuery } from '@mantine/hooks'
import {
  CalendarDays,
  ChartNoAxesCombined,
  CheckCheck,
  Headphones,
  Inbox,
  ListTodo,
  MoreHorizontal,
  Plus,
  Settings2,
  Sprout,
  Sun,
} from 'lucide-react'
import { $data, $view } from '../model'
import type { Project, View } from '../model/schema'
import { dateKey } from '../lib'

const navigation: { id: View; label: string; icon: typeof Sun }[] = [
  { id: 'today', label: 'Сегодня', icon: Sun },
  { id: 'upcoming', label: 'Предстоящее', icon: CalendarDays },
  { id: 'all', label: 'Все задачи', icon: ListTodo },
  { id: 'inbox', label: 'Входящие', icon: Inbox },
]

type SidebarProps = {
  sidebar: boolean
  online: boolean
  go: (view: View) => void
  setSettings: (open: boolean) => void
  setSidebar: (open: boolean) => void
  setProjectEditor: (project: Project | 'new') => void
  setDeleteProject: (project: Project) => void
}

export function Sidebar({
  sidebar,
  online,
  go,
  setSettings,
  setSidebar,
  setProjectEditor,
  setDeleteProject,
}: SidebarProps) {
  const mobile = useMediaQuery('(max-width: 760px)')
  const trapRef = useFocusTrap(mobile && sidebar)
  const data = useUnit($data)
  const view = useUnit($view)
  const todayTasks = data.tasks.filter((t) => t.due === dateKey())
  const doneToday = todayTasks.filter((t) => t.status === 'done').length
  const progress = todayTasks.length ? Math.round((doneToday / todayTasks.length) * 100) : 0
  const countFor = (id: View) =>
    data.tasks.filter(
      (task) =>
        task.status !== 'done' &&
        (id === 'today'
          ? task.due && task.due <= dateKey()
          : id === 'upcoming'
            ? task.due && task.due > dateKey()
            : id === 'inbox'
              ? !task.projectId
              : true),
    ).length
  return (
    <aside
      ref={trapRef}
      inert={mobile && !sidebar}
      aria-label="Боковая панель"
      className={`sidebar ${sidebar ? 'is-open' : ''}`}
    >
      <button className="brand" onClick={() => go('today')} aria-label="Flowday — на главную">
        <img src="/favicon.svg" alt="" />
        <span>
          flowday<span className="brand-dot">.</span>
        </span>
      </button>
      <button className="workspace-switch" onClick={() => setSettings(true)}>
        <span className="workspace-avatar">М</span>
        <span>
          <strong>Моё пространство</strong>
          <small>Личное · только для вас</small>
        </span>
        <Settings2 size={14} />
      </button>
      <div className="nav-section-title">ПРОСТРАНСТВО</div>
      <nav aria-label="Основная навигация">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${view === id ? 'active' : ''}`}
            onClick={() => go(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
            <span className="nav-count">{countFor(id)}</span>
          </button>
        ))}
      </nav>
      <div className="nav-divider" />
      <div className="nav-section-title projects-title">
        ПРОЕКТЫ
        <Tooltip label="Новый проект">
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => setProjectEditor('new')}
            aria-label="Создать проект"
          >
            <Plus size={15} />
          </ActionIcon>
        </Tooltip>
      </div>
      <nav aria-label="Проекты">
        {data.projects.map((p) => (
          <div
            key={p.id}
            className={`project-nav-row ${view === `project:${p.id}` ? 'active' : ''}`}
          >
            <button
              className="nav-item"
              onClick={() => go(`project:${p.id}`)}
              aria-current={view === `project:${p.id}` ? 'page' : undefined}
            >
              <i className="project-dot" style={{ background: p.color }} />
              <span>{p.name}</span>
              <span className="nav-count">
                {data.tasks.filter((t) => t.projectId === p.id && t.status !== 'done').length}
              </span>
            </button>
            <Menu width={185} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  className="project-menu"
                  variant="subtle"
                  color="gray"
                  size="xs"
                  aria-label={`Настройки проекта ${p.name}`}
                >
                  <MoreHorizontal size={15} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setProjectEditor(p)}>Редактировать</Menu.Item>
                <Menu.Item color="red" onClick={() => setDeleteProject(p)}>
                  Удалить проект
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        ))}
        <button className="add-project" onClick={() => setProjectEditor('new')}>
          <Plus size={15} />
          Новый проект
        </button>
      </nav>
      <div className="nav-divider" />
      <nav aria-label="Инструменты">
        <button
          className={`nav-item ${view === 'focus' ? 'active' : ''}`}
          onClick={() => go('focus')}
        >
          <Headphones size={18} />
          <span>Режим фокуса</span>
          <span className="new-badge">ZEN</span>
        </button>
        <button
          className={`nav-item ${view === 'stats' ? 'active' : ''}`}
          onClick={() => go('stats')}
        >
          <ChartNoAxesCombined size={18} />
          <span>Мой прогресс</span>
        </button>
        <button
          className={`nav-item ${view === 'completed' ? 'active' : ''}`}
          onClick={() => go('completed')}
        >
          <CheckCheck size={18} />
          <span>Выполненное</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="daily-goal">
          <div>
            <span>
              <Sprout size={15} />
              День в вашем ритме
            </span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>
          <small>
            {doneToday} из {todayTasks.length} задач на сегодня
          </small>
        </div>
        <button
          className="nav-item"
          onClick={() => {
            setSettings(true)
            setSidebar(false)
          }}
        >
          <Settings2 size={18} />
          <span>Настройки</span>
          <span className="key-hint">⚙</span>
        </button>
        <div className="sidebar-footnote">
          <span className={`save-dot ${!online ? 'offline' : ''}`} />
          {online ? 'Всё сохраняется на устройстве' : 'Офлайн · всё под рукой'}
        </div>
      </div>
    </aside>
  )
}
