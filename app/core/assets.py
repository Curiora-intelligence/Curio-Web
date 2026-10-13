"""Content-versioned URLs, including relative native ES-module dependencies."""
from hashlib import sha256
from pathlib import Path
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles

STATIC_ROOT = Path(__file__).resolve().parents[2] / 'static'


def asset_version(root=STATIC_ROOT):
    digest = sha256()
    for file in sorted(path for path in root.rglob('*') if path.is_file()):
        digest.update(file.relative_to(root).as_posix().encode())
        digest.update(b'\0')
        digest.update(file.read_bytes())
        digest.update(b'\0')
    return 'v-' + digest.hexdigest()[:16]


class VersionedStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        prefix, _, remainder = path.partition('/')
        versioned = prefix.startswith('v-')
        if versioned:
            # Never serve changed bytes under a previously immutable URL.
            if prefix != asset_version(Path(self.directory)):
                raise HTTPException(status_code=404)
            path = remainder
        response = await super().get_response(path, scope)
        response.headers['Cache-Control'] = ('public, max-age=31536000, immutable'
                                             if versioned else 'no-cache')
        return response
