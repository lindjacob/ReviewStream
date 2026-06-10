# ReviewStream shared

## Purpose

Type-only package for contracts shared by the backend and frontend. It keeps JSON API DTOs in one
place without making the frontend import backend implementation files.

## Invariants

- Shared types describe wire/API shapes, not backend domain models.
- Date fields crossing HTTP are strings; backend-only domain objects may still use `Date`.
- Imports from this package should be type-only.

## Non-goals & trade-offs

- No runtime helpers or business logic live here.
- No generated client/schema layer yet; the current API surface is small enough for hand-written DTOs.
