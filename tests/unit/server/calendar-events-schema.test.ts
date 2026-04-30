import { describe, expect, it } from 'vitest'
import { getTableName } from 'drizzle-orm'
import {
  calendarEvents,
  calendarEventsRelations,
  usersCalendarRelations,
  type CalendarEvent,
  type NewCalendarEvent,
} from '~~/server/db/schema'

describe('calendar events schema', () => {
  it('defines the calendar_events table with the expected columns', () => {
    expect(getTableName(calendarEvents)).toBe('calendar_events')

    expect(calendarEvents.id.columnType).toBe('PgSerial')
    expect(calendarEvents.teacherId.columnType).toBe('PgText')
    expect(calendarEvents.title.columnType).toBe('PgVarchar')
    expect(calendarEvents.description.columnType).toBe('PgText')
    expect(calendarEvents.startTime.columnType).toBe('PgTimestamp')
    expect(calendarEvents.endTime.columnType).toBe('PgTimestamp')
    expect(calendarEvents.isAvailable.columnType).toBe('PgBoolean')
    expect(calendarEvents.maxStudents.columnType).toBe('PgInteger')
    expect(calendarEvents.createdAt.columnType).toBe('PgTimestamp')
    expect(calendarEvents.updatedAt.columnType).toBe('PgTimestamp')
  })

  it('matches availability and student limit defaults', () => {
    expect(calendarEvents.isAvailable.notNull).toBe(true)
    expect(calendarEvents.isAvailable.default).toBe(true)
    expect(calendarEvents.maxStudents.default).toBe(1)
  })

  it('exports relations and inferred types', () => {
    expect(calendarEventsRelations).toBeDefined()
    expect(usersCalendarRelations).toBeDefined()

    const event = {} as CalendarEvent
    const newEvent = {} as NewCalendarEvent

    expect(event).toEqual({})
    expect(newEvent).toEqual({})
  })
})
