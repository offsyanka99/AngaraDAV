/**
 * Notes rich-text field (contenteditable + toolbar).
 */
import { esc } from "../../ui";
import { sanitizeNoteHtml } from "./html";
import type { NotesHost } from "./host";

let toolbarSyncAbort: AbortController | null = null;

export function renderNoteEditor(html: string, readOnly: boolean): string {
  const safe = sanitizeNoteHtml(html);
  const toolbar = readOnly
    ? ""
    : `<div class="note-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="italic" title="Italic"><em>I</em></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h1" title="Heading 1">H1</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h2" title="Heading 2">H2</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h3" title="Heading 3">H3</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="blockquote" title="Blockquote">“</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertHorizontalRule" title="Horizontal line">―</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertCheckbox" title="Checkbox">☐</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="createLink" title="Link">Link</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertCode" title="Inline code">&lt;/&gt;</button>
      </div>`;
  return `<div class="note-editor">
      ${toolbar}
      <div class="note-editor-body" data-note-editor="1" ${readOnly ? "contenteditable=\"false\"" : 'contenteditable="true" role="textbox" aria-label="Note body" aria-multiline="true"'}
        >${safe}</div>
      <textarea name="description" hidden>${esc(html)}</textarea>
    </div>`;
}

export function bindNoteEditor(host: NotesHost): void {
  toolbarSyncAbort?.abort();
  toolbarSyncAbort = null;
  const editor = host.root.querySelector<HTMLElement>("[data-note-editor]");
  const hidden = host.root.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
  if (!editor || !hidden) return;
  const sync = () => {
    hidden.value = sanitizeNoteHtml(editor.innerHTML);
    syncNoteToolbar(editor);
  };
  toolbarSyncAbort = new AbortController();
  const { signal } = toolbarSyncAbort;
  editor.addEventListener("input", sync, { signal });
  editor.addEventListener("blur", sync, { signal });
  editor.addEventListener("keyup", () => syncNoteToolbar(editor), { signal });
  editor.addEventListener("mouseup", () => syncNoteToolbar(editor), { signal });
  document.addEventListener("selectionchange", () => {
    if (!editor.isConnected) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!editor.contains(sel.anchorNode)) return;
    syncNoteToolbar(editor);
  }, { signal });
  const toolbar = host.root.querySelector(".note-editor-toolbar");
  toolbar?.addEventListener(
    "mousedown",
    (ev) => {
      if ((ev.target as HTMLElement | null)?.closest?.("[data-action='note-fmt']")) {
        ev.preventDefault();
      }
    },
    { signal },
  );
  syncNoteToolbar(editor);
}

function selectionRoot(editor: HTMLElement): Node | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const node = sel.anchorNode;
  if (!node || !editor.contains(node)) return null;
  return node;
}

function closestInEditor(editor: HTMLElement, from: Node | null, predicate: (el: HTMLElement) => boolean): HTMLElement | null {
  let n: Node | null = from;
  while (n && n !== editor) {
    if (n instanceof HTMLElement && predicate(n)) return n;
    n = n.parentNode;
  }
  return null;
}

function currentBlockEl(editor: HTMLElement): HTMLElement | null {
  return closestInEditor(editor, selectionRoot(editor), (n) =>
    /^(H1|H2|H3|BLOCKQUOTE|P|DIV)$/.test(n.tagName),
  );
}

function currentBlockTag(editor: HTMLElement): string {
  const el = currentBlockEl(editor);
  const tag = el?.tagName.toLowerCase() ?? "";
  return tag === "div" ? "" : tag;
}

