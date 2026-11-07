import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Сегодня', exact: true })).toBeVisible()
})

test('creates, edits, completes and restores a task', async ({ page }) => {
  await page.getByRole('button', { name: 'Новая задача' }).click()
  await page.getByLabel('Название', { exact: true }).fill('Проверить тестовое задание')
  await page.getByLabel('Описание').fill('Проверить детали и завершить работу')
  await page.getByRole('combobox', { name: 'Приоритет', exact: true }).click()
  await page.getByRole('option', { name: 'Высокий', exact: true }).click()
  await page.getByRole('combobox', { name: 'Теги', exact: true }).fill('релиз')
  await page.getByRole('combobox', { name: 'Теги', exact: true }).press('Enter')
  await page.getByPlaceholder('Добавить маленький шаг').fill('Проверить адаптив')
  await page.getByRole('button', { name: 'Добавить шаг', exact: true }).click()
  await page.getByRole('button', { name: 'Создать задачу', exact: true }).click()
  const card = page.getByRole('article').filter({ hasText: 'Проверить тестовое задание' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('#релиз')
  await expect(card).toContainText('0/1')
  await card.getByRole('button', { name: 'Проверить тестовое задание', exact: true }).click()
  await page.getByLabel('Название', { exact: true }).fill('Готовое тестовое задание')
  await page.getByRole('button', { name: 'Сохранить изменения' }).click()
  const edited = page.getByRole('article').filter({ hasText: 'Готовое тестовое задание' })
  await edited.getByRole('checkbox').check()
  await expect(edited).toHaveClass(/completed/)
  await page.reload()
  await expect(edited).toHaveClass(/completed/)
  await edited.getByRole('button', { name: 'Действия: Готовое тестовое задание' }).click()
  await page.getByRole('menuitem', { name: 'Удалить', exact: true }).click()
  await expect(edited).toHaveCount(0)
  await page.getByRole('button', { name: 'Отменить удаление' }).click()
  await expect(edited).toBeVisible()
})

test('filters tasks and moves cards between board columns', async ({ page }) => {
  await page.getByLabel('Поиск задач').fill('референсы')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Очистить поиск' }).click()
  await page.getByRole('button', { name: 'Вид: доска' }).click()
  const source = page.locator('.kanban-column.todo [draggable="true"]').first()
  const title = await source.locator('.task-title').innerText()
  await source.dragTo(page.locator('.kanban-column.progress'))
  await expect(page.locator('.kanban-column.progress')).toContainText(title)
  await page.locator('.kanban-column.done').getByRole('button', { name: 'Добавить задачу' }).click()
  await expect(page.getByRole('combobox', { name: 'Статус', exact: true })).toHaveValue('Готово')
})

test('keeps accurate timer state across pause and reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T12:00:00+03:00') })
  await page.clock.pauseAt(new Date('2026-11-07T12:00:01+03:00'))
  await page.getByRole('button', { name: 'Таймер: Подготовить материалы к встрече' }).click()
  await page.clock.fastForward(30000)
  await expect(page.getByRole('timer')).toHaveText('24:30')
  await page.getByRole('button', { name: 'Приостановить' }).click()
  await page.clock.fastForward(60000)
  await expect(page.getByRole('timer')).toHaveText('24:30')
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText('24:30')
  const tracked = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('flowday:v1')!).tasks.find(
        (t: { id: string }) => t.id === 'demo-2',
      ).tracked,
  )
  expect(tracked).toBeGreaterThanOrEqual(30)
  expect(tracked).toBeLessThan(32)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await page.clock.fastForward(24 * 60000 + 30000)
  await expect(page.getByRole('timer')).toHaveText('00:00')
  await expect(page.getByText('Отличная работа! Пора отдохнуть.')).toBeVisible()
})

