import re
from fastapi.testclient import TestClient
from app.main import app


def test_page_and_all_static_assets():
    with TestClient(app) as client:
        page = client.get('/')
        assert page.status_code == 200
        assert 'What do you need' in page.text
        assert 'Sign in to Curio' in page.text
        assets = re.findall(r'(?:href|src)="(http://testserver/static/[^"]+)"', page.text)
        assert len(assets) >= 12
        for asset in assets:
            result = client.get(asset)
            assert result.status_code == 200, asset


def test_config_is_serialized_as_data(monkeypatch):
    monkeypatch.setenv('CURIO_API_BASE', 'http://localhost:8001/</script><script>alert(1)</script>')
    with TestClient(app) as client:
        page = client.get('/').text
        assert '<script>alert(1)</script>' not in page
        assert r'\u003c/script\u003e' in page


def test_no_backend_import_or_node_build_required():
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    assert not (root / 'package.json').exists()
    assert not (root / 'src').exists()
    assert not (root / 'node_modules').exists()


def test_dedicated_interview_page_uses_same_config():
    with TestClient(app) as client:
        page = client.get('/interview')
        assert page.status_code == 200
        assert 'Question 1 of 5' in page.text and 'Finish Answer' in page.text
        assert 'js/interview.js' in page.text and 'js/app.js' not in page.text
        assert 'curio-config' in page.text


def test_marketplace_routes_and_preserved_personal_features():
    with TestClient(app) as client:
        for page in ('discover','saved','requests','notifications','history','provider','admin','account'):
            text=client.get('/'+page).text
            assert 'data-page="'+page+'"' in text and 'js/marketplace.js' in text
        home=client.get('/').text
        assert 'Personal' in home and 'Career' in home and 'Mock Interview' in home and 'Upload' not in home or 'image-file' in home
