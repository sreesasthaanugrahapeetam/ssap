#!/usr/bin/env python3
"""Generates the doodle-style line art used behind the admin screens (src/admin/art/*.svg).

Run from the repo root:  python3 tools/gen-doodle-art.py
Shapes get a small deterministic jitter so they look hand-drawn.
"""
import math, random, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'admin', 'art')
rng = random.Random(7)


def r(a=1.0):
    return rng.uniform(-a, a)


def smooth(pts, closed=False):
    n = len(pts)
    if n < 2:
        return ''
    def P(i):
        return pts[i % n] if closed else pts[max(0, min(n - 1, i))]
    d = f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
    segs = n if closed else n - 1
    for i in range(segs):
        p0, p1, p2, p3 = P(i - 1), P(i), P(i + 1), P(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
    return d + ('Z' if closed else '')


def line(pts, j=0.9, closed=False, fill=None):
    q = [(x + r(j), y + r(j)) for x, y in pts]
    f = f' fill="currentColor" fill-opacity="{fill}"' if fill else ''
    return f'<path d="{smooth(q, closed)}"{f}/>'


def poly(pts, j=0.8, closed=True, fill=None, nostroke=False):
    """Angular hand-drawn polygon: straight edges with a slightly wobbly midpoint."""
    q = [(x + r(j), y + r(j)) for x, y in pts]
    n = len(q)
    d = f'M{q[0][0]:.1f} {q[0][1]:.1f}'
    segs = n if closed else n - 1
    for i in range(segs):
        a, b = q[i], q[(i + 1) % n]
        m = ((a[0] + b[0]) / 2 + r(j), (a[1] + b[1]) / 2 + r(j))
        d += f'Q{m[0]:.1f} {m[1]:.1f} {b[0]:.1f} {b[1]:.1f}'
    f = f' fill="currentColor" fill-opacity="{fill}"' if fill else ''
    if nostroke:
        f += ' stroke="none"'
    return f'<path d="{d}{"Z" if closed else ""}"{f}/>'


def blob(cx, cy, rx, ry, n=9, j=1.0, fill=None):
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n + r(0.12)
        pts.append((cx + rx * math.cos(a) * (1 + r(0.05)), cy + ry * math.sin(a) * (1 + r(0.05))))
    return line(pts, j, closed=True, fill=fill)


def dot(cx, cy, rad=1.6):
    return f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rad}" fill="currentColor" stroke="none"/>'


def ring(cx, cy, rad):
    return blob(cx, cy, rad, rad, n=7, j=0.5)


def sparkle(x, y, s=5):
    return line([(x - s, y), (x + s, y)], 0.3) + line([(x, y - s), (x, y + s)], 0.3)


def bird(x, y, s=7):
    return line([(x - s, y), (x - s / 2, y - s / 2), (x, y), (x + s / 2, y - s / 2), (x + s, y)], 0.3)


def tree(x, base, h=44, w=26):
    return (line([(x, base), (x + r(1), base - h * 0.45)], 0.5) +
            blob(x, base - h * 0.75, w / 2, h * 0.38, n=8, j=1.0, fill=0.1))


def cloud(x, y, s=1.0):
    return (blob(x, y, 14 * s, 8 * s, 7, 0.6) + blob(x + 14 * s, y + 3 * s, 11 * s, 7 * s, 7, 0.6) +
            blob(x - 13 * s, y + 4 * s, 9 * s, 6 * s, 7, 0.6))


def beads(x0, x1, y, sag, n, rad=1.9):
    out = []
    for t in range(n + 1):
        u = t / n
        x = x0 + (x1 - x0) * u
        yy = y + sag * (1 - (2 * u - 1) ** 2)
        out.append(ring(x, yy, rad))
    return ''.join(out)


def svg(vb, stroke, op, sw, body, fillop=1):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="none" stroke="{stroke}" '
            f'opacity="{op}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" '
            f'color="{stroke}">\n{body}\n</svg>')


