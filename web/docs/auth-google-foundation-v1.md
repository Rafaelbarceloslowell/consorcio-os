# GorillaOS — Google Authentication Foundation V1 R1

This package creates the first controlled authentication foundation.

## Required environment variable names

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

No values or placeholder secrets are included.

## Deliberately not included

- Public signup
- Email/password login
- Global page protection
- Complete invitation management
- Advanced roles and permissions
- Automatic database migration
- Database writes during package validation
- Any 3D or Blender change

## Authorization foundation

A Google user can only be created when the Google e-mail matches exactly one
active `Consultant` inside an active `Workspace`. The Better Auth `User` stores
the existing `workspaceId` and `consultantId`; it does not duplicate either
business entity.

## Database

The package updates `prisma/schema.prisma` and regenerates the Prisma client,
but it does not run a migration and does not change the database.

A controlled migration must be prepared and approved separately after the
Google credentials and target database plan are confirmed.

## R1 type correction

The R1 package preserves the approved architecture and fixes only the environment-map test typing and the inferred Better Auth instance cache type.

## R3 runner correction

The authentication implementation is unchanged from the version that passed TypeScript, targeted tests, and the full 1,772-test suite. R3 changes only the controlled installer and replaces Windows PowerShell JSON parsing with a dependency-free Node validator.
