#!/usr/bin/env python3
"""Create reusable character recordings only on a cloud build runner."""
import argparse, hashlib, json, math, os, pathlib, subprocess, tempfile, time
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "audio"
PLAN = json.loads((ROOT / "cloud" / "voice-plan.json").read_text())
RATE = 24000
RECIPE = "kokoro-0.9.4-loudnorm-18-v1"

def identity(clip):
    data = [RECIPE, PLAN["model"], clip["text"], clip["voice"], clip["language"], clip["speed"]]
    return hashlib.sha256(json.dumps(data, ensure_ascii=False).encode()).hexdigest()[:16]

def existing():
    try:
        return json.loads((OUT / "manifest.json").read_text())
    except (OSError, ValueError):
        return {}

def reusable(clip, entry):
    path = OUT / pathlib.Path(entry.get("url", "")).name
    return (entry.get("fingerprint") == identity(clip) and
            entry.get("text") == clip["text"] and path.is_file() and
            hashlib.sha256(path.read_bytes()).hexdigest() == entry.get("sha256"))

def pending(manifest):
    return [c for c in PLAN["clips"] if not reusable(c, manifest.get("clips", {}).get(c["id"], {}))]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    old = existing()
    todo = pending(old)
    if args.check:
        value = "true" if todo else "false"
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                f.write("needed=" + value + "\n")
        audit_ok = False
        try:
            audit = json.loads((ROOT / "review/voice-audit.json").read_text())
            audit_ok = audit.get("success") and audit.get("manifestSha256") == hashlib.sha256((OUT / "manifest.json").read_bytes()).hexdigest()
        except (OSError, ValueError):
            pass
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                f.write("audit_needed=" + ("true" if todo or not audit_ok else "false") + "\n")
        print(f"{len(todo)} recordings need generation; {len(PLAN['clips']) - len(todo)} can be reused.", flush=True)
        return
    OUT.mkdir(parents=True, exist_ok=True)
    clips = {c["id"]: old.get("clips", {}).get(c["id"]) for c in PLAN["clips"] if reusable(c, old.get("clips", {}).get(c["id"], {}))}
    if todo:
        import numpy as np
        import soundfile as sf
        from imageio_ffmpeg import get_ffmpeg_exe
        ffmpeg = get_ffmpeg_exe()
        import torch
        from kokoro import KPipeline
        torch.set_num_threads(min(4, os.cpu_count() or 2))
        torch.manual_seed(7)
        pipelines = {}
        started = time.monotonic()
        with tempfile.TemporaryDirectory(prefix="harbor-voices-") as tmp:
            for i, clip in enumerate(todo):
                lang = clip["language"]
                if lang not in pipelines:
                    model = next(iter(pipelines.values())).model if pipelines else True
                    pipelines[lang] = KPipeline(lang_code=lang, repo_id=PLAN["model"], model=model, device="cpu")
                with torch.inference_mode():
                    chunks = [audio.detach().cpu().numpy() for _, _, audio in
                              pipelines[lang](clip["text"], voice=clip["voice"], speed=clip["speed"]) if audio is not None]
                if not chunks:
                    raise RuntimeError("No audio for " + clip["id"])
                wave = np.concatenate(chunks).astype(np.float32)
                seconds = len(wave) / RATE
                rms = float(np.sqrt(np.mean(wave ** 2)))
                if not np.isfinite(wave).all() or not 1 < seconds < 45 or rms < .002:
                    raise RuntimeError(f"Invalid speech for {clip['id']}: {seconds}s, rms={rms}")
                wav = pathlib.Path(tmp) / "source.wav"
                sf.write(wav, wave, RATE)
                fingerprint = identity(clip)
                filename = clip["id"] + "-" + fingerprint + ".mp3"
                target = OUT / filename
                subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
                    "-af", "loudnorm=I=-18:TP=-2:LRA=9", "-ar", str(RATE), "-ac", "1",
                    "-codec:a", "libmp3lame", "-b:a", "80k", str(target)], check=True)
                decoded = subprocess.check_output([ffmpeg, "-v", "error", "-i", str(target),
                    "-f", "f32le", "-ac", "1", "-ar", str(RATE), "pipe:1"])
                probe = len(decoded) / (4 * RATE)
                clips[clip["id"]] = {"url": "audio/" + filename, "text": clip["text"],
                    "person": clip["person"], "voice": clip["voice"], "speed": clip["speed"],
                    "duration": round(float(probe), 3), "bytes": target.stat().st_size,
                    "fingerprint": fingerprint, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}
                print(f"[{i + 1}/{len(todo)}] {clip['id']} | {seconds:.1f}s | {time.monotonic() - started:.0f}s elapsed", flush=True)
    manifest = {"version": 2, "engine": "kokoro", "model": PLAN["model"], "package": PLAN["package"],
        "recipe": RECIPE, "sampleRate": RATE, "voices": PLAN["cast"], "clips": clips}
    if pending(manifest):
        raise RuntimeError("Voice library incomplete")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    retained = {pathlib.Path(c["url"]).name for c in clips.values()}
    # Only remove obsolete files in this generator-owned audio directory.
    for path in OUT.glob("*.mp3"):
        if path.name not in retained:
            path.unlink()
    print(f"Voice library ready: {len(clips)} recordings; {sum(c['bytes'] for c in clips.values()) / 1e6:.2f} MB.", flush=True)

if __name__ == "__main__":
    main()
