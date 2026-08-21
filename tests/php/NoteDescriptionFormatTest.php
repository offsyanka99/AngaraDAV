<?php

/**
 * HTML ↔ Markdown for VJOURNAL DESCRIPTION / X-ALT-DESC (jtx Board interop).
 *
 * Run: php tests/php/NoteDescriptionFormatTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\NoteDescriptionFormat;

$failures = 0;
function assert_true(bool $cond, string $msg): void {
    global $failures;
    if ($cond) {
        echo "OK  $msg\n";

        return;
    }
    echo "FAIL $msg\n";
    ++$failures;
}

assert_true(!NoteDescriptionFormat::looksLikeMarkdown('Discussed roadmap'), 'plain sentence is not markdown');
assert_true(!NoteDescriptionFormat::looksLikeMarkdown('2%'), 'percent is not markdown');
assert_true(NoteDescriptionFormat::looksLikeMarkdown('Hello **team**'), 'bold is markdown');
assert_true(NoteDescriptionFormat::looksLikeMarkdown('*italic word*'), 'italic is markdown');
assert_true(NoteDescriptionFormat::looksLikeMarkdown("- milk\n- bread"), 'list is markdown');
assert_true(NoteDescriptionFormat::looksLikeHtml('<p>Hi</p>'), 'html detect');

$md = NoteDescriptionFormat::htmlToMarkdown('<p>Hello <strong>team</strong></p><script>alert(1)</script>');
assert_true(str_contains($md, '**team**'), 'html to markdown bold');
assert_true(!str_contains($md, 'script'), 'html to markdown drops script');
assert_true(!str_contains($md, '<strong>'), 'html to markdown has no tags');

$html = NoteDescriptionFormat::markdownToHtml('Hello **team** and *more*');
assert_true(str_contains($html, '<strong>team</strong>'), 'markdown to html bold');
assert_true(str_contains($html, '<em>more</em>'), 'markdown to html italic');

$listHtml = NoteDescriptionFormat::markdownToHtml("- milk\n- bread");
assert_true(str_contains($listHtml, '<ul>'), 'markdown list ul');
assert_true(str_contains($listHtml, '<li>milk</li>'), 'markdown list item');

$linkMd = NoteDescriptionFormat::htmlToMarkdown('<p>See <a href="https://example.com">site</a></p>');
assert_true(str_contains($linkMd, '[site](https://example.com)'), 'html link to markdown');

$fromJtx = NoteDescriptionFormat::toPortalHtml('', 'Hello **team**');
assert_true(str_contains($fromJtx, '<strong>team</strong>'), 'jtx markdown becomes portal html');

$fromAlt = NoteDescriptionFormat::toPortalHtml('<p>Hello <strong>team</strong></p>', 'Hello team');
assert_true(str_contains($fromAlt, '<strong>team</strong>'), 'X-ALT-DESC wins over plain DESCRIPTION');

$plain = NoteDescriptionFormat::toPortalHtml('', 'Discussed roadmap');
assert_true($plain === 'Discussed roadmap', 'plain description unchanged');

$h2 = NoteDescriptionFormat::htmlToMarkdown('<h2>Agenda</h2><p>Talk</p>');
assert_true(str_contains($h2, '## Agenda'), 'h2 to markdown heading');

$h3md = NoteDescriptionFormat::htmlToMarkdown('<h3>Detail</h3>');
assert_true(str_contains($h3md, '### Detail'), 'h3 to markdown heading');
$h3html = NoteDescriptionFormat::markdownToHtml('### Detail');
assert_true(str_contains($h3html, '<h3>Detail</h3>'), 'markdown ### to h3');

$qmd = NoteDescriptionFormat::htmlToMarkdown('<blockquote>Quoted</blockquote>');
assert_true(str_contains($qmd, '> Quoted'), 'blockquote to markdown');
$qhtml = NoteDescriptionFormat::markdownToHtml("> Quoted");
assert_true(str_contains($qhtml, '<blockquote>'), 'markdown quote to blockquote');
assert_true(NoteDescriptionFormat::looksLikeMarkdown("> Quoted line"), 'blockquote is markdown');

$hrmd = NoteDescriptionFormat::htmlToMarkdown('<p>A</p><hr><p>B</p>');
assert_true(str_contains($hrmd, '---'), 'hr to markdown thematic break');
$hrhtml = NoteDescriptionFormat::markdownToHtml("A\n\n---\n\nB");
assert_true(str_contains($hrhtml, '<hr>'), 'markdown --- to hr');
assert_true(NoteDescriptionFormat::looksLikeMarkdown("---"), 'hr is markdown');

$taskMd = NoteDescriptionFormat::markdownToHtml("- [ ] milk\n- [x] bread");
assert_true(str_contains($taskMd, 'type="checkbox"'), 'task list becomes checkboxes');
assert_true(substr_count($taskMd, 'checked') === 1, 'checked task keeps checked');
$taskBack = NoteDescriptionFormat::htmlToMarkdown($taskMd);
assert_true(str_contains($taskBack, '- [ ] milk'), 'checkbox back to unchecked markdown');
assert_true(str_contains($taskBack, '- [x] bread'), 'checkbox back to checked markdown');
assert_true(NoteDescriptionFormat::looksLikeMarkdown('- [ ] buy milk'), 'task list is markdown');

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}
echo "\nAll NoteDescriptionFormat tests passed.\n";
exit(0);
