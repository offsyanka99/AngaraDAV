# Generic WebDAV file storage implementation plan

**Status:** Initial private-drive scope implemented; portal Files tab added in 1.0.5. Sync, Push, and sharing remain follow-up milestones.

## Implementation result

The owner-only filesystem-backed release scope is implemented behind the
`files_enabled` feature flag. Automated coverage includes atomic writes,
quotas, path/symlink handling, account quarantine and username reuse, a
two-user authenticated HTTP workflow, and all 104 WebDAV Litmus 0.13 tests.

As of **1.0.5**, the user portal exposes a **Files** tab backed by
`Baikal\Portal\FileService` and `/api/files/*` (same physical homes as
`/dav.php/files/{username}/`): list, mkdir, upload, download, rename, move,
delete, and quota status.

The follow-up milestones in this document remain intentionally unimplemented:
RFC 6578 file Sync, WebDAV-Push for files, mutable sharing ACLs, public links,
trash, and version history.

## Goal

Add an optional, private WebDAV file home for every AngaraDAV DAV user while
preserving the existing CalDAV and CardDAV behavior.

The first release targets a dependable mounted drive, not a complete cloud
storage product. Each user owns an isolated file tree at:

```text
/dav.php/files/{username}/
```

The feature is disabled by default and must not expose file homes through
`/cal.php/` or `/card.php/`.

## Compatibility target

The initial implementation must support the operations expected by common
WebDAV drive clients:

- `OPTIONS`, `PROPFIND`, `HEAD`, and `GET`
- `PUT`, `MKCOL`, `DELETE`, `COPY`, and `MOVE`
- `PROPPATCH` with persistent dead properties
- `LOCK` and `UNLOCK` with persistent locks
- Conditional requests using ETags
- Byte-range downloads
- Owner-only WebDAV ACL enforcement
- Per-user quota reporting and enforcement

Validate interoperability with Windows Explorer, macOS Finder, GNOME Files,
Cyberduck, and rclone. WebDAV Litmus should be used as the protocol compliance
suite.

## Initial non-goals

The first release does not include:

- Public links or anonymous access
- User-to-user file sharing
- Trash, version history, or file recovery
- Full-text search or content indexing
- Object storage backends
- Antivirus or data-loss-prevention scanning
- RFC 6578 WebDAV-Sync for files
- WebDAV-Push notifications for files
- Vendor-specific chunked upload protocols

These features require additional metadata, policy, and lifecycle work. They
must not be implied by the initial "WebDAV file storage" label.

## Architecture decisions

### DAV tree

Use the existing SabreDAV server and principal backend. Add an ACL-aware
`files` root only to the combined `/dav.php/` endpoint.

Do not register SabreDAV's stock `DAVACL\FS\HomeCollection` directly. Use it as
a reference for principal lookup and ACL behavior, but provide AngaraDAV-owned
nodes for storage safety, quota enforcement, atomic writes, and lifecycle
handling.

Refactor the server constructor so each entrypoint explicitly selects its
capabilities. The current boolean arguments do not identify whether the caller
is `/dav.php/`, `/cal.php/`, or `/card.php/`.

Recommended endpoint capability object or options array:

```php
[
    'caldav'  => true,
    'carddav' => true,
    'files'   => true,
]
```

Keep a compatibility constructor path only if an external caller is known to
instantiate `Baikal\Core\Server` directly.

### Storage layout

Store file bytes outside the web document root. The default layout is:

```text
Specific/files/homes/{storage-id}/
Specific/files/tmp/{storage-id}/
Specific/files/quarantine/{storage-id}/
```

Allow a deployment to override the root with
`BAIKAL_FILES_STORAGE_PATH`. The configured path must be absolute, writable,
must not be the filesystem root, and must not resolve beneath `html/`.

Use a random, non-reusable storage ID instead of a username as the physical
directory name. This prevents a deleted and recreated username from inheriting
the previous account's files.

The temporary directory must be on the same filesystem as the home directory
so a completed upload can be installed with an atomic rename.

### Home identity and lifecycle

Add a small cross-database `file_homes` table rather than deriving physical
storage paths from principal URIs.

Minimum fields:

| Field | Purpose |
|-------|---------|
| `id` | Database primary key |
| `user_id` | Current AngaraDAV user ID; nullable after deletion |
| `principaluri` | Principal URI recorded for audit and cleanup |
| `storage_id` | Random unique physical storage identifier |
| `status` | `active`, `quarantined`, or `purging` |
| `created_at` | Creation timestamp |
| `quarantined_at` | Deletion/quarantine timestamp |

Provision the table idempotently for SQLite and PostgreSQL and include
it in fresh-install schemas.

When an administrator deletes a user:

1. Revoke access by changing the home status in the database.
2. Move the physical home to `quarantine/` using the storage ID.
3. Remove file dead properties and locks for the old DAV path.
4. Delete the principal and normal CalDAV/CardDAV data.
5. Leave permanent deletion to an explicit administrator action or retention
   policy.

