---
description: 'Authoring Storybook stories: conventions and visual testing'
applyTo: '**/*.stories.tsx,**/*.stories.ts,**/*.integration.ts'
---

# Authoring stories

How to author Storybook stories and their visual tests. For the strategy (the tiers, and when a visual test is warranted), see the Visual Testing docs (`apps/spade/player/docs/content/docs/(spade-web-app)/testing/visual-testing.mdx`) and [ADR 008](../../docs/decisions/008-visual-regression-testing-strategy.md). This file covers how to write them.

## Visual tests

A visual test screenshots rendered UI and compares it to a committed baseline. CI regenerates and commits changed baselines for you to review.

For product-app UI, choose the tier in order:

1. **Generic or reusable component** (button, card, input, layout primitive): Fusion covers it. Add nothing.
2. **A page or a region of a page**: a page-level Playwright test (below). The default for product apps.
3. **An isolated, high-importance component a page-level test cannot guard**: a Storybook visual test. The exception.


## Make it deterministic

A screenshot must reach identical pixels every run:

- **Freeze the clock**: no live `Date.now()`, `new Date()`, or relative time; pass fixed timestamps.
- **Static data**: no `Math.random` or live network; mock with fixed fixtures.
- **No animation or timing dependence**: do not gate the final frame on a timeout or animation end.
- **Static, preloaded assets**: lazy or remote images and late webfonts cause diffs.
- **Pin the viewport** for layout-sensitive captures.
- **Settle on its own**: no manual interaction; drive it in a `play` function if needed.


## Page example (Playwright)

Write a `*.integration.ts` that navigates the real page, mocks its data at the network boundary (`mockRequest`), and asserts a screenshot.

```ts
import { expect } from '@playwright/test';


test('home page matches baseline', async ({ page, mockRequest }) => {
  mockRequest.addMock({
    operationName: 'GetHome',
    response: { body: { data: { home: { title: 'Welcome' } } } }
  });

  await page.goto('./en');
  await expect(page).toHaveScreenshot('home-desktop.png', {
    fullPage: true,
    animations: 'disabled'
  });
});
```

The same determinism rules apply: mock all data, disable animations, mask dynamic chrome such as the Atomic Toolbar, and freeze time if the page shows it.
