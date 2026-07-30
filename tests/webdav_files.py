import os
from urllib.parse import urljoin

import mechanicalsoup
import requests
from requests.auth import HTTPDigestAuth

from test_helpers import (
    BASE_URL,
    follow_link_containing,
    follow_meta_redirect,
    install_sqlite,
)


def setup():
    db_path = "Specific/db/db.sqlite"
    if os.path.exists(db_path):
        os.remove(db_path)


def create_user(browser: mechanicalsoup.StatefulBrowser, username: str):
    browser.open(urljoin(BASE_URL, "admin/"))
    follow_link_containing(browser, "users and resources")
    follow_link_containing(browser, "add user")
    browser.select_form("form")
    browser["data[username]"] = username
    browser["data[displayname]"] = username.title()
    browser["data[email]"] = f"{username}@example.com"
    browser["data[password]"] = "password123"
    browser["data[passwordconfirm]"] = "password123"
    browser.submit_selected()
    assert username in browser.get_current_page().text


def enable_file_storage(browser: mechanicalsoup.StatefulBrowser):
    browser.open(urljoin(BASE_URL, "admin/"))
    follow_link_containing(browser, "system settings")
    browser.select_form("form")
    browser["data[files_enabled]"] = "1"
    browser.submit_selected()
    page_text = browser.get_current_page().text.lower()
    assert "validation error" not in page_text
    assert "angaradav system settings" in page_text


def delete_user(browser: mechanicalsoup.StatefulBrowser, username: str):
    browser.open(urljoin(BASE_URL, "admin/"))
    follow_link_containing(browser, "users and resources")
    page = browser.get_current_page()
    for row in page.find_all("tr"):
        username_element = row.find("strong")
        if username_element is None or username_element.get_text(strip=True) != username:
            continue
        delete_link = next(
            (link for link in row.find_all("a") if "delete" in link.get_text(strip=True).lower()),
            None,
        )
        if delete_link is None:
            continue
        browser.follow_link(delete_link)
        follow_link_containing(browser, f"delete {username}")
        follow_meta_redirect(browser)
        return
    raise RuntimeError(f"Unable to find exact user row for {username}")


def dav_request(method: str, path: str, username: str, **kwargs):
    url = urljoin(BASE_URL, "dav.php/" + path.lstrip("/"))
    return requests.request(
        method,
        url,
        auth=HTTPDigestAuth(username, "password123"),
        timeout=20,
        **kwargs,
    )


def test_private_webdav_file_home(browser: mechanicalsoup.StatefulBrowser):
    install_sqlite(browser)
    enable_file_storage(browser)
    create_user(browser, "alice")
    create_user(browser, "al")
    create_user(browser, "bob")

    home = "files/alice/"
    response = dav_request("PROPFIND", home, "alice", headers={"Depth": "0"})
    assert response.status_code == 207, response.text
    assert "alice" in response.text

    response = dav_request("PROPFIND", "files/", "alice", headers={"Depth": "1"})
    assert response.status_code in (403, 405)
    assert "bob" not in response.text

    response = dav_request("MKCOL", home + "docs", "alice")
    assert response.status_code == 201, response.text

    response = dav_request("PUT", home + "docs/hello.txt", "alice", data=b"hello world")
    assert response.status_code in (201, 204), response.text
    etag = response.headers.get("ETag")
    assert etag

    response = dav_request("GET", home + "docs/hello.txt", "alice")
    assert response.status_code == 200
    assert response.content == b"hello world"

    response = dav_request(
        "GET",
        home + "docs/hello.txt",
        "alice",
        headers={"Range": "bytes=0-4"},
    )
    assert response.status_code == 206
    assert response.content == b"hello"

    property_body = """<?xml version="1.0" encoding="utf-8" ?>
<D:propertyupdate xmlns:D="DAV:" xmlns:T="urn:baikal:test">
  <D:set><D:prop><T:label>example</T:label></D:prop></D:set>
</D:propertyupdate>"""
    response = dav_request(
        "PROPPATCH",
        home + "docs/hello.txt",
        "alice",
        data=property_body.encode("utf-8"),
        headers={"Content-Type": "application/xml"},
    )
    assert response.status_code == 207, response.text

    lock_body = """<?xml version="1.0" encoding="utf-8" ?>
<D:lockinfo xmlns:D="DAV:">
  <D:lockscope><D:exclusive/></D:lockscope>
  <D:locktype><D:write/></D:locktype>
  <D:owner><D:href>principals/alice</D:href></D:owner>
</D:lockinfo>"""
    response = dav_request(
        "LOCK",
        home + "docs/hello.txt",
        "alice",
        data=lock_body.encode("utf-8"),
        headers={"Content-Type": "application/xml", "Timeout": "Second-300"},
    )
    assert response.status_code == 200, response.text
    lock_token = response.headers.get("Lock-Token")
    assert lock_token

    delete_user(browser, "al")

    property_find = """<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:T="urn:baikal:test">
  <D:prop><T:label/></D:prop>
</D:propfind>"""
    response = dav_request(
        "PROPFIND",
        home + "docs/hello.txt",
        "alice",
        data=property_find.encode("utf-8"),
        headers={"Content-Type": "application/xml", "Depth": "0"},
    )
    assert response.status_code == 207, response.text
    assert "example" in response.text

    response = dav_request("PUT", home + "docs/hello.txt", "alice", data=b"blocked")
    assert response.status_code == 423

    response = dav_request("HEAD", home + "docs/hello.txt", "alice")
    current_etag = response.headers["ETag"]
    wrong_etag = current_etag[:-2] + ("0" if current_etag[-2] != "0" else "1") + '"'
    complex_if = f"({lock_token} [{wrong_etag}]) (Not <DAV:no-lock> [{wrong_etag}])"
    response = dav_request(
        "PUT",
        home + "docs/hello.txt",
        "alice",
        data=b"invalid-condition",
        headers={"If": complex_if},
    )
    assert response.status_code == 412, response.text

    response = dav_request(
        "PUT",
        home + "docs/hello.txt",
        "alice",
        data=b"updated",
        headers={"If": f"({lock_token})"},
    )
    assert response.status_code == 204, response.text

    response = dav_request(
        "UNLOCK",
        home + "docs/hello.txt",
        "alice",
        headers={"Lock-Token": lock_token},
    )
    assert response.status_code == 204, response.text

    source_url = urljoin(BASE_URL, "dav.php/" + home + "docs/hello.txt")
    copy_url = urljoin(BASE_URL, "dav.php/" + home + "docs/copy.txt")
    moved_url = urljoin(BASE_URL, "dav.php/" + home + "docs/moved.txt")
    response = requests.request(
        "COPY",
        source_url,
        auth=HTTPDigestAuth("alice", "password123"),
        headers={"Destination": copy_url},
        timeout=20,
    )
    assert response.status_code == 201, response.text

    response = requests.request(
        "MOVE",
        copy_url,
        auth=HTTPDigestAuth("alice", "password123"),
        headers={"Destination": moved_url},
        timeout=20,
    )
    assert response.status_code == 201, response.text

    response = dav_request("GET", home + "docs/hello.txt", "bob")
    assert response.status_code == 403

    create_user(browser, "al")
    response = dav_request("PROPFIND", "files/al/", "al", headers={"Depth": "1"})
    assert response.status_code == 207, response.text
    assert "hello.txt" not in response.text

    response = dav_request("DELETE", home + "docs", "alice")
    assert response.status_code == 204, response.text