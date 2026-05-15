import { and, desc, eq } from 'drizzle-orm'
import { getDatabase } from '../index'
import { roleReviews, users } from '../schema'
import type { RoleReview } from '../schema'

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected'
export type PickableRole = 'teacher' | 'student'
export type { RoleReview }
export type RoleReviewWithUser = RoleReview & {
  user: { id: string; email: string; name: string | null }
}

// Caller (service layer) is responsible for validating that requestedRole is a PickableRole
// before calling this function. The DB column is plain text with no database-level constraint.
export async function createRoleRequest(
  userId: string,
  requestedRole: PickableRole,
): Promise<RoleReview> {
  const db = getDatabase()
  const [review] = await db
    .insert(roleReviews)
    .values({ userId, requestedRole, status: 'pending', updatedAt: new Date() })
    .returning()
  return review!
}

export async function getPendingRequestByUserId(userId: string): Promise<RoleReview | undefined> {
  const db = getDatabase()
  const result = await db
    .select()
    .from(roleReviews)
    .where(and(eq(roleReviews.userId, userId), eq(roleReviews.status, 'pending')))
    .limit(1)
  return result[0]
}

export async function getRoleRequestById(id: number): Promise<RoleReview | undefined> {
  const db = getDatabase()
  const result = await db
    .select()
    .from(roleReviews)
    .where(eq(roleReviews.id, id))
    .limit(1)
  return result[0]
}

export async function listPendingRoleRequests(): Promise<RoleReviewWithUser[]> {
  const db = getDatabase()
  return await db
    .select({
      id: roleReviews.id,
      userId: roleReviews.userId,
      requestedRole: roleReviews.requestedRole,
      status: roleReviews.status,
      reviewedBy: roleReviews.reviewedBy,
      createdAt: roleReviews.createdAt,
      updatedAt: roleReviews.updatedAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
      },
    })
    .from(roleReviews)
    .innerJoin(users, eq(roleReviews.userId, users.id))
    .where(eq(roleReviews.status, 'pending'))
    .orderBy(desc(roleReviews.createdAt))
}

export async function updateRoleRequestStatus(
  id: number,
  status: RoleRequestStatus,
  reviewedBy: string,
): Promise<RoleReview | undefined> {
  const db = getDatabase()
  const result = await db
    .update(roleReviews)
    .set({ status, reviewedBy, updatedAt: new Date() })
    .where(eq(roleReviews.id, id))
    .returning()
  return result[0]
}
