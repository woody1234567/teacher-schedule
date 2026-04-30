import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readProjectFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), 'utf8')
}

describe('calendar pages', () => {
  it('teacher calendar page wires calendar management components to the calendar composable', () => {
    const source = readProjectFile('app/pages/teacher/calendar.vue')

    expect(source).toContain("role: 'teacher'")
    expect(source).toContain('const calendar = useCalendar()')
    expect(source).toContain('<CalendarView')
    expect(source).toContain(':show-actions="true"')
    expect(source).toContain('@edit="startEdit"')
    expect(source).toContain('@delete="deleteEvent"')
    expect(source).toContain('<EventForm')
    expect(source).toContain('@submit="saveEvent"')
    expect(source).toContain("await calendar.fetchEvents()")
    expect(source).toContain("await calendar.createEvent(data)")
    expect(source).toContain("await calendar.updateEvent(editingEvent.value.id, data)")
    expect(source).toContain("await calendar.deleteEvent(id)")
  })

  it('student teacher detail page fetches and renders available teacher slots', () => {
    const source = readProjectFile('app/pages/student/teachers/[id].vue')

    expect(source).toContain("role: 'student'")
    expect(source).toContain('const route = useRoute()')
    expect(source).toContain('/api/calendar/teachers/${teacherId}/available')
    expect(source).toContain('response.teacher')
    expect(source).toContain('response.availableSlots')
    expect(source).toContain('<EventCard')
    expect(source).toContain(':event="slot"')
    expect(source).toContain('@book="bookSlot(slot)"')
    expect(source).toContain('Feature coming in Phase 3')
  })
})
