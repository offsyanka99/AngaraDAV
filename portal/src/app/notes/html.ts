/**
 * Note body HTML helpers: sanitize for contenteditable, plain-text fallback.
 */
const ALLOWED = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI",
  "H1", "H2", "H3", "A", "BLOCKQUOTE", "DIV", "SPAN", "HR", "INPUT",
  "DEL", "S", "STRIKE", "CODE",
]);

export function noteLooksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

export function notePlainText(html: string): string {
  return html
    .replace(/<\/(p|div|h1|h2|h3|li|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeNoteHtml(raw: string): string {
  if (!raw) return "";
  if (!noteLooksLikeHtml(raw)) return raw;
  if (typeof DOMParser === "undefined") {
    return raw.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/on\w+\s*=/gi, "");
  }
  const doc = new DOMParser().parseFromString(`<div id="n">${raw}</div>`, "text/html");
  const root = doc.getElementById("n");
  if (!root) return "";
  const walk = (node: Node): void => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === 1) {
        const el = child as HTMLElement;
        const tag = el.tagName;
        if (tag === "INPUT" && el.getAttribute("type")?.toLowerCase() !== "checkbox") {
          el.parentNode?.removeChild(el);
          continue;
        }
        if (!ALLOWED.has(tag)) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
          continue;
        }
        for (const attr of [...el.attributes]) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on") || name === "style") el.removeAttribute(attr.name);
          else if (tag === "A" && name === "href") {
            const href = attr.value.trim();
            if (!/^(https?:|mailto:|#)/i.test(href)) el.removeAttribute("href");
          } else if (tag === "INPUT" && (name === "type" || name === "checked")) {
            continue;
          } else if (!(tag === "A" && (name === "href" || name === "target" || name === "rel"))) {
            el.removeAttribute(attr.name);
          }
        }
        if (tag === "A") {
          el.setAttribute("rel", "noopener noreferrer");
          el.setAttribute("target", "_blank");
        }
        if (tag === "INPUT") {
          el.setAttribute("type", "checkbox");
        }
        walk(el);
      } else if (child.nodeType !== 3) {
        child.parentNode?.removeChild(child);
      }
    }
  };
  walk(root);
  return root.innerHTML;
}
