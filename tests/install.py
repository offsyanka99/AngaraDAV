import mechanicalsoup
from test_helpers import install_sqlite, install_pgsql

def test_sqlite(browser: mechanicalsoup.StatefulBrowser):
    install_sqlite(browser)
    
def test_pgsql(browser: mechanicalsoup.StatefulBrowser):
    install_pgsql(browser)

