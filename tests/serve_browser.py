"""Development-only verification harness. Never imported by main.py.
Serves the real templates/modules with a controlled backend at /__fixtures.
Run: uvicorn tests.serve_browser:app --host 127.0.0.1 --port 8018
"""
import asyncio
import json
from pathlib import Path
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

ROOT = Path(__file__).resolve().parents[1]
app = FastAPI()
app.mount('/static', StaticFiles(directory=ROOT/'static'), name='static')
templates = Jinja2Templates(directory=ROOT/'templates')
runs = {}
submissions = []
socket_events = []
ANSWER = 'Here is a simple starting point.\n\n**Keep the goal clear.** Break the work into small, testable steps.\n\n```python\nprint("Hello, Curio")\n```\n\n| Step | Purpose |\n| --- | --- |\n| Define | Agree on the outcome |\n| Verify | Check what changed |\n\n<script>alert("unsafe")</script>\n[Unsafe](javascript:alert(1))\n\n[Reference](https://example.com)'

@app.get('/__test/setup.js')
async def setup(): return FileResponse(ROOT/'tests/browser_setup.js', media_type='text/javascript')
@app.get('/__test/checks.js')
async def checks(): return FileResponse(ROOT/'tests/browser_checks.js', media_type='text/javascript')
@app.get('/__test/theme.js')
async def theme_checks(): return FileResponse(ROOT/'tests/theme_checks.js', media_type='text/javascript')

@app.get('/__test/tokens.css')
async def theme(appearance: str = 'dark'):
    # Browser automation has no OS-media override. Test styles emulate its CSS query only.
    css = (ROOT/'static/css/tokens.css').read_text()
    css = css.replace('(prefers-color-scheme: dark)', 'all' if appearance == 'dark' else 'not all')
    css += f'\n:root {{ color-scheme: {"dark" if appearance == "dark" else "light"}; }}'
    from fastapi.responses import Response
    return Response(css, media_type='text/css')

@app.get('/__test/app', response_class=HTMLResponse)
@app.get('/browser-tests', response_class=HTMLResponse)
@app.get('/__test/appearance', response_class=HTMLResponse)
async def page(request: Request, appearance: str = '', recovery: bool = False):
    origin = str(request.base_url).rstrip('/')
    config = {'apiBase':origin+'/__fixtures','wsBase':origin.replace('http','ws',1)+'/__fixtures','development':False}
    if request.url.path == '/__test/appearance':
        from app.core.config import Settings
        config = Settings().browser_config()
    html = templates.env.get_template('index.html').render(request=request, config=config)
    if request.url.path != '/__test/appearance':
        html = html.replace('<head>', '<head><script src="/__test/setup.js"></script>')
    if appearance in ('light','dark'):
        html = html.replace(str(request.url_for('static', path='css/tokens.css')), '/__test/tokens.css?appearance='+appearance)
    if recovery:
        runs['recovered-run'] = {'answer':'Recovered answer', 'conversation_id':'recovered-conversation','user_id':'fixture-user','status':'completed','message':'recovery'}
    if request.url.path == '/browser-tests':
        html = html.replace('</body>', '<script type="module" src="/__test/checks.js"></script></body>')
    return html

@app.get('/theme-tests', response_class=HTMLResponse)
async def themes():
    return '<!doctype html><title>Curio theme and layout checks</title><script type="module" src="/__test/theme.js"></script>'

@app.get('/__fixtures/auth/me')
async def identity(): return {'id':'fixture-user','name':'Test account','csrf':'test-csrf'}
@app.get('/__fixtures/health')
async def health(): return {'status':'ok'}
@app.get('/__fixtures/memory/{user}')
async def memories(user: str): return {'memories':[{'kind':'preference','key':'writing','value':'Concise explanations'}]}
@app.get('/__fixtures/marketplace/history/conversations')
async def history(): return {'conversations':[{'id':'stored-conversation','title':'Stored conversation'}]}
@app.get('/__fixtures/marketplace/conversations/{id}')
async def conversation(id: str): return {'messages':[{'id':'stored-message','role':'assistant','content':'This conversation came from the history endpoint.'}]}
@app.get('/__fixtures/state')
async def fixture_state(): return {'submissions':submissions,'socketEvents':socket_events}
@app.post('/__fixtures/curio/runs',status_code=202)
async def start(request: Request):
    form = await request.form()
    record = {key:str(value) for key,value in form.items() if key != 'image'}
    record['image'] = getattr(form.get('image'),'filename',None)
    record['csrf'] = request.headers.get('x-csrf-token')
    record['identity'] = request.headers.get('x-curio-user-id')
    submissions.append(record)
    rid = record['request_id']
    if record['message'].startswith('[retry]') and sum(item['request_id'] == rid for item in submissions) == 1:
        return JSONResponse({'detail':'Temporary fixture failure'},status_code=503)
    runs[rid] = {'answer':ANSWER,'conversation_id':record.get('conversation_id','fixture-conversation'),'user_id':'fixture-user','status':'completed','message':record['message']}
    return {'request_id':rid,'status':'accepted'}
@app.get('/__fixtures/curio/runs/{rid}')
async def status(rid: str): return runs[rid]
@app.get('/__fixtures/curio/runs/{rid}/events')
async def events(rid: str):
    async def stream():
        result = runs[rid]
        if result['message'].startswith('[poll]'):
            yield 'event: stage\ndata: not-json\n\n'; return
        yield 'id: 1-0\nevent: stage\ndata: {"stage":"reasoning"}\n\n'
        # Replayed event verifies ID deduplication.
        yield 'id: 1-0\nevent: stage\ndata: {"stage":"reasoning"}\n\n'
        await asyncio.sleep(.6)
        yield 'id: 2-0\nevent: final\ndata: '+json.dumps(result)+'\n\n'
        yield 'id: 2-0\nevent: final\ndata: '+json.dumps(result)+'\n\n'
        yield 'id: 3-0\nevent: done\ndata: {}\n\n'
    return StreamingResponse(stream(),media_type='text/event-stream')
@app.websocket('/__fixtures/live/ws/{user}')
async def live(ws: WebSocket,user: str):
    await ws.accept()
    await ws.send_json({'type':'ready','frame_interval_seconds':5})
    try:
        while True:
            data = await ws.receive_json(); socket_events.append(data)
            if data['type'] == 'configure': await ws.send_json({'type':'configured','frame_interval_seconds':5})
            elif data['type'] == 'frame': await ws.send_json({'type':'observation','observation':{'objects':['test canvas']}})
            elif data['type'] == 'transcript':
                await asyncio.sleep(.4)
                await ws.send_json({'type':'response','answer':'Live fixture answer','conversation_id':'live-conversation','user_id':user})
    except WebSocketDisconnect: pass
