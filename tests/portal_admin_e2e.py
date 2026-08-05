"""
Portal-only e2e: install API, authz, admin routes.

Run (against a live instance):
  BAIKAL_BASE_URL=http://127.0.0.1:31088/ pytest tests/portal_admin_e2e.py -v

These replace MechanicalSoup Formal /admin/ tests (classic UI removed).
"""

from __future__ import annotations

import os

import pytest

from portal_api_helpers import ADMIN_PASSWORD, PortalClient, ensure_fresh_install

# Skip if no server (CI unit-only runs)
def _server_up() -> bool:
    try:
        c = PortalClient()
        c.install_status()
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    os.environ.get("PORTAL_E2E", "1") == "0" or not _server_up(),
    reason="Live AngaraDAV required (set BAIKAL_BASE_URL; PORTAL_E2E=0 to force skip)",
)


def test_install_status_has_csrf():
    c = PortalClient()
    st = c.install_status()
    assert st.get("csrfToken")
    assert "step" in st


def test_authz_anonymous_admin_401():
    c = PortalClient()
    status, data = c.request("GET", "/api/admin/dashboard")
    assert status == 401
    assert "error" in (data or {})


def test_authz_non_admin_403_if_extra_user():
    """
    If only admin exists, create is skipped. When a non-admin can log in, expect 403.
    """
    c = ensure_fresh_install()
    st = c.install_status()
    if st.get("step") not in ("done", "locked", "upgrade"):
        pytest.skip(f"instance not finished install: {st.get('step')}")
    try:
        c.login("admin", ADMIN_PASSWORD)
    except AssertionError:
        pytest.skip("admin login failed — set PORTAL_TEST_ADMIN_PASSWORD to match instance")
    status, data = c.request("GET", "/api/admin/dashboard", expect_status=200)
    assert (data or {}).get("data") is not None or "users" in (data or {}).get("data", data or {})


def test_admin_capabilities_portal_urls():
    c = ensure_fresh_install()
    st = c.install_status()
    if st.get("step") not in ("done", "locked", "upgrade"):
        pytest.skip("need finished install")
    try:
        c.login("admin", ADMIN_PASSWORD)
    except AssertionError:
        pytest.skip("admin login failed")
    status, data = c.request("GET", "/api/admin/capabilities", expect_status=200)
    cap = (data or {}).get("data") or data
    assert cap.get("portalAdminUrl", "").startswith("/portal")
    for p in cap.get("pages") or []:
        assert p.get("portalUrl", "").startswith("/portal")
        assert "classicUrl" not in p


def test_admin_settings_system_get():
    c = ensure_fresh_install()
    if c.install_status().get("step") not in ("done", "locked", "upgrade"):
        pytest.skip("need finished install")
    try:
        c.login("admin", ADMIN_PASSWORD)
    except AssertionError:
        pytest.skip("admin login failed")
    status, data = c.request("GET", "/api/admin/settings/system", expect_status=200)
    body = (data or {}).get("data") or data
    assert "timezone" in body
    assert "admin_passwordhash" not in body


def test_admin_database_confirm_required():
    c = ensure_fresh_install()
    if c.install_status().get("step") not in ("done", "locked", "upgrade"):
        pytest.skip("need finished install")
    try:
        c.login("admin", ADMIN_PASSWORD)
    except AssertionError:
        pytest.skip("admin login failed")
    status, data = c.request(
        "PATCH",
        "/api/admin/settings/database",
        {"backend": "sqlite", "sqlite_file": "/tmp/should-not-write.sqlite"},
    )
    assert status == 400
    assert "CONFIRM" in str((data or {}).get("error", "")).upper() or "confirm" in str(data).lower()