If quarantine fails, user deletion must fail closed or leave the home marked
inaccessible. A new account must never attach to an existing physical home.

### File and directory nodes

Add AngaraDAV-owned classes under `Core/Frameworks/Baikal/Core/Files/`:

| Class | Responsibility |
|-------|----------------|
| `HomeCollection` | Principal-to-home lookup and owner-only root ACL |
| `Directory` | Child enumeration, collection mutations, quota checks |
| `File` | Streaming reads/writes, ETags, ranges, partial updates if enabled |
| `HomeStorage` | Safe path resolution, atomic writes, usage calculation |
| `HomeRepository` | `file_homes` persistence and account lifecycle |
| `SchemaManager` | Idempotent database provisioning |

All child nodes must implement `Sabre\DAVACL\IACL` and return the owning
principal. ACLs are protected in the first release; `ACL` requests that try to
share resources remain unsupported.

Storage rules:

- Reject `.` and `..`, control characters, and paths above configured limits.
- Never follow symbolic links.
- Confirm resolved paths remain beneath the selected home.
- Disable listing of the top-level user-home collection.
- Stream request bodies and responses.
- Write uploads to a unique temporary file with exclusive creation.
- Flush and atomically rename only after the full request succeeds.
- Remove abandoned temporary files using a bounded cleanup job.
- Generate an ETag that changes for every content change. A content hash
  calculated during upload is preferred over inode/size/mtime tuples.
- Use `finfo` for content type when available, with
  `application/octet-stream` as the fallback.

### Locking and properties

Register `Sabre\DAV\Locks\Plugin` with the existing PDO lock backend when file
storage is enabled. The database schemas already contain the `locks` table.

Keep the existing PDO property-storage plugin. Verify that dead properties are
removed on delete and moved on `MOVE`, including directory subtrees.

The lock and property paths must include the `files/{username}` prefix so they
cannot collide with calendars, address books, or another endpoint.

### Quotas

Expose `quota-used-bytes` and `quota-available-bytes`, but do not treat those
properties as enforcement. Enforce quota before and during every operation
that can increase storage:

- New `PUT`
- Overwrite `PUT`, accounting for the replaced file size
- `COPY`
- Cross-directory `MOVE` if quota ownership changes in a future release
- Partial update, if enabled
- Concurrent uploads

Return `507 Insufficient Storage` when a limit is exceeded. Application quotas
should be backed by filesystem or dataset quotas where the deployment platform
supports them.

## Configuration

Add defaults and admin controls:

```yaml
system:
  files_enabled: false
  files_storage_path: ''
  files_max_upload_mb: 1024
  files_quota_mb: 10240
  files_quarantine_days: 30
```

An empty storage path means `Specific/files`. A quota value of `0` may mean
unlimited, but the admin UI and documentation must state that explicitly.

Environment overrides:

- `BAIKAL_FILES_STORAGE_PATH`
- `BAIKAL_FILES_MAX_UPLOAD_MB`
- `BAIKAL_FILES_QUOTA_MB`

Validate numeric values with conservative lower and upper bounds. Environment
configuration overrides YAML consistently with the existing deployment model.

## Implementation phases

### Phase 1: Configuration and endpoint isolation

- [ ] Add file-storage defaults to `Model/Config/Standard.php`.
- [ ] Add admin settings with clear units and validation.
- [ ] Add documented defaults to `config/baikal.yaml.dist`.
- [ ] Refactor `Baikal\Core\Server` to accept explicit endpoint capabilities.
- [ ] Make `/dav.php/` enable configured file storage.
- [ ] Ensure `/cal.php/` is CalDAV-only and `/card.php/` is CardDAV-only.
- [ ] Add `files` and its endpoint to public service information without
      exposing storage paths, quotas, or usage.

**Gate:** Existing CalDAV/CardDAV tests pass unchanged, and file nodes cannot
be discovered through the protocol-specific endpoints.

### Phase 2: Home persistence and safe filesystem nodes

- [ ] Add `file_homes` schemas and an idempotent schema manager.
- [ ] Add `HomeRepository` and random storage-ID generation.
- [ ] Implement `HomeCollection`, `Directory`, `File`, and `HomeStorage`.
- [ ] Enforce owner-only ACLs and disable root user listing.
- [ ] Implement safe path resolution and symlink rejection.
- [ ] Implement streamed, atomic uploads and reliable ETags.
- [ ] Implement account deletion quarantine and explicit purge behavior.
- [ ] Clean up locks and dead properties during quarantine/purge.

**Gate:** Two authenticated users cannot enumerate or access each other's
homes, including after account deletion and username reuse.

### Phase 3: Locks, properties, quotas, and compatibility

- [ ] Register the PDO lock plugin when file storage is enabled.
- [ ] Verify `LOCK` refresh, lock-token writes, and `UNLOCK` behavior.
- [ ] Verify dead-property create, update, move, and delete behavior.
- [ ] Add quota reporting and race-safe enforcement.
- [ ] Define maximum file size, path length, segment length, and tree depth.
- [ ] Decide whether to enable SabreDAV partial-update support based on client
      compatibility tests.