# ───────────────────────────── Sabarimala sannidhanam ─────────────────────────────
def sannidhanam():
    p = []
    a = p.append
    a(line([(0, 262), (60, 232), (120, 252), (230, 244), (330, 236), (400, 254)], 1.2))
    a(tree(40, 262, 44, 26) + tree(362, 258, 48, 28))
    a(cloud(70, 40) + cloud(320, 56, 0.9) + bird(220, 34) + bird(240, 26, 5))
    a(sparkle(170, 24) + sparkle(380, 24) + sparkle(30, 90))
    # 18 steps (wobbly)
    for i in range(18):
        y = 288 - i * 3.5
        hw = 100 - i * 1.9
        a(line([(200 - hw, y), (200, y + 0.6), (200 + hw, y)], 0.5))
    a(line([(100, 288), (166, 226)], 0.8) + line([(300, 288), (234, 226)], 0.8))
    # walls + door
    a(poly([(140, 226), (140, 190), (260, 190), (260, 226)], 0.8, closed=False))
    a(line([(186, 226), (186, 208), (200, 196), (214, 208), (214, 226)], 0.5))
    for x in (152, 166, 234, 248):
        a(line([(x, 226), (x, 196)], 0.4))
    # roofs
    a(poly([(92, 192), (124, 152), (276, 152), (308, 192)], 1.0, fill=0.1))
    a(poly([(130, 152), (156, 118), (244, 118), (270, 152)], 1.0, fill=0.1))
    a(poly([(160, 118), (184, 88), (216, 88), (240, 118)], 0.9, fill=0.1))
    for x in range(106, 296, 16):
        a(ring(x, 198, 2.0))
    for x in (176, 200, 224):
        a(blob(x, 106, 4, 6, 6, 0.4, fill=0.2) + line([(x, 112), (x, 118)], 0.2))
    a(blob(200, 70, 5, 7, 6, 0.4, fill=0.2) + line([(200, 62), (200, 52)], 0.3) + ring(200, 49, 2.4))
    # flag post with pennant
    a(line([(338, 288), (337, 140)], 0.8) + line([(331, 168), (345, 168)], 0.3) + line([(331, 198), (345, 198)], 0.3) + line([(331, 228), (345, 228)], 0.3))
    a(line([(337, 140), (337, 122)], 0.3) + line([(337, 124), (360, 130), (337, 138)], 0.4, closed=True, fill=0.2))
    # diyas
    for x in (60, 80):
        a(line([(x - 8, 286), (x - 5, 292), (x + 5, 292), (x + 8, 286)], 0.3, closed=True, fill=0.15))
        a(line([(x, 285), (x - 3, 278), (x, 270), (x + 3, 278), (x, 285)], 0.2))
    return '\n'.join(p)


# ───────────────────────────── gopuram ─────────────────────────────
def gopuram():
    p = []
    a = p.append
    a(line([(20, 306), (200, 308), (380, 306)], 0.8) + line([(40, 296), (360, 296)], 0.8))
    T = [(286, 238, 62, 338, 82, 318), (238, 196, 86, 314, 104, 296), (196, 160, 110, 290, 126, 274),
         (160, 130, 132, 268, 146, 254), (130, 104, 150, 250, 162, 238), (104, 84, 166, 234, 174, 226)]
    for yb, yt, xlb, xrb, xlt, xrt in T:
        a(poly([(xlb, yb), (xlt, yt), (xrt, yt), (xrb, yb)], 1.0, fill=0.08))
    a(line([(176, 286), (176, 262), (188, 246), (200, 242), (212, 246), (224, 262), (224, 286)], 0.8))
    for cx in (110, 146, 254, 290):
        a(line([(cx - 9, 286), (cx - 9, 270), (cx, 262), (cx + 9, 270), (cx + 9, 286)], 0.5))
    for cx in (118, 152, 200, 248, 282):
        a(line([(cx - 7, 238), (cx - 7, 226), (cx, 218), (cx + 7, 226), (cx + 7, 238)], 0.4))
    for cx in (140, 172, 200, 228, 260):
        a(ring(cx, 188, 3))
    for cx in (162, 200, 238):
        a(ring(cx, 152, 3))
    a(line([(170, 84), (172, 66), (200, 58), (228, 66), (230, 84)], 0.8, fill=0.12))
    for cx in (176, 200, 224):
        a(blob(cx, 52, 4.4, 6.4, 6, 0.4, fill=0.2) + line([(cx, 59), (cx, 64)], 0.2))
    a(line([(200, 44), (200, 30)], 0.3) + ring(200, 26, 3))
    a(sparkle(60, 120) + sparkle(340, 110) + bird(80, 60) + bird(320, 50, 5))
    return '\n'.join(p)


ART = {
    'sannidhanam': (sannidhanam, '0 0 400 300'),
    'gopuram': (gopuram, '0 0 400 320'),
}
COLORS = {'gold': ('#C9A227', 0.85, 2.4), 'cream': ('#FFF0CC', 0.32, 2.3), 'brown': ('#8A4B14', 0.22, 2.6)}

for name, (fn, vb) in ART.items():
    rng.seed(sum(map(ord, name)))
    body = fn()
    for cname, (c, op, sw) in COLORS.items():
        with open(os.path.join(OUT, f'{name}-{cname}.svg'), 'w') as fh:
            fh.write(svg(vb, c, op, sw, body))
print('wrote doodle art to', os.path.abspath(OUT))
