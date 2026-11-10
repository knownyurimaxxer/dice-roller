"""
Turns the digits 0-9 of each of the dice number fonts (the files in
assets/fonts, listed in FONTS below) into triangles for the dice, written to
src/dice/glyphs.ts. The dice are drawn with raw WebGL, which has no text, so
this is how their numbers get the very same letterforms as the font.

    pip install fonttools
    python3 tools/generate_glyphs.py

Run it again only if you add or swap a font. To add one: put the file in
assets/fonts, add it to FONTS here and to DICE_FONTS in src/dice/fonts.ts.
"""
import math
import os
import sys
from fractions import Fraction

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
# id (as in src/dice/fonts.ts) -> file. All are the heaviest weight of their family.
FONTS = [
    ("inter", "Inter-Black.otf"),
    ("poppins", "Poppins-Black.ttf"),
    ("orbitron", "Orbitron-Black.ttf"),
    ("playfair", "PlayfairDisplay-BlackItalic.ttf"),
]
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


def on_segment(p, a, b, eps=1e-9):
    """True if p lies on the segment ab, not counting its two ends."""
    if math.dist(p, a) < 1e-9 or math.dist(p, b) < 1e-9:
        return False
    if abs(cross(a, b, p)) > eps * max(1.0, math.dist(a, b)):
        return False
    return min(a[0], b[0]) - 1e-9 <= p[0] <= max(a[0], b[0]) + 1e-9 and min(a[1], b[1]) - 1e-9 <= p[1] <= max(a[1], b[1]) + 1e-9


def edges(poly):
    return [(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly))]


CUT_GAP = 0.02  # width of the cut that joins a hole to the outline (font units, ~0.002% of the digit)


def bridge(outer, hole, others):
    """Joins a hole to the outline with a cut that crosses nothing. The two
    sides of the cut are a hair apart, so no two points of the result coincide."""
    all_edges = edges(outer) + edges(hole) + [e for o in others for e in edges(o)]
    # start from the hole's rightmost point, try the nearest outline points first
    order = sorted(range(len(hole)), key=lambda i: -hole[i][0])
    for hi in order:
        h = hole[hi]
        for oi in sorted(range(len(outer)), key=lambda i: math.dist(outer[i], h)):
            o = outer[oi]
            if any(segs_cross(h, o, a, b) for a, b in all_edges):
                continue
            if any(on_segment(p, h, o) for a, b in all_edges for p in (a, b)):
                continue
            mid = ((h[0] + o[0]) / 2, (h[1] + o[1]) / 2)
            if not inside(mid, outer) or any(inside(mid, k) for k in [hole] + others):
                continue
            length = math.dist(h, o)
            nx, ny = -(o[1] - h[1]) / length * CUT_GAP, (o[0] - h[0]) / length * CUT_GAP
            rot = hole[hi:] + hole[:hi]
            h2 = (h[0] + nx, h[1] + ny)
            o2 = (o[0] + nx, o[1] + ny)
            return outer[: oi + 1] + rot + [h2, o2] + outer[oi + 1 :]
    raise RuntimeError("could not join a hole")


def inside(p, poly):
    x, y = p
    c = False
    for (x1, y1), (x2, y2) in edges(poly):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


SNAP = 64  # outlines are snapped to 1/64 of a font unit so the exact arithmetic below stays small


def _fcross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def _winding(q, loops):
    """Winding number of the point q with respect to closed polygons (exact)."""
    w = 0
    for loop in loops:
        n = len(loop)
        for i in range(n):
            a, b = loop[i], loop[(i + 1) % n]
            if a[1] <= q[1]:
                if b[1] > q[1] and _fcross(a, b, q) > 0:
                    w += 1
            elif b[1] <= q[1] and _fcross(a, b, q) < 0:
                w -= 1
    return w


