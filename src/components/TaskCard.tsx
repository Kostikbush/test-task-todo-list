import { ActionIcon, Checkbox, Menu, Tooltip, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useUnit } from 'effector-react'
import {
  CalendarDays,
  CheckCheck,
  Copy,
  Flag,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import {
  $data,
  taskDeleted,
  taskPatched,
  taskRestored,
  taskSaved,
  taskToggled,
  timerSelected,
  timerStarted,
} from '../model'
import type { Task } from '../model/schema'
import { dateKey, duration, formatDate } from '../lib'

export const priorityNames = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
  none: 'Без приоритета',
}

export function TaskCard({
  task,
  onEdit,
  board = false,
}: {
  task: Task
  onEdit: (task: Task) => void
  board?: boolean
}) {
  const { projects, timer } = useUnit($data)
  const project = projects.find((p) => p.id === task.projectId)
  const overdue = task.due && task.due < dateKey() && task.status !== 'done'
  const remove = () => {
    taskDeleted(task.id)
    notifications.show({
      title: 'Задача удалена',
      message: (
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => {
            taskRestored(task)
            notifications.clean()
          }}
        >
          Отменить удаление
        </Button>
      ),
      autoClose: 7000,
    })
  }
  const start = () => {
    if (timer.taskId !== task.id) timerSelected(task.id)
    timerStarted(Date.now())
  }
  return (
    <article
      className={`task-card ${task.status === 'done' ? 'completed' : ''} ${board ? 'board-card' : ''} ${timer.taskId === task.id && timer.startedAt ? 'tracking' : ''}`}
    >
      <Checkbox
        className="task-check"
        checked={task.status === 'done'}
        onChange={() => taskToggled(task.id)}
        aria-label={`${task.status === 'done' ? 'Вернуть' : 'Выполнить'}: ${task.title}`}
        radius="xl"
        size="md"
      />
      <div className="task-body">
        <button className="task-title" onClick={() => onEdit(task)}>
          {task.title}
        </button>
        <div className="task-meta">
          {project && (
            <span className="project-label">
              <i style={{ background: project.color }} />
              {project.name}
            </span>
          )}
          {task.priority !== 'none' && (
            <span className={`priority-label ${task.priority}`}>
              <Flag size={11} />
              {priorityNames[task.priority]}
            </span>
          )}
          {task.tags.slice(0, 2).map((tag) => (
            <span className="tag" key={tag}>
              #{tag}
            </span>
          ))}
          {task.subtasks.length > 0 && (
            <span>
              <ListChecks size={13} />
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </span>
          )}
          {task.tracked > 0 && <span className="tracked-time">◷ {duration(task.tracked)}</span>}
        </div>
      </div>
      <div className="task-side">
        {task.due && (
          <span className={`task-date ${overdue ? 'overdue' : ''}`}>
            <CalendarDays size={13} />
            {formatDate(task.due, true)}
          </span>
        )}
        {task.status !== 'done' && (
          <Tooltip label="Начать фокус">
            <ActionIcon
              className="task-play"
              variant="subtle"
              color="gray"
              aria-label={`Таймер: ${task.title}`}
              onClick={start}
            >
              <Play size={15} />
            </ActionIcon>
          </Tooltip>
        )}
        <Menu position="bottom-end" shadow="md" width={210} withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label={`Действия: ${task.title}`}>
              <MoreHorizontal size={19} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<Pencil size={15} />} onClick={() => onEdit(task)}>
              Редактировать
            </Menu.Item>
            <Menu.Item leftSection={<CheckCheck size={15} />} onClick={() => taskToggled(task.id)}>
              {task.status === 'done' ? 'Вернуть в задачи' : 'Завершить'}
            </Menu.Item>
            {task.status !== 'done' && (
              <Menu.Item
                leftSection={<ArrowRight size={15} />}
                onClick={() =>
                  taskPatched({
                    id: task.id,
                    patch: { status: task.status === 'progress' ? 'todo' : 'progress' },
                  })
                }
              >
                {task.status === 'progress' ? 'К выполнению' : 'Взять в работу'}
              </Menu.Item>
            )}
            <Menu.Item
              leftSection={<Copy size={15} />}
              onClick={() => {
                taskSaved({
                  draft: { ...task, title: `${task.title.slice(0, 190)} (копия)`, status: 'todo' },
                })
                notifications.show({ message: 'Копия задачи создана' })
              }}
            >
              Дублировать
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<Trash2 size={15} />} onClick={remove}>
              Удалить
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </article>
  )
}
