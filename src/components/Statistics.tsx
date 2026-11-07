import { useUnit } from 'effector-react'
import { ArrowUpRight, Check, Clock3, Sprout, Target } from 'lucide-react'
import { $data } from '../model'
import { dateKey, duration, plural, shiftDate } from '../lib'

export function WeekChart({ large = false }: { large?: boolean }) {
  const { tasks, sessions } = useUnit($data)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(i - 6)
    return {
      date,
      done: tasks.filter((t) => t.completedAt && dateKey(new Date(t.completedAt)) === date).length,
      focus: Math.round(
        sessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.seconds, 0) / 60,
      ),
    }
  })
  const max = Math.max(4, ...days.map((day) => day.done))
  return (
    <div className={`week-chart ${large ? 'large-chart' : ''}`}>
      <div className="chart-bars">
        {days.map((day) => (
          <div
            className={`chart-column ${day.date === dateKey() ? 'is-today' : ''}`}
            key={day.date}
            title={`${day.date}: ${day.done} задач, ${day.focus} мин фокуса`}
          >
            <div className="bar-area">
              <span className="bar-value">{day.done > 0 ? day.done : ''}</span>
              <div
                className="chart-bar"
                style={{ height: `${Math.max(5, (day.done / max) * 100)}%` }}
              />
            </div>
            <span>
              {new Intl.DateTimeFormat('ru', { weekday: 'short' }).format(
                new Date(`${day.date}T12:00:00`),
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <i />
        Выполненные задачи<span>последние 7 дней</span>
      </div>
    </div>
  )
}

export function StatsOverview() {
  const { tasks, sessions } = useUnit($data)
  const today = dateKey()
  const todayTasks = tasks.filter((t) => t.due === today)
  const done = tasks.filter(
    (t) => t.completedAt && dateKey(new Date(t.completedAt)) === today,
  ).length
  const focus = sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.seconds, 0)
  const pending = tasks.filter((t) => t.status !== 'done' && t.due && t.due <= today).length
  const percent = todayTasks.length
    ? Math.round((todayTasks.filter((t) => t.status === 'done').length / todayTasks.length) * 100)
    : 0
  return (
    <div className="stats-overview">
      <div className="stat-card">
        <div className="stat-icon green">
          <Check size={19} />
        </div>
        <div>
          <span className="stat-label">Выполнено сегодня</span>
          <div className="stat-value">
            {done}
            <small>{plural(done, ['задача', 'задачи', 'задач'])}</small>
          </div>
        </div>
        <div
          className="mini-progress"
          style={{ background: `conic-gradient(var(--accent) ${percent}%, var(--soft) 0)` }}
        >
          <span>{percent}%</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon purple">
          <Clock3 size={19} />
        </div>
        <div>
          <span className="stat-label">Время в фокусе</span>
          <div className="stat-value">
            {duration(focus).split(' ')[0]}
            <small>{duration(focus).split(' ').slice(1).join(' ')}</small>
          </div>
        </div>
        <ArrowUpRight size={17} className="stat-decoration" />
      </div>
      <div className="stat-card">
        <div className="stat-icon orange">
          <Target size={19} />
        </div>
        <div>
          <span className="stat-label">Впереди на сегодня</span>
          <div className="stat-value">
            {pending}
            <small>{plural(pending, ['задача', 'задачи', 'задач'])}</small>
          </div>
        </div>
        <span className="stat-note">Всё получится</span>
      </div>
    </div>
  )
}

export function Statistics() {
  const { tasks, projects, sessions } = useUnit($data)
  const completed = tasks.filter((t) => t.status === 'done').length
  const totalFocus = sessions.reduce((sum, session) => sum + session.seconds, 0)
  return (
    <div className="statistics-page">
      <StatsOverview />
      <div className="stats-panels">
        <section className="surface">
          <div className="section-heading">
            <h2>Маленькие шаги, большой прогресс</h2>
            <Sprout size={21} />
          </div>
          <p className="muted">Каждая завершённая задача имеет значение.</p>
          <WeekChart large />
        </section>
        <section className="surface overall-stats">
          <h2>За всё время</h2>
          <div>
            <span>Выполнено задач</span>
            <strong>{completed}</strong>
          </div>
          <div>
            <span>Завершено сессий</span>
            <strong>{sessions.filter((s) => s.complete).length}</strong>
          </div>
          <div>
            <span>Время фокуса</span>
            <strong>{duration(totalFocus)}</strong>
          </div>
          <div>
            <span>Выполнение задач</span>
            <strong>{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</strong>
          </div>
        </section>
      </div>
      <section className="surface">
        <h2>Ваши проекты</h2>
        <div className="project-stats">
          {projects.map((project) => {
            const list = tasks.filter((t) => t.projectId === project.id)
            const done = list.filter((t) => t.status === 'done').length
            return (
              <div key={project.id}>
                <div className="project-stat-label">
                  <span>
                    <i style={{ background: project.color }} />
                    {project.name}
                  </span>
                  <small>
                    {done} / {list.length}
                  </small>
                </div>
                <div className="progress-track">
                  <div
                    style={{
                      background: project.color,
                      width: `${list.length ? (done / list.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
