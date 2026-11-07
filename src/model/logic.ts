import type { AppData, Task, View } from './schema'
import { dateKey } from '../lib'

export function timerRemaining(data: AppData, now: number): number {
  return Math.max(
    0,
    data.timer.remaining -
      (data.timer.startedAt === null ? 0 : Math.max(0, now - data.timer.startedAt) / 1000),
  )
}

export function settleTimer(data: AppData, now: number, complete = false): AppData {
  const remaining = timerRemaining(data, now)
  const elapsed = Math.max(0, data.timer.duration - remaining - data.timer.credited)
  const focus = data.timer.mode === 'focus'
  return {
    ...data,
    timer: { ...data.timer, remaining, startedAt: null, credited: data.timer.credited + elapsed },
    tasks: focus
      ? data.tasks.map((task) =>
          task.id === data.timer.taskId ? { ...task, tracked: task.tracked + elapsed } : task,
        )
      : data.tasks,
    sessions:
      focus && elapsed > 0
        ? [
            ...data.sessions,
            {
              id: crypto.randomUUID(),
              date: dateKey(new Date(now)),
              seconds: elapsed,
              taskId: data.timer.taskId,
              complete,
            },
          ]
        : data.sessions,
  }
}

export function matchesView(task: Task, view: View, today = dateKey()): boolean {
  if (view.startsWith('project:')) return task.projectId === view.slice(8)
  if (view === 'today')
    return task.due !== null && task.due <= today && (task.status !== 'done' || task.due === today)
  if (view === 'upcoming') return task.due !== null && task.due > today && task.status !== 'done'
  if (view === 'inbox') return task.projectId === null && task.status !== 'done'
  if (view === 'completed') return task.status === 'done'
  return true
}

export function selectTasks(
  tasks: Task[],
  options: { view: View; search: string; priority: string; sort: string; showCompleted: boolean },
): Task[] {
  const query = options.search.trim().toLocaleLowerCase('ru')
  const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 }
  return tasks
    .filter(
      (task) =>
        matchesView(task, options.view) &&
        (options.showCompleted || task.status !== 'done' || options.view === 'completed') &&
        (options.priority === 'all' || task.priority === options.priority) &&
        (!query ||
          `${task.title} ${task.description} ${task.tags.join(' ')} ${task.subtasks.map((s) => s.title).join(' ')}`
            .toLocaleLowerCase('ru')
            .includes(query)),
    )
    .sort((a, b) =>
      options.sort === 'priority'
        ? priorityOrder[a.priority] - priorityOrder[b.priority] || a.order - b.order
        : options.sort === 'due'
          ? (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.order - b.order
          : options.sort === 'newest'
            ? b.createdAt - a.createdAt
            : a.order - b.order,
    )
}
