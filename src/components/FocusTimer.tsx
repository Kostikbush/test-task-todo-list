import { useUnit } from 'effector-react'
import { ActionIcon, Button, Select, SegmentedControl, Tooltip } from '@mantine/core'
import { Coffee, Headphones, Maximize2, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import {
  $data,
  $now,
  timerModeChanged,
  timerPaused,
  timerReset,
  timerSelected,
  timerStarted,
  viewChanged,
} from '../model'
import { timerRemaining } from '../model/logic'
import { clockTime, dateKey } from '../lib'
import { prepareSound } from '../sound'

export function FocusTimer({ expanded = false }: { expanded?: boolean }) {
  const data = useUnit($data)
  const now = useUnit($now)
  const { timer } = data
  const remaining = timerRemaining(data, now)
  const running = timer.startedAt !== null
  const selected = data.tasks.find((t) => t.id === timer.taskId)
  const sessions = data.sessions.filter((s) => s.date === dateKey() && s.complete).length
  const percent = Math.min(100, Math.max(0, (1 - remaining / timer.duration) * 100))
  return (
    <section className={`focus-card ${expanded ? 'expanded-focus' : ''}`} aria-label="Фокус-таймер">
      <div className="panel-heading">
        <span>
          <Headphones size={16} />
          Время для фокуса
        </span>
        {!expanded && (
          <Tooltip label="Режим фокуса">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Открыть режим фокуса"
              onClick={() => viewChanged('focus')}
            >
              <Maximize2 size={15} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>
      {expanded && (
        <p className="focus-intro">Одна задача. Никакой спешки. Только вы и то, что важно.</p>
      )}
      <SegmentedControl
        className="timer-modes"
        fullWidth
        size="xs"
        value={timer.mode}
        onChange={(value) => timerModeChanged(value as 'focus' | 'break')}
        data={[
          { value: 'focus', label: 'Фокус' },
          { value: 'break', label: 'Перерыв' },
        ]}
      />
      <div className={`timer-ring ${running ? 'running' : ''}`}>
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle className="ring-track" cx="110" cy="110" r="98" />
          <circle
            className="ring-progress"
            cx="110"
            cy="110"
            r="98"
            strokeDasharray="615.75"
            strokeDashoffset={615.75 * (1 - percent / 100)}
          />
        </svg>
        <div className="timer-inner">
          <span className="timer-eyebrow">
            {timer.mode === 'break'
              ? 'ВЫДОХНИТЕ'
              : running
                ? 'В ПОТОКЕ'
                : remaining === 0
                  ? 'ОТЛИЧНАЯ РАБОТА'
                  : 'ВАШЕ ВРЕМЯ'}
          </span>
          <span
            className="timer-number"
            role="timer"
            aria-label={`Осталось ${clockTime(remaining)}`}
          >
            {clockTime(remaining)}
          </span>
          <span className="timer-caption">
            {timer.mode === 'break' ? (
              <>
                <Coffee size={12} />
                пора отдохнуть
              </>
            ) : (
              <>
                <span className={`live-dot ${running ? 'active' : ''}`} />
                {running ? 'шаг за шагом' : 'без отвлечений'}
              </>
            )}
          </span>
        </div>
      </div>
      <Select
        aria-label="Задача для фокуса"
        placeholder="Выберите задачу для фокуса"
        data={data.tasks
          .filter((t) => t.status !== 'done' || t.id === timer.taskId)
          .map((t) => ({ value: t.id, label: t.title }))}
        value={selected?.id ?? null}
        onChange={(id) => timerSelected(id)}
        clearable
        searchable
        nothingFoundMessage="Нет задач"
        size="xs"
        className="focus-task-select"
      />
      <div className="timer-controls">
        <Button
          fullWidth
          leftSection={running ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          onClick={() => {
            prepareSound()
            if (running) timerPaused(Date.now())
            else timerStarted(Date.now())
          }}
        >
          {running
            ? 'Приостановить'
            : remaining === 0
              ? 'Ещё один подход'
              : remaining < timer.duration
                ? 'Продолжить'
                : 'Начать фокус'}
        </Button>
        <Tooltip label="Сбросить таймер">
          <ActionIcon
            size={37}
            variant="default"
            aria-label="Сбросить таймер"
            onClick={() => timerReset(Date.now())}
          >
            <RotateCcw size={16} />
          </ActionIcon>
        </Tooltip>
      </div>
      <div className="focus-sessions">
        <div>
          {Array.from({ length: data.settings.dailyGoal }, (_, i) => (
            <i key={i} className={i < sessions ? 'filled' : ''} />
          ))}
        </div>
        <span>
          {sessions} из {data.settings.dailyGoal} {expanded ? 'фокус-сессий сегодня' : 'сессий'}
        </span>
      </div>
      {expanded && (
        <div className="focus-advice">
          <Sparkles size={18} />
          <p>
            Уберите телефон, налейте воды и начните с одного маленького шага. Отдых — тоже часть
            работы.
          </p>
        </div>
      )}
    </section>
  )
}
