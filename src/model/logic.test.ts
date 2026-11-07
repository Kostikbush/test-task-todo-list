import { describe, expect, it } from 'vitest'
import { dateKey, shiftDate } from '../lib'
import { initialData } from './seed'
import { matchesView, selectTasks, settleTimer, timerRemaining } from './logic'
import { dataSchema } from './schema'

describe('task selection', () => {
  const data = initialData()
  const base = {
    view: 'all' as const,
    search: '',
    priority: 'all',
    sort: 'manual',
    showCompleted: true,
  }
  it('includes overdue tasks today but excludes old completed tasks', () => {
    const overdue = { ...data.tasks[0], due: shiftDate(-1) }
    expect(matchesView(overdue, 'today')).toBe(true)
    expect(matchesView({ ...overdue, status: 'done' }, 'today')).toBe(false)
  })
  it('finds text in titles, descriptions, tags and subtasks without case sensitivity', () => {
    expect(selectTasks(data.tasks, { ...base, search: 'РЕФЕРЕНСЫ' }).map((t) => t.id)).toEqual([
      'demo-1',
    ])
    expect(selectTasks(data.tasks, { ...base, search: 'привычки' }).map((t) => t.id)).toEqual([
      'demo-3',
    ])
    expect(selectTasks(data.tasks, { ...base, search: 'определить' }).map((t) => t.id)).toEqual([
      'demo-1',
    ])
  })
  it('combines project, priority and status filters', () => {
    const result = selectTasks(data.tasks, {
      ...base,
      view: 'project:work',
      priority: 'high',
      showCompleted: false,
    })
    expect(result).toHaveLength(2)
    expect(
      result.every((t) => t.projectId === 'work' && t.priority === 'high' && t.status !== 'done'),
    ).toBe(true)
  })
  it('sorts undated tasks last by due date', () => {
    expect(selectTasks(data.tasks, { ...base, sort: 'due' }).at(-1)?.due).toBeNull()
  })
  it('keeps completed view useful when completed items are hidden elsewhere', () => {
    expect(
      selectTasks(data.tasks, { ...base, view: 'completed', showCompleted: false }),
    ).toHaveLength(2)
  })
})

describe('timer accounting', () => {
  it('uses elapsed wall time and clamps the remainder after suspension', () => {
    const data = initialData()
    data.timer = {
      taskId: 'demo-1',
      mode: 'focus',
      duration: 1500,
      remaining: 1500,
      startedAt: 1000,
      credited: 0,
    }
    expect(timerRemaining(data, 31000)).toBe(1470)
    expect(timerRemaining(data, 4000000)).toBe(0)
    expect(timerRemaining(data, 0)).toBe(1500)
  })
  it('credits each second once across pause and resume', () => {
    const data = initialData()
    data.timer = {
      taskId: 'demo-2',
      mode: 'focus',
      duration: 1500,
      remaining: 1500,
      startedAt: 1000,
      credited: 0,
    }
    const first = settleTimer(data, 31000)
    expect(first.tasks.find((t) => t.id === 'demo-2')?.tracked).toBe(30)
    expect(settleTimer(first, 90000).sessions).toHaveLength(1)
    const resumed = { ...first, timer: { ...first.timer, startedAt: 100000 } }
    const second = settleTimer(resumed, 120000)
    expect(second.tasks.find((t) => t.id === 'demo-2')?.tracked).toBe(50)
    expect(second.sessions.reduce((sum, s) => sum + s.seconds, 0)).toBe(50)
  })
  it('never credits more than the session duration', () => {
    const data = initialData()
    data.timer = {
      taskId: 'demo-2',
      mode: 'focus',
      duration: 60,
      remaining: 60,
      startedAt: 1000,
      credited: 0,
    }
    const result = settleTimer(data, 900000, true)
    expect(result.tasks.find((t) => t.id === 'demo-2')?.tracked).toBe(60)
    expect(result.sessions[0]).toMatchObject({
      seconds: 60,
      complete: true,
      date: dateKey(new Date(900000)),
    })
  })
  it('does not add breaks to focus statistics or task time', () => {
    const data = initialData()
    data.timer = {
      taskId: 'demo-2',
      mode: 'break',
      duration: 300,
      remaining: 300,
      startedAt: 1000,
      credited: 0,
    }
    const result = settleTimer(data, 301000, true)
    expect(result.tasks).toEqual(data.tasks)
    expect(result.sessions).toHaveLength(0)
  })
})

describe('backup validation', () => {
  it('accepts a round-tripped dataset', () => {
    const data = initialData()
    expect(dataSchema.parse(JSON.parse(JSON.stringify(data)))).toEqual(data)
  })
  it('rejects malformed backups and invalid preferences', () => {
    expect(dataSchema.safeParse({ tasks: [] }).success).toBe(false)
    expect(
      dataSchema.safeParse({
        ...initialData(),
        settings: { ...initialData().settings, focusMinutes: -2 },
      }).success,
    ).toBe(false)
  })
  it('rejects dates that do not exist', () => {
    const data = initialData()
    data.tasks[0].due = '2026-02-31'
    expect(dataSchema.safeParse(data).success).toBe(false)
  })
})
