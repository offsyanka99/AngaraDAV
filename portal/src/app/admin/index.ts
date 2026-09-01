/**
 * Admin domain public API (Phase 5).
 */
export type { AdminHost } from "./host";
export {
  adminPageMeta,
  adminStatusLabel,
  adminStatusBadgeClass,
  adminSubnavButtons,
  adminComingSoonBanner,
  adminStatCard,
  serviceBadge,
  serviceOnOff,
} from "./meta";
export {
  loadAdminCapabilities,
  loadAdminDashboard,
  loadAdminUsers,
  loadAdminUserDetail,
  loadAdminUserResources,
  loadAdminSystemSettings,
  loadAdminDatabaseSettings,
} from "./loaders";
export { renderAdminOverview } from "./overview";
export {
  filteredAdminUsers,
  renderAdminUserCreateModal,
  renderAdminUserEditModal,
  renderAdminUserDeleteModal,
  renderAdminUserDetailPanel,
  renderAdminUsersShell,
  onAdminUserCreate,
  onAdminUserEdit,
  onAdminCalSave,
  onAdminAbSave,
} from "./users";
export {
  renderAdminSettingsShell,
  onAdminSettingsSave,
} from "./settings";
export {
  renderAdminConfigurationShell,
  renderAdminResetModal,
  onAdminBackupDownload,
  onAdminRestoreFileSelected,
  onAdminRestoreDiscard,
  onAdminRestoreApply,
} from "./configuration";
export {
  collectAdminDatabaseFormBody,
  onAdminDatabaseFormSubmit,
  onAdminDatabaseTest,
  renderAdminDatabaseShell,
  renderAdminDbConfirmModal,
} from "./database";
export { activateAdminPage, renderAdminSection } from "./page";
export { handleAdminAction } from "./actionsRouter";
export { bindAdminDom } from "./bind";