test('creates projects and keeps their tasks when a project is removed', async ({ page }) => {
  await page.getByRole('button', { name: 'Создать проект', exact: true }).click()
  await page.getByLabel('Название проекта').fill('Мой проект')
  await page.getByRole('button', { name: 'Создать проект', exact: true }).last().click()
  await page.getByRole('button', { name: 'Мой проект 0', exact: true }).click()
  await page.getByLabel('Быстро добавить задачу').fill('Важная задача проекта')
  await page.getByLabel('Быстро добавить задачу').press('Enter')
  await expect(page.getByRole('article')).toContainText('Важная задача проекта')
  await page.getByRole('button', { name: 'Настройки проекта Мой проект', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Удалить проект', exact: true }).click()
  await page.getByRole('button', { name: 'Удалить проект', exact: true }).click()
  await page.getByRole('button', { name: /^Входящие / }).click()
  await expect(page.getByRole('article').filter({ hasText: 'Важная задача проекта' })).toBeVisible()
})

test('handles the PWA installation prompt from the settings button', async ({ page }) => {
  await page.evaluate(() => {
    const prompt = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(prompt, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    window.dispatchEvent(prompt)
  })
  await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click()
  await page.getByRole('button', { name: 'Установить приложение', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Приложение установлено', exact: true }),
  ).toBeDisabled()
})

test('persists appearance, supports mobile and has no horizontal overflow', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: 'artifacts/desktop-light.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click()
  await page.locator('.mantine-SegmentedControl-label').filter({ hasText: 'Тёмная' }).click()
  await page.locator('.font-option').filter({ hasText: 'Inter' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    page.getByRole('button', { name: 'Установить приложение', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('body')).toHaveCSS('font-family', /Inter/)
  await page.screenshot({
    path: 'artifacts/desktop-dark.png',
    fullPage: true,
    animations: 'disabled',
  })
  for (const width of [320, 375, 520, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({
    path: 'artifacts/mobile-dark.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Открыть меню', exact: true }).click()
  await page.getByRole('button', { name: 'Режим фокуса ZEN', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'В потоке', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('works offline after installation of the service worker', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true)
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons).toHaveLength(3)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Сегодня', exact: true })).toBeVisible()
  await page.getByLabel('Быстро добавить задачу').fill('Задача без интернета')
  await page.getByLabel('Быстро добавить задачу').press('Enter')
  await expect(page.getByRole('article').filter({ hasText: 'Задача без интернета' })).toBeVisible()
  await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click()
  await expect(page.getByText('Настройки пространства', { exact: true })).toBeVisible()
})

test('exports and validates backup files', async ({ page }) => {
  await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Экспорт JSON' }).click()
  expect((await download).suggestedFilename()).toMatch(/^flowday-.*\.json$/)
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"tasks":[]}'),
  })
  await expect(page.getByText('Не удалось импортировать', { exact: true })).toBeVisible()
  const backup = await page.evaluate(() => localStorage.getItem('flowday:v1')!)
  const parsed = JSON.parse(backup)
  parsed.tasks = [{ ...parsed.tasks[0], id: 'imported', title: 'Задача из резервной копии' }]
  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(parsed)),
  })
  await page.getByRole('button', { name: 'Восстановить', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('Задача из резервной копии')
})

test('passes WCAG accessibility checks in both themes', async ({ page }) => {
  const light = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  console.log(
    JSON.stringify(
      light.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, data: n.any[0]?.data })),
      })),
    ),
  )
  expect(
    light.violations.map((v) => ({ id: v.id, elements: v.nodes.map((n) => n.target) })),
  ).toEqual([])
  await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click()
  await page.locator('.mantine-SegmentedControl-label').filter({ hasText: 'Тёмная' }).click()
  await page.keyboard.press('Escape')
  const dark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  console.log(
    JSON.stringify(
      dark.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, data: n.any[0]?.data })),
      })),
    ),
  )
  expect(
    dark.violations.map((v) => ({ id: v.id, elements: v.nodes.map((n) => n.target) })),
  ).toEqual([])
})
