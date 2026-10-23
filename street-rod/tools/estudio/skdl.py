# Baja los modelos de roster.json desde Sketchfab con el token de ~/.sketchfab_token (nunca se imprime)
import json, os, subprocess, sys, zipfile
SP = os.path.dirname(os.path.abspath(__file__))
tok = open(os.path.expanduser('~/.sketchfab_token')).read().strip()
roster = json.load(open(os.path.join(SP, 'roster.json')))
only = sys.argv[1:]
for key, m in roster.items():
    if only and key not in only: continue
    d = os.path.join(SP, 'models', key)
    if os.path.exists(os.path.join(d, 'scene.gltf')) or os.path.exists(os.path.join(d, 'model.glb')):
        print(key, 'ya está'); continue
    os.makedirs(d, exist_ok=True)
    r = subprocess.run(['curl', '-s', '-H', 'Authorization: Token ' + tok, f"https://api.sketchfab.com/v3/models/{m['uid']}/download"], capture_output=True)
    try: info = json.loads(r.stdout)
    except Exception: print(key, 'error', r.stdout[:120]); continue
    if 'glb' in info:
        subprocess.run(['curl', '-s', '-L', '-o', os.path.join(d, 'model.glb'), info['glb']['url']]); print(key, 'glb', info['glb'].get('size'))
    elif 'gltf' in info:
        z = os.path.join(d, 'model.zip')
        subprocess.run(['curl', '-s', '-L', '-o', z, info['gltf']['url']])
        zipfile.ZipFile(z).extractall(d); os.remove(z); print(key, 'gltf', info['gltf'].get('size'))
    else:
        print(key, 'sin descarga:', list(info.keys())[:5])