function placeCaretIn(el: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function execFormatBlock(tag: string): boolean {
  for (const name of [tag, `<${tag}>`]) {
    try {
      if (document.execCommand("formatBlock", false, name)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function applyBlockTag(editor: HTMLElement, tag: string): void {
  const block = currentBlockEl(editor);
  if (block) {
    const cur = block.tagName.toLowerCase();
    const next = cur === tag ? "p" : tag;
    const neu = document.createElement(next);
    while (block.firstChild) neu.appendChild(block.firstChild);
    if (!neu.childNodes.length) neu.appendChild(document.createElement("br"));
    block.replaceWith(neu);
    placeCaretIn(neu);
    return;
  }
  if (!execFormatBlock(tag)) {
    document.execCommand("insertHTML", false, `<${tag}><br></${tag}>`);
  }
}

function checkboxList(editor: HTMLElement): HTMLUListElement | HTMLOListElement | null {
  const li = closestInEditor(
    editor,
    selectionRoot(editor),
    (n) => n.tagName === "LI" && !!n.querySelector('input[type="checkbox"]'),
  );
  const list = li?.parentElement;
  if (list instanceof HTMLUListElement || list instanceof HTMLOListElement) return list;
  return null;
}

function unwrapElement(el: HTMLElement): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function unwrapCheckboxList(list: HTMLUListElement | HTMLOListElement): void {
  const parent = list.parentNode;
  if (!parent) return;
  const items = [...list.children].filter((c): c is HTMLLIElement => c instanceof HTMLLIElement);
  for (const li of items) {
    li.querySelectorAll('input[type="checkbox"]').forEach((box) => box.remove());
    const p = document.createElement("p");
    p.innerHTML = li.innerHTML.trim() ? li.innerHTML : "<br>";
    parent.insertBefore(p, list);
  }
  parent.removeChild(list);
}

function syncNoteToolbar(editor: HTMLElement): void {
  const toolbar = editor.parentElement?.querySelector(".note-editor-toolbar");
  if (!toolbar) return;
  const block = currentBlockTag(editor);
  const inCode = !!closestInEditor(editor, selectionRoot(editor), (n) => n.tagName === "CODE");
  const inLink = !!closestInEditor(editor, selectionRoot(editor), (n) => n.tagName === "A");
  const inCheckbox = !!checkboxList(editor);
  toolbar.querySelectorAll<HTMLButtonElement>(".note-fmt-btn").forEach((btn) => {
    const cmd = btn.dataset.cmd || "";
    const value = (btn.dataset.value || "").toLowerCase();
    let on = false;
    if (cmd === "formatBlock" && value) on = block === value;
    else if (cmd === "insertCheckbox") on = inCheckbox;
    else if (cmd === "insertCode") on = inCode;
    else if (cmd === "createLink") on = inLink;
    else if (cmd === "insertHorizontalRule") on = false;
    else {
      try {
        on = document.queryCommandState(cmd);
      } catch {
        on = false;
      }
    }
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

export function applyNoteFormat(cmd: string, value?: string): void {
  const editor = document.querySelector<HTMLElement>("[data-note-editor]");
  if (!editor || editor.getAttribute("contenteditable") !== "true") return;
  editor.focus();
  if (cmd === "createLink") {
    const existing = closestInEditor(editor, selectionRoot(editor), (n) => n.tagName === "A");
    if (existing) {
      document.execCommand("unlink", false);
    } else {
      const href = window.prompt("Link URL", "https://");
      if (!href) return;
      document.execCommand("createLink", false, href);
    }
  } else if (cmd === "formatBlock") {
    applyBlockTag(editor, (value || "h2").toLowerCase());
  } else if (cmd === "insertHorizontalRule") {
    document.execCommand("insertHorizontalRule", false);
  } else if (cmd === "insertCheckbox") {
    const list = checkboxList(editor);
    if (list) unwrapCheckboxList(list);
    else document.execCommand("insertHTML", false, '<ul><li><input type="checkbox"> </li></ul>');
  } else if (cmd === "insertCode") {
    const code = closestInEditor(editor, selectionRoot(editor), (n) => n.tagName === "CODE");
    if (code) unwrapElement(code);
    else {
      const sel = window.getSelection();
      const raw = sel && sel.rangeCount > 0 ? sel.toString() : "";
      const safe = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      document.execCommand("insertHTML", false, `<code>${safe || "\u200b"}</code>`);
    }
  } else {
    document.execCommand(cmd, false, value);
  }
  const hidden = document.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
  if (hidden) hidden.value = sanitizeNoteHtml(editor.innerHTML);
  syncNoteToolbar(editor);
}
