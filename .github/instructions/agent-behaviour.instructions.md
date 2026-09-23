---
applyTo: '**'
---

# Repository Agent Behaviour

## File Creation Boundaries

- Do not create files outside this repository unless the user explicitly asks for it.
- Reason: creating files outside the repository requires explicit user approval every time, even if broad approval was given earlier.

## Temporary Files

- If temporary files are needed, use only the `.agent-tmp` folder at the repository root.
- Create `.agent-tmp` if it does not exist.
- Clean up temporary files created in `.agent-tmp` after finishing the task.

## `.agent-tmp` Durability

- Treat anything inside `.agent-tmp` as disposable.
- Files in `.agent-tmp` may be deleted, overwritten, or changed at any time.
- Do not rely on `.agent-tmp` contents as durable project state.
- `.agent-tmp` is not tracked in git.

## Durable Artifacts — `.agent-artifacts`

Some agent output must survive until a human consumes it: PR screenshots, captured
evidence, review reports, generated PR bodies. `.agent-tmp` is the wrong place for these,
because its contents are disposable: any agent may delete or overwrite the files it put there
at any time, and legitimately does.

- Put anything a later phase, a later agent, or a human still needs in `.agent-artifacts`
  at the repository root. Create it if it does not exist.
- **Never delete or bulk-clean `.agent-artifacts`.** It is not covered by the `.agent-tmp`
  cleanup rule. Remove a file from it only when explicitly asked to, and only by name.
- Never bulk-clean by directory anywhere. `find .agent-tmp -delete` and equivalents wipe
  sibling work in progress. Delete only the specific files you created, by name.
- `.agent-artifacts` is not tracked in git. Never stage or commit its contents — that is
  what keeps it safe to write to freely.
- Use `.agent-tmp` only for genuinely throwaway scratch: intermediate scripts, captured
  command output you are about to parse, working files with no consumer but you.
