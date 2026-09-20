#!/usr/bin/env python3
"""Check the repository against the project's 25,000,000-byte per-file budget.

Run from any directory: python tools/check_file_sizes.py
No packages, network requests or changes to files are required.
"""
from pathlib import Path
import sys

LIMIT = 25_000_000
ROOT = Path(__file__).resolve().parents[1]
IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', '_local'}


def main() -> int:
    files = []
    try:
        for path in ROOT.rglob('*'):
            rel = path.relative_to(ROOT)
            if any(part in IGNORE_DIRS for part in rel.parts) or path.is_symlink():
                continue
            if path.is_file():
                files.append((path.stat().st_size, rel.as_posix()))
    except OSError as exc:
        print(f'Unable to check files: {exc}', file=sys.stderr)
        return 2
    oversized = [(size, name) for size, name in files if size >= LIMIT]
    for size, name in sorted(files, reverse=True)[:10]:
        print(f'{size / 1_000_000:7.3f} MB  {name}')
    if oversized:
        print(f'\nFAIL: {len(oversized)} file(s) are not below {LIMIT:,} bytes.')
        for size, name in oversized:
            print(f'  {name}: {size:,} bytes')
        return 1
    print(f'\nOK: all {len(files)} files are below {LIMIT:,} bytes.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
