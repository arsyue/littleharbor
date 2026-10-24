#!/usr/bin/env python3
"""Cloud-only decoding and independent speech readback of each character."""
import hashlib, json, pathlib, re, subprocess, tempfile
from faster_whisper import WhisperModel
from imageio_ffmpeg import get_ffmpeg_exe
ffmpeg = get_ffmpeg_exe()
ROOT = pathlib.Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / "web/audio/manifest.json").read_text())
plan = json.loads((ROOT / "cloud/voice-plan.json").read_text())
assert len(manifest["clips"]) == len(plan["clips"])
assert len(plan["clips"]) >= 88
for expected in plan["clips"]:
    clip = manifest["clips"][expected["id"]]
    path = ROOT / "web" / clip["url"]
    assert clip["text"] == expected["text"]
    assert hashlib.sha256(path.read_bytes()).hexdigest() == clip["sha256"]
    subprocess.run([ffmpeg, "-v", "error", "-i", str(path), "-f", "null", "-"], check=True)
def words(text):
    return re.findall(r"[a-z]+", text.lower().replace("’", "'").replace("'", ""))
def wer(expected, actual):
    a, b = words(expected), words(actual)
    row = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        new = [i]
        for j, y in enumerate(b, 1):
            new.append(min(new[-1] + 1, row[j] + 1, row[j - 1] + (x != y)))
        row = new
    return row[-1] / max(1, len(a))
model = WhisperModel("base.en", device="cpu", compute_type="int8", cpu_threads=2)
sample_ids = [p + "-greeting" for p in plan["cast"]] + [m + "-0-say" for m in ["welcome", "market", "design", "delivery"]]
sample_ids += ["work-bake-rolls-order", "work-bake-loaf-order", "work-bake-braid-order", "work-guest-Alice-order", "work-guest-Rowan-order", "work-clay-0-order", "work-museum-welcome"]
readbacks = []
for key in sample_ids:
    clip = manifest["clips"][key]
    segments, _ = model.transcribe(str(ROOT / "web" / clip["url"]), language="en", beam_size=5, condition_on_previous_text=False)
    actual = " ".join(s.text.strip() for s in segments)
    error = wer(clip["text"], actual)
    readbacks.append({"id": key, "expected": clip["text"], "heard": actual, "wordErrorRate": round(error, 3)})
    print(key, "word error rate", round(error, 3), actual, flush=True)
report = {"success": all(r["wordErrorRate"] <= .25 for r in readbacks), "engine": "kokoro",
    "clips": len(manifest["clips"]), "durationSeconds": round(sum(c["duration"] for c in manifest["clips"].values()), 1),
    "totalBytes": sum(c["bytes"] for c in manifest["clips"].values()),
    "allClipsDecoded": True, "manifestSha256": hashlib.sha256((ROOT / "web/audio/manifest.json").read_bytes()).hexdigest(), "readbacks": readbacks}
(ROOT / "review").mkdir(exist_ok=True)
(ROOT / "review/voice-audit.json").write_text(json.dumps(report, indent=2) + "\n")
assert report["success"], "A voice sample needs pronunciation review"
print(f"All {len(manifest['clips'])} recordings decode; {len(readbacks)} readback samples passed.", flush=True)
