from fastapi import FastAPI
from app.core.assets import STATIC_ROOT, VersionedStaticFiles
from app.routers.home import router

app = FastAPI(title='Curio Web', docs_url=None, redoc_url=None)
app.mount('/static', VersionedStaticFiles(directory=STATIC_ROOT), name='static')
app.include_router(router)
