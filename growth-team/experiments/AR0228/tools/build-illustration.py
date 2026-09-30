#!/usr/bin/env python3
"""Generate the AR0228 success-modal illustration from its Figma vector exports.

Coordinate system verified empirically: every offset below (px and %) resolves
against the 370x220 `illustration` frame (node 93:21734). Confirmed by measuring
the blue disc in Figma's own render -- x 93..276, matching `left:93 size:183.6`.
"""
import os, subprocess, time

OUT = "/Users/renataraggio/Claude/hubstaff/teams/growth-team/experiments/AR0228/assets/success"
BASE = "https://www.figma.com/api/mcp/asset/"

# (filename, uuid, css) -- emitted in this order, which is the Figma z-order.
ITEMS = []

def px(name, uid, left, top, size):
    ITEMS.append((name, uid, f"left:{left}px;top:{top}px;width:{size}px;height:{size}px"))

def box(name, uid, left, top, w, h):
    ITEMS.append((name, uid, f"left:{left}px;top:{top}px;width:{w}px;height:{h}px"))

FW, FH = 370.0, 220.0  # the illustration frame

def inset(name, uid, t, r, b, l):
    """Resolve a Figma percentage inset to explicit px.

    An <img> is a replaced element: with all four insets and auto width/height
    it renders at its INTRINSIC size and the insets only position it. So the
    box has to be resolved here rather than left to the browser.
    """
    left, top = l / 100 * FW, t / 100 * FH
    w = (100 - l - r) / 100 * FW
    h = (100 - t - b) / 100 * FH
    ITEMS.append((name, uid,
                  f"left:{left:.2f}px;top:{top:.2f}px;width:{w:.2f}px;height:{h:.2f}px"))

px("bg-glow", "fb9e299d-8e49-4b4e-9a44-5d1bfc72f738", -40, -40, 220)
for i, (uid, l, t, s) in enumerate([
    ("8ff405c5-ad13-4a67-acdd-5200744ed515", 18, 18, 6),
    ("bfd92e2a-82d3-4720-8502-8326d0447030", 52, 26, 4),
    ("9a0d6f3e-8d5b-4909-bbe0-b5e94ef79ea7", 86, 14, 5),
    ("f916b0ad-6e36-4ad8-813f-bbfa9defe336", 120, 34, 3),
    ("e9e5bc8a-df6a-46a5-aea2-189e5d2f1bb9", 154, 22, 4),
    ("6c75939b-9daf-4835-bb49-d3aef8531925", 188, 40, 5),
    ("9fb143c0-5d6e-425e-927a-d721bcdf6571", 222, 28, 3),
    ("7fbb7902-7a40-4cc7-8b6e-cf628aa2a9a7", 256, 16, 4),
    ("9ff5f637-0f6e-45ca-8a7f-b6b602cfa26f", 290, 32, 5),
    ("d9340965-96cb-4b42-8ef3-8f5109c75c05", 324, 20, 3),
    ("2e788d83-d4dc-4704-9c2d-52e3b8d91c32", 358, 38, 4)], 1):
    px(f"star-{i}", uid, l, t, s)

