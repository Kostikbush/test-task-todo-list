import { useState } from 'react'
import type { ReactNode } from 'react'
import { useUnit } from 'effector-react'
import { ActionIcon, Button, Menu, Select, Switch, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Flower2,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Sprout,
  X,
} from 'lucide-react'
import { $data, $view, $search, searchChanged, taskSaved, taskPatched } from '../model'
import type { Task } from '../model/schema'
import { selectTasks } from '../model/logic'
import { dateKey, formatDate, plural, shiftDate } from '../lib'
import { priorities, statuses } from './TaskEditor'
import { TaskCard } from './TaskCard'

function TaskGroup({
  title,
  count,
  children,
  done = false,
}: {
  title: string
  count: number
  children: ReactNode
  done?: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className={`task-group ${done ? 'done-group' : ''}`}>
      <button className="group-heading" onClick={() => setOpen(!open)} aria-expanded={open}>
        <ChevronDown size={15} className={open ? '' : 'collapsed'} />
        <span>{title}</span>
        <span className="group-count">{count}</span>
        {done && <CheckCheck size={15} />}
      </button>
      {open && children}
    </section>
  )
}

export function TaskWorkspace({
  selectedDay,
  setSelectedDay,
  onNew,
  onEdit,
}: {
  selectedDay: string | null
  setSelectedDay: (day: string | null) => void
  onNew: (status?: Task['status']) => void
  onEdit: (task: Task) => void
}) {
  const data = useUnit($data)
  const view = useUnit($view)
  const search = useUnit($search)
  const project = data.projects.find((p) => view === `project:${p.id}`)
  const [layout, setLayout] = useState<'list' | 'board'>('list')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('manual')
  const [showCompleted, setShowCompleted] = useState(true)
  const [quickTitle, setQuickTitle] = useState('')

  const tasks = selectTasks(data.tasks, { view, search, priority, sort, showCompleted }).filter(
    (t) => !selectedDay || t.due === selectedDay,
  )
  const openTasks = tasks.filter((t) => t.status !== 'done')
  const completedTasks = tasks.filter((t) => t.status === 'done')

  const defaultDue =
    view === 'inbox' ? null : (selectedDay ?? (view === 'upcoming' ? shiftDate(1) : dateKey()))
  const quickAdd = () => {
    if (!quickTitle.trim()) return
    taskSaved({
      draft: {
        title: quickTitle.trim(),
        description: '',
        priority: 'none',
        status: 'todo',
        due: defaultDue,
        projectId: project?.id ?? null,
        tags: [],
        subtasks: [],
      },
    })
    setQuickTitle('')
    notifications.show({ message: 'Задача добавлена', autoClose: 2000 })
  }

  return (
    <div className="task-workspace">
      <div className="task-toolbar">
        <div className="list-heading">
          <h2>{view === 'today' ? 'План на день' : 'Задачи'}</h2>
          <span>{tasks.length}</span>
        </div>
        <div className="toolbar-actions">
          <Menu width={230} position="bottom-end" closeOnItemClick={false}>
            <Menu.Target>
              <Button
                variant="subtle"
                color={priority !== 'all' || !showCompleted ? 'teal' : 'gray'}
                size="compact-sm"
                leftSection={<SlidersHorizontal size={14} />}
              >
                Фильтр{priority !== 'all' && <span className="filter-dot" />}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <div className="filter-dropdown">
                <Select
                  label="Приоритет"
                  value={priority}
                  onChange={(value) => setPriority(value ?? 'all')}
                  data={[{ value: 'all', label: 'Любой приоритет' }, ...priorities]}
                  allowDeselect={false}
                />
                <Switch
                  mt="md"
                  size="xs"
                  label="Показывать выполненные"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.currentTarget.checked)}
                />
                <Button
                  mt="md"
                  fullWidth
                  variant="light"
                  size="xs"
                  onClick={() => {
                    setPriority('all')
                    setShowCompleted(true)
                    setSelectedDay(null)
                    searchChanged('')
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            </Menu.Dropdown>
          </Menu>
          <Menu width={195} position="bottom-end">
            <Menu.Target>
              <Tooltip label="Порядок задач">
                <ActionIcon
                  variant={sort !== 'manual' ? 'light' : 'subtle'}
                  color="gray"
                  aria-label="Сортировка задач"
                >
                  <ArrowDownWideNarrow size={17} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              {[
                { id: 'manual', label: 'По порядку добавления' },
                { id: 'priority', label: 'По приоритету' },
                { id: 'due', label: 'По сроку' },
                { id: 'newest', label: 'Сначала новые' },
              ].map((item) => (
                <Menu.Item
                  key={item.id}
                  rightSection={sort === item.id ? <Check size={14} /> : null}
                  onClick={() => setSort(item.id)}
                >
                  {item.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <span className="toolbar-divider" />
          <div className="view-toggle">
            <Tooltip label="Список">
              <button
                aria-label="Вид: список"
                aria-pressed={layout === 'list'}
                className={layout === 'list' ? 'selected' : ''}
                onClick={() => setLayout('list')}
              >
                <List size={16} />
              </button>
            </Tooltip>
            <Tooltip label="Доска">
              <button
                aria-label="Вид: доска"
                aria-pressed={layout === 'board'}
                className={layout === 'board' ? 'selected' : ''}
                onClick={() => setLayout('board')}
              >
                <LayoutGrid size={15} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {view === 'upcoming' && (
        <div className="upcoming-days">
          <button onClick={() => setSelectedDay(null)} className={!selectedDay ? 'selected' : ''}>
            <CalendarDays size={18} />
            <span>Все даты</span>
          </button>
          {Array.from({ length: 6 }, (_, i) => shiftDate(i + 1)).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={selectedDay === day ? 'selected' : ''}
            >
              <span>
                {new Intl.DateTimeFormat('ru', { weekday: 'short' }).format(
                  new Date(`${day}T12:00:00`),
                )}
              </span>
              <strong>{new Date(`${day}T12:00:00`).getDate()}</strong>
              <i
                className={
                  data.tasks.some((t) => t.due === day && t.status !== 'done') ? 'has-tasks' : ''
                }
              />
            </button>
          ))}
        </div>
      )}
      {(search || priority !== 'all' || selectedDay) && (
        <div className="filter-summary">
          <Search size={13} />
          <span>
            {search ? `«${search}» · ` : ''}
            {selectedDay ? `${formatDate(selectedDay)} · ` : ''}Найдено: {tasks.length}
          </span>
          <button
            onClick={() => {
              searchChanged('')
              setPriority('all')
              setSelectedDay(null)
            }}
          >
            Сбросить
            <X size={12} />
          </button>
        </div>
      )}
      {layout === 'board' && tasks.length > 0 ? (
        <div className="kanban">
          {statuses.map((status) => (
            <section
              className={`kanban-column ${status.value}`}
              key={status.value}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/flowday-task')
                if (data.tasks.some((t) => t.id === id))
                  taskPatched({ id, patch: { status: status.value as Task['status'] } })
              }}
            >
              <div className="kanban-heading">
                <span>
                  <i />
                  {status.label}
                </span>
                <small>{tasks.filter((t) => t.status === status.value).length}</small>
              </div>
              {tasks
                .filter((t) => t.status === status.value)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/flowday-task', task.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    <TaskCard task={task} onEdit={onEdit} board />
                  </div>
                ))}
              <button className="kanban-add" onClick={() => onNew(status.value as Task['status'])}>
                <Plus size={14} />
                Добавить задачу
              </button>
            </section>
          ))}
        </div>
      ) : tasks.length ? (
        <div className="task-groups">
          {view === 'upcoming' ? (
            [...new Set(openTasks.map((t) => t.due))].sort().map((day) => (
              <TaskGroup
                key={day}
                title={day ? formatDate(day) : 'Без срока'}
                count={openTasks.filter((t) => t.due === day).length}
              >
                {openTasks
                  .filter((t) => t.due === day)
                  .map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={onEdit} />
                  ))}
              </TaskGroup>
            ))
          ) : (
            <>
              {openTasks.some((t) => t.status === 'progress') && (
                <TaskGroup
                  title="В работе"
                  count={openTasks.filter((t) => t.status === 'progress').length}
                >
                  {openTasks
                    .filter((t) => t.status === 'progress')
                    .map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={onEdit} />
                    ))}
                </TaskGroup>
              )}
              {openTasks.some((t) => t.status === 'todo') && (
                <TaskGroup
                  title="К выполнению"
                  count={openTasks.filter((t) => t.status === 'todo').length}
                >
                  {openTasks
                    .filter((t) => t.status === 'todo')
                    .map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={onEdit} />
                    ))}
                </TaskGroup>
              )}
            </>
          )}
          {completedTasks.length > 0 && (
            <TaskGroup title="Выполнено" count={completedTasks.length} done>
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEdit} />
              ))}
            </TaskGroup>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <span>
            <Flower2 size={34} strokeWidth={1.4} />
          </span>
          <h3>
            {search || priority !== 'all'
              ? 'Пока ничего не нашлось'
              : view === 'completed'
                ? 'Здесь появятся ваши победы'
                : 'Немного свободного пространства'}
          </h3>
          <p>
            {search || priority !== 'all'
              ? 'Попробуйте другой запрос или измените фильтры.'
              : view === 'completed'
                ? 'Завершите первую задачу — даже самую маленькую.'
                : 'Добавьте задачу, а всё остальное — шаг за шагом.'}
          </p>
          {view !== 'completed' && (
            <Button variant="light" leftSection={<Plus size={15} />} onClick={() => onNew()}>
              Создать задачу
            </Button>
          )}
        </div>
      )}
      {view !== 'completed' && (
        <form
          className="quick-add"
          onSubmit={(event) => {
            event.preventDefault()
            quickAdd()
          }}
        >
          <Plus size={18} />
          <input
            aria-label="Быстро добавить задачу"
            placeholder="Добавить задачу и освободить мысли…"
            value={quickTitle}
            maxLength={200}
            onChange={(event) => setQuickTitle(event.currentTarget.value)}
          />
          {quickTitle.trim() ? (
            <ActionIcon variant="light" type="submit" aria-label="Сохранить задачу">
              <ArrowRight size={16} />
            </ActionIcon>
          ) : (
            <kbd>↵</kbd>
          )}
        </form>
      )}
      <div className="list-footnote">
        <Sprout size={14} />
        {completedTasks.length > 0
          ? `${completedTasks.length} ${plural(completedTasks.length, ['маленькая победа', 'маленькие победы', 'маленьких побед'])}. Продолжайте в своём темпе.`
          : 'Не нужно делать всё сразу. Просто начните.'}
      </div>
    </div>
  )
}
