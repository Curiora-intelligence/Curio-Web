"""Template, asset and retained frontend contract regression checks."""
from pathlib import Path
import re
from fastapi.testclient import TestClient
from main import app

ROOT = Path(__file__).resolve().parents[1]

def test_home_and_assets():
    with TestClient(app) as client:
        page = client.get('/')
        assert page.status_code == 200
        for url in re.findall(r'(?:src|href)="(http://testserver/static/[^"]+)"', page.text):
            assert client.get(url).status_code == 200, url
        assert 'Where should we begin?' in page.text
        assert 'What should we work on?' in page.text
        for text in ['theme-preference', 'Mock Interview', 'Services & map', 'mode-tabs', 'class="orb"']:
            assert text not in page.text
        ids = re.findall(r'\bid="([^"]+)"', page.text)
        assert len(ids) == len(set(ids)), 'DOM IDs must remain unique'
        for hook in ['chat-form', 'message', 'messages', 'history-list', 'memory-dialog', 'live-dialog', 'chat-tab', 'work-tab']:
            assert hook in ids

def test_javascript_imports_resolve():
    for module in (ROOT / 'static/js').glob('*.js'):
        for imported in re.findall(r'(?:from\s*|import\s*\()\s*[\'"](\./[^\'"]+)', module.read_text()):
            assert (module.parent / imported).is_file(), (module, imported)

def test_system_theme_needs_no_javascript_or_storage():
    css = (ROOT / 'static/css/tokens.css').read_text()
    assert '@media (prefers-color-scheme: dark)' in css
    assert 'color-scheme: light dark' in css
    assert 'data-theme' not in css
    html = (ROOT / 'templates/base.html').read_text()
    assert 'media="(prefers-color-scheme: dark)"' in html
    assert 'media="(prefers-color-scheme: light)"' in html
    assert 'theme-init.js' not in html
    for source in (ROOT / 'static/js').glob('*.js'):
        assert 'curio_theme' not in source.read_text()

def test_obsolete_pages_are_not_routes():
    with TestClient(app) as client:
        for path in ['/interview','/discover','/saved','/requests','/notifications','/provider','/admin']:
            assert client.get(path).status_code == 404

def test_transport_contracts_retained():
    api = (ROOT / 'static/js/api.js').read_text()
    sse = (ROOT / 'static/js/sse.js').read_text()
    assert "data.set('request_id', requestId)" in api
    assert "data.set('image', image)" in api
    assert 'X-CSRF-Token' in api and "credentials:'include'" in api
    assert 'lastEventId' in sse and 'runStatus(id)' in sse
    live = (ROOT / 'static/js/live.js').read_text()
    assert "mode: 'general'" in live and "type: 'transcript'" in live
    assert "inFlight === 'reason'" in live
    assert 'getUserMedia' not in live and 'captureJPEG' not in live
    assert not re.search(r'interview|marketplace\.js|service-response|mode-tabs', live)


def test_versioned_nested_modules_and_cache_policy():
    from app.core.assets import asset_version
    version = asset_version()
    with TestClient(app) as client:
        page = client.get('/')
        assert page.headers['cache-control'] == 'no-cache'
        assert f'/static/{version}/js/app.js' in page.text
        for file in (ROOT / 'static').rglob('*'):
            if not file.is_file():
                continue
            url = f'/static/{version}/{file.relative_to(ROOT / "static").as_posix()}'
            asset = client.get(url)
            assert asset.status_code == 200, url
            assert 'immutable' in asset.headers['cache-control']
            cached = client.get(url, headers={'If-None-Match': asset.headers['etag']})
            assert cached.status_code == 304, url  # Successful cache validation, not a missing resource.
            assert 'immutable' in cached.headers['cache-control']
        legacy = client.get('/static/js/app.js')
        assert legacy.status_code == 200 and legacy.headers['cache-control'] == 'no-cache'
        assert 'marketplace.js' not in legacy.text
        assert client.get('/static/js/marketplace.js').status_code == 404  # Intentionally removed.
        assert client.get('/static/v-old/js/app.js').status_code == 404
        assert client.get(f'/static/{version}/%2e%2e/main.py').status_code == 404


def test_asset_version_changes_with_content(tmp_path):
    from app.core.assets import asset_version
    source = tmp_path / 'module.js'
    source.write_text('export const value = 1;')
    first = asset_version(tmp_path)
    assert first == asset_version(tmp_path)
    source.write_text('export const value = 2;')
    assert asset_version(tmp_path) != first