# figure: backing disc, then body fragments (top right bottom left percentages)
px("disc", "69512ea2-8e2d-4228-bdfe-0b367398b28e", 93, 38.4, 183.605)
FIG = [
    ("rectangle", "b93474b6-540a-497c-b7f4-83f8d6485687", 32.68, 63.97, 63.12, 33.54),
    ("fill-1",  "bcb21c17-4f7c-4d74-8951-d332bd477ab3", 26.98, 40.20, 28.24, 41.31),
    ("fill-3",  "ed03ec46-cc97-4758-b7d8-aeb3af2b8474", 38.61, 45.49, 57.36, 52.99),
    ("fill-5",  "374a591b-240b-4b9c-8ec2-ca1d21079f91", 38.61, 53.40, 57.36, 45.08),
    ("fill-7",  "ab4443ca-b874-431c-a5e6-6d462a0ba9dd", 44.25, 48.30, 44.57, 47.58),
    ("stroke-9","6b61b343-a48c-4ca0-8615-4ad54592f4d4", 44.70, 49.95, 54.92, 49.50),
    ("fill-11", "b030730b-e711-4537-80a0-8fb268af199d", 30.96, 46.55, 52.15, 46.09),
    ("fill-13", "33d53a91-b24e-4b47-b4a3-fc96b43869ed", 29.05, 46.02, 58.01, 44.28),
    ("stroke-15","24ce4d6e-c2a1-490b-9f8a-4e28882aed6c", 36.04, 51.17, 63.00, 46.79),
    ("stroke-17","c71e722b-8d8e-4073-9ea1-7f1e834bdb00", 36.20, 47.38, 62.99, 50.22),
    ("stroke-19","e2b17412-ec00-4535-82a7-068211b2b8ab", 37.00, 50.21, 57.57, 48.84),
    ("stroke-21","231da78b-b82d-4c21-8940-72ed0a6734a1", 38.12, 51.54, 60.38, 47.16),
    ("stroke-23","4dd10b81-1726-4150-9868-39112b29a3b1", 38.12, 48.00, 60.38, 50.71),
    ("fill-25", "3cd31fcb-da64-4a23-8ae2-278ae2028953", 43.13, 49.43, 55.68, 48.74),
    ("stroke-27","4c9b6419-7eab-472f-8fb7-13974c2ec86a", 42.91, 49.30, 55.46, 48.61),
    ("stroke-29","bf6abcb4-7ea8-4353-bc97-c179222b47d9", 45.27, 49.95, 54.39, 49.33),
    ("fill-31", "3379da5e-953d-46db-b78e-5a07cd3f7a4c", 41.94, 46.01, 53.87, 53.21),
    ("fill-33", "4861e13a-70e5-440a-b119-1215518a5007", 41.94, 53.67, 53.87, 45.54),
    ("fill-35", "6b7b4bdd-dc87-4c59-858a-0100f0d3dd1a", 10.54, 28.33, 74.51, 67.08),
    ("stroke-37","1e1f6914-0cd0-49b6-966e-c02dbfc8bf95", 10.92, 29.71, 84.04, 69.86),
    ("stroke-39","bc76b84c-cf79-4a9e-bfda-f0c7ee8c0ddf", 11.54, 29.06, 83.39, 70.60),
    ("stroke-41","d48df1fa-4f1b-4d18-a957-3c8090433c56", 13.68, 28.53, 82.46, 71.15),
    ("fill-43", "c395c005-c934-4fbd-b274-cff2ad677b5c", 20.46, 28.82, 49.86, 61.31),
    ("fill-45", "ca649a80-b183-4b93-b1aa-a483c7256c32", 42.24, 34.27, 33.53, 52.23),
    ("fill-47", "96ba0f11-9084-4dbc-b6ca-60835bb6101e", 51.72, 39.07, 33.09, 52.13),
]
for n, u, t, r, b, l in FIG:
    inset(n, u, t, r, b, l)
box("intersect", "58a205a7-ec19-4880-8e7b-5809d9b733c5", 154.47, 188.84, 62.781, 33.104)
FIG2 = [
    ("fill-67", "5748eaf4-3f28-44ac-9368-8ba129948ecf", 83.24, 44.70, 13.80, 44.32),
    ("fill-69", "7b7f6e05-bd58-424e-a442-c5bc91496108", 83.24, 45.06, 16.76, 44.77),
    ("stroke-71","dea7e7cd-7ba1-4a3d-8ad3-44395cf17e54", 85.72, 44.96, 13.95, 44.60),
    ("fill-73", "2f19e63c-d11b-4179-aab0-9d3ef10ccff6", 10.10, 63.95, 74.97, 31.26),
    ("stroke-75","6f2224a0-25a0-4ffd-b685-4ef4c09393e6", 10.46, 66.66, 84.51, 32.90),
    ("stroke-77","c7254c3e-70e2-489c-b818-8bd438bb3c1a", 10.97, 67.33, 83.98, 32.18),
    ("stroke-79","a8542e48-7aa6-4134-b9e3-f08e374d071a", 13.00, 68.07, 83.14, 31.59),
    ("fill-81", "ac14a9ad-f6d9-40cd-b5d1-9075b5f433b6", 20.16, 59.81, 49.21, 31.51),
    ("fill-83", "8219399d-dcd2-42bb-905a-35c216411c96", 42.68, 51.93, 31.75, 35.53),
    ("fill-85", "2eeacbe1-c0e9-461a-93a2-198a01a1a9bb", 53.21, 51.83, 31.29, 39.56),
    ("stroke-87","7f1df228-8551-4cac-8183-afc2554ce81e", 82.90, 50.45, -0.92, 49.09),
    ("fill-89", "0ffa3f76-4a62-44ba-88ce-9b0d70d83827", 51.17, 42.12, 16.98, 41.67),
    ("stroke-91","8f357c2c-91f7-47dc-b493-a0806c7e41dc", 54.58, 48.41, 44.83, 48.04),
    ("stroke-93","379be95e-5464-42ee-9b38-95bdbcd4127f", 67.36, 44.44, 32.20, 43.63),
    ("stroke-95","9ce9d9ae-d519-4a5f-b105-5bca12264b76", 61.02, 43.03, 16.76, 42.64),
]
for n, u, t, r, b, l in FIG2:
    inset(n, u, t, r, b, l)

