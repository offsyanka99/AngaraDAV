<?php

namespace Baikal\Portal;

use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Component\VCard;
use Sabre\VObject\Reader;

/**
 * vCard parse/build/photo mapping used by portal contacts (and unit tests).
 */
class VCardMapper {
    private const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
    private const PHOTO_MAX_EDGE = 256;
    private const MAX_NOTE_LEN = 4000;
    private const MAX_NAME_LEN = 200;
    private const MAX_URL_LEN = 500;
    private const MAX_CUSTOM_LABEL_LEN = 64;
    private const MAX_CUSTOM_VALUE_LEN = 2000;
    /** Portal custom fields (Unicode labels) — not limited to ASCII X-FOO names */
    private const CUSTOM_PROP = 'X-BAIKAL-CUSTOM';

    /**
     * Strip invalid UTF-8 so json_encode never fails for one bad contact.
     */
    private function utf8(string $s): string {
        if ($s === '') {
            return '';
        }
        if (mb_check_encoding($s, 'UTF-8')) {
            // Also strip other C0 controls except tab/newline
            return preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', '', $s) ?? $s;
        }
        $clean = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
        if (!is_string($clean) || $clean === '') {
            $clean = mb_convert_encoding($s, 'UTF-8', 'ISO-8859-1');
        }
        if (!is_string($clean)) {
            return '';
        }

        return preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', '', $clean) ?? $clean;
    }

