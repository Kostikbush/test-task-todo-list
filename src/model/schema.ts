import { z } from 'zod'

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  status: z.enum(['todo', 'progress', 'done']),
  priority: z.enum(['high', 'medium', 'low', 'none']),
  projectId: z.string().nullable(),
  due: z.iso.date().nullable(),
  tags: z.array(z.string().max(30)).max(20),
  subtasks: z
    .array(z.object({ id: z.string(), title: z.string().min(1).max(200), done: z.boolean() }))
    .max(100),
  tracked: z.number().nonnegative().finite(),
  createdAt: z.number().finite(),
  completedAt: z.number().finite().nullable(),
  order: z.number().finite(),
})

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})
export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  font: z.enum(['manrope', 'inter', 'lora']),
  focusMinutes: z.number().int().min(1).max(120),
  breakMinutes: z.number().int().min(1).max(30),
  sound: z.boolean(),
  compact: z.boolean(),
  dailyGoal: z.number().int().min(1).max(20),
})
export const timerSchema = z.object({
  taskId: z.string().nullable(),
  mode: z.enum(['focus', 'break']),
  duration: z.number().positive().finite(),
  remaining: z.number().nonnegative().finite(),
  startedAt: z.number().finite().nullable(),
  credited: z.number().nonnegative().finite(),
})
export const dataSchema = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema).max(10000),
  projects: z.array(projectSchema).max(100),
  settings: settingsSchema,
  timer: timerSchema,
  sessions: z
    .array(
      z.object({
        id: z.string(),
        date: z.iso.date(),
        seconds: z.number().nonnegative().finite(),
        taskId: z.string().nullable(),
        complete: z.boolean(),
      }),
    )
    .max(50000),
})

export type Task = z.infer<typeof taskSchema>
export type Project = z.infer<typeof projectSchema>
export type Settings = z.infer<typeof settingsSchema>
export type Timer = z.infer<typeof timerSchema>
export type AppData = z.infer<typeof dataSchema>
export type View =
  'today' | 'all' | 'upcoming' | 'inbox' | 'completed' | 'focus' | 'stats' | `project:${string}`
export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'order' | 'tracked'>
