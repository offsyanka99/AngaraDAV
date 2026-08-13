# Portal delegated-events — Step 8 verification

**Date:** 2026-08-12  
**Branch:** `refactor/portal-delegated-events` → release **2.2.2**  
**Product baseline:** builds on 2.2.1 SPA  

---

## 1. Automated (passed)

| Check | Result |
|-------|--------|
| `tsc --noEmit` | clean |
| `vite build` | clean (`index-BHlyAcKg.js` / `index-CC4UvJIA.css` at time of run) |
| Mount-time root listeners | 1 each: click, submit, change, input, keydown, dragenter/over/leave/drop, error (capture) |
| Document Escape `keydown` | **1** |
| Stability after **20** tab switches + **10** info open/Escape | root + document counts **unchanged** |
| Spot smoke | login, new-task click, task ArrowDown+Enter, logout |

Harness: Playwright + CDP `DOMDebugger.getEventListeners` (see session `/tmp/portal-step8-verify.mjs`).

---

## 2. Architecture (as verified)

```text
mountApp
  └── registerPortalEvents(o)   // ONCE
  └── bootstrap → render()
        └── bindAfterRender(o)  // outside menus, indeterminate, holidays sync only
```

| Layer | File | Role |
|-------|------|------|
| Mount | `app/events.ts` | All interaction listeners |
| After render | `app/afterRender.ts` | Menus outside-click, indeterminate, holidays UI sync |

---

## 3. Manual smoke checklist (for you)

Use **http://127.0.0.1:8080/portal/** (hard-refresh). Prefer a clean session.

### Shell
- [ ] Login / logout  
- [ ] Tab switch: Calendar, Contacts, Tasks, Notes, Files, Admin  
- [ ] User menu; info **(i)** open/close; Escape  
- [ ] Header: **DAV** is medium gray (not blue)  

### Calendar
- [ ] Select/toggle calendars; month prev/next/today  
- [ ] New event on day; edit event chip; DT month/year + day/time  
- [ ] Save event; Escape closes modal  
- [ ] Share (add second user without replacing first)  

### Tasks / Notes
- [ ] Focus a row → **↑/↓** moves focus; **Enter** opens  
- [ ] Type summary then open Due/Date — draft retained  
- [ ] Create/cancel/delete  

### Contacts
- [ ] Same keyboard nav on list  
- [ ] Birthday picker; multi email; photo  
- [ ] Delete (themed confirm)  

### Files
- [ ] Upload menu Files… / Folder…  
- [ ] Drop **multiple** files and **multiple** folders  
- [ ] Conflict modal: skip / overwrite / cancel  
- [ ] Mkdir, rename  
- [ ] Escape while upload running does **not** kill mid-flight  

### Admin (if admin)
- [ ] Settings form save  
- [ ] Users list / open user  

### Listener sanity (optional DevTools)
1. Open page, log in  
2. Console: after many tab switches, `#app` should still have **one** `click` / `submit` / `change` / `input` / `keydown`  
3. `document` should still have **one** `keydown` for Escape  

---

## 4. Step 8 status

| Item | Status |
|------|--------|
| tsc + Vite build | **Pass** |
| Listener stability | **Pass** (automated) |
| No duplicate Escape | **Pass** (automated) |
| Manual smoke §8 | **Pending — your pass** |

When manual smoke is green, mark checklist items and merge the branch.
