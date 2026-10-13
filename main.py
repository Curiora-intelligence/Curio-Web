from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers.home import router

app = FastAPI(title='Curio Interface', docs_url=None, redoc_url=None)
app.mount('/static', StaticFiles(directory="static"), name='static')
app.include_router(router)
