/**
 * Admin form submit listeners (Phase 5).
 */
import type { AdminHost } from "./host";
import {
  onAdminAbSave,
  onAdminCalSave,
  onAdminUserCreate,
  onAdminUserEdit,
} from "./users";
import { onAdminSettingsSave } from "./settings";
import { onAdminDatabaseFormSubmit } from "./database";

export function bindAdminDom(host: AdminHost): void {
  const { root } = host;

  const adminUserCreateForm = root.querySelector<HTMLFormElement>(
    '[data-form="admin-user-create"]',
  );
  adminUserCreateForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onAdminUserCreate(host, adminUserCreateForm);
  });

  const adminUserEditForm = root.querySelector<HTMLFormElement>(
    '[data-form="admin-user-edit"]',
  );
  adminUserEditForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onAdminUserEdit(host, adminUserEditForm);
  });

  const adminCalForm = root.querySelector<HTMLFormElement>('[data-form="admin-cal"]');
  adminCalForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onAdminCalSave(host, adminCalForm);
  });

  const adminAbForm = root.querySelector<HTMLFormElement>('[data-form="admin-ab"]');
  adminAbForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onAdminAbSave(host, adminAbForm);
  });

  const adminSettingsForm = root.querySelector<HTMLFormElement>(
    '[data-form="admin-settings"]',
  );
  adminSettingsForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onAdminSettingsSave(host, adminSettingsForm);
  });

  const adminDbForm = root.querySelector<HTMLFormElement>('[data-form="admin-database"]');
  adminDbForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    onAdminDatabaseFormSubmit(host, adminDbForm);
  });
}
