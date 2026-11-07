import { useState } from 'react'
import { Button, ColorSwatch, Group, Modal, Stack, TextInput } from '@mantine/core'
import { Check } from 'lucide-react'
import { projectSaved } from '../model'
import { uid } from '../lib'
import type { Project } from '../model/schema'

export function ProjectEditor({ project, onClose }: { project?: Project; onClose: () => void }) {
  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? '#8d83d5')
  const [error, setError] = useState(false)
  return (
    <Modal
      opened
      onClose={onClose}
      title={project ? 'Редактировать проект' : 'Новый проект'}
      centered
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) {
            setError(true)
            return
          }
          projectSaved({ id: project?.id ?? uid(), name: name.trim(), color })
          onClose()
        }}
      >
        <Stack gap="lg">
          <TextInput
            data-autofocus
            label="Название проекта"
            placeholder="Для чего найдём место?"
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value)
              setError(false)
            }}
            error={error ? 'Введите название' : undefined}
          />
          <div>
            <div className="field-label">Цвет проекта</div>
            <Group gap="sm">
              {['#8d83d5', '#d69b62', '#6eaa9e', '#d77f91', '#6899cd', '#a1a867'].map((value) => (
                <ColorSwatch
                  component="button"
                  type="button"
                  key={value}
                  color={value}
                  size={32}
                  onClick={() => setColor(value)}
                  aria-label={`Цвет ${value}`}
                  aria-pressed={color === value}
                >
                  {color === value && <Check size={17} color="white" />}
                </ColorSwatch>
              ))}
            </Group>
          </div>
          <Button type="submit">{project ? 'Сохранить' : 'Создать проект'}</Button>
        </Stack>
      </form>
    </Modal>
  )
}
