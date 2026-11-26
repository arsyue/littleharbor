#!/usr/bin/env python3
"""Install the tested Word Armor release on an existing systemd deployment."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import time
from urllib.request import Request, urlopen
from zipfile import ZipFile

SERVICE = "word-armor-game"
LIVE = Path("/opt/word-armor-service")
ORIGIN = "https://word-armor-field.abloom-chub-6743.chatgpt.site/downloads/"
BASE = "http://127.0.0.1:8486/word-armor/"
PUBLIC = "https://wordgame.educationstudio.cn/word-armor/"
PACKS = {
    "Word-Armor-Server.zip": "ff880bf57223c3a1f9d31f5da0109f4c81f5b4188e537913970e599269886398",
    "Word-Armor-LAN.zip": "f4afc9b2bb1de3a981bcd91d048cdc7d050b570e21359f74f0cff413a11210e5",
}

def check(ok, message):
    if not ok:
        raise RuntimeError(message)

def call(base, route, data=None, key=""):
    payload = None if data is None else json.dumps(data).encode()
    req = Request(base+route, data=payload, headers={"Content-Type": "application/json", "X-Player": key})
    with urlopen(req, timeout=12) as response:
        return json.load(response)

def wait_ready():
    for attempt in range(20):
        try:
            if call(BASE, "healthz").get("ok"):
                return
        except OSError:
            pass
        time.sleep(0.5)
    raise RuntimeError("Local service health check failed")

def verify_game(base):
    room = call(base, "api/rooms", {"size":1, "maxHP":7, "hint":"letters"})
    path = "api/rooms/"+room["code"]+"/"
    host = room["token"]
    guest = None
    try:
        guest = call(base, path+"join", {"team":1, "name":"Update test"}, "")["token"]
        start = call(base, path+"start", {}, host)["game"]
        units = {t["id"]:t for t in start["tanks"]}
        check(units["A1"]["mask"] == "R_ _ _ _" and units["B1"]["hp"] == 7, "Clue or custom HP check failed")
        shot = call(base, path+"attack", {"word":"forest"}, host)
        other = call(base, path.rstrip("/"), None, guest)["game"]
        check(shot["correct"] and {t["id"]:t["hp"] for t in other["tanks"]} == {"A1":7,"B1":6}, "Word-only attack or synchronization failed")
    finally:
        for key in [guest, host]:
            if key:
                try: call(base, path+"leave", {}, key)
                except OSError: pass

def update():
    check(os.geteuid() == 0, "Run as root or with sudo")
    check((LIVE/"server.mjs").is_file() and (LIVE/"public"/"index.html").is_file(), "Existing Word Armor installation not found")
    lock = open("/run/lock/word-armor-update.lock", "a")
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    subprocess.run(["systemctl","is-active","--quiet",SERVICE], check=True)
    check(call(BASE, "healthz").get("edition") == "server", "Expected server edition under /word-armor/")
    work = Path(tempfile.mkdtemp(prefix="word-armor-update.", dir=LIVE.parent))
    stage = work/"stage"
    backup = work/"previous"
    stage.mkdir()
    backup.mkdir()
    (stage/"downloads").mkdir()
    print("Preparing checked packages in", work, flush=True)
    for name, expected in PACKS.items():
        path = stage/"downloads"/name
        subprocess.run(["curl","--fail","--silent","--show-error","--location","--proto","=https","--proto-redir","=https","--retry","2","--connect-timeout","15","--max-time","360","--output",str(path),ORIGIN+name], check=True)
        check(hashlib.sha256(path.read_bytes()).hexdigest() == expected, "Checksum mismatch: "+name)
        path.chmod(0o644)
    files = []
    with ZipFile(stage/"downloads"/"Word-Armor-Server.zip") as archive:
        for item in archive.infolist():
            if item.is_dir() or not item.filename.startswith("Word-Armor-Server/"):
                continue
            rel = Path(item.filename[len("Word-Armor-Server/"):])
            if rel.is_absolute() or ".." in rel.parts:
                raise RuntimeError("Invalid archive path")
            if rel.as_posix() not in ("game.mjs", "server.mjs") and rel.parts[:1] != ("public",):
                continue
            dest = stage/rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(archive.read(item))
            files.append(rel)
    check(all(Path(p) in files for p in ["game.mjs","server.mjs","public/index.html","public/engine.js","public/app.js"]), "Incomplete server package")
    files += [Path("downloads")/name for name in PACKS]
    for rel in files:
        target = LIVE/rel
        check((target.parent.resolve() == LIVE.resolve() or LIVE.resolve() in target.parent.resolve().parents) and not target.is_symlink(), "Unexpected installation layout: "+str(rel))
        target.parent.mkdir(parents=True, exist_ok=True)
        check(not target.exists() or target.is_file(), "Unexpected file type: "+str(rel))
        if target.is_file():
            old = backup/rel
            old.parent.mkdir(parents=True, exist_ok=True)
            os.link(target, old)
            original = target.stat()
            os.chown(stage/rel, original.st_uid, original.st_gid)
            (stage/rel).chmod(stat.S_IMODE(original.st_mode))
    changed = []
    try:
        for rel in files:
            os.replace(stage/rel, LIVE/rel)
            changed.append(rel)
        subprocess.run(["systemctl","restart",SERVICE], check=True)
        wait_ready()
        verify_game(BASE)
    except BaseException:
        if changed:
            for rel in reversed(changed):
                old = backup/rel
                if old.exists(): os.replace(old, LIVE/rel)
                else: (LIVE/rel).unlink()
            subprocess.run(["systemctl","restart",SERVICE], check=True)
            wait_ready()
            print("Restored previous game files and service.", flush=True)
        raise
    print("Local release and two-player match verified. Previous files:",backup,flush=True)
    verify_game(PUBLIC)
    for name in PACKS:
        req = Request(PUBLIC+"downloads/"+name, method="HEAD")
        with urlopen(req,timeout=15) as response:
            check(int(response.headers["Content-Length"]) == (LIVE/"downloads"/name).stat().st_size, "Download size mismatch: "+name)
    print("WORD ARMOR UPDATE OK - public multiplayer and both downloads verified", flush=True)

if __name__ == "__main__":
    update()
