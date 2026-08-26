# Notes: EasyMDE integration and modal create/edit

Dated **2026-08-26**. Effort scale: **S** 0.5–2 days · **M** 3–7 days · **L** 1.5–3 weeks.

**Status:** Notes/Tasks **modal create/edit shipped in 2.4.1**. EasyMDE was **not** adopted. This file remains the rationale.

Do **not** change Digest `auth_realm` (`BaikalDAV`) or `/var/www/baikal`.

Related: jtx Board Markdown interop (`NoteDescriptionFormat`, CHANGELOG 2.3.3 / 2.4.1), portal CSP (`docker/nginx-security-headers.inc`), shared dialog shell (`portal/src/ui.ts` `renderModal`).

---

## Verdict

| Question | Answer |
|----------|--------|
| Move Notes create/edit into a modal? | **Yes.** Beneficial on its own, matching Contacts and Calendar events. Do this first. |
| Integrate EasyMDE into Notes? | **Possible, not recommended as the next step.** Feasible only with a constrained config and extra wiring. Cost is high relative to the current editor’s job. |

The two ideas compose well (EasyMDE wants more width than the side panel), but they are **not** a package. The modal pays off even if the editor stays as it is. EasyMDE does **not** pay off unless the product goal is Markdown-source editing with preview, not a better WYSIWYG.

Recommended sequence:

1. **Modal create/edit** for Notes (**S**, maybe **M** if unsaved-close polish is included).
2. Keep the existing HTML editor in that modal.
3. Revisit EasyMDE (or a smaller CodeMirror 6 editor) only if Markdown-source editing is an explicit product goal.

---

## Current Notes stack

Notes are CalDAV `VJOURNAL` on writable calendars (`notes_enabled`). Portal code lives in `portal/src/app/notes/` (~740 lines). PHP conversion lives in `Baikal\Portal\NoteDescriptionFormat` (tested by `tests/php/NoteDescriptionFormatTest.php` and `CalendarItemServiceTest.php`).

### UI

Master–detail, same grid as Tasks (`portal-grid-items` + `body.layout-tasks`):

- Left: sortable table (title, date, calendar) with search, bulk copy/delete, **Add note**.
- Right: create/edit card — calendar (create only), title, date, **contenteditable** body, Save / Delete / Cancel.

On viewports ≤ 900px the form stacks under the list. The list wrap is capped (`max-height: min(42vh, 500px)`); the editor body is `min-height: 10rem` / `max-height: 28rem`.

Contacts already left this pattern: the contact form is `#contact-edit-modal` (`cal-modal-card-wide`). Calendar events use the same shell. Tasks still use the side panel; their fields are short. Notes are the odd one out: a long rich body squeezed into a ~0.95fr column.

### Editor

`portal/src/app/notes/editor.ts`:

- Toolbar: Bold, Italic, Underline, bullet/numbered list, H2, H3, blockquote, horizontal rule, checkbox, link.
- Body: `contenteditable` + `document.execCommand` (`formatBlock`, `insertHTML` for checkboxes, `window.prompt` for links).
- Hidden `<textarea name="description">` synced on input/blur/save.
- Sanitizer (`html.ts`) allows `P BR STRONG B EM I U UL OL LI H2 H3 A BLOCKQUOTE DIV SPAN HR INPUT[type=checkbox]`. No images, tables, code, H1, strikethrough.

`execCommand` is deprecated. That is a real maintenance risk, but the surface is small and covered by PHP round-trip tests.

`bindNoteEditor` remounts listeners after every SPA `innerHTML` paint (`afterRender.ts`). That is cheap for a contenteditable node and expensive for a CodeMirror instance (cursor, undo, composition).

### Storage (jtx Board interop)

RFC 5545 `DESCRIPTION` is plain text. The portal and jtx Board disagree on the body format:

| Direction | What happens |
|-----------|----------------|
| Portal save (HTML) | `DESCRIPTION` = Markdown; `X-ALT-DESC;FMTTYPE=text/html` = HTML |
| Portal save (Markdown that is not HTML) | `DESCRIPTION` = Markdown; `X-ALT-DESC` derived HTML |
| Portal save (plain) | `DESCRIPTION` only |
| Portal read | Prefer `X-ALT-DESC` HTML; else convert Markdown `DESCRIPTION` to HTML; else leave plain text |
| jtx Board | Renders Markdown from `DESCRIPTION`, ignores `X-ALT-DESC` |

API body is **HTML for the editor** (`toPortalHtml`). Max length 20 000 characters (`CalendarItemService::MAX_DESCRIPTION`). Supported Markdown subset: `**bold**`, `*italic*`, `##` / `###`, `>`, `---`, `- [ ]` / `- [x]`, lists, `[text](https://…)` links.

