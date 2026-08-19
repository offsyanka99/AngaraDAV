/**
 * Shared portal UI primitives: HTML escaping, flash/system messages, modal shells.
 *
 * Use these helpers so dialogs and banners look and behave the same across
 * user tabs, Administration, and the install wizard.
 *
 * Visual system (styles.css):
 *   - Flash:  .flash .flash-{error|success|info}  (+ optional dismiss)
 *   - Modal:  .cal-modal  (standard dialog shell; name is historical)
 *             .cal-modal-card | .cal-modal-card-sm | .cal-modal-card-wide
 *   - Close:  .modal-close  (alias: .info-modal-close)
 */

export type FlashType = "error" | "success" | "info";

export type ModalSize = "sm" | "md" | "wide";

export type ModalBtnVariant = "primary" | "danger" | "ghost";

/** Escape text for safe insertion into HTML text/attribute context. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type FlashOptions = {
  /** Show × dismiss control (default true when dismissAction is set, else false). */
  dismissible?: boolean;
  /** data-action on the dismiss button (default "flash-close"). */
  dismissAction?: string;
  /** Extra CSS classes on the root .flash element. */
  className?: string;
  /** ARIA role (default "status"). */
  role?: string;
  /** Inline style attribute value (rare; prefer classes). */
  style?: string;
};

/**
 * System message banner (error / success / info).
 * Used on the main page, inside modals, and on the install wizard.
 */
export function renderFlash(
  type: FlashType,
  message: string,
  opts: FlashOptions = {},
): string {
  if (!message) return "";
  const dismissible =
    opts.dismissible !== undefined
      ? opts.dismissible
      : opts.dismissAction !== undefined;
  const dismissAction = opts.dismissAction ?? "flash-close";
  const role = opts.role ?? "status";
  const extra = opts.className ? ` ${opts.className}` : "";
  const style = opts.style ? ` style="${esc(opts.style)}"` : "";
  const close = dismissible
    ? `<button type="button" class="flash-close" data-action="${esc(dismissAction)}" aria-label="Dismiss message" title="Dismiss">×</button>`
    : "";
  return `<div class="flash flash-${esc(type)}${extra}" role="${esc(role)}"${style}>
      <span class="flash-text">${esc(message)}</span>
      ${close}
    </div>`;
}

export type ModalButton = {
  label: string;
  /** data-action value; omit for type=submit buttons. */
  action?: string;
  variant?: ModalBtnVariant;
  disabled?: boolean;
  type?: "button" | "submit";
  id?: string;
  /** Extra HTML attributes already escaped (e.g. data-username="…"). */
  attrs?: string;
};

export type ModalOptions = {
  /** Optional element id. */
  id?: string;
  title: string;
  /** id for the title element (for aria-labelledby). Auto-generated from id when omitted. */
  titleId?: string;
  /** data-action for backdrop + header × + default Cancel when footerActions used. */
  closeAction: string;
  /** Inner HTML of .cal-modal-body (not escaped). */
  body: string;
  /**
   * Footer: either raw HTML, or a list of standard buttons.
   * When omitted and form is false, no footer is rendered.
   */
  footer?: string | ModalButton[];
  size?: ModalSize;
  /**
   * When true, body + footer are wrapped in <form class="stack" …>.
   * Pass formAttrs for data-form / id / etc. (raw attribute string).
   */
  form?: boolean;
  formAttrs?: string;
  /** Extra classes on the root .cal-modal element. */
  className?: string;
  /** Extra classes on the card (beyond size). */
  cardClassName?: string;
  /** Extra raw attributes on the root element (already escaped as needed). */
  rootAttrs?: string;
  /** Disable header close button. */
  hideClose?: boolean;
  /** When true, backdrop has no close action (e.g. progress while running). */
  lockBackdrop?: boolean;
};

function cardSizeClass(size: ModalSize | undefined): string {
  if (size === "sm") return " cal-modal-card-sm";
  if (size === "wide") return " cal-modal-card-wide";
  return "";
}

function btnClass(variant: ModalBtnVariant | undefined): string {
  if (variant === "danger") return "btn btn-danger";
  if (variant === "ghost") return "btn btn-ghost";
  return "btn btn-primary";
}