# Pentagram stars. Each Figma instance nests the glyph at inset 13.41/15.05/19.8/15.05
# inside an overflow-clip box; that inset is folded into the emitted geometry.
PENTA = [("penta-1", "02ab2cb4-3106-4e1e-acb6-bf75c75d1540", 142.3, 6.85, 37.21),
         ("penta-2", "89ef6ca8-6c67-41ea-ba77-81e6378a43f9", 179.5, 31.12, 19.41),
         ("penta-3", "89ef6ca8-6c67-41ea-ba77-81e6378a43f9", 321.0, 117.0, 19.41),
         ("penta-4", "9d50dfb3-b412-4ab3-8911-11e7207c6614", 199.8, 2.0, 26.69),
         ("penta-5", "9d50dfb3-b412-4ab3-8911-11e7207c6614", 18.0, 82.0, 26.69)]
for n, u, l, t, s in PENTA:
    gl, gt = l + s * .1505, t + s * .1341
    gw, gh = s * (1 - .1505 - .1505), s * (1 - .1341 - .198)
    ITEMS.append((n, u, f"left:{gl:.2f}px;top:{gt:.2f}px;width:{gw:.2f}px;height:{gh:.2f}px"))

for n, u, l, t, s in [
    ("confetti-1", "b3ba33bc-0487-4d02-ad53-d3ec157562ff", 24, 13, 10),
    ("confetti-2", "d4dd8af2-389a-4516-b89c-971b800cf6f7", 61, 29, 8),
    ("confetti-3", "9995e9eb-3617-4399-b581-8631016a5e57", 328, 39, 10),
    ("confetti-4", "9995e9eb-3617-4399-b581-8631016a5e57", 61, 120, 10),
    ("confetti-5", "083daaf8-d4c2-4da1-adaa-addc7d7c116a", 35, 174, 10),
    ("confetti-6", "d4dd8af2-389a-4516-b89c-971b800cf6f7", 75, 186, 8),
    ("confetti-7", "d4dd8af2-389a-4516-b89c-971b800cf6f7", 304, 80, 8),
    ("confetti-8", "b3ba33bc-0487-4d02-ad53-d3ec157562ff", 307, 168, 10),
    ("confetti-9", "9f8df098-a08a-4acc-940e-fe9dc695ec5d", 327, 186, 8),
    ("sparkle-1", "109ae5c3-62d2-4b91-9c70-74b061b26ac3", 12, 12, 4),
    ("sparkle-2", "9a37161c-7e87-47d5-9242-6f1eb61fb88c", 380, 18, 3),
    ("sparkle-3", "11e20750-a2b6-4620-a239-f59cb2124a72", 18, 190, 3),
    ("sparkle-4", "ba6d9b1c-2fea-42aa-9391-af0489a32f0f", 370, 180, 4)]:
    px(n, u, l, t, s)

os.makedirs(OUT, exist_ok=True)
seen, html = {}, []
for name, uid, css in ITEMS:
    fn = seen.get(uid)
    if not fn:
        fn = name + ".svg"
        seen[uid] = fn
        if os.path.exists(os.path.join(OUT, fn)):
            html.append(f'    <img src="assets/success/{fn}" alt="" style="{css}" />')
            continue
        # The asset endpoint answers 202 with an empty body while it renders,
        # so fetch with curl and retry until real SVG bytes come back.
        for attempt in range(6):
            data = subprocess.run(["curl", "-sL", BASE + uid + ".svg"],
                                  capture_output=True).stdout
            if data.lstrip()[:4] == b"<svg":
                break
            time.sleep(1)
        assert data.lstrip()[:4] == b"<svg", (name, uid, data[:60])
        open(os.path.join(OUT, fn), "wb").write(data)
    html.append(f'    <img src="assets/success/{fn}" alt="" style="{css}" />')

open(os.path.join(OUT, "_fragment.html"), "w").write("\n".join(html) + "\n")
print(f"downloaded {len(seen)} unique svgs, emitted {len(ITEMS)} layers")