Underline has **no** Markdown equivalent: `htmlToMarkdown` drops `<u>` to plain text. EasyMDE would not restore that feature.

---

## EasyMDE

[EasyMDE](https://github.com/Ionaru/easy-markdown-editor) (`easymde` on npm) is a SimpleMDE fork: CodeMirror **5** + toolbar + [Marked](https://marked.js.org/) GFM preview. Latest stable **2.21.0** (2026-05-03; check-list toolbar). **3.0.0** is still beta. MIT license. Vanilla JS, so it fits a no-framework SPA better than MDXEditor / Milkdown.

It is **Markdown-source with live styling and a preview pane**, not a WYSIWYG HTML editor. Users see `**bold**`, `# heading`, `- [ ] task`. That matches jtx `DESCRIPTION` better than the current HTML editor, and worse than the current “looks like a note” toolbar.

### Size and dependency policy

| Artifact | Size |
|----------|------|
| Portal JS today (`html/portal/assets/index-*.js`) | **361 KB** |
| Portal CSS today | **63 KB** |
| EasyMDE `dist/easymde.min.js` | **~320 KB** |
| EasyMDE min+gzip (bundlephobia 2.20.0) | **~88 KB**; CodeMirror is ~80% of the package |
| EasyMDE CSS | **~13 KB** |

`portal/package.json` has **no runtime dependencies** (TypeScript + Vite only). EasyMDE would be the first, and it would roughly **double** the shipped JS unless it is dynamically imported only on the Notes tab.

CDN install (`unpkg` / `jsDelivr`) is incompatible with portal CSP. It must be bundled via npm + Vite.

### CSP (hard blockers unless configured)

Current policy (`portal/index.html` and nginx):

```
script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'
```

EasyMDE defaults that **fail** that policy:

| Default | What it loads | Fix if we ship EasyMDE |
|---------|----------------|-------------------------|
| `autoDownloadFontAwesome` (undefined) | `maxcdn.bootstrapcdn.com/font-awesome/…` stylesheet | **`autoDownloadFontAwesome: false`**. Toolbar needs a local icon set (`iconClassMap` / custom `toolbar` with text, as the current Bold/Italic buttons do). |
| `spellChecker: true` | `cdn.jsdelivr.net/codemirror.spell-checker/…` (`.aff`/`.dic`) | **`spellChecker: false`**. Native `spellcheck` on the textarea is enough. |
| `highlight.js` for fenced code | extra CDN | Leave **off**. Fenced code is not in the allowed note subset. |

GitHub issue [Ionaru/easy-markdown-editor#546](https://github.com/Ionaru/easy-markdown-editor/issues/546) documents exactly these CSP failures. They are configuration, not code changes, but they are mandatory.

Do **not** widen CSP to CDNs to make EasyMDE easier.

### Feature mismatch vs jtx / sanitizer

EasyMDE’s default toolbar is a blog editor. Notes are a **closed subset**.

| EasyMDE default | Notes today | If EasyMDE is used |
|-----------------|-------------|--------------------|
| Bold, italic, quote, lists, H2/H3, HR, link | Yes | Keep |
| Check-list (2.21) | Yes (`- [ ]`) | Keep |
| Underline | Yes (HTML only) | **Drop** (or keep HTML editor) |
| H1, H4–H6, strikethrough, code, table, image, upload | No | **Hide** |
| Side-by-side, fullscreen, Markdown guide | No | Hide or constrain (fullscreen fights portal chrome / `body.cal-modal-open`) |
| Preview via Marked (unsanitized GFM) | PHP subset + DOM sanitizer | Custom `previewRender` + `renderingConfig.sanitizerFunction` matching `sanitizeNoteHtml` / `NoteDescriptionFormat` |

If preview uses stock Marked, users will see tables, images, and raw HTML that **will not survive** save → PHP sanitize → jtx. The preview must lie in the same subset as the server.

`unorderedListStyle: "-"` matches PHP (`- item`, `- [ ]`). Default EasyMDE lists are `*`.

### Data-flow inversion

Today: editor HTML → API HTML → PHP `htmlToMarkdown` + `X-ALT-DESC`.

EasyMDE: editor Markdown → API could stay HTML (`markdownToHtml` in the browser) **or** send Markdown and let PHP’s existing `looksLikeMarkdown` branch run.

| Option | Pros | Cons |
|--------|------|------|
| **A.** EasyMDE → HTML on save, keep API | No PHP/API change | Round-trip loss (underline; Marked vs PHP dialect drift) |
| **B.** EasyMDE → Markdown in `description` | Honest jtx source; PHP already accepts Markdown | Portal list preview is HTML/`notePlainText`; read path still converts for any leftover HTML editor |
| **C.** Dual: Markdown in textarea, HTML preview only | Cleanest long-term | Two client formats during transition |

Round-trip is already lossy (underline, extra tags). Switching the source of truth to Markdown makes **jtx the native dialect** and the portal preview a view. That is the only strong product argument for EasyMDE.

### SPA lifecycle

The portal replaces `#portal-page` innerHTML on almost every action. EasyMDE wraps a textarea with CodeMirror 5:

- Must `new EasyMDE({ element })` after paint and `toTextArea()` / `cleanup()` before the next paint, **or** live in `#portal-overlays` with a stability key (see `overlays.ts` for PDF preview).
- Opening in a modal that was `display:none` needs `autoRefresh: { delay: 300 }` or an explicit `codemirror.refresh()`.
- Date picker already uses `position: fixed` so modal `overflow` does not clip it (`datetime.ts`). EasyMDE dropdowns / preview must be checked the same way.
- `forceSync: true` so FormData / `syncEditingNoteFromForm` still see the textarea (date-picker re-renders currently call that).
- Confirm-delete already stacks a second modal; Escape handling in `events.ts` would need a `noteModalOpen` branch next to `contactModalOpen` / `eventModalOpen`.

### Theme

Portal dark/light uses CSS variables (`--surface`, `--text`, `--border`, `--accent`). EasyMDE ships a CodeMirror 5 skin that will look like a foreign light editor unless we override `.EasyMDEContainer`, `.CodeMirror`, toolbar, and preview. That is a non-trivial CSS island (~100+ selectors), including both themes.

### 3.x / CodeMirror 6

EasyMDE 3 is alpha/beta. CodeMirror 5 is maintenance-mode. Betting Notes on EasyMDE 2 is a mid-term debt. A thin CodeMirror **6** `@codemirror/lang-markdown` editor would be smaller and current, but it is not EasyMDE (no stock toolbar/preview).

---

## Modal create/edit (independent of EasyMDE)

### Why it helps

1. **Notes bodies are long.** The side panel is sized for Tasks. The editor is the thing that needs width and height; the list is the thing that needs rows.
2. **Already the portal pattern** for Contacts (`contactModalOpen`, `cal-modal-card-wide`) and events (`eventModalOpen`). Shared `renderModal()` + focus trap + `body.cal-modal-open` + flash-inside-modal (`shell.ts` `flashOnMain`).
3. **Mobile.** Below 900px, list + form already stack. A modal is a focused edit surface; the list can use the full width.
4. **Toolbar width.** Eleven format buttons wrap awkwardly in `minmax(260px, 0.95fr)`. A wide modal (800px, already used by contacts) fits one toolbar row.
5. **Keyboard list nav** (↑/↓/Enter on the table) stays on the list; Enter opens the modal instead of filling a side card.

### Costs / design choices

| Topic | Notes |
|-------|--------|
| Glance-at-list while editing | Lost. Contacts already accepted this. |
| Unsaved close | Events/contacts close on backdrop / Escape with no dirty prompt. Same here unless we add a shared dirty guard. |
| Read-only notes | Open the same modal without Save (current form already disables the editor). |
| Delete | Keep confirm-delete stacked on top (`confirmDelete.scope = "note"`). |
| Date field | Existing fixed popover works inside modals. |
| After save | Close modal and keep the row selected (Contacts pattern), or leave it open. Closing is clearer. |
| Tasks | **Do not** move Tasks in the same change. Short form + subtask parent picker still benefit from the side panel. |
| Layout CSS | Notes can drop `layout-tasks` sharing or keep the list-only pin. Full-width list is the win. |

### Sketch (reuse Contacts)

State: `noteModalOpen` (or reuse `creatingNote` + `editingNote` as the open condition, like events).

Actions: `new-note` / `select-note` open modal; `cancel-note` / Escape / backdrop close; form `data-form="note"` with footer Create/Save + Cancel + Delete.

Render: list-only main; `renderModal({ id: "note-edit-modal", size: "wide", form: true, … })` in the tab HTML (same place as the contact modal, not the overlay slot unless EasyMDE requires instance stability).

`home.ts` `cal-modal-open` and `shell.ts` `flashOnMain` must include the new flag. `events.ts` Escape stack: confirm-delete → info/about → date picker → **note modal** → …

---

## Integration options

| Path | Effort | When to pick |
|------|--------|--------------|
| **1. Modal only, keep HTML editor** | **S–M** | Default. Fixes space and consistency. No new dependency. |
| **2. Modal + EasyMDE (constrained)** | **M–L** | Only if Markdown-source + preview is the product goal. First runtime dep, ~2× JS unless lazy-loaded, CSP-safe config, PHP subset preview, theme CSS, CM5 lifecycle. |
| **3. EasyMDE in the current side panel** | **M** | Worse than 2. Default `minHeight: 300px` plus side-by-side does not fit the panel. Skip. |
| **4. Modal + keep HTML editor, replace `execCommand`** | **M** | If deprecation is the pain, not Markdown. `inputMode` / `document.execCommand` polyfill is unnecessary; a tiny wrapper around `Selection` + `insertHTML` for the existing 11 commands is enough. |
| **5. CodeMirror 6 Markdown (no EasyMDE)** | **L** | Modern, CSP-friendly, tree-shakeable. We would own toolbar, preview, theme. Only if we reject EasyMDE but still want Markdown-source. |

### If path 2 is chosen anyway (checklist)

Must:

- `npm install easymde` (pin **2.21.x**, not 3.x beta). Dynamic `import()` from Notes bind so Calendar/Contacts/Files do not pay the cost.
- Import `easymde/dist/easymde.min.css` and restyle to `--surface` / `--text`.
- `autoDownloadFontAwesome: false`, `spellChecker: false`, `status: false`, `sideBySideFullscreen: false`.
- Toolbar: `bold italic heading-2 heading-3 quote unordered-list ordered-list check-list horizontal-rule link preview | undo redo`. No image/table/code/guide/fullscreen.
- `unorderedListStyle: "-"`, `blockStyles.bold: "**"`, `blockStyles.italic: "*"`.
- `previewRender` + sanitizer aligned with `NoteDescriptionFormat` (or call a shared TS port of the subset). Do not use stock Marked GFM.
- `forceSync: true`; destroy instance in `bindNoteEditor` before re-init; `autoRefresh` if the modal paints hidden.
- Decide API: keep sending HTML (path A) or send Markdown (path B) and extend `notePlainText` for list previews.
- Tests: existing PHP round-trips still pass; add a portal test that toolbar-hidden features do not persist; CSP test still forbids extra hosts.
- **No** image upload, **no** highlight.js, **no** Font Awesome webfonts.

Should not:

- Enable autosave to `localStorage` (conflicts with CalDAV as source of truth; stale drafts after client sync).
- Change `MAX_DESCRIPTION` or jtx field layout.
- Load EasyMDE from a CDN.

---

## Alternatives considered (and dropped)

| Library | Why not |
|---------|---------|
| SimpleMDE | Abandoned (2017); EasyMDE exists because of that. |
| MDXEditor, Milkdown (React) | Portal is vanilla TypeScript. |
| Toast UI Editor | Heavier; another CSS island. |
| TinyMCE / CKEditor | HTML WYSIWYG, license/cloud, huge, fights Markdown `DESCRIPTION`. |
| `markdown-text-editor` (CSP-friendly claim) | Much less ecosystem; still a first runtime dep for a subset we already implement. |

---

## Recommendation (short)

**Move Notes create/edit into a wide modal.** Mirror Contacts: full-width list, dialog for the form, flash inside the dialog, Escape/backdrop close. Leave Tasks as master–detail.

**Do not add EasyMDE now.** The current editor already matches the jtx subset; PHP already owns HTML ↔ Markdown. EasyMDE would add ~320 KB, the first npm runtime dependency, Font Awesome/spell-checker CSP landmines, a CodeMirror 5 lifecycle vs `innerHTML`, a theme fork, and a preview that is *more* capable than we are allowed to store — unless we spend the **M–L** to constrain it.

Revisit a Markdown-source editor only if users need to **see and edit the same Markdown jtx Board stores**, not if they need a nicer toolbar. In that case prefer a **lazy-loaded, subset-locked EasyMDE 2.21** in the new modal, or skip EasyMDE and wrap CodeMirror 6.

---

## Suggested implementation order (path 1)

1. Add `noteModalOpen` (or treat `editingNote != null` as open). Wire `new-note` / `select-note` / `cancel-note`.
2. Extract the current form from `render.ts` into `renderNoteModal()` using `renderModal({ size: "wide", form: true })`.
3. Notes tab becomes list-only; empty state stays “Add note”.
4. Hook `cal-modal-open`, `flashOnMain`, Escape stack, focus trap (already generic).
5. Keep `bindNoteEditor` as-is inside the modal body.
6. Screenshots: update `docs/images/portal-notes.png` / DEPLOYMENT figure.
7. Optional follow-up: dirty-close confirm shared with Contacts/Events.
