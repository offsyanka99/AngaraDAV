/**
 * Convert Office Open XML / ODF XML parts to simple HTML (text is escaped).
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function allMatches(xml: string, re: RegExp): string[] {
  const out: string[] = [];
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(xml))) out.push(m[1] ?? m[0]);
  return out;
}

function inner(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:[\\w.-]+:)?${tag}\\b[^>]*>[\\s\\S]*?</(?:[\\w.-]+:)?${tag}>`, "gi");
  return xml.match(re) ?? [];
}

function textsIn(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:[\\w.-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${tag}>`, "gi");
  return allMatches(xml, re).map((t) => decodeXmlEntities(t.replace(/<[^>]+>/g, "")));
}

export function docxToHtml(documentXml: string): string {
  const paras = inner(documentXml, "p");
  if (paras.length === 0) {
    const t = textsIn(documentXml, "t").join(" ").trim();
    return t ? `<p>${esc(t)}</p>` : "";
  }
  const parts: string[] = [];
  for (const p of paras) {
    const runs = inner(p, "r");
    const chunks: string[] = [];
    const source = runs.length ? runs : [p];
    for (const r of source) {
      const t = textsIn(r, "t").join("");
      if (!t) continue;
      let html = esc(t);
      if (/<(?:[\w.-]+:)?b\b/i.test(r) || /w:val="true"[^>]*w:b|w:b\s*\/>/i.test(r)) html = `<strong>${html}</strong>`;
      if (/<(?:[\w.-]+:)?i\b/i.test(r)) html = `<em>${html}</em>`;
      chunks.push(html);
    }
    parts.push(`<p>${chunks.join("") || "&nbsp;"}</p>`);
  }
  const tables = inner(documentXml, "tbl");
  for (const tbl of tables) {
    const rows = inner(tbl, "tr")
      .map((tr) => {
        const cells = inner(tr, "tc")
          .map((tc) => `<td>${esc(textsIn(tc, "t").join(" "))}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    if (rows) parts.push(`<table class="files-preview-sheet">${rows}</table>`);
  }
  return parts.join("");
}

export function xlsxToHtml(sharedStringsXml: string | null, sheetXml: string): string {
  const strings = sharedStringsXml ? textsIn(sharedStringsXml, "t") : [];
  const rows = inner(sheetXml, "row");
  if (rows.length === 0) return "";
  const body = rows
    .map((row) => {
      const cells = inner(row, "c").map((c) => {
        const isShared = /\bt="s"/.test(c);
        const v = (textsIn(c, "v")[0] ?? textsIn(c, "t")[0] ?? "").trim();
        let text = v;
        if (isShared) {
          const idx = Number(v);
          text = Number.isFinite(idx) && strings[idx] !== undefined ? strings[idx] : v;
        }
        return `<td>${esc(text)}</td>`;
      });
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");
  return `<table class="files-preview-sheet">${body}</table>`;
}

export function pptxToHtml(slideXmls: string[]): string {
  return slideXmls
    .map((xml, i) => {
      const lines = textsIn(xml, "t").map((t) => t.trim()).filter(Boolean);
      const body = lines.map((t) => `<p>${esc(t)}</p>`).join("") || "<p class=\"muted\">(empty slide)</p>";
      return `<section class="files-preview-slide"><h3>Slide ${i + 1}</h3>${body}</section>`;
    })
    .join("");
}

export function odtToHtml(contentXml: string): string {
  const paras = inner(contentXml, "p");
  if (paras.length === 0) return textsIn(contentXml, "p").map((t) => `<p>${esc(t)}</p>`).join("");
  return paras
    .map((p) => `<p>${esc(decodeXmlEntities(p.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()) || "&nbsp;"}</p>`)
    .join("");
}
