import type { AppData, Task } from './schema'
import { dateKey, shiftDate } from '../lib'

export function initialData(): AppData {
  const now = Date.now()
  const task = (id: number, title: string, values: Partial<Task> = {}): Task => ({
    id: `demo-${id}`,
    title,
    description: '',
    status: 'todo',
    priority: 'none',
    projectId: 'work',
    due: dateKey(),
    tags: [],
    subtasks: [],
    tracked: 0,
    createdAt: now - id * 3600000,
    completedAt: null,
    order: id,
    ...values,
  })
  return {
    version: 1,
    projects: [
      { id: 'work', name: 'Работа', color: '#8d83d5' },
      { id: 'personal', name: 'Личное', color: '#d69b62' },
      { id: 'learning', name: 'Развитие', color: '#6eaa9e' },
    ],
    tasks: [
      task(1, 'Продумать концепцию нового проекта', {
        priority: 'high',
        status: 'progress',
        tags: ['дизайн', 'важное'],
        description:
          'Собрать идеи, определить главную задачу продукта и наметить направление. Начать с самого важного.',
        subtasks: [
          { id: 's1', title: 'Собрать референсы', done: true },
          { id: 's2', title: 'Набросать первые идеи', done: false },
          { id: 's3', title: 'Сформулировать концепцию', done: false },
        ],
        tracked: 1500,
      }),
      task(2, 'Подготовить материалы к встрече', {
        priority: 'high',
        tags: ['команда'],
        description: 'Записать вопросы и собрать результаты за неделю.',
      }),
      task(3, 'Прочитать главу книги', {
        projectId: 'learning',
        priority: 'medium',
        tags: ['привычки'],
      }),
      task(4, 'Выбраться на прогулку без телефона', { projectId: 'personal', priority: 'low' }),
      task(5, 'Разобрать входящие и навести порядок', { priority: 'medium', projectId: null }),
      task(6, 'Спланировать день', {
        status: 'done',
        projectId: 'personal',
        completedAt: now - 3600000,
        tracked: 600,
      }),
      task(7, 'Посмотреть обратную связь', { status: 'done', completedAt: now - 1800000 }),
      task(8, 'Обновить портфолио', { due: shiftDate(1), priority: 'medium', tags: ['дизайн'] }),
      task(9, 'Пройти урок по типографике', {
        projectId: 'learning',
        due: shiftDate(2),
        priority: 'low',
      }),
      task(10, 'Купить продукты на неделю', {
        projectId: 'personal',
        due: shiftDate(1),
        subtasks: [
          { id: 's4', title: 'Овощи и фрукты', done: false },
          { id: 's5', title: 'Кофе', done: false },
        ],
      }),
      task(11, 'Идея: маленький pet-проект', { projectId: null, due: null, tags: ['идеи'] }),
    ],
    settings: {
      theme: 'light',
      font: 'manrope',
      focusMinutes: 25,
      breakMinutes: 5,
      sound: true,
      compact: false,
      dailyGoal: 4,
    },
    timer: {
      taskId: null,
      mode: 'focus',
      duration: 1500,
      remaining: 1500,
      startedAt: null,
      credited: 0,
    },
    sessions: [],
  }
}
