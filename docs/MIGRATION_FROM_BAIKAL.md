# Migrating to AngaraDAV

AngaraDAV is the continuation of the former `offsyanka99/Baikal` fork under an
independent product and repository name. Existing installations do not require
a database or filesystem migration.

## Docker image

Change the image reference and recreate the container:

```yaml
image: ghcr.io/offsyanka99/angaradav:latest
```

Keep the existing volume targets:

```yaml
volumes:
  - /your/config:/var/www/baikal/config
  - /your/data:/var/www/baikal/Specific
```

Changing the container or host dataset name is optional. Do not create empty
replacement volumes when the existing volumes contain production data.

## Compatibility identifiers

The following names intentionally remain unchanged:

- `config/baikal.yaml`
- `BAIKAL_*` environment variables
- `/var/www/baikal` container path
- `Baikal\*` and `BaikalAdmin\*` PHP namespaces
- `BAIKAL_VERSION` and related internal constants
- `BaikalDAV` authentication realm
- Database schemas and table names
- `/dav.php/`, `/cal.php/`, `/card.php/`, `/api/`, and `/portal/` URLs

Changing the authentication realm would invalidate stored Digest hashes, so it
is retained for existing and new installations during the compatibility period.

## Repository

New development, issues, documentation, and images live at:

- <https://github.com/offsyanka99/AngaraDAV>
- <https://ghcr.io/offsyanka99/angaradav>

The former repository remains the historical home for the `0.11.1-fork.*`
release tags. The first independent AngaraDAV release will start a new version
line without changing the compatibility identifiers above.