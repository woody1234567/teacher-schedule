import { and, asc, eq, gte, lt, lte } from 'drizzle-orm'
import { getDatabase } from '../index'
import { calendarEvents } from '../schema'
import type { CalendarEvent, NewCalendarEvent } from '../schema'

export type CreateCalendarEventInput = Omit<NewCalendarEvent, 'id' | 'teacherId' | 'createdAt' | 'updatedAt'>
export type UpdateCalendarEventInput = Partial<Omit<NewCalendarEvent, 'id' | 'teacherId' | 'createdAt' | 'updatedAt'>>

export async function createCalendarEvent(
  teacherId: string,
  data: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const db = getDatabase()
  const [event] = await db.insert(calendarEvents).values({
    ...data,
    teacherId,
    updatedAt: new Date(),
  }).returning()
  return event
}

export async function getCalendarEventById(id: number): Promise<CalendarEvent | null> {
  const db = getDatabase()
  const [event] = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .limit(1)

  return event ?? null
}

export async function getCalendarEventsByTeacher(teacherId: string): Promise<CalendarEvent[]> {
  const db = getDatabase()
  return await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.teacherId, teacherId))
    .orderBy(asc(calendarEvents.startTime), asc(calendarEvents.id))
}

export async function getCalendarEventsByTeacherAndDate(
  teacherId: string,
  date: Date,
): Promise<CalendarEvent[]> {
  const db = getDatabase()
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.teacherId, teacherId),
        gte(calendarEvents.startTime, dayStart),
        lt(calendarEvents.startTime, dayEnd),
      ),
    )
    .orderBy(asc(calendarEvents.startTime), asc(calendarEvents.id))
}

export async function updateCalendarEvent(
  id: number,
  data: UpdateCalendarEventInput,
): Promise<CalendarEvent | undefined> {
  const db = getDatabase()
  const [event] = await db
    .update(calendarEvents)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(calendarEvents.id, id))
    .returning()

  return event
}

export async function deleteCalendarEvent(id: number): Promise<boolean> {
  const db = getDatabase()
  const result = await db
    .delete(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .returning()

  return result.length > 0
}

export async function getAvailableSlots(teacherId: string): Promise<CalendarEvent[]> {
  const db = getDatabase()
  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.teacherId, teacherId),
        eq(calendarEvents.isAvailable, true),
      ),
    )
    .orderBy(asc(calendarEvents.startTime), asc(calendarEvents.id))
}

export async function getAvailableSlotsInDateRange(
  teacherId: string,
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const db = getDatabase()
  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.teacherId, teacherId),
        eq(calendarEvents.isAvailable, true),
        gte(calendarEvents.startTime, startDate),
        lte(calendarEvents.endTime, endDate),
      ),
    )
    .orderBy(asc(calendarEvents.startTime), asc(calendarEvents.id))
}
