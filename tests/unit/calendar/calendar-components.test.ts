import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readProjectFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), 'utf8')
}

describe('calendar UI components', () => {
  it('EventCard uses Nuxt UI display primitives and exposes action events', () => {
    const source = readProjectFile('app/components/calendar/EventCard.vue')

    expect(source).toContain('<UCard')
    expect(source).toContain('<UBadge')
    expect(source).toContain('<UButton')
    expect(source).toContain("defineEmits<{")
    expect(source).toContain("(event: 'edit'): void")
    expect(source).toContain("(event: 'delete'): void")
    expect(source).toContain("(event: 'book'): void")
  })

  it('EventForm uses Nuxt UI form controls and validates before submitting', () => {
    const source = readProjectFile('app/components/calendar/EventForm.vue')

    expect(source).toContain('<UFormField')
    expect(source).toContain('<UInput')
    expect(source).toContain('<UTextarea')
    expect(source).toContain('<UInputNumber')
    expect(source).toContain('<USwitch')
    expect(source).toContain("emit('submit'")
    expect(source).toContain('Start time must be before end time')
  })

  it('CalendarView renders an event month grid and delegates event actions', () => {
    const source = readProjectFile('app/components/calendar/CalendarView.vue')

    expect(source).toContain('calendarDays')
    expect(source).toContain('grid grid-cols-7')
    expect(source).toContain('<EventCard')
    expect(source).toContain("emit('edit', event)")
    expect(source).toContain("emit('delete', event.id)")
    expect(source).toContain("emit('dateSelect', selectedDate.value)")
  })
})
