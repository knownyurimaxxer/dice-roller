"""
Turns the digits 0-9 of the app's number font (assets/fonts/Inter-Black.otf)
into triangles for the dice, written to src/dice/glyphs.ts. The dice are drawn
with raw WebGL, which has no text, so this is how their numbers get the very
same letterforms as the big result number (which uses the same font file).

    pip install fonttools
    python3 tools/generate_glyphs.py [path/to/font.otf]

Run it again only if you swap the font (and change NUMBER_FONT in
src/constants.ts to match).
"""
import math
import os
import sys

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
FONT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "assets", "fonts", "Inter-Black.otf")
OUT = os.path.join(ROOT, "src", "dice", "glyphs.ts")
CURVE_STEPS = 8  # straight pieces per curve


class Flatten(BasePen):
    """Collects each outline as a list of points, curves cut into pieces."""

    def __init__(self, glyphs):
        super().__init__(glyphs)
        self.contours = []
        self.cur = None

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, CURVE_STEPS + 1):
            t = i / CURVE_STEPS
            u = 1 - t
            self.cur.append(
                (
                    u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                    u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
                )
            )

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, CURVE_STEPS + 1):
            t = i / CURVE_STEPS
            u = 1 - t
            self.cur.append(
                (
                    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
                )
            )

    def _closePath(self):
        c = self.cur
        if len(c) > 1 and c[0] == c[-1]:
            c.pop()
        if len(c) >= 3:
            self.contours.append(c)
        self.cur = None

    _endPath = _closePath


def area(poly):
    return 0.5 * sum(
        poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1]
        for i in range(len(poly))
    )


def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def segs_cross(a, b, c, d):
    """True if segment ab properly crosses (or touches the inside of) cd."""
    eps = 1e-9
    d1, d2 = cross(a, b, c), cross(a, b, d)
    d3, d4 = cross(c, d, a), cross(c, d, b)
    return ((d1 > eps and d2 < -eps) or (d1 < -eps and d2 > eps)) and (
        (d3 > eps and d4 < -eps) or (d3 < -eps and d4 > eps)
    )


def edges(poly):
    return [(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly))]


def bridge(outer, hole, others):
    """Joins a hole to the outline with a cut that crosses nothing."""
    all_edges = edges(outer) + edges(hole) + [e for o in others for e in edges(o)]
    # start from the hole's rightmost point, try the nearest outline points first
    order = sorted(range(len(hole)), key=lambda i: -hole[i][0])
    for hi in order:
        h = hole[hi]
        for oi in sorted(range(len(outer)), key=lambda i: math.dist(outer[i], h)):
            o = outer[oi]
            if any(segs_cross(h, o, a, b) for a, b in all_edges):
                continue
            mid = ((h[0] + o[0]) / 2, (h[1] + o[1]) / 2)
            if not inside(mid, outer) or any(inside(mid, k) for k in [hole] + others):
                continue
            rot = hole[hi:] + hole[:hi]
            return outer[: oi + 1] + rot + [rot[0]] + outer[oi:]
    raise RuntimeError("could not join a hole")


def inside(p, poly):
    x, y = p
    c = False
    for (x1, y1), (x2, y2) in edges(poly):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def ear_clip(poly):
    """Triangles (as point triples, counter-clockwise) of a simple polygon."""
    pts = list(poly)
    tris = []
    eps = 1e-7

    def in_tri(p, a, b, c):
        return cross(a, b, p) >= -eps and cross(b, c, p) >= -eps and cross(c, a, p) >= -eps

    guard = 0
    while len(pts) > 3 and guard < 100000:
        guard += 1
        n = len(pts)
        cut = None
        for i in range(n):
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
            cr = cross(a, b, c)
            if abs(cr) <= eps:  # a flat point adds nothing: drop it
                cut = (i, False)
                break
            if cr < 0:
                continue
            if any(
                p not in (a, b, c) and in_tri(p, a, b, c)
                for p in pts
            ):
                continue
            cut = (i, True)
            break
        if cut is None:
            raise RuntimeError("no ear found")
        i, emit = cut
        if emit:
            tris.append((pts[i - 1], pts[i], pts[(i + 1) % n]))
        pts.pop(i)
    if len(pts) == 3 and abs(cross(*pts)) > eps:
        tris.append(tuple(pts))
    return tris


