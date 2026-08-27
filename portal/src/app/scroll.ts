/**
 * Scroll capture/restore across full re-renders (Phase 3 extract).
 */

export type ScrollSnapshot = {
  windowX: number;
  windowY: number;
  tableTop: number | null;
  abListTop: number | null;
  calListTop: number | null;
  filesTableTop: number | null;
  weekWrapTop: number | null;
};

/** Full re-render replaces DOM and would reset scroll; capture so list clicks stay put. */
export function captureScroll(root: HTMLElement): ScrollSnapshot {
  const table = root.querySelector<HTMLElement>(".contacts-table-wrap");
  const abList = root.querySelector<HTMLElement>(".contacts-ab-list");
  const calList = root.querySelector<HTMLElement>(".calendars-owned-list");
  const filesTable = root.querySelector<HTMLElement>(".files-table-wrap");
  const weekWrap = root.querySelector<HTMLElement>(".week-wrap");
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    tableTop: table?.scrollTop ?? null,
    abListTop: abList?.scrollTop ?? null,
    calListTop: calList?.scrollTop ?? null,
    filesTableTop: filesTable?.scrollTop ?? null,
    weekWrapTop: weekWrap?.scrollTop ?? null,
  };
}

export function restoreScroll(root: HTMLElement, s: ScrollSnapshot): void {
  // Double rAF: after layout of the newly injected form/list
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(s.windowX, s.windowY);
      if (s.tableTop !== null) {
        const table = root.querySelector<HTMLElement>(".contacts-table-wrap");
        if (table) table.scrollTop = s.tableTop;
      }
      if (s.abListTop !== null) {
        const abList = root.querySelector<HTMLElement>(".contacts-ab-list");
        if (abList) abList.scrollTop = s.abListTop;
      }
      if (s.calListTop !== null) {
        const calList = root.querySelector<HTMLElement>(".calendars-owned-list");
        if (calList) calList.scrollTop = s.calListTop;
      }
      if (s.filesTableTop !== null) {
        const filesTable = root.querySelector<HTMLElement>(".files-table-wrap");
        if (filesTable) filesTable.scrollTop = s.filesTableTop;
      }
      const weekWrap = root.querySelector<HTMLElement>(".week-wrap");
      if (weekWrap) {
        const alignRaw = weekWrap.dataset.alignHour;
        if (alignRaw !== undefined && alignRaw !== "") {
          const hourPx = parseFloat(getComputedStyle(weekWrap).getPropertyValue("--week-hour")) || 40;
          const hour = Number(alignRaw);
          if (Number.isFinite(hour)) weekWrap.scrollTop = hour * hourPx;
        } else if (s.weekWrapTop !== null) {
          weekWrap.scrollTop = s.weekWrapTop;
        }
      }
    });
  });
}
