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

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}
echo "\nAll NoteDescriptionFormat tests passed.\n";
exit(0);
