# Task 2: User Query Capabilities

## Objective

Add DB query helpers for admin user management.

## Tests

- Service tests verify admin workflows call `listUsers` and `updateUserRole`.
- Existing DB tests continue covering core user CRUD.

## Implementation Notes

- Return a public user shape that excludes password/account/session fields.
- Update only the `role` and `updatedAt` fields when changing roles.
