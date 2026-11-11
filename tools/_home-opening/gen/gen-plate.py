# Generate room-plate candidates with OpenAI images/generations (gpt-image-2).
# usage: python3 gen-plate.py <prompt.txt> <size> [n] [out-prefix]   (needs OPENAI_API_KEY in the environment)
#   e.g. python3 gen-plate.py laptop.txt 1536x1024 2 out/laptop
import base64, json, os, sys, urllib.request

prompt_path, size = sys.argv[1:3]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 1
prefix = sys.argv[4] if len(sys.argv) > 4 else "out/plate"
os.makedirs(os.path.dirname(prefix) or ".", exist_ok=True)
body = json.dumps({"model": os.environ.get("IMG_MODEL", "gpt-image-2"), "prompt": open(prompt_path).read(),
                   "size": size, "quality": "high", "n": n}).encode()
req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body, method="POST",
                             headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"], "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=600) as r:
        d = json.load(r)
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:400]); sys.exit(1)
for i, item in enumerate(d["data"]):
    path = f"{prefix}-{i + 1}.png"
    open(path, "wb").write(base64.b64decode(item["b64_json"]))
    print("saved", path)
print("usage", d.get("usage"))
