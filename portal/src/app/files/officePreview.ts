/**
 * Build an HTML preview from an Office / OpenDocument blob.
 */
import { extensionOf } from "./previewKind";
import { docxToHtml, odtToHtml, pptxToHtml, xlsxToHtml } from "./officeXml";
import { unzipEntries, zipText } from "./zip";

const MAX_OFFICE_BYTES = 20 * 1024 * 1024;

export async function officeBlobToHtml(name: string, blob: Blob): Promise<string> {
  const ext = extensionOf(name);
  if (ext === "doc" || ext === "xls" || ext === "ppt") {
    throw new Error("Older binary Office files (.doc / .xls / .ppt) cannot be previewed. Download to open them.");
  }
  if (blob.size > MAX_OFFICE_BYTES) {
    throw new Error("This document is too large to preview. Download it instead.");
  }
  const files = await unzipEntries(await blob.arrayBuffer());
  if (ext === "docx") {
    const xml = zipText(files, "word/document.xml");
    if (!xml) throw new Error("This Word file has no document.xml");
    const html = docxToHtml(xml);
    if (!html) throw new Error("No readable text in this Word file");
    return html;
  }
  if (ext === "xlsx") {
    const sheetPath = [...files.keys()]
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    const sheetXml = sheetPath ? zipText(files, sheetPath) : null;
    if (!sheetXml) throw new Error("This spreadsheet has no worksheet");
    const html = xlsxToHtml(zipText(files, "xl/sharedStrings.xml"), sheetXml);
    if (!html) throw new Error("No readable cells in this spreadsheet");
    return html;
  }
  if (ext === "pptx") {
    const slides = [...files.keys()]
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((k) => zipText(files, k))
      .filter((x): x is string => !!x);
    if (slides.length === 0) throw new Error("This presentation has no slides");
    return pptxToHtml(slides);
  }
  if (ext === "odt" || ext === "ods" || ext === "odp") {
    const xml = zipText(files, "content.xml");
    if (!xml) throw new Error("This OpenDocument file has no content.xml");
    const html = odtToHtml(xml);
    if (!html) throw new Error("No readable text in this document");
    return html;
  }
  throw new Error("This Office file type cannot be previewed");
}
