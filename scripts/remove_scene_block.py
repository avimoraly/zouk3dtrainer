from pathlib import Path

path = Path('src/zouk-trainer.jsx')
lines = path.read_text(encoding='utf-8').splitlines()

for i, line in enumerate(lines):
    if line.strip() == 'import * as THREE from "three";':
        lines[i] = "import useTrainerScene from './hooks/useTrainerScene.js';"
        break

ui_line = None
for i, line in enumerate(lines, start=1):
    if line.strip() == '// ─── UI ──────────────────────────────────────────':
        ui_line = i
        break

start = None
for i, line in enumerate(lines, start=1):
    if 'const el = mountRef.current;' in line:
        start = i - 1
        break

if start is None or ui_line is None:
    raise RuntimeError('Could not locate effect block boundaries')

replacement = [
    '  useTrainerScene({ mountRef, bodySpeedRef, headSpeedRef, flexRef, speedMultRef });',
    ''
]

lines = lines[:start-1] + replacement + lines[ui_line-1:]
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'Updated {path} with {len(lines)} lines')
print(f'Removed block from line {start} to line {ui_line - 1}')