    /**
     * Parse vCard string into form-oriented fields (public for unit tests).
     *
     * @return array<string, mixed>
     */
    public function parseVCard(string $carddata): array {
        $empty = [
            'firstname'         => '',
            'lastname'          => '',
            'fullname'          => '',
            'org'               => '',
            'title'             => '',
            'emails'            => [],
            'phones'            => [],
            'address'           => [
                'street'  => '',
                'city'    => '',
                'region'  => '',
                'postal'  => '',
                'country' => '',
            ],
            'url'               => '',
            'note'              => '',
            'birthday'          => null,
            'specialDate'       => null,
            'specialDateLabel'  => '',
            'custom'            => [],
            'hasPhoto'          => false,
            'photoBinary'       => null,
        ];

        if (trim($carddata) === '') {
            return $empty;
        }

        try {
            $vcard = Reader::read($carddata, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            return $empty;
        }
        if (!$vcard instanceof VCard) {
            return $empty;
        }

        $data = $empty;

        if (isset($vcard->N)) {
            $parts = $vcard->N->getParts();
            $data['lastname'] = $this->utf8((string) ($parts[0] ?? ''));
            $data['firstname'] = $this->utf8((string) ($parts[1] ?? ''));
        }
        if (isset($vcard->FN)) {
            $data['fullname'] = $this->utf8((string) $vcard->FN);
        }
        if (isset($vcard->ORG)) {
            $orgParts = $vcard->ORG->getParts();
            $data['org'] = $this->utf8((string) ($orgParts[0] ?? $vcard->ORG));
        }
        if (isset($vcard->TITLE)) {
            $data['title'] = $this->utf8((string) $vcard->TITLE);
        }
        if (isset($vcard->NOTE)) {
            $data['note'] = $this->utf8((string) $vcard->NOTE);
        }
        if (isset($vcard->URL)) {
            $data['url'] = $this->utf8((string) $vcard->URL);
        }
        $data['birthday'] = $this->parseVCardDateProp($vcard, 'BDAY');
        $special = $this->parseVCardDateProp($vcard, 'ANNIVERSARY');
        if ($special === null) {
            $special = $this->parseVCardDateProp($vcard, 'X-SPECIAL-DATE');
        }
        if ($special === null) {
            $special = $this->parseVCardDateProp($vcard, 'X-ABDATE');
        }
        $data['specialDate'] = $special;
        $specialLabel = '';
        foreach (['X-SPECIAL-LABEL', 'X-SPECIAL-DATE-LABEL', 'X-ABLABEL'] as $labProp) {
            if (isset($vcard->{$labProp})) {
                $specialLabel = $this->utf8(trim((string) $vcard->{$labProp}));
                if ($specialLabel !== '') {
                    break;
                }
            }
        }
        $data['specialDateLabel'] = $specialLabel;

        $emails = [];
        if (isset($vcard->EMAIL)) {
            foreach ($vcard->EMAIL as $email) {
                $val = $this->utf8(trim((string) $email));
                // Drop emails that still look binary-corrupted
                if ($val !== '' && filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    $emails[] = $val;
                } elseif ($val !== '' && preg_match('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/u', $val)) {
                    $emails[] = $val;
                }
            }
        }
        $data['emails'] = array_values(array_unique($emails));

        $phones = [];
        if (isset($vcard->TEL)) {
            foreach ($vcard->TEL as $tel) {
                $val = $this->utf8(trim((string) $tel));
                if ($val === '') {
                    continue;
                }
                $type = 'other';
                if (isset($tel['TYPE'])) {
                    $t = strtoupper((string) $tel['TYPE']);
                    if (str_contains($t, 'CELL') || str_contains($t, 'MOBILE')) {
                        $type = 'cell';
                    } elseif (str_contains($t, 'WORK')) {
                        $type = 'work';
                    } elseif (str_contains($t, 'HOME')) {
                        $type = 'home';
                    }
                }
                $phones[] = ['type' => $type, 'value' => $val];
            }
        }
        $data['phones'] = $phones;

        if (isset($vcard->ADR)) {
            $adr = $vcard->ADR;
            $parts = $adr->getParts();
            // ADR: PO Box; Extended; Street; City; Region; Postal; Country
            $data['address'] = [
                'street'  => $this->utf8((string) ($parts[2] ?? '')),
                'city'    => $this->utf8((string) ($parts[3] ?? '')),
                'region'  => $this->utf8((string) ($parts[4] ?? '')),
                'postal'  => $this->utf8((string) ($parts[5] ?? '')),
                'country' => $this->utf8((string) ($parts[6] ?? '')),
            ];
        }

        if (isset($vcard->PHOTO)) {
            $binary = $this->extractPhotoBinary($vcard);
            // Only treat as a real photo if we can recognize image magic (avoids 404 avatar spam)
            if (is_string($binary) && $binary !== '' && $this->looksLikeImage($binary)) {
                $data['hasPhoto'] = true;
                $data['photoBinary'] = $binary;
            }
        }

        // Custom / extension properties (vCard X-*)
        $custom = [];
        foreach ($vcard->children() as $child) {
            if (!$child instanceof \Sabre\VObject\Property) {
                continue;
            }
            $propName = strtoupper((string) $child->name);
            // Grouped props may look like ITEM1.X-ABLABEL
            $baseName = $propName;
            if (str_contains($propName, '.')) {
                $baseName = substr($propName, (int) strrpos($propName, '.') + 1);
            }
            if (!str_starts_with($baseName, 'X-')) {
                continue;
            }
            $val = $child->getValue();
            if (!is_string($val) && !is_numeric($val)) {
                // Skip binary / structured blobs that are not plain text
                continue;
            }
            $val = trim((string) $val);
            if ($val === '') {
                continue;
            }
            // Skip huge binary-like payloads mistakenly stored as X-*
            if (strlen($val) > 8000) {
                continue;
            }
            if (preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', $val)) {
                // Allow only if it is our JSON custom field (no C0 controls expected)
                continue;
            }

            // Portal format: X-BAIKAL-CUSTOM value is JSON {"l":"label","v":"value"} (UTF-8 OK)
            if ($baseName === self::CUSTOM_PROP) {
                $decoded = json_decode($val, true);
                if (is_array($decoded) && (isset($decoded['l']) || isset($decoded['v']))) {
                    $label = $this->utf8(trim((string) ($decoded['l'] ?? 'Custom')));
                    $value = $this->utf8(trim((string) ($decoded['v'] ?? '')));
                    if ($label === '' && $value === '') {
                        continue;
                    }
                    $custom[] = [
                        'name'  => self::CUSTOM_PROP,
                        'label' => $label !== '' ? $label : 'Custom',
                        'value' => $value,
                    ];
                    continue;
                }
            }

            $custom[] = [
                'name'  => $baseName,
                'label' => $this->customLabelFromPropName($baseName),
                'value' => $this->utf8($val),
            ];
        }
        $data['custom'] = $custom;

        $vcard->destroy();

        return $data;
    }

    /**
     * Build a vCard string from form fields (new card; used by tests).
     *
     * @param array<string, mixed> $fields
     */
    public function buildVCardFromFields(array $fields, ?string $uid = null): string {
        $normalized = $this->normalizeFormFields($fields, true);
        $vcard = new VCard([
            'VERSION' => '3.0',
            'UID'     => $uid ?? UUIDUtil::getUUID(),
        ]);
        $this->applyFormFieldsToVCard($vcard, $normalized, true);
        $this->applyPhotoFromFields($vcard, $fields, true);
        $out = $vcard->serialize();
        $vcard->destroy();

        return $out;
    }

    /**
     * Resize/encode an uploaded photo (public for tests).
     *
     * @return string JPEG binary
     */
    public function processPhotoInput(string $input, bool $isBase64 = true): string {
        if ($isBase64) {
            $input = trim($input);
            if (str_starts_with($input, 'data:')) {
                $comma = strpos($input, ',');
                if ($comma === false) {
                    throw new ApiException('Invalid photo data URI', 400);
                }
                $input = substr($input, $comma + 1);
            }
            $binary = base64_decode($input, true);
            if ($binary === false || $binary === '') {
                throw new ApiException('Invalid photo base64 data', 400);
            }
        } else {
            $binary = $input;
        }

        if (strlen($binary) > self::MAX_PHOTO_BYTES) {
            throw new ApiException('Photo is too large (max 2 MB)', 400);
        }

        $hasGd = function_exists('imagecreatefromstring') && function_exists('imagejpeg');
        if (!$hasGd) {
            // CLI/php-S often lacks php-gd. JPEG can still be stored as vCard PHOTO.
            if (strncmp($binary, "\xFF\xD8", 2) === 0) {
                return $binary;
            }
            throw new ApiException('Photo processing requires PHP GD (PNG/WebP/GIF). Install php-gd (Ubuntu: sudo apt install php-gd) and restart PHP, or upload a JPEG.', 501);
        }

        $src = @imagecreatefromstring($binary);
        if ($src === false) {
            throw new ApiException('Photo is not a supported image format', 400);
        }

        $width = imagesx($src);
        $height = imagesy($src);
        if ($width < 1 || $height < 1) {
            // GdImage is freed by GC (imagedestroy() deprecated in PHP 8.5)
            throw new ApiException('Invalid photo dimensions', 400);
        }

        $max = self::PHOTO_MAX_EDGE;
        if ($width > $max || $height > $max) {
            $ratio = min($max / $width, $max / $height);
            $newW = max(1, (int) round($width * $ratio));
            $newH = max(1, (int) round($height * $ratio));
            $dst = imagecreatetruecolor($newW, $newH);
            if ($dst === false) {
                throw new ApiException('Failed to resize photo', 500);
            }
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $width, $height);
            $src = $dst;
        }

        ob_start();
        imagejpeg($src, null, 85);
        $jpeg = ob_get_clean();
        if ($jpeg === false || $jpeg === '') {
            throw new ApiException('Failed to encode photo as JPEG', 500);
        }

        return $jpeg;
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function normalizeFormFields(array $fields, bool $requireName): array {
        $firstname = mb_substr(trim((string) ($fields['firstname'] ?? '')), 0, self::MAX_NAME_LEN);
        $lastname = mb_substr(trim((string) ($fields['lastname'] ?? '')), 0, self::MAX_NAME_LEN);
        $fullname = mb_substr(trim((string) ($fields['fullname'] ?? '')), 0, self::MAX_NAME_LEN);
        if ($fullname === '') {
            $fullname = trim($firstname . ' ' . $lastname);
        }
        if ($requireName && $fullname === '' && $firstname === '' && $lastname === '') {
            throw new ApiException('Name is required (fullname or first/last name)', 400);
        }

        $emails = [];
        if (isset($fields['emails']) && is_array($fields['emails'])) {
            foreach ($fields['emails'] as $e) {
                $e = trim((string) $e);
                if ($e !== '') {
                    $emails[] = $e;
                }
            }
        } elseif (isset($fields['email'])) {
            // Backward-compatible single email
            $e = trim((string) $fields['email']);
            if ($e !== '') {
                $emails[] = $e;
            }
        }
        $emails = array_values(array_unique($emails));
        if (count($emails) > 10) {
            throw new ApiException('Too many email addresses (max 10)', 400);
        }

        $phones = [];
        if (isset($fields['phones']) && is_array($fields['phones'])) {
            foreach ($fields['phones'] as $p) {
                if (!is_array($p)) {
                    $val = trim((string) $p);
                    if ($val !== '') {
                        $phones[] = ['type' => 'other', 'value' => $val];
                    }
                    continue;
                }
                $val = trim((string) ($p['value'] ?? ''));
                if ($val === '') {
                    continue;
                }
                $type = strtolower((string) ($p['type'] ?? 'other'));
                if (!in_array($type, ['cell', 'work', 'home', 'other'], true)) {
                    $type = 'other';
                }
                $phones[] = ['type' => $type, 'value' => $val];
            }
        } else {
            // Legacy single phones
            foreach (['tel_cell' => 'cell', 'tel_work' => 'work', 'tel_home' => 'home'] as $key => $type) {
                if (!empty($fields[$key])) {
                    $phones[] = ['type' => $type, 'value' => trim((string) $fields[$key])];
                }
            }
        }
        if (count($phones) > 10) {
            throw new ApiException('Too many phone numbers (max 10)', 400);
        }

        $address = [
            'street'  => '',
            'city'    => '',
            'region'  => '',
            'postal'  => '',
            'country' => '',
        ];
        if (isset($fields['address']) && is_array($fields['address'])) {
            foreach (array_keys($address) as $k) {
                if (isset($fields['address'][$k])) {
                    $address[$k] = trim((string) $fields['address'][$k]);
                }
            }
        } elseif (isset($fields['address']) && is_string($fields['address'])) {
            $address['street'] = trim($fields['address']);
        }

        $custom = [];
        if (isset($fields['custom']) && is_array($fields['custom'])) {
            foreach ($fields['custom'] as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $label = $this->utf8(trim((string) ($row['label'] ?? $row['name'] ?? '')));
                $value = $this->utf8(trim((string) ($row['value'] ?? '')));
                if ($label === '' && $value === '') {
                    continue;
                }
                if ($label === '') {
                    throw new ApiException('Custom field label is required when a value is set', 400);
                }
                if (mb_strlen($label) > self::MAX_CUSTOM_LABEL_LEN) {
                    throw new ApiException('Custom field label is too long (max ' . self::MAX_CUSTOM_LABEL_LEN . ' characters)', 400);
                }
                if ($value === '') {
                    // Empty value = omit (clear) this field
                    continue;
                }
                if (mb_strlen($value) > self::MAX_CUSTOM_VALUE_LEN) {
                    throw new ApiException('Custom field value is too long (max ' . self::MAX_CUSTOM_VALUE_LEN . ' characters)', 400);
                }
                // Always use X-BAIKAL-CUSTOM + JSON so labels can be any Unicode (Cyrillic, etc.)
                // Classic vCard property names are ASCII-only (X-SPOUSE), which breaks non-Latin labels.
                $custom[] = [
                    'name'  => self::CUSTOM_PROP,
                    'label' => $label,
                    'value' => $value,
                ];
            }
        }
        if (count($custom) > 30) {
            throw new ApiException('Too many custom fields (max 30)', 400);
        }

        return [
            'firstname' => $firstname,
            'lastname'  => $lastname,
            'fullname'  => $fullname,
            'org'       => mb_substr(trim((string) ($fields['org'] ?? '')), 0, self::MAX_NAME_LEN),
            'title'     => mb_substr(trim((string) ($fields['title'] ?? '')), 0, self::MAX_NAME_LEN),
            'emails'    => $emails,
            'phones'    => $phones,
            'address'   => $address,
            'url'              => mb_substr(trim((string) ($fields['url'] ?? '')), 0, self::MAX_URL_LEN),
            'note'             => mb_substr(trim((string) ($fields['note'] ?? '')), 0, self::MAX_NOTE_LEN),
            'birthday'         => $this->normalizeDateField($fields['birthday'] ?? null),
            'specialDate'      => $this->normalizeDateField($fields['specialDate'] ?? null),
            'specialDateLabel' => mb_substr(trim((string) ($fields['specialDateLabel'] ?? '')), 0, 64),
            'custom'           => $custom,
            // track which managed groups were present in the request (for partial PATCH)
            '_has'             => [
                'name'       => array_key_exists('firstname', $fields)
                    || array_key_exists('lastname', $fields)
                    || array_key_exists('fullname', $fields),
                'org'        => array_key_exists('org', $fields),
                'title'      => array_key_exists('title', $fields),
                'emails'     => array_key_exists('emails', $fields) || array_key_exists('email', $fields),
                'phones'     => array_key_exists('phones', $fields)
                    || array_key_exists('tel_cell', $fields)
                    || array_key_exists('tel_work', $fields)
                    || array_key_exists('tel_home', $fields),
                'address'    => array_key_exists('address', $fields),
                'url'        => array_key_exists('url', $fields),
                'note'       => array_key_exists('note', $fields),
                'birthday'   => array_key_exists('birthday', $fields),
                'specialDate' => array_key_exists('specialDate', $fields)
                    || array_key_exists('specialDateLabel', $fields),
                'custom'     => array_key_exists('custom', $fields),
            ],
        ];
    }

    /**
     * @param mixed $raw
     */
    private function normalizeDateField($raw): ?string {
        if ($raw === null) {
            return null;
        }
        $s = trim((string) $raw);
        if ($s === '') {
            return null;
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m)) {
            if (!checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
                throw new ApiException('Invalid date', 400);
            }

            return $s;
        }
        if (preg_match('/^(\d{4})(\d{2})(\d{2})$/', $s, $m)) {
            if (!checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
                throw new ApiException('Invalid date', 400);
            }

            return $m[1] . '-' . $m[2] . '-' . $m[3];
        }
        throw new ApiException('Dates must be YYYY-MM-DD', 400);
    }

