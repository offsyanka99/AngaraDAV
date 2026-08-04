import mechanicalsoup, os
from test_helpers import install_sqlite, install_pgsql, assert_upgrade

def test_sqlite(browser: mechanicalsoup.StatefulBrowser):
    install_sqlite(browser) # Creates a proper database
    config = f"""
system:
    configured_version: 0.10.1
    timezone: Europe/Paris
    card_enabled: true
    cal_enabled: true
    dav_auth_type: Digest
    admin_passwordhash: abbc0ffed774e98a495fe5a2596ed7deab14211f250673ad661be7b759c9a7fd
    failed_access_message: 'user %u authentication failure for AngaraDAV'
    auth_realm: BaikalDAV
    base_uri: ''
    invite_from: noreply@localhost
database:
    sqlite_file: {os.getcwd()}/Specific/db/db.sqlite
    backend: sqlite
    encryption_key: 89dc0abf3bf079f11df5f009a1b41fe1
"""
    with open("config/baikal.yaml", "w", encoding="utf-8") as f:
        f.write(config)
    assert_upgrade(browser)
    
def ignored_test_pgsql(browser: mechanicalsoup.StatefulBrowser):
    install_pgsql(browser) # Creates a proper database
    config = f"""
system:
    configured_version: 0.10.1
    timezone: Europe/Paris
    card_enabled: true
    cal_enabled: true
    dav_auth_type: Digest
    admin_passwordhash: abbc0ffed774e98a495fe5a2596ed7deab14211f250673ad661be7b759c9a7fd
    failed_access_message: 'user %u authentication failure for AngaraDAV'
    auth_realm: BaikalDAV
    base_uri: ''
    invite_from: noreply@localhost
database:
    sqlite_file: {os.getcwd()}/Specific/db/db.sqlite
    backend: postgres
    pgsql_host: 127.0.0.1
    pgsql_dbname: baikal_test
    pgsql_username: baikal
    pgsql_password: baikal
    encryption_key: 89dc0abf3bf079f11df5f009a1b41fe1
"""
    with open("config/baikal.yaml", "w", encoding="utf-8") as f:
        f.write(config)
    assert_upgrade(browser)