def merge_contours(contours):
    """The area a font fills (non-zero winding rule) as clean loops: counter-
    clockwise outlines and clockwise holes that overlap nothing, even when the
    font's own contours overlap, share edges or touch. All arithmetic is exact."""
    loops = []
    for c in contours:
        pts = []
        for x, y in c:
            q = (Fraction(round(x * SNAP), SNAP), Fraction(round(y * SNAP), SNAP))
            if not pts or pts[-1] != q:
                pts.append(q)
        if len(pts) > 1 and pts[0] == pts[-1]:
            pts.pop()
        if len(pts) >= 3:
            loops.append(pts)
    segs = [(l[i], l[(i + 1) % len(l)]) for l in loops for i in range(len(l))]

    # cut every segment where another one crosses or touches it
    pieces = set()
    for i, (a, b) in enumerate(segs):
        d1 = (b[0] - a[0], b[1] - a[1])
        cuts = {a, b}
        for j, (c, d) in enumerate(segs):
            if i == j:
                continue
            if max(a[0], b[0]) < min(c[0], d[0]) or max(c[0], d[0]) < min(a[0], b[0]):
                continue
            if max(a[1], b[1]) < min(c[1], d[1]) or max(c[1], d[1]) < min(a[1], b[1]):
                continue
            d2 = (d[0] - c[0], d[1] - c[1])
            den = d1[0] * d2[1] - d1[1] * d2[0]
            ca = (c[0] - a[0], c[1] - a[1])
            if den != 0:
                t = Fraction(ca[0] * d2[1] - ca[1] * d2[0], 1) / den
                u = Fraction(ca[0] * d1[1] - ca[1] * d1[0], 1) / den
                if 0 <= t <= 1 and 0 <= u <= 1:
                    cuts.add((a[0] + t * d1[0], a[1] + t * d1[1]))
            elif ca[0] * d1[1] - ca[1] * d1[0] == 0:  # on the same line
                for q in (c, d):
                    if min(a[0], b[0]) <= q[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= q[1] <= max(a[1], b[1]):
                        cuts.add(q)
        ordered = sorted(cuts, key=lambda q: (q[0] - a[0]) * d1[0] + (q[1] - a[1]) * d1[1])
        for p, q in zip(ordered, ordered[1:]):
            pieces.add((p, q) if p < q else (q, p))

    # keep the pieces with filled area on one side only, pointing so the fill is on the left
    tiny = Fraction(1, 10**9)
    boundary = {}
    for a, b in pieces:
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        nx, ny = -(b[1] - a[1]) * tiny, (b[0] - a[0]) * tiny
        left = _winding((mid[0] + nx, mid[1] + ny), loops) != 0
        right = _winding((mid[0] - nx, mid[1] - ny), loops) != 0
        if left != right:
            e = (a, b) if left else (b, a)
            boundary.setdefault(e[0], []).append(e)

    def turn(frm, e):
        """How far clockwise the edge e is from the direction back to frm."""
        back = math.atan2(float(frm[1] - e[0][1]), float(frm[0] - e[0][0]))
        out = math.atan2(float(e[1][1] - e[0][1]), float(e[1][0] - e[0][0]))
        return (back - out) % (2 * math.pi) or 2 * math.pi

    used = set()
    result = []
    for start in [e for es in boundary.values() for e in es]:
        if start in used:
            continue
        used.add(start)
        loop = [start[0]]
        edge = start
        while True:
            options = [e for e in boundary[edge[1]] if e not in used or e == start]
            nxt = min(options, key=lambda e: turn(edge[0], e))
            if nxt == start:
                break
            used.add(nxt)
            loop.append(nxt[0])
            edge = nxt
        # points in a straight line add nothing
        keep = [
            p
            for i, p in enumerate(loop)
            if _fcross(loop[i - 1], p, loop[(i + 1) % len(loop)]) != 0
        ]
        if len(keep) >= 3:
            result.append([(float(x), float(y)) for x, y in keep])
    return result


def separate(group_loops):
    """Moves the points where holes touch another loop a hair into their hole,
    so no two loops share a point (what the triangulation below needs)."""
    out = []
    for k, loop in enumerate(group_loops):
        if area(loop) > 0:
            out.append(loop)
            continue
        cx = sum(p[0] for p in loop) / len(loop)
        cy = sum(p[1] for p in loop) / len(loop)
        moved = []
        for p in loop:
            touching = any(
                on_segment(p, a, b) or math.dist(p, a) < 1e-9
                for j, other in enumerate(group_loops)
                if j != k
                for a, b in edges(other)
            )
            if touching:
                d = math.dist(p, (cx, cy)) or 1.0
                p = (p[0] + (cx - p[0]) / d * CUT_GAP, p[1] + (cy - p[1]) / d * CUT_GAP)
            moved.append(p)
        out.append(moved)
    return out


def triangulate(contours):
    """Triangles (counter-clockwise point triples) of the filled area of a font's
    contours, and that area."""
    loops = merge_contours(contours)
    outers = sorted((l for l in loops if area(l) > 0), key=area)
    holes = [l for l in loops if area(l) < 0]
    tris = []
    total = 0.0
    for outer in outers:
        mine = []
        for h in holes:
            # the smallest outline that has the whole hole in it
            home = next(
                (
                    o
                    for o in outers
                    if all(inside(p, o) or any(on_segment(p, a, b) or math.dist(p, a) < 1e-9 for a, b in edges(o)) for p in h)
                ),
                None,
            )
            if home is outer:
                mine.append(h)
        group = separate([outer] + mine)
        poly = group[0]
        rest = group[1:]
        rest.sort(key=lambda h: -max(p[0] for p in h))
        for k, h in enumerate(rest):
            poly = bridge(poly, h, rest[k + 1 :])
        tris += ear_clip(poly)
        total += area(outer) + sum(area(h) for h in mine)
    return tris, total


def ear_clip(poly):
    """Triangles (as point triples, counter-clockwise) of a simple polygon."""
    pts = list(poly)
    tris = []
    eps = 1e-7

    def in_tri(p, a, b, c):
        return cross(a, b, p) > eps and cross(b, c, p) > eps and cross(c, a, p) > eps

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


def lining_names(font):
    """Digit glyph name -> its lining-figures version, for fonts whose default
    digits are old-style (Playfair Display): what the font's own 'lnum'
    feature would swap in."""
    out = {}
    if "GSUB" not in font:
        return out
    gsub = font["GSUB"].table
    for rec in gsub.FeatureList.FeatureRecord:
        if rec.FeatureTag != "lnum":
            continue
        for li in rec.Feature.LookupListIndex:
            for st in gsub.LookupList.Lookup[li].SubTable:
                st = getattr(st, "ExtSubTable", st)
                out.update(getattr(st, "mapping", {}))
    return out


def build(path):
    """The digits of one font: (digit, advance, xMin, xMax, vertices, indices) each."""
    font = TTFont(path)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    lining = lining_names(font)
    raw = {}
    for d in "0123456789":
        name = cmap[ord(d)]
        name = lining.get(name, name)
        pen = Flatten(gs)
        gs[name].draw(pen)
        raw[d] = (pen.contours, font["hmtx"][name][0])
    # one height for every digit, so the numbers sit level: baseline to top
    ys = [y for cs, _ in raw.values() for c in cs for _, y in c]
    y0, y1 = min(ys), max(ys)
    scale = 1.0 / (y1 - y0)

    out = []
    for d, (cs, adv) in raw.items():
        tris, want = triangulate(cs)
        got = sum(cross(*t) / 2 for t in tris)
        assert abs(got - want) < want * 2e-3, (d, got, want)
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
        print(" ", d, len(kept) // 3, "triangles")
    return out


def main():
    sets = []
    for fid, filename in FONTS:
        print(fid)
        sets.append((fid, build(os.path.join(ROOT, "assets", "fonts", filename))))

    lines = [
        "/**",
        " * GENERATED by tools/generate_glyphs.py from the fonts in assets/fonts.",
        " * Do not edit by hand. The digits 0-9 of each dice number font as",
        " * triangles: 1 high (baseline 0, top 1), x measured from the pen position.",
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
        "/** The digits of every font, by font id (see DICE_FONTS in fonts.ts). */",
        "export const GLYPH_SETS: Record<string, Record<string, Glyph>> = {",
    ]
    for fid, out in sets:
        lines.append(f'\t"{fid}": {{')
        for d, adv, xmin, xmax, verts, idx in out:
            flat = ",".join(f"{v:g}" for p in verts for v in p)
            lines += [
                f'\t\t"{d}": {{',
                f"\t\t\tadvance: {adv:g},",
                f"\t\t\txMin: {xmin:g},",
                f"\t\t\txMax: {xmax:g},",
                f"\t\t\tvertices: [{flat}],",
                f"\t\t\tindices: [{','.join(map(str, idx))}],",
                "\t\t},",
            ]
        lines.append("\t},")
    lines += ["};", ""]
    with open(OUT, "w") as f:
        f.write("\n".join(lines))
    print("wrote", os.path.normpath(OUT), os.path.getsize(OUT), "bytes")


main()