    /**
     * @param mixed $vcard VCard
     */
    private function parseVCardDateProp($vcard, string $name): ?string {
        if (!isset($vcard->{$name})) {
            return null;
        }
        $prop = $vcard->{$name};
        try {
            if (is_object($prop) && method_exists($prop, 'getDateTime')) {
                return $prop->getDateTime()->format('Y-m-d');
            }
        } catch (\Throwable $e) {
            // fall through to string parse
        }
        $raw = trim((string) $prop);
        if ($raw === '') {
            return null;
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $raw, $m)) {
            return $m[1] . '-' . $m[2] . '-' . $m[3];
        }
        if (preg_match('/^(\d{4})(\d{2})(\d{2})/', $raw, $m)) {
            return $m[1] . '-' . $m[2] . '-' . $m[3];
        }

        return null;
    }

    /**
     * @param mixed $vcard VCard component/property holder
     */
    private function setVCardDateProp($vcard, string $name, ?string $ymd): void {
        unset($vcard->{$name});
        if ($ymd === null || $ymd === '') {
            return;
        }
        try {
            $dt = new \DateTime($ymd . ' 00:00:00', new \DateTimeZone('UTC'));
            $vcard->add($name, $dt, ['VALUE' => 'DATE']);
        } catch (\Throwable $e) {
            $vcard->{$name} = str_replace('-', '', $ymd);
        }
    }

    /**
     * Map "Spouse" / "X-SPOUSE" → valid vCard property name X-SPOUSE.
     */
    private function normalizeCustomPropName(string $labelOrName): string {
        $s = trim($labelOrName);
        if ($s === '') {
            return '';
        }
        $s = strtoupper($s);
        $s = str_replace([' ', '_'], '-', $s);
        if (!str_starts_with($s, 'X-')) {
            $s = 'X-' . $s;
        }
        $s = preg_replace('/[^A-Z0-9-]+/', '', $s) ?? '';
        $s = preg_replace('/-+/', '-', $s) ?? '';
        $s = trim($s, '-');
        if ($s === '' || $s === 'X') {
            return '';
        }
        if (!str_starts_with($s, 'X-')) {
            $s = 'X-' . $s;
        }
        if (strlen($s) > 64) {
            $s = substr($s, 0, 64);
        }

        return $s;
    }

    private function customLabelFromPropName(string $propName): string {
        $name = strtoupper(trim($propName));
        if (str_starts_with($name, 'X-')) {
            $name = substr($name, 2);
        }
        $name = str_replace(['-', '_'], ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name) ?? $name;
        $name = trim($name);
        if ($name === '') {
            return 'Custom';
        }

        // Title-case words for display
        return ucwords(strtolower($name));
    }

    /**
     * @param array<string, mixed> $normalized
     */
    public function applyFormFieldsToVCard(VCard $vcard, array $normalized, bool $isCreate): void {
        $has = $normalized['_has'];

        if ($isCreate || !empty($has['name'])) {
            unset($vcard->N, $vcard->FN);
            $fn = (string) $normalized['fullname'];
            if ($fn === '') {
                $fn = trim($normalized['firstname'] . ' ' . $normalized['lastname']) ?: 'Contact';
            }
            $vcard->FN = $fn;
            $vcard->N = [
                (string) $normalized['lastname'],
                (string) $normalized['firstname'],
                '',
                '',
                '',
            ];
        }

        if ($isCreate || !empty($has['org'])) {
            unset($vcard->ORG);
            if ($normalized['org'] !== '') {
                $vcard->ORG = (string) $normalized['org'];
            }
        }
        if ($isCreate || !empty($has['title'])) {
            unset($vcard->TITLE);
            if ($normalized['title'] !== '') {
                $vcard->TITLE = (string) $normalized['title'];
            }
        }
        if ($isCreate || !empty($has['url'])) {
            unset($vcard->URL);
            if ($normalized['url'] !== '') {
                $vcard->URL = (string) $normalized['url'];
            }
        }
        if ($isCreate || !empty($has['note'])) {
            unset($vcard->NOTE);
            if ($normalized['note'] !== '') {
                $vcard->NOTE = (string) $normalized['note'];
            }
        }

        if ($isCreate || !empty($has['birthday'])) {
            $this->setVCardDateProp($vcard, 'BDAY', $normalized['birthday'] ?? null);
        }

        if ($isCreate || !empty($has['emails'])) {
            unset($vcard->EMAIL);
            foreach ($normalized['emails'] as $email) {
                $vcard->add('EMAIL', $email, ['TYPE' => 'INTERNET']);
            }
        }

        if ($isCreate || !empty($has['phones'])) {
            unset($vcard->TEL);
            foreach ($normalized['phones'] as $phone) {
                $type = strtoupper((string) $phone['type']);
                $vcard->add('TEL', (string) $phone['value'], ['TYPE' => $type]);
            }
        }

        if ($isCreate || !empty($has['address'])) {
            unset($vcard->ADR);
            $a = $normalized['address'];
            $any = ($a['street'] . $a['city'] . $a['region'] . $a['postal'] . $a['country']) !== '';
            if ($any) {
                $vcard->add('ADR', [
                    '',
                    '',
                    (string) $a['street'],
                    (string) $a['city'],
                    (string) $a['region'],
                    (string) $a['postal'],
                    (string) $a['country'],
                ]);
            }
        }

        if ($isCreate || !empty($has['custom'])) {
            $this->replaceCustomProperties($vcard, $normalized['custom'] ?? []);
        }

        // After custom X-* replace so our managed labels are not wiped
        if ($isCreate || !empty($has['specialDate'])) {
            unset($vcard->ANNIVERSARY, $vcard->{'X-SPECIAL-DATE'}, $vcard->{'X-SPECIAL-LABEL'}, $vcard->{'X-SPECIAL-DATE-LABEL'});
            $special = $normalized['specialDate'] ?? null;
            $label = trim((string) ($normalized['specialDateLabel'] ?? ''));
            if (is_string($special) && $special !== '') {
                $this->setVCardDateProp($vcard, 'ANNIVERSARY', $special);
                if ($label !== '') {
                    $vcard->add('X-SPECIAL-LABEL', $label);
                }
            }
        }
    }

    /**
     * Replace all plain-text X-* properties with the form list (import/export safe).
     *
     * @param list<array{name: string, label?: string, value: string}> $custom
     */
    private function replaceCustomProperties(VCard $vcard, array $custom): void {
        $toRemove = [];
        foreach ($vcard->children() as $child) {
            if (!$child instanceof \Sabre\VObject\Property) {
                continue;
            }
            $propName = strtoupper((string) $child->name);
            $baseName = $propName;
            if (str_contains($propName, '.')) {
                $baseName = substr($propName, (int) strrpos($propName, '.') + 1);
            }
            if (!str_starts_with($baseName, 'X-')) {
                continue;
            }
            // Managed by birthday / special date handlers
            if (in_array($baseName, ['X-SPECIAL-LABEL', 'X-SPECIAL-DATE', 'X-SPECIAL-DATE-LABEL'], true)) {
                continue;
            }
            $val = $child->getValue();
            // Keep non-text / huge X-* blobs (do not manage in portal UI)
            if (!is_string($val) && !is_numeric($val)) {
                continue;
            }
            $val = (string) $val;
            if (strlen($val) > 4000 || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', $val)) {
                continue;
            }
            $toRemove[] = $child;
        }
        foreach ($toRemove as $child) {
            $vcard->remove($child);
        }

        foreach ($custom as $row) {
            $label = trim((string) ($row['label'] ?? ''));
            $value = (string) ($row['value'] ?? '');
            if ($label === '' || $value === '') {
                continue;
            }
            // JSON payload preserves Unicode labels (Cyrillic, etc.)
            $payload = json_encode(
                ['l' => $label, 'v' => $value],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
            if ($payload === false) {
                continue;
            }
            $vcard->add(self::CUSTOM_PROP, $payload);
        }
    }

    /**
     * @param array<string, mixed> $fields
     */
    public function applyPhotoFromFields(VCard $vcard, array $fields, bool $isCreate): void {
        // removePhoto: true clears PHOTO
        if (!empty($fields['removePhoto'])) {
            unset($vcard->PHOTO);

            return;
        }
        if (!array_key_exists('photoBase64', $fields) && !array_key_exists('photo', $fields)) {
            return;
        }
        $raw = $fields['photoBase64'] ?? $fields['photo'] ?? null;
        if ($raw === null || $raw === '') {
            if ($isCreate) {
                return;
            }
            // empty string with key present → clear
            unset($vcard->PHOTO);

            return;
        }
        if (!is_string($raw)) {
            throw new ApiException('photoBase64 must be a string', 400);
        }

        $jpeg = $this->processPhotoInput($raw, true);
        $this->setJpegPhoto($vcard, $jpeg);
    }

    /**
     * Store JPEG as vCard 3.0 PHOTO;ENCODING=b (never raw binary on v4 — corrupts cards).
     */
    private function setJpegPhoto(VCard $vcard, string $jpegBinary): void {
        unset($vcard->PHOTO);
        // Pass binary; VObject base64-encodes for ENCODING=b only when document type is v3
        $vcard->add('PHOTO', $jpegBinary, ['ENCODING' => 'b', 'TYPE' => 'JPEG']);
    }

    /**
     * Clone into a true vCard 3.0 document (docType), not just VERSION property text.
     */
    public function asVCard3(VCard $src): VCard {
        $dst = new VCard(['VERSION' => '3.0']);
        foreach ($src->children() as $child) {
            if (strtoupper((string) $child->name) === 'VERSION') {
                continue;
            }
            $dst->add(clone $child);
        }
        $src->destroy();

        return $dst;
    }

    /**
     * Re-encode PHOTO on imported/edited cards (strip raw binary / data-URI polyglots).
     */
    public function sanitizePhotoOnVCard(VCard $vcard): void {
        if (!isset($vcard->PHOTO)) {
            return;
        }
        $binary = $this->extractPhotoBinary($vcard);
        if ($binary === null || $binary === '') {
            unset($vcard->PHOTO);

            return;
        }
        try {
            // If already JPEG under size, still re-encode via GD when available
            if (function_exists('imagecreatefromstring')) {
                $jpeg = $this->processPhotoInput($binary, false);
            } else {
                // Fallback: only keep if looks like JPEG
                if (strncmp($binary, "\xFF\xD8", 2) !== 0) {
                    unset($vcard->PHOTO);

                    return;
                }
                if (strlen($binary) > self::MAX_PHOTO_BYTES) {
                    unset($vcard->PHOTO);

                    return;
                }
                $jpeg = $binary;
            }
            $this->setJpegPhoto($vcard, $jpeg);
        } catch (\Throwable $e) {
            unset($vcard->PHOTO);
        }
    }

    /**
     * Extract photo bytes from PHOTO property (v3 base64, v4 data URI, or binary).
     */
    public function extractPhotoBinary(VCard $vcard): ?string {
        if (!isset($vcard->PHOTO)) {
            return null;
        }
        $photo = $vcard->PHOTO;
        $raw = $photo->getValue();
        if (!is_string($raw) || $raw === '') {
            return null;
        }
        // data:image/jpeg;base64,... (vCard 4 style)
        if (str_starts_with($raw, 'data:')) {
            $comma = strpos($raw, ',');
            if ($comma === false) {
                return null;
            }
            $meta = substr($raw, 0, $comma);
            $payload = substr($raw, $comma + 1);
            if (stripos($meta, ';base64') !== false) {
                $decoded = base64_decode($payload, true);

                return ($decoded !== false && $decoded !== '') ? $decoded : null;
            }

            return $payload !== '' ? rawurldecode($payload) : null;
        }
        // Already binary (JPEG/PNG magic)
        if (preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', $raw) || strncmp($raw, "\xFF\xD8", 2) === 0 || strncmp($raw, "\x89PNG", 4) === 0) {
            return $raw;
        }
        // Base64 text
        if (preg_match('/^[A-Za-z0-9+\/=\s]+$/', $raw) && strlen($raw) > 32) {
            $decoded = base64_decode(preg_replace('/\s+/', '', $raw) ?? '', true);
            if ($decoded !== false && $decoded !== '') {
                return $decoded;
            }
        }

        return $raw;
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function toSummary(string $uri, array $fields, string $carddata): array {
        $fn = (string) ($fields['fullname'] ?? '');
        if ($fn === '') {
            $fn = trim(($fields['firstname'] ?? '') . ' ' . ($fields['lastname'] ?? ''));
        }
        if ($fn === '') {
            $fn = $uri;
        }
        $emails = $fields['emails'] ?? [];
        $phones = $fields['phones'] ?? [];
        $primaryEmail = is_array($emails) && $emails !== [] ? (string) $emails[0] : '';
        $primaryPhone = '';
        if (is_array($phones)) {
            foreach ($phones as $p) {
                if (is_array($p) && ($p['type'] ?? '') === 'cell' && !empty($p['value'])) {
                    $primaryPhone = (string) $p['value'];
                    break;
                }
            }
            if ($primaryPhone === '' && $phones !== [] && is_array($phones[0])) {
                $primaryPhone = (string) ($phones[0]['value'] ?? '');
            }
        }

        return [
            'uri'         => $this->utf8($uri),
            'displayname' => $this->utf8($fn),
            'firstname'   => $this->utf8((string) ($fields['firstname'] ?? '')),
            'lastname'    => $this->utf8((string) ($fields['lastname'] ?? '')),
            'org'         => $this->utf8((string) ($fields['org'] ?? '')),
            'email'       => $this->utf8($primaryEmail),
            'phone'       => $this->utf8($primaryPhone),
            'hasPhoto'    => !empty($fields['hasPhoto']),
            'etag'        => md5($carddata),
        ];
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function toDetail(string $uri, array $fields): array {
        $fn = (string) ($fields['fullname'] ?? '');
        if ($fn === '') {
            $fn = trim(($fields['firstname'] ?? '') . ' ' . ($fields['lastname'] ?? ''));
        }
        $photoDataUri = null;
        if (!empty($fields['photoBinary']) && is_string($fields['photoBinary'])) {
            $photoDataUri = 'data:image/jpeg;base64,' . base64_encode($fields['photoBinary']);
        }

        $emails = $fields['emails'] ?? [];
        if (!is_array($emails)) {
            $emails = [];
        }
        $phones = $fields['phones'] ?? [];
        if (!is_array($phones)) {
            $phones = [];
        }
        $custom = $fields['custom'] ?? [];
        if (!is_array($custom)) {
            $custom = [];
        }
        $address = $fields['address'] ?? [
            'street' => '', 'city' => '', 'region' => '', 'postal' => '', 'country' => '',
        ];
        if (!is_array($address)) {
            $address = ['street' => '', 'city' => '', 'region' => '', 'postal' => '', 'country' => ''];
        }

        return [
            'uri'          => $this->utf8($uri),
            'displayname'  => $this->utf8($fn !== '' ? $fn : $uri),
            'firstname'    => $this->utf8((string) ($fields['firstname'] ?? '')),
            'lastname'     => $this->utf8((string) ($fields['lastname'] ?? '')),
            'fullname'     => $this->utf8($fn),
            'org'          => $this->utf8((string) ($fields['org'] ?? '')),
            'title'        => $this->utf8((string) ($fields['title'] ?? '')),
            'emails'       => array_values(array_map(fn ($e) => $this->utf8((string) $e), $emails)),
            'phones'       => array_values(array_map(function ($p) {
                if (!is_array($p)) {
                    return ['type' => 'other', 'value' => $this->utf8((string) $p)];
                }

                return [
                    'type'  => $this->utf8((string) ($p['type'] ?? 'other')),
                    'value' => $this->utf8((string) ($p['value'] ?? '')),
                ];
            }, $phones)),
            'address'      => [
                'street'  => $this->utf8((string) ($address['street'] ?? '')),
                'city'    => $this->utf8((string) ($address['city'] ?? '')),
                'region'  => $this->utf8((string) ($address['region'] ?? '')),
                'postal'  => $this->utf8((string) ($address['postal'] ?? '')),
                'country' => $this->utf8((string) ($address['country'] ?? '')),
            ],
            'url'               => $this->utf8((string) ($fields['url'] ?? '')),
            'note'              => $this->utf8((string) ($fields['note'] ?? '')),
            'birthday'          => isset($fields['birthday']) && is_string($fields['birthday']) && $fields['birthday'] !== ''
                ? $fields['birthday']
                : null,
            'specialDate'       => isset($fields['specialDate']) && is_string($fields['specialDate']) && $fields['specialDate'] !== ''
                ? $fields['specialDate']
                : null,
            'specialDateLabel'  => $this->utf8((string) ($fields['specialDateLabel'] ?? '')),
            'custom'            => array_values(array_map(function ($c) {
                if (!is_array($c)) {
                    return ['label' => '', 'value' => ''];
                }

                return [
                    'name'  => $this->utf8((string) ($c['name'] ?? '')),
                    'label' => $this->utf8((string) ($c['label'] ?? '')),
                    'value' => $this->utf8((string) ($c['value'] ?? '')),
                ];
            }, $custom)),
            'hasPhoto'          => !empty($fields['hasPhoto']),
            'photoDataUri'      => $photoDataUri,
        ];
    }

    private function looksLikeImage(string $binary): bool {
        if (strlen($binary) < 4) {
            return false;
        }

        // JPEG / PNG / GIF
        return strncmp($binary, "\xFF\xD8\xFF", 3) === 0
            || strncmp($binary, "\x89PNG", 4) === 0
            || strncmp($binary, 'GIF8', 4) === 0;
    }

    /**
     * @param array<string, mixed> $summary
     * @param array<string, mixed> $fields
     */
    public function matchesSearch(array $summary, array $fields, string $q): bool {
        $hay = mb_strtolower(implode(' ', [
            (string) ($summary['displayname'] ?? ''),
            (string) ($summary['email'] ?? ''),
            (string) ($summary['phone'] ?? ''),
            (string) ($summary['org'] ?? ''),
            (string) ($fields['note'] ?? ''),
            (string) ($fields['title'] ?? ''),
            (string) ($fields['url'] ?? ''),
            implode(' ', $fields['emails'] ?? []),
        ]));
        foreach ($fields['phones'] ?? [] as $p) {
            if (is_array($p)) {
                $hay .= ' ' . mb_strtolower((string) ($p['value'] ?? ''));
            }
        }
        foreach ($fields['custom'] ?? [] as $c) {
            if (is_array($c)) {
                $hay .= ' ' . mb_strtolower((string) ($c['label'] ?? '') . ' ' . (string) ($c['value'] ?? ''));
            }
        }

        return str_contains($hay, $q);
    }
}
