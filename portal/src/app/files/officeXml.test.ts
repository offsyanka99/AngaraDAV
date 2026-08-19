import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { docxToHtml, pptxToHtml, xlsxToHtml } from "./officeXml.ts";

describe("officeXml", () => {
  it("converts Word paragraphs and bold runs", () => {
    const xml = `<w:document><w:body>
      <w:p><w:r><w:t>Hello</w:t></w:r></w:p>
      <w:p><w:r><w:b/><w:t>Bold</w:t></w:r></w:p>
    </w:body></w:document>`;
    const html = docxToHtml(xml);
    assert.match(html, /Hello/);
    assert.match(html, /<strong>Bold<\/strong>/);
  });

  it("converts spreadsheet shared strings", () => {
    const sst = `<sst><si><t>Name</t></si><si><t>Ada</t></si></sst>`;
    const sheet = `<worksheet><sheetData>
      <row><c t="s"><v>0</v></c><c t="s"><v>1</v></c></row>
      <row><c><v>42</v></c></row>
    </sheetData></worksheet>`;
    const html = xlsxToHtml(sst, sheet);
    assert.match(html, /Name/);
    assert.match(html, /Ada/);
    assert.match(html, />42</);
  });

  it("renders PowerPoint slides", () => {
    const html = pptxToHtml([`<p:sld><a:t>Intro</a:t><a:t>Agenda</a:t></p:sld>`]);
    assert.match(html, /Slide 1/);
    assert.match(html, /Intro/);
    assert.match(html, /Agenda/);
  });
});