def main():
    font = TTFont(FONT)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    raw = {}
    for d in "0123456789":
        name = cmap[ord(d)]
        pen = Flatten(gs)
        gs[name].draw(pen)
        raw[d] = (pen.contours, font["hmtx"][name][0])
    # one height for every digit, so the numbers sit level: baseline to top
    ys = [y for cs, _ in raw.values() for c in cs for _, y in c]
    y0, y1 = min(ys), max(ys)
    scale = 1.0 / (y1 - y0)

    out = []
    for d, (cs, adv) in raw.items():
        cs = sorted(cs, key=lambda c: -abs(area(c)))
        outer = cs[0] if area(cs[0]) > 0 else cs[0][::-1]
        holes = [c if area(c) < 0 else c[::-1] for c in cs[1:]]
        holes.sort(key=lambda h: -max(p[0] for p in h))
        poly = outer
        for k, h in enumerate(holes):
            poly = bridge(poly, h, holes[k + 1 :])
        tris = ear_clip(poly)
        want = abs(area(outer)) - sum(abs(area(h)) for h in holes)
        got = sum(cross(*t) / 2 for t in tris)
        assert abs(got - want) < want * 1e-4, (d, got, want)
        verts, index = [], {}
        idx = []
        for t in tris:
            for p in t:
                key = (round(p[0], 3), round(p[1], 3))
                if key not in index:
                    index[key] = len(verts)
                    verts.append(key)
                idx.append(index[key])
        xs = [p[0] for p in verts]
        final = [(round(x * scale, 4), round((y - y0) * scale, 4)) for x, y in verts]
        # rounding can squash a sliver flat or flip it: drop those
        kept = []
        for i in range(0, len(idx), 3):
            a, b, c = (final[idx[i + k]] for k in range(3))
            if cross(a, b, c) / 2 > 1e-7:
                kept += idx[i : i + 3]
        out.append(
            (
                d,
                round(adv * scale, 4),
                round((min(xs)) * scale, 4),
                round(max(xs) * scale, 4),
                final,
                kept,
            )
        )
        print(d, len(kept) // 3, "triangles")

    lines = [
        "/**",
        " * GENERATED by tools/generate_glyphs.py from assets/fonts/Inter-Black.otf.",
        " * Do not edit by hand. The digits 0-9 of the number font as triangles:",
        " * 1 high (baseline 0, top 1), x measured from the pen position.",
        " */",
        "export type Glyph = {",
        "\t/** How far the pen moves on after this digit. */",
        "\tadvance: number;",
        "\t/** Left and right edge of the ink. */",
        "\txMin: number;",
        "\txMax: number;",
        "\t/** x, y pairs. */",
        "\tvertices: number[];",
        "\t/** Three vertex numbers per triangle, counter-clockwise. */",
        "\tindices: number[];",
        "};",
        "",
        "export const GLYPHS: Record<string, Glyph> = {",
    ]
    for d, adv, xmin, xmax, verts, idx in out:
        flat = ",".join(f"{v:g}" for p in verts for v in p)
        lines += [
            f'\t"{d}": {{',
            f"\t\tadvance: {adv:g},",
            f"\t\txMin: {xmin:g},",
            f"\t\txMax: {xmax:g},",
            f"\t\tvertices: [{flat}],",
            f"\t\tindices: [{','.join(map(str, idx))}],",
            "\t},",
        ]
    lines += ["};", ""]
    with open(OUT, "w") as f:
        f.write("\n".join(lines))
    print("wrote", os.path.normpath(OUT), os.path.getsize(OUT), "bytes")


main()