/** Render a standard modal footer from button descriptors. */
export function renderModalFooter(buttons: ModalButton[]): string {
  const parts = buttons.map((b) => {
    const type = b.type ?? "button";
    const cls = btnClass(b.variant);
    const dis = b.disabled ? " disabled" : "";
    const id = b.id ? ` id="${esc(b.id)}"` : "";
    const action = b.action ? ` data-action="${esc(b.action)}"` : "";
    const attrs = b.attrs ? ` ${b.attrs}` : "";
    return `<button type="${type}" class="${cls}"${action}${id}${attrs}${dis}>${esc(b.label)}</button>`;
  });
  return parts.join("\n");
}

/**
 * Standard dialog shell used across Calendars, Contacts, Files, Admin, etc.
 * Structure: backdrop + card (header / body / footer).
 */
export function renderModal(opts: ModalOptions): string {
  const titleId =
    opts.titleId ||
    (opts.id ? `${opts.id}-title` : `modal-title-${Math.random().toString(36).slice(2, 9)}`);
  const rootId = opts.id ? ` id="${esc(opts.id)}"` : "";
  const rootExtra = opts.className ? ` ${opts.className}` : "";
  const rootAttrs = opts.rootAttrs ? ` ${opts.rootAttrs}` : "";
  const cardExtra = `${cardSizeClass(opts.size)}${opts.cardClassName ? ` ${opts.cardClassName}` : ""}`;
  const closeAction = opts.closeAction;
  const backdropAction = opts.lockBackdrop ? "" : ` data-action="${esc(closeAction)}"`;
  const closeBtn = opts.hideClose
    ? ""
    : `<button type="button" class="modal-close info-modal-close" data-action="${esc(closeAction)}" aria-label="Close">×</button>`;

  let footerHtml = "";
  if (opts.footer !== undefined) {
    footerHtml =
      typeof opts.footer === "string" ? opts.footer : renderModalFooter(opts.footer);
  }

  const footerBlock = footerHtml
    ? `<footer class="cal-modal-footer">${footerHtml}</footer>`
    : "";
  const bodyBlock = `<div class="cal-modal-body">${opts.body}</div>`;

  let inner: string;
  if (opts.form) {
    const fa = opts.formAttrs ? ` ${opts.formAttrs}` : "";
    inner = `<form class="stack"${fa}>
        ${bodyBlock}
        ${footerBlock}
      </form>`;
  } else {
    inner = `${bodyBlock}
      ${footerBlock}`;
  }

  return `<div class="cal-modal${rootExtra}"${rootId}${rootAttrs} role="dialog" aria-modal="true" aria-labelledby="${esc(titleId)}" data-focus-trap="1">
      <div class="cal-modal-backdrop"${backdropAction}></div>
      <div class="cal-modal-card${cardExtra}">
        <header class="cal-modal-header">
          <h3 id="${esc(titleId)}">${esc(opts.title)}</h3>
          ${closeBtn}
        </header>
        ${inner}
      </div>
    </div>`;
}

export type ConfirmCheckboxOptions = {
  /** data-action on the input. */
  action: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  /**
   * "admin" → .admin-delete-confirm (Admin danger confirms)
   * "checkbox" → .checkbox (Calendars / Contacts)
   */
  style?: "admin" | "checkbox";
};

/** Standard “I understand…” confirm checkbox used before destructive actions. */
export function renderConfirmCheckbox(opts: ConfirmCheckboxOptions): string {
  const cls = opts.style === "checkbox" ? "checkbox" : "admin-delete-confirm";
  const style = opts.style === "checkbox" ? ' style="margin-top:1rem"' : "";
  const id = opts.id ? ` id="${esc(opts.id)}"` : "";
  const checked = opts.checked ? " checked" : "";
  const disabled = opts.disabled ? " disabled" : "";
  return `<label class="${cls}"${style}>
            <input type="checkbox"${id} data-action="${esc(opts.action)}"${checked}${disabled} />
            ${esc(opts.label)}
          </label>`;
}