- [ ] Add bounded cleanup for expired locks and abandoned temporary uploads.

**Gate:** WebDAV Litmus passes the agreed class 1/class 2 profile, with every
intentional failure documented.

### Phase 4: Docker and deployment operations

- [ ] Create `Specific/files` with restrictive ownership in the image.
- [ ] Update entrypoint permission handling for the default storage path.
- [ ] Document a separate persistent dataset/volume for large file storage.
- [ ] Add a dedicated nginx DAV location with configurable body size and
      appropriate FastCGI timeouts.
- [ ] Evaluate `fastcgi_request_buffering off` for large streamed uploads.
- [ ] Ensure nginx temporary storage cannot exhaust the container filesystem.
- [ ] Add file homes, quarantine, and metadata to backup/restore instructions.
- [ ] Add health diagnostics for an enabled but missing/unwritable storage
      path without revealing the path publicly.

**Gate:** A multi-gigabyte test upload does not load the body into PHP memory,
survives normal proxy timeouts, and leaves no visible partial file when
interrupted.

### Phase 5: Automated and client testing

- [ ] Add `tests/php/FileHomeStorageTest.php` for paths, atomic writes, quota,
      ETags, lifecycle, and schema behavior.
- [ ] Add `tests/webdav_files.py` for HTTP method and two-user ACL coverage.
- [ ] Run the tests against SQLite and PostgreSQL.
- [ ] Add concurrent PUT, overwrite, disk-full, and interrupted-upload tests.
- [ ] Test conditional headers, range downloads, `COPY` overwrite semantics,
      and `MOVE` across directories.
- [ ] Add a containerized WebDAV Litmus job or a documented reproducible
      Litmus command if CI integration is impractical.
- [ ] Record manual compatibility results for Windows Explorer, macOS Finder,
      GNOME Files, Cyberduck, and rclone.

**Gate:** CI passes, the Docker smoke test passes, and no supported client can
cross account boundaries or observe incomplete uploads.

### Phase 6: Documentation and release

- [ ] Add the file-drive URL and supported feature set to `README.md`.
- [ ] Add configuration, reverse-proxy, quota, volume, backup, restore, and
      account-deletion guidance to `docs/DEPLOYMENT.md`.
- [ ] State the initial non-goals explicitly in release notes.
- [ ] Keep the feature disabled by default for upgrades.
- [ ] Verify disabling the feature leaves stored files untouched and removes
      file capabilities from DAV discovery.
- [ ] Provide rollback instructions that preserve the storage volume and
      `file_homes` metadata.

**Gate:** A clean install and an upgraded installation can independently
enable, use, disable, and re-enable file storage without data loss.

## Follow-up milestones

### RFC 6578 WebDAV-Sync

Filesystem nodes do not become sync collections merely because the existing
Sync plugin is enabled. Implementing file sync requires a durable change
journal and custom nodes implementing `Sabre\DAV\Sync\ISyncCollection`.

Before implementation, choose between:

1. A filesystem source of truth plus a per-collection database journal. This
      is simpler but assumes all mutations pass through AngaraDAV.
2. A database metadata tree with filesystem blobs. This provides stable node
   identity and stronger transactions but is a larger backend.

The second design is preferred if versioning, sharing, or object storage is
likely. The journal must cover create, update, delete, copy, move, subtree
changes, token expiry, and bounded history cleanup.

### WebDAV-Push for files

Extend Push only after file sync tokens exist:

- Make eligible file collections advertise Push properties.
- Add generic file collections to Push capability resolution.
- Emit content-update notifications for every committed mutation.
- Include the file collection sync token in queued notifications.
- Preserve `Push-Dont-Notify` behavior and ACL checks.
- Add end-to-end tests with a client that supports Push for generic files.

Push remains an accelerator; clients must continue supporting normal WebDAV
discovery or sync.

### Sharing

Sharing requires mutable ACL persistence rather than the protected owner-only
ACL used by the first release. Define owner, read-only, and read-write grants;
inheritance; group behavior; revocation; move/copy semantics; and audit logs
before enabling the `ACL` method.

Public links, passwords, expiry dates, upload-only shares, and link discovery
are application features, not automatic consequences of generic WebDAV.

## Release blockers

Do not advertise generic WebDAV file storage as supported until all of the
following are true:

- File storage is disabled by default and endpoint-scoped.
- Cross-user access and top-level user enumeration are blocked.
- Username reuse cannot expose a quarantined home.
- Writes are streamed, atomic, quota-checked, and symlink-safe.
- Persistent locks and dead properties behave correctly.
- Interrupted requests never expose partial files.
- Docker storage, limits, permissions, backup, and restore are documented.
- Automated protocol/security tests and the agreed client matrix pass.

## Recommended delivery sequence

Implement Phases 1 through 3 as small, independently reviewable changes, then
complete Docker operations and testing before updating user-facing claims.
Release the private drive without file Sync, Push, or sharing. Treat each
follow-up as a separate feature with its own schema, threat model, and test
plan.