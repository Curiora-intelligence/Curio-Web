from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from app.core.config import Settings

router = APIRouter()
templates = Jinja2Templates(directory=Path(__file__).resolve().parents[2] / 'templates')


@router.get('/')
async def home(request: Request):
    return templates.TemplateResponse(request=request, name='index.html', context={'config': Settings().browser_config()})


@router.get('/interview')
async def interview(request: Request):
    return templates.TemplateResponse(request=request, name='interview.html', context={'config': Settings().browser_config()})

@router.get('/discover')
@router.get('/saved')
@router.get('/requests')
@router.get('/notifications')
@router.get('/history')
@router.get('/provider')
@router.get('/admin')
@router.get('/account')
async def marketplace(request: Request):
    page=request.url.path.strip('/')
    from fastapi import HTTPException
    if page not in ('discover','saved','requests','notifications','history','provider','admin','account'): raise HTTPException(404,'Page not found.')
    return templates.TemplateResponse(request=request,name='marketplace.html',context={'config':Settings().browser_config(),'page':page})
