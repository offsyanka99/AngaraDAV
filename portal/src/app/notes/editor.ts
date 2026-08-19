/**
 * Notes rich-text field (contenteditable + toolbar).
 */
import { esc } from "../../ui";
import { sanitizeNoteHtml } from "./html";
import type { NotesHost } from "./host";

export function renderNoteEditor(html: string, readOnly: boolean): string {
  const safe = sanitizeNoteHtml(html);
  const toolbar = readOnly
    ? ""
    : `<div class="note-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="bold" title="Bold"><strong>B</strong></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="italic" title="Italic"><em>I</em></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="formatBlock" data-value="h2" title="Heading">H</button>
        <button type="button" class="note-fmt-btn" data-action="note-fmt" data-cmd="createLink" title="Link">Link</button>
      </div>`;
  return `<div class="note-editor">
      ${toolbar}
      <div class="note-editor-body" data-note-editor="1" ${readOnly ? "contenteditable=\"false\"" : 'contenteditable="true" role="textbox" aria-label="Note body" aria-multiline="true"'}
        >${safe}</div>
      <textarea name="description" hidden>${esc(html)}</textarea>
    </div>`;
}

export function bindNoteEditor(host: NotesHost): void {
  const editor = host.root.querySelector<HTMLElement>("[data-note-editor]");
  const hidden = host.root.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
  if (!editor || !hidden) return;
  const sync = () => {
    hidden.value = sanitizeNoteHtml(editor.innerHTML);
  };
  editor.addEventListener("input", sync);
  editor.addEventListener("blur", sync);
  const toolbar = host.root.querySelector(".note-editor-toolbar");
  toolbar?.addEventListener("mousedown", (ev) => {
    if ((ev.target as HTMLElement | null)?.closest?.("[data-action='note-fmt']")) {
      ev.preventDefault();
    }
  });
}

export function applyNoteFormat(cmd: string, value?: string): void {
  const editor = document.querySelector<HTMLElement>("[data-note-editor]");
  if (!editor || editor.getAttribute("contenteditable") !== "true") return;
  editor.focus();
  if (cmd === "createLink") {
    const href = window.prompt("Link URL", "https://");
    if (!href) return;
    document.execCommand("createLink", false, href);
  } else if (cmd === "formatBlock") {
    document.execCommand("formatBlock", false, value || "h2");
  } else {
    document.execCommand(cmd, false, value);
  }
  const hidden = document.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
  if (hidden) hidden.value = sanitizeNoteHtml(editor.innerHTML);
}
