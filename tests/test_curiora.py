"""The pinned visual distribution remains self-contained in a product checkout."""
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urljoin
from fastapi.testclient import TestClient
from main import app
from app.core.assets import asset_version

ROOT = Path(__file__).resolve().parents[1]


def test_snapshot_integrity_and_version_pin():
    manifest = json.loads((ROOT/'static/curiora/snapshot.json').read_text())
    assert manifest['schema'] == 1 and manifest['version'] == '1.0.1'
    assert len(manifest['source_base_revision']) == 40
    for name, digest in manifest['files'].items():
        assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest() == digest, name
    expected = hashlib.sha256(json.dumps({'version': manifest['version'], 'files': manifest['files']}, sort_keys=True).encode()).hexdigest()
    assert expected == manifest['snapshot_sha256']


def test_nested_shared_imports_use_the_same_immutable_asset_namespace():
    version = asset_version()
    with TestClient(app) as client:
        page = client.get('/').text
        assert f'/static/{version}/curiora/controls.css' in page
        for module in (ROOT/'static').rglob('*.js'):
            for imported in re.findall(r'from\s*[\'"](\.\.?/[^\'"]+)', module.read_text()):
                url = urljoin(f'/static/{version}/{module.relative_to(ROOT/"static").as_posix()}', imported)
                response = client.get(url)
                assert response.status_code == 200, url
                assert 'immutable' in response.headers['cache-control']


def test_shared_geometry_is_used_without_runtime_repository_access():
    adapter = (ROOT/'static/js/motion.js').read_text()
    assert "from '../curiora/liquid.js'" in adapter
    assert 'liquidOutline' not in adapter and 'indicator.animate' not in adapter
    for module in (ROOT/'static/curiora').glob('*.js'):
        assert not re.search(r'fetch\(|WebSocket|EventSource|SpeechRecognition|speechSynthesis|curio-config', module.read_text())


def test_server_rendered_voice_matches_the_shared_original_geometry():
    source = (ROOT/'static/curiora/voice-control.js').read_text()
    paths = json.loads(re.search(r'export const VOICE_PATHS = (\[.*?\]);', source).group(1))
    partial = (ROOT/'templates/components/curiora_voice.html').read_text()
    assert re.findall(r'<path d="([^"]+)"', partial) == paths
    assert len(paths) == 5
    with TestClient(app) as client:
        page = client.get('/').text
        assert 'speak-session-control' in page and 'Stop and leave Curio Speak' in page
        assert page.count('class="curiora-voice-wave"') == 2
