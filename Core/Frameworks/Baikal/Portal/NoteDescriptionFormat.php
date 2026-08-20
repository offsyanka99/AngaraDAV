<?php

namespace Baikal\Portal;

/**
 * Note body conversion for CalDAV VJOURNAL interop.
 *
 * RFC 5545 DESCRIPTION is plain text. The portal stores HTML in
 * X-ALT-DESC;FMTTYPE=text/html. jtx Board renders Markdown from DESCRIPTION
 * and ignores X-ALT-DESC — so DESCRIPTION must be Markdown when the portal
 * has HTML, and portal reads must turn jtx Markdown into HTML.
 */
final class NoteDescriptionFormat {
    /** @var list<string> */
    private const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
        'h2', 'h3', 'a', 'blockquote', 'div', 'span',
    ];

    public static function looksLikeHtml(string $s): bool {
        return (bool) preg_match('/<[a-z][\s\S]*>/i', $s);
    }

    /**
     * Conservative: only treat as Markdown when common markers are present.
     * Plain sentences (and values like "2%") stay unchanged.
     */
    public static function looksLikeMarkdown(string $s): bool {
        if ($s === '' || self::looksLikeHtml($s)) {
            return false;
        }
        if (preg_match('/\*\*[^*\n]+\*\*|__[^_\n]+__/', $s) === 1) {
            return true;
        }
        if (preg_match('/^\s{0,3}#{1,3}\s+\S/m', $s) === 1) {
            return true;
        }
        if (preg_match('/^\s{0,3}[-+]\s+\S/m', $s) === 1) {
            return true;
        }
        if (preg_match('/^\s{0,3}\*\s+\S/m', $s) === 1) {
            return true;
        }
        if (preg_match('/^\s{0,3}\d+\.\s+\S/m', $s) === 1) {
            return true;
        }
        if (preg_match('/\[[^\]]+\]\((?:https?:|mailto:)[^)\s]+\)/', $s) === 1) {
            return true;
        }
        if (preg_match('/(?:^|[^\w*])\*(?!\s|\*)([^*]+?)(?<!\s|\*)\*(?:[^\w*]|$)/', $s) === 1) {
            return true;
        }
        if (preg_match('/(?:^|[^\w_])_(?!\s|_)([^_]+?)(?<!\s|_)_(?:[^\w_]|$)/', $s) === 1) {
            return true;
        }

        return false;
    }

    public static function htmlToPlain(string $html): string {
        $withBreaks = preg_replace('#</(p|div|h2|h3|li|blockquote)>#i', "\n", $html) ?? $html;
        $withBreaks = preg_replace('#<br\s*/?>#i', "\n", $withBreaks) ?? $withBreaks;
        $text = html_entity_decode(strip_tags($withBreaks), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace("/[ \t]+/", ' ', $text) ?? $text;
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

        return trim($text);
    }

    public static function sanitize(string $html): string {
        if ($html === '' || !self::looksLikeHtml($html)) {
            return $html;
        }
        $root = self::parseFragment($html);
        if ($root === null) {
            $html = preg_replace('#<script[\s\S]*?</script>#i', '', $html) ?? $html;
            $html = preg_replace('#<style[\s\S]*?</style>#i', '', $html) ?? $html;

            return $html;
        }
        self::sanitizeNode($root);

        return self::innerHtml($root);
    }

    public static function htmlToMarkdown(string $html): string {
        $html = self::sanitize($html);
        if ($html === '') {
            return '';
        }
        if (!self::looksLikeHtml($html)) {
            return trim($html);
        }
        $root = self::parseFragment($html);
        if ($root === null) {
            return self::htmlToPlain($html);
        }
        $md = self::nodeToMarkdown($root);
        $md = preg_replace("/\n{3,}/", "\n\n", $md) ?? $md;

        return trim($md);
    }

    public static function markdownToHtml(string $md): string {
        $md = str_replace(["\r\n", "\r"], "\n", $md);
        $md = trim($md);
        if ($md === '') {
            return '';
        }
        $lines = explode("\n", $md);
        $html = [];
        $para = [];
        $n = count($lines);
        $i = 0;
        $flushPara = static function () use (&$para, &$html): void {
            if ($para === []) {
                return;
            }
            $joined = implode("\n", $para);
            $html[] = '<p>' . self::inlineMarkdown(str_replace("\n", "<br>", $joined)) . '</p>';
            $para = [];
        };
        while ($i < $n) {
            $line = $lines[$i];
            if (trim($line) === '') {
                $flushPara();
                ++$i;
                continue;
            }
            if (preg_match('/^(#{1,3})\s+(.*)$/', $line, $m) === 1) {
                $flushPara();
                $level = strlen($m[1]);
                $tag = $level === 1 || $level === 2 ? 'h2' : 'h3';
                $html[] = '<' . $tag . '>' . self::inlineMarkdown(trim($m[2])) . '</' . $tag . '>';
                ++$i;
                continue;
            }
            if (preg_match('/^>\s?(.*)$/', $line, $m) === 1) {
                $flushPara();
                $buf = [$m[1]];
                ++$i;
                while ($i < $n && preg_match('/^>\s?(.*)$/', $lines[$i], $m2) === 1) {
                    $buf[] = $m2[1];
                    ++$i;
                }
                $html[] = '<blockquote>' . self::inlineMarkdown(implode("\n", $buf)) . '</blockquote>';
                continue;
            }
            if (preg_match('/^\s*[-+]\s+(.*)$/', $line, $m) === 1
                || preg_match('/^\s*\*\s+(.*)$/', $line, $m) === 1) {
                $flushPara();
                $items = [];
                while ($i < $n && (
                    preg_match('/^\s*[-+]\s+(.*)$/', $lines[$i], $m2) === 1
                    || preg_match('/^\s*\*\s+(.*)$/', $lines[$i], $m2) === 1
                )) {
                    $items[] = '<li>' . self::inlineMarkdown($m2[1]) . '</li>';
                    ++$i;
                }
                $html[] = '<ul>' . implode('', $items) . '</ul>';
                continue;
            }
            if (preg_match('/^\s*\d+\.\s+(.*)$/', $line, $m) === 1) {
                $flushPara();
                $items = [];
                while ($i < $n && preg_match('/^\s*\d+\.\s+(.*)$/', $lines[$i], $m2) === 1) {
                    $items[] = '<li>' . self::inlineMarkdown($m2[1]) . '</li>';
                    ++$i;
                }
                $html[] = '<ol>' . implode('', $items) . '</ol>';
                continue;
            }
            $para[] = $line;
            ++$i;
        }
        $flushPara();

        return implode('', $html);
    }

    /**
     * Portal / API body: HTML when possible so the rich editor can render it.
     */
    public static function toPortalHtml(string $htmlFromAltDesc, string $description): string {
        $htmlFromAltDesc = trim($htmlFromAltDesc);
        if ($htmlFromAltDesc !== '') {
            return self::sanitize($htmlFromAltDesc);
        }
        $description = trim($description);
        if ($description === '') {
            return '';
        }
        if (self::looksLikeHtml($description)) {
            return self::sanitize($description);
        }
        if (self::looksLikeMarkdown($description)) {
            return self::markdownToHtml($description);
        }

        return $description;
    }

    private static function parseFragment(string $html): ?\DOMElement {
        $dom = new \DOMDocument();
        $prev = libxml_use_internal_errors(true);
        $ok = $dom->loadHTML(
            '<?xml encoding="UTF-8"><html><body><div id="n">' . $html . '</div></body></html>',
            LIBXML_NOWARNING | LIBXML_NOERROR
        );
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
        if (!$ok) {
            return null;
        }
        $root = $dom->getElementById('n');

        return $root instanceof \DOMElement ? $root : null;
    }

    private static function sanitizeNode(\DOMNode $node): void {
        $children = [];
        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }
        foreach ($children as $child) {
            if ($child instanceof \DOMElement) {
                $tag = strtolower($child->tagName);
                if (!in_array($tag, self::ALLOWED_TAGS, true)) {
                    while ($child->firstChild) {
                        $node->insertBefore($child->firstChild, $child);
                    }
                    $node->removeChild($child);
                    continue;
                }
                self::stripAttributes($child, $tag);
                self::sanitizeNode($child);
            } elseif ($child->nodeType !== XML_TEXT_NODE && $child->nodeType !== XML_CDATA_SECTION_NODE) {
                $node->removeChild($child);
            }
        }
    }

    private static function stripAttributes(\DOMElement $el, string $tag): void {
        $keep = [];
        if ($tag === 'a') {
            $href = trim($el->getAttribute('href'));
            if ($href !== '' && preg_match('/^(https?:|mailto:|#)/i', $href) === 1) {
                $keep['href'] = $href;
            }
        }
        $names = [];
        foreach ($el->attributes ?? [] as $attr) {
            $names[] = $attr->name;
        }
        foreach ($names as $name) {
            $el->removeAttribute($name);
        }
        foreach ($keep as $name => $value) {
            $el->setAttribute($name, $value);
        }
        if ($tag === 'a' && $el->hasAttribute('href')) {
            $el->setAttribute('rel', 'noopener noreferrer');
            $el->setAttribute('target', '_blank');
        }
    }

    private static function innerHtml(\DOMElement $root): string {
        $doc = $root->ownerDocument;
        if ($doc === null) {
            return '';
        }
        $html = '';
        foreach ($root->childNodes as $child) {
            $html .= $doc->saveHTML($child);
        }

        return $html;
    }

    private static function nodeToMarkdown(\DOMNode $node): string {
        if ($node instanceof \DOMText) {
            return self::escapeMarkdown($node->textContent);
        }
        if (!$node instanceof \DOMElement) {
            return '';
        }
        $tag = strtolower($node->tagName);
        if ($tag === 'br') {
            return "\n";
        }
        if ($tag === 'ul' || $tag === 'ol') {
            return "\n\n" . self::listToMarkdown($node, $tag === 'ol') . "\n\n";
        }
        $inner = self::childrenToMarkdown($node);
        $trim = trim($inner);

        return match ($tag) {
            'strong', 'b' => $trim === '' ? '' : '**' . $trim . '**',
            'em', 'i' => $trim === '' ? '' : '*' . $trim . '*',
            'u' => $inner,
            'h2' => "\n\n## " . $trim . "\n\n",
            'h3' => "\n\n### " . $trim . "\n\n",
            'p', 'div' => "\n\n" . $trim . "\n\n",
            'blockquote' => "\n\n" . self::prefixLines($trim, '> ') . "\n\n",
            'a' => self::linkToMarkdown($node, $trim),
            'span', 'li' => $inner,
            default => $inner,
        };
    }

    private static function childrenToMarkdown(\DOMNode $node): string {
        $out = '';
        foreach ($node->childNodes as $child) {
            $out .= self::nodeToMarkdown($child);
        }

        return $out;
    }

    private static function listToMarkdown(\DOMElement $list, bool $ordered): string {
        $lines = [];
        $i = 1;
        foreach ($list->childNodes as $child) {
            if (!$child instanceof \DOMElement || strtolower($child->tagName) !== 'li') {
                continue;
            }
            $text = trim(self::childrenToMarkdown($child));
            $text = preg_replace("/\n+/", "\n  ", $text) ?? $text;
            $lines[] = $ordered ? ($i . '. ' . $text) : ('- ' . $text);
            ++$i;
        }

        return implode("\n", $lines);
    }

    private static function linkToMarkdown(\DOMElement $a, string $text): string {
        $href = trim($a->getAttribute('href'));
        if ($href === '' || $text === '') {
            return $text;
        }
        if (preg_match('/^(https?:|mailto:|#)/i', $href) !== 1) {
            return $text;
        }

        return '[' . $text . '](' . $href . ')';
    }

    private static function prefixLines(string $text, string $prefix): string {
        if ($text === '') {
            return '';
        }
        $lines = preg_split("/\n/", $text) ?: [$text];

        return implode("\n", array_map(static fn (string $line): string => $prefix . $line, $lines));
    }

    private static function escapeMarkdown(string $text): string {
        return str_replace(
            ['\\', '*', '_', '[', ']', '`'],
            ['\\\\', '\\*', '\\_', '\\[', '\\]', '\\`'],
            $text
        );
    }

    private static function inlineMarkdown(string $s): string {
        $s = htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $s = preg_replace_callback(
            '/\[([^\]\n]+)\]\(((?:https?:|mailto:)[^)\s]+)\)/',
            static function (array $m): string {
                $href = htmlspecialchars(html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'), ENT_QUOTES | ENT_HTML5, 'UTF-8');

                return '<a href="' . $href . '" rel="noopener noreferrer" target="_blank">' . $m[1] . '</a>';
            },
            $s
        ) ?? $s;
        $s = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $s) ?? $s;
        $s = preg_replace('/__(.+?)__/s', '<strong>$1</strong>', $s) ?? $s;
        $s = preg_replace('/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/s', '<em>$1</em>', $s) ?? $s;
        $s = preg_replace('/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/s', '<em>$1</em>', $s) ?? $s;

        return $s;
    }
}
