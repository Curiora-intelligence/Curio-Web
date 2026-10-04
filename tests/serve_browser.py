"""Optional browser checks. Run only for development; never mounted by the app."""
from pathlib import Path
from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from app.main import app
from app.routers.pages import templates
from app.core.config import Settings

root = Path(__file__).resolve().parent
app.mount('/__tests', StaticFiles(directory=root), name='browser-tests')


@app.get('/browser-tests', response_class=HTMLResponse)
async def browser_tests(request: Request):
    html = templates.env.get_template('index.html').render(request=request, config={**Settings().browser_config(),'development':True})
    html = html.replace('<script id="curio-config"', '<script src="/__tests/browser_setup.js"></script><script id="curio-config"')
    html = html.replace('</body>', '<script type="module" src="/__tests/browser_checks.js"></script></body>')
    return html


@app.get('/browser-interview-tests', response_class=HTMLResponse)
async def browser_interview_tests(request: Request):
    html = templates.env.get_template('interview.html').render(request=request, config={**Settings().browser_config(),'development':True})
    html = html.replace('<script id="curio-config"', '<script src="/__tests/browser_setup.js"></script><script src="/__tests/interview_setup.js"></script><script id="curio-config"')
    return html.replace('</body>', '<script type="module" src="/__tests/interview_checks.js"></script></body>')

@app.get('/browser-marketplace-tests',response_class=HTMLResponse)
async def marketplace_tests(request: Request):
    page=request.query_params.get('page','discover')
    if page not in {'discover','requests','notifications','history','saved','provider','admin','account'}: page='discover'
    html=templates.env.get_template('marketplace.html').render(request=request,config={**Settings().browser_config(),'development':False},page=page)
    html=html.replace('<script id="curio-config"','<script src="/__tests/marketplace_setup.js"></script><script id="curio-config"')
    checks='marketplace_checks.js' if page=='discover' else 'marketplace_portal_checks.js'
    return html.replace('</body>',f'<script type="module" src="/__tests/{checks}"></script></body>')
