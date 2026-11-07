import { useState } from 'react'
import { useUnit } from 'effector-react'
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
  ActionIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Plus, Trash2 } from 'lucide-react'
import { $data, taskSaved } from '../model'
import type { Task, TaskDraft } from '../model/schema'
import { dateKey, uid } from '../lib'

export const priorities = [
  { value: 'high', label: 'Высокий' },
  { value: 'medium', label: 'Средний' },
  { value: 'low', label: 'Низкий' },
  { value: 'none', label: 'Без приоритета' },
]
export const statuses = [
  { value: 'todo', label: 'К выполнению' },
  { value: 'progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
]

export function TaskEditor({
  task,
  projectId,
  due,
  initialStatus = 'todo',
  onClose,
}: {
  task?: Task
  projectId?: string
  due?: string | null
  initialStatus?: Task['status']
  onClose: () => void
}) {
  const { projects } = useUnit($data)
  const [draft, setDraft] = useState<TaskDraft>(() =>
    task
      ? { ...task }
      : {
          title: '',
          description: '',
          status: initialStatus,
          priority: 'none',
          projectId: projectId ?? null,
          due: due === undefined ? dateKey() : due,
          tags: [],
          subtasks: [],
        },
  )
  const [subtask, setSubtask] = useState('')
  const [error, setError] = useState('')
  const update = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const addSubtask = () => {
    if (!subtask.trim()) return
    update('subtasks', [...draft.subtasks, { id: uid(), title: subtask.trim(), done: false }])
    setSubtask('')
  }
  const save = () => {
    if (!draft.title.trim()) {
      setError('Как называется задача?')
      return
    }
    taskSaved({
      id: task?.id,
      draft: {
        ...draft,
        title: draft.title.trim(),
        subtasks: subtask.trim()
          ? [...draft.subtasks, { id: uid(), title: subtask.trim(), done: false }]
          : draft.subtasks,
      },
    })
    notifications.show({
      title: task ? 'Изменения сохранены' : 'Задача добавлена',
      message: 'Ещё один шаг к тому, что важно.',
      color: 'teal',
    })
    onClose()
  }
  return (
    <Modal
      opened
      onClose={onClose}
      title={task ? 'Детали задачи' : 'Новая задача'}
      size="lg"
      centered
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <Stack gap="lg">
          <TextInput
            data-autofocus
            label="Название"
            placeholder="Что хотите сделать?"
            maxLength={200}
            value={draft.title}
            onChange={(event) => {
              update('title', event.currentTarget.value)
              setError('')
            }}
            error={error}
            size="md"
          />
          <Textarea
            label="Описание"
            placeholder="Идеи, ссылки и всё, что пригодится…"
            maxLength={5000}
            autosize
            minRows={3}
            maxRows={8}
            value={draft.description}
            onChange={(event) => update('description', event.currentTarget.value)}
          />
          <div className="form-grid">
            <Select
              label="Проект"
              placeholder="Входящие"
              clearable
              data={projects.map((project) => ({ value: project.id, label: project.name }))}
              value={draft.projectId}
              onChange={(value) => update('projectId', value)}
            />
            <TextInput
              label="Срок"
              type="date"
              value={draft.due ?? ''}
              onChange={(event) => update('due', event.currentTarget.value || null)}
            />
            <Select
              label="Приоритет"
              data={priorities}
              value={draft.priority}
              onChange={(value) => update('priority', value as Task['priority'])}
              allowDeselect={false}
            />
            <Select
              label="Статус"
              data={statuses}
              value={draft.status}
              onChange={(value) => update('status', value as Task['status'])}
              allowDeselect={false}
            />
          </div>
          <TagsInput
            label="Теги"
            placeholder="Добавьте тег и нажмите Enter"
            value={draft.tags}
            onChange={(value) =>
              update(
                'tags',
                value.map((t) => t.slice(0, 30)),
              )
            }
            maxTags={20}
          />
          <div className="subtasks-editor">
            <label>
              Маленькие шаги{' '}
              <span>
                {draft.subtasks.length
                  ? `${draft.subtasks.filter((s) => s.done).length}/${draft.subtasks.length}`
                  : ''}
              </span>
            </label>
            {draft.subtasks.map((item) => (
              <div className="subtask" key={item.id}>
                <Checkbox
                  checked={item.done}
                  onChange={() =>
                    update(
                      'subtasks',
                      draft.subtasks.map((s) => (s.id === item.id ? { ...s, done: !s.done } : s)),
                    )
                  }
                  aria-label={`Выполнить: ${item.title}`}
                />
                <span className={item.done ? 'is-done' : ''}>{item.title}</span>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`Удалить шаг: ${item.title}`}
                  onClick={() =>
                    update(
                      'subtasks',
                      draft.subtasks.filter((s) => s.id !== item.id),
                    )
                  }
                >
                  <Trash2 size={15} />
                </ActionIcon>
              </div>
            ))}
            <Group gap="xs" mt="xs">
              <TextInput
                flex={1}
                placeholder="Добавить маленький шаг"
                maxLength={200}
                value={subtask}
                onChange={(event) => setSubtask(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addSubtask()
                  }
                }}
              />
              <ActionIcon
                size="lg"
                variant="light"
                aria-label="Добавить шаг"
                onClick={addSubtask}
                disabled={!subtask.trim() || draft.subtasks.length >= 100}
              >
                <Plus size={18} />
              </ActionIcon>
            </Group>
          </div>
          <Group justify="space-between" className="modal-footer">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">{task ? 'Сохранить изменения' : 'Создать задачу'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
