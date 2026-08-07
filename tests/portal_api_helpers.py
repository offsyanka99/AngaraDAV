"""
Portal-only HTTP helpers (JSON API + install).

Replaces MechanicalSoup Formal /admin/ flows. Requires a running AngaraDAV
instance (set BAIKAL_BASE_URL, default http://127.0.0.1:31088/).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from typing import Any, Optional
from urllib.parse import urljoin

BASE_URL = os.environ.get("BAIKAL_BASE_URL", "http://127.0.0.1:31088/").rstrip("/") + "/"
ADMIN_PASSWORD = os.environ.get("PORTAL_TEST_ADMIN_PASSWORD", "secret12345")


class PortalClient:
    def __init__(self, base_url: str = BASE_URL):
        self.base = base_url
        self.jar = CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.csrf = ""

    def _url(self, path: str) -> str:
        return urljoin(self.base, path.lstrip("/"))

    def request(
        self,
        method: str,
        path: str,
        body: Optional[dict] = None,
        *,
        expect_status: Optional[int] = None,
    ) -> tuple[int, Any]:
        data = None
        headers = {"Accept": "application/json"}
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if method.upper() not in ("GET", "HEAD") and self.csrf:
            headers["X-CSRF-Token"] = self.csrf
        # Match browser same-origin signals (portal rejects mutations without them)
        if method.upper() not in ("GET", "HEAD"):
            from urllib.parse import urlparse

            p = urlparse(self.base)
            origin = f"{p.scheme}://{p.netloc}" if p.scheme and p.netloc else self.base.rstrip("/")
            headers.setdefault("Origin", origin)
            headers.setdefault("Referer", origin + "/")
        req = urllib.request.Request(self._url(path), data=data, headers=headers, method=method.upper())
        try:
            with self.opener.open(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
                status = resp.status
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8")
            status = e.code
        payload: Any = None
        if raw.strip():
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"_raw": raw}
        if expect_status is not None and status != expect_status:
            raise AssertionError(f"{method} {path} expected {expect_status}, got {status}: {payload}")
        return status, payload

    def install_status(self) -> dict:
        _, data = self.request("GET", "/api/install/status", expect_status=200)
        d = data.get("data") or data
        self.csrf = d.get("csrfToken") or self.csrf
        return d

    def install_initialize(self, password: str = ADMIN_PASSWORD, **kwargs) -> dict:
        body = {
            "timezone": kwargs.get("timezone", "UTC"),
            "cal_enabled": True,
            "card_enabled": True,
            "tasks_enabled": True,
            "notes_enabled": False,
            "files_enabled": False,
            "dav_auth_type": "Digest",
            "invite_from": "noreply@example.local",
            "session_max_age_minutes": 15,
            "admin_password": password,
            "admin_password_confirm": password,
        }
        body.update({k: v for k, v in kwargs.items() if k not in body or True})
        _, data = self.request("POST", "/api/install/initialize", body, expect_status=200)
        d = data.get("data") or data
        self.csrf = d.get("csrfToken") or self.csrf
        return d

    def install_database_sqlite(self, sqlite_file: str) -> dict:
        body = {"backend": "sqlite", "sqlite_file": sqlite_file}
        _, data = self.request("POST", "/api/install/database", body, expect_status=200)
        d = data.get("data") or data
        self.csrf = d.get("csrfToken") or self.csrf
        return d

    def login(self, username: str, password: str) -> dict:
        status, data = self.request(
            "POST",
            "/api/login",
            {"username": username, "password": password},
        )
        if status != 200:
            raise AssertionError(f"login failed {status}: {data}")
        user = data.get("user") or {}
        self.csrf = user.get("csrfToken") or data.get("csrfToken") or self.csrf
        return data

    def me(self) -> tuple[int, Any]:
        return self.request("GET", "/api/me")

    def admin(self, method: str, path: str, body: Optional[dict] = None, **kw) -> tuple[int, Any]:
        return self.request(method, "/api" + path if path.startswith("/admin") else path, body, **kw)


def ensure_fresh_install(client: Optional[PortalClient] = None) -> PortalClient:
    """
    Drive install wizard to completion when step is initialize/database.
    Does not wipe an already-finished instance (use reset-to-default as admin first).
    """
    c = client or PortalClient()
    st = c.install_status()
    step = st.get("step")
    if step in ("done", "locked"):
        return c
    if step == "permissions":
        raise RuntimeError(f"Install blocked on permissions: {st.get('permissions')}")
    if step == "initialize":
        c.install_initialize()
        st = c.install_status()
    if st.get("step") == "database":
        sqlite = (st.get("defaults") or {}).get("sqlite_file") or "/var/www/baikal/Specific/db/db.sqlite"
        c.install_database_sqlite(sqlite)
    return c
