# ADR-002 — Development identity for the first persistence slice

## Status

Implemented development-only constraint; production identity remains undecided.

## Context

Workspace and Project APIs need a trusted principal before a login UI or identity
provider has been selected. Caller-supplied user and workspace headers do not
establish identity.

## Decision

Use an explicitly enabled development bearer token mapped to one provisioned User
by server configuration. Require NODE_ENV=development, DEV_AUTH_ENABLED=true,
a token of at least 32 characters, and a valid DEV_USER_ID. Generated local tokens
contain 32 random bytes. Never send token configuration to the browser or commit it.

Missing/invalid credentials, an absent user, and non-development environments fail
closed. The liveness endpoint stays public. Production Workspace/Project endpoints
remain unavailable until a production identity adapter is implemented.

The creator receives WorkspaceMember on workspace creation and explicit
ProjectMember on project creation. A workspace member may create a project, but
can only list/read/update projects where they have ProjectMember. This first slice
has no role hierarchy, invitations, membership administration, or approval actions.

## Consequences

This supports local API development without claiming a finished login system.
Unauthorized workspace/project access returns 404 to avoid confirming existence.
Changing DEV_USER_ID or rotating the token requires restarting the API. Replace
this adapter with verified sessions before shared deployment; do not extend the
development token into production authentication.
