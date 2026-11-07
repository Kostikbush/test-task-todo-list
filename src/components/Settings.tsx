import { useRef, useState } from 'react'
import { useUnit } from 'effector-react'
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  Check,
  Download,
  Laptop,
  Moon,
  Smartphone,
  Sun,
  Upload,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { $data, dataCleared, dataImported, settingsChanged } from '../model'
import { dataSchema } from '../model/schema'
import type { Settings as Preferences } from '../model/schema'
import type { PwaState } from '../pwa'
import { dateKey } from '../lib'
import { settleTimer } from '../model/logic'

export function Settings({ onClose, pwa }: { onClose: () => void; pwa: PwaState }) {
  const data = useUnit($data)
  const { settings } = data
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<typeof data | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(settleTimer(data, Date.now()), null, 2)], {
        type: 'application/json',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `flowday-${dateKey()}.json`
    link.click()
    URL.revokeObjectURL(url)
    notifications.show({ message: 'Резервная копия сохранена' })
  }
  const importFile = async (file?: File) => {
    if (!file) return
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Файл слишком большой. Максимум — 10 МБ.')
      const result = dataSchema.safeParse(JSON.parse(await file.text()))
      if (!result.success) throw new Error('Файл не соответствует формату резервной копии Flowday.')
      const projectIds = new Set(result.data.projects.map((p) => p.id))
      const taskIds = result.data.tasks.map((t) => t.id)
      if (
        new Set(taskIds).size !== taskIds.length ||
        projectIds.size !== result.data.projects.length
      )
        throw new Error('В файле обнаружены повторяющиеся идентификаторы.')
      setPendingImport({
        ...result.data,
        tasks: result.data.tasks.map((t) => ({
          ...t,
          projectId: t.projectId && projectIds.has(t.projectId) ? t.projectId : null,
        })),
      })
    } catch (error) {
      notifications.show({
        title: 'Не удалось импортировать',
        message: error instanceof Error ? error.message : 'Проверьте файл',
        color: 'red',
      })
    }
    if (fileInput.current) fileInput.current.value = ''
  }
  return (
    <>
      <Modal opened onClose={onClose} title="Настройки пространства" size="lg" centered>
        <Stack gap={28}>
          <section className="settings-section">
            <h3>Оформление</h3>
            <p>Пусть здесь будет по-вашему.</p>
            <div className="field-label">Тема</div>
            <SegmentedControl
              fullWidth
              value={settings.theme}
              onChange={(theme) => settingsChanged({ theme: theme as Preferences['theme'] })}
              data={[
                {
                  value: 'light',
                  label: (
                    <span className="control-label">
                      <Sun size={15} />
                      Светлая
                    </span>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <span className="control-label">
                      <Moon size={15} />
                      Тёмная
                    </span>
                  ),
                },
                {
                  value: 'auto',
                  label: (
                    <span className="control-label">
                      <Laptop size={15} />
                      Системная
                    </span>
                  ),
                },
              ]}
            />
            <div className="field-label" style={{ marginTop: 18 }}>
              Шрифт
            </div>
            <div className="font-options">
              {[
                { value: 'manrope', label: 'Manrope', detail: 'Мягкий и современный' },
                { value: 'inter', label: 'Inter', detail: 'Чёткий и лаконичный' },
                { value: 'lora', label: 'Lora', detail: 'С характером книги' },
              ].map((font) => (
                <button
                  key={font.value}
                  className={`font-option ${settings.font === font.value ? 'selected' : ''}`}
                  style={{ fontFamily: font.value === 'lora' ? 'Lora' : `${font.label} Variable` }}
                  onClick={() => settingsChanged({ font: font.value as Preferences['font'] })}
                >
                  <span>Aa {settings.font === font.value && <Check size={16} />}</span>
                  <strong>{font.label}</strong>
                  <small>{font.detail}</small>
                </button>
              ))}
            </div>
            <Switch
              mt="lg"
              label="Компактный список"
              description="Больше задач на одном экране"
              checked={settings.compact}
              onChange={(event) => settingsChanged({ compact: event.currentTarget.checked })}
            />
          </section>
          <section className="settings-section">
            <h3>Ритм работы</h3>
            <p>Подберите комфортную длительность подхода.</p>
            <div className="form-grid">
              <NumberInput
                label="Фокус, минут"
                min={1}
                max={120}
                allowDecimal={false}
                value={settings.focusMinutes}
                onChange={(value) =>
                  typeof value === 'number' &&
                  value >= 1 &&
                  value <= 120 &&
                  settingsChanged({ focusMinutes: value })
                }
              />
              <NumberInput
                label="Перерыв, минут"
                min={1}
                max={30}
                allowDecimal={false}
                value={settings.breakMinutes}
                onChange={(value) =>
                  typeof value === 'number' &&
                  value >= 1 &&
                  value <= 30 &&
                  settingsChanged({ breakMinutes: value })
                }
              />
              <NumberInput
                label="Цель сессий в день"
                min={1}
                max={20}
                allowDecimal={false}
                value={settings.dailyGoal}
                onChange={(value) =>
                  typeof value === 'number' &&
                  value >= 1 &&
                  value <= 20 &&
                  settingsChanged({ dailyGoal: value })
                }
              />
            </div>
            <Switch
              mt="lg"
              label="Мягкий звук по завершении"
              description="Сигнал прозвучит, если приложение открыто"
              checked={settings.sound}
              onChange={(event) => settingsChanged({ sound: event.currentTarget.checked })}
            />
          </section>
          <section className="install-box">
            <div className="install-icon">
              <Smartphone size={25} />
            </div>
            <div>
              <h3>Flowday всегда под рукой</h3>
              <p>
                Установите как приложение. Задачи, таймер и ваши шрифты доступны даже без интернета.
              </p>
              <Button
                mt="sm"
                size="xs"
                leftSection={pwa.installed ? <Check size={14} /> : <Download size={14} />}
                disabled={pwa.installed}
                onClick={() => void pwa.install()}
              >
                {pwa.installed ? 'Приложение установлено' : 'Установить приложение'}
              </Button>
            </div>
          </section>
          {pwa.needRefresh[0] && (
            <Alert icon={<RefreshCw size={18} />} title="Доступна новая версия">
              <Button size="xs" onClick={() => void pwa.updateServiceWorker(true)}>
                Обновить приложение
              </Button>
            </Alert>
          )}
          <section className="settings-section">
            <h3>Ваши данные</h3>
            <p>
              Всё хранится в этом браузере. Сохраните копию, чтобы перенести задачи на другое
              устройство.
            </p>
            <Group>
              <Button variant="default" leftSection={<Download size={15} />} onClick={exportData}>
                Экспорт JSON
              </Button>
              <Button
                variant="default"
                leftSection={<Upload size={15} />}
                onClick={() => fileInput.current?.click()}
              >
                Импорт JSON
              </Button>
            </Group>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => void importFile(event.currentTarget.files?.[0])}
            />
            <button className="danger-link" onClick={() => setClearConfirm(true)}>
              Удалить все задачи и историю
            </button>
          </section>
          <div className="settings-version">
            FLOWDAY <span>1.0 · Сделано для спокойной продуктивности</span>
          </div>
          <Button fullWidth variant="light" onClick={onClose}>
            Готово
          </Button>
        </Stack>
      </Modal>
      <Modal
        opened={pwa.installHelp}
        onClose={() => pwa.setInstallHelp(false)}
        title="Установить Flowday"
        centered
        size="sm"
      >
        <Stack>
          <p className="muted">
            В Chrome или Edge откройте меню браузера и выберите «Установить Flowday» или «Установить
            страницу как приложение».
          </p>
          <p className="muted">
            На iPhone и iPad откройте приложение в Safari: «Поделиться» → «На экран Домой».
          </p>
          <Alert icon={<AlertCircle size={17} />}>
            Установка доступна при открытии через HTTPS или localhost. Если пункт ещё не появился,
            обновите страницу после первого посещения.
          </Alert>
          <Button onClick={() => pwa.setInstallHelp(false)}>Понятно</Button>
        </Stack>
      </Modal>
      <Modal
        opened={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        title="Восстановить резервную копию?"
        centered
        size="sm"
      >
        <p className="muted">
          Текущие задачи, проекты, настройки и история будут заменены. В копии:{' '}
          {pendingImport?.tasks.length} задач. Сначала можно отменить и сохранить текущие данные
          через экспорт.
        </p>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setPendingImport(null)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (pendingImport) dataImported(pendingImport)
              setPendingImport(null)
              notifications.show({ message: 'Резервная копия восстановлена' })
            }}
          >
            Восстановить
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={clearConfirm}
        onClose={() => setClearConfirm(false)}
        title="Очистить пространство?"
        centered
        size="sm"
      >
        <p className="muted">
          Все задачи и история фокуса будут удалены. Проекты и настройки останутся. Это действие
          нельзя отменить — при необходимости сначала сохраните копию.
        </p>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setClearConfirm(false)}>
            Отмена
          </Button>
          <Button
            color="red"
            onClick={() => {
              dataCleared()
              setClearConfirm(false)
              notifications.show({ message: 'Пространство готово к новым задачам' })
            }}
          >
            Удалить данные
          </Button>
        </Group>
      </Modal>
    </>
  )
}
