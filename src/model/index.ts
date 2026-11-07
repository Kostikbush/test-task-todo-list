import { createEvent, createStore } from 'effector'
import type { AppData, Project, Settings, Task, TaskDraft, View } from './schema'
import { dataSchema } from './schema'
import { initialData } from './seed'
import { settleTimer, timerRemaining } from './logic'
import { uid } from '../lib'

export const STORAGE_KEY = 'flowday:v1'
let loadFailed = false
function restore(): AppData {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return dataSchema.parse(JSON.parse(saved))
  } catch {
    loadFailed = true
    if (saved) {
      try {
        localStorage.setItem('flowday:recovery', saved)
      } catch {
        loadFailed = true
      }
    }
  }
  return initialData()
}

const restoredData = restore()

export const taskSaved = createEvent<{ id?: string; draft: TaskDraft }>()
export const taskPatched = createEvent<{ id: string; patch: Partial<Task> }>()
export const taskToggled = createEvent<string>()
export const taskDeleted = createEvent<string>()
export const taskRestored = createEvent<Task>()
export const projectSaved = createEvent<Project>()
export const projectDeleted = createEvent<string>()
export const settingsChanged = createEvent<Partial<Settings>>()
export const dataImported = createEvent<AppData>()
export const dataCleared = createEvent()
export const timerSelected = createEvent<string | null>()
export const timerStarted = createEvent<number>()
export const timerPaused = createEvent<number>()
export const timerReset = createEvent<number>()
export const timerModeChanged = createEvent<'focus' | 'break'>()
export const tick = createEvent<number>()
export const timerFinished = createEvent()
export const viewChanged = createEvent<View>()
export const searchChanged = createEvent<string>()
export const storageFailed = createEvent<boolean>()

export const $now = createStore(Date.now()).on(tick, (_, now) => now)
export const $view = createStore<View>('today').on(viewChanged, (_, view) => view)
export const $search = createStore('')
  .on(searchChanged, (_, search) => search)
  .reset(viewChanged)
export const $restoreFailed = createStore(loadFailed).reset(dataImported, dataCleared)
export const $storageFailed = createStore(false).on(storageFailed, (_, value) => value)
export const $data = createStore<AppData>(restoredData)
  .on(taskSaved, (data, { id, draft }) => ({
    ...data,
    tasks: id
      ? data.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...draft,
                completedAt: draft.status === 'done' ? (task.completedAt ?? Date.now()) : null,
              }
            : task,
        )
      : [
          ...data.tasks,
          {
            ...draft,
            id: uid(),
            createdAt: Date.now(),
            completedAt: draft.status === 'done' ? Date.now() : null,
            tracked: 0,
            order: Math.max(0, ...data.tasks.map((t) => t.order)) + 1,
          },
        ],
  }))
  .on(taskPatched, (data, { id, patch }) => ({
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            ...patch,
            completedAt: patch.status
              ? patch.status === 'done'
                ? (task.completedAt ?? Date.now())
                : null
              : task.completedAt,
          }
        : task,
    ),
  }))
  .on(taskToggled, (data, id) => ({
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: task.status === 'done' ? 'todo' : 'done',
            completedAt: task.status === 'done' ? null : Date.now(),
          }
        : task,
    ),
  }))
  .on(taskDeleted, (data, id) => {
    const next = data.timer.taskId === id ? settleTimer(data, Date.now()) : data
    return {
      ...next,
      tasks: next.tasks.filter((task) => task.id !== id),
      timer: next.timer.taskId === id ? { ...next.timer, taskId: null } : next.timer,
    }
  })
  .on(taskRestored, (data, task) => ({ ...data, tasks: [...data.tasks, task] }))
  .on(projectSaved, (data, project) => ({
    ...data,
    projects: data.projects.some((p) => p.id === project.id)
      ? data.projects.map((p) => (p.id === project.id ? project : p))
      : [...data.projects, project],
  }))
  .on(projectDeleted, (data, id) => ({
    ...data,
    projects: data.projects.filter((p) => p.id !== id),
    tasks: data.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
  }))
  .on(settingsChanged, (data, settings) => {
    const merged = { ...data.settings, ...settings }
    const minutes = data.timer.mode === 'focus' ? merged.focusMinutes : merged.breakMinutes
    const idle = data.timer.startedAt === null && data.timer.remaining === data.timer.duration
    return {
      ...data,
      settings: merged,
      timer: idle ? { ...data.timer, duration: minutes * 60, remaining: minutes * 60 } : data.timer,
    }
  })
  .on(dataImported, (_, data) => ({ ...data, timer: { ...data.timer, startedAt: null } }))
  .on(dataCleared, (data) => ({
    ...initialData(),
    tasks: [],
    projects: data.projects,
    settings: data.settings,
    sessions: [],
  }))
  .on(timerSelected, (data, id) => ({
    ...settleTimer(data, Date.now()),
    timer: {
      taskId: id,
      mode: 'focus',
      duration: data.settings.focusMinutes * 60,
      remaining: data.settings.focusMinutes * 60,
      startedAt: null,
      credited: 0,
    },
  }))
  .on(timerStarted, (data, now) => {
    if (data.timer.startedAt !== null) return data
    const reset = data.timer.remaining <= 0
    return {
      ...data,
      timer: {
        ...data.timer,
        remaining: reset ? data.timer.duration : data.timer.remaining,
        credited: reset ? 0 : data.timer.credited,
        startedAt: now,
      },
    }
  })
  .on(timerPaused, (data, now) => settleTimer(data, now))
  .on(timerReset, (data, now) => {
    const next = settleTimer(data, now)
    return {
      ...next,
      timer: { ...next.timer, remaining: next.timer.duration, startedAt: null, credited: 0 },
    }
  })
  .on(timerModeChanged, (data, mode) => {
    const next = settleTimer(data, Date.now())
    const seconds =
      (mode === 'focus' ? data.settings.focusMinutes : data.settings.breakMinutes) * 60
    return {
      ...next,
      timer: {
        ...next.timer,
        mode,
        duration: seconds,
        remaining: seconds,
        startedAt: null,
        credited: 0,
      },
    }
  })
  .on(tick, (data, now) =>
    data.timer.startedAt !== null && timerRemaining(data, now) <= 0
      ? settleTimer(data, now, true)
      : data,
  )

let wasRunning = false
$data.watch((data) => {
  const justFinished = wasRunning && data.timer.startedAt === null && data.timer.remaining === 0
  wasRunning = data.timer.startedAt !== null
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    storageFailed(false)
  } catch {
    storageFailed(true)
  }
  if (justFinished) timerFinished()
})
