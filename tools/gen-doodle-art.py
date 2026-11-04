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


def poly(pts, j=0.8, closed=True, fill=None):
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


# ───────────────────────────── Ayyappa, seated in the yogic pose ─────────────────────────────
def ayyappa():
    p = []
    a = p.append
    # sun-ray strokes around the halo
    for ang in range(-80, 81, 16):
        t = math.radians(ang - 90)
        a(line([(110 + 100 * math.cos(t), 104 + 100 * math.sin(t)), (110 + 112 * math.cos(t), 104 + 112 * math.sin(t))], 0.4))
    # prabhavali arch
    a(line([(30, 240), (26, 150), (44, 74), (110, 12), (176, 74), (194, 150), (190, 240)], 1.0))
    a(line([(44, 238), (42, 152), (56, 88), (110, 30), (164, 88), (178, 152), (176, 238)], 1.0))
    # crown
    a(line([(86, 72), (90, 52), (98, 40), (110, 26), (122, 40), (130, 52), (134, 72)], 0.7, fill=0.15))
    a(line([(86, 72), (110, 76), (134, 72)], 0.5))
    a(ring(110, 54, 4) + ring(98, 64, 2.6) + ring(122, 64, 2.6) + ring(110, 18, 3.2))
    # ears + kundalas
    a(blob(84, 102, 5, 10, 7, 0.5) + blob(136, 102, 5, 10, 7, 0.5) + ring(83, 118, 3.6) + ring(137, 118, 3.6))
    # head
    a(blob(110, 100, 25, 29, 10, 0.9, fill=0.12))
    a(line([(98, 98), (102, 94), (107, 98)], 0.3) + line([(113, 98), (118, 94), (122, 98)], 0.3))
    a(line([(102, 113), (110, 119), (118, 113)], 0.3))
    a(line([(110, 76), (110, 86)], 0.3) + dot(110, 92, 1.6))
    a(ring(94, 108, 2.4) + ring(126, 108, 2.4))
    # torso
    a(blob(110, 164, 36, 34, 10, 1.0, fill=0.1))
    # mala
    a(beads(78, 142, 134, 28, 10, 2.2))
    a(blob(110, 164, 6, 7, 7, 0.4, fill=0.2) + dot(110, 164, 1.4))
    # arms into chinmudra
    a(line([(78, 138), (60, 164), (54, 192)], 1.0) + line([(142, 138), (160, 164), (166, 192)], 1.0))
    a(blob(52, 198, 7, 7, 7, 0.5) + ring(52, 198, 2.6) + blob(168, 198, 7, 7, 7, 0.5) + ring(168, 198, 2.6))
    # folded legs + belt
    a(blob(110, 206, 62, 17, 11, 1.0, fill=0.1))
    a(line([(58, 198), (68, 190), (78, 198), (88, 190), (98, 198), (108, 190), (118, 198), (128, 190), (138, 198), (148, 190), (158, 198)], 0.5))
    a(blob(66, 218, 9, 5, 6, 0.4) + blob(154, 218, 9, 5, 6, 0.4))
    # lotus pedestal
    for cx in range(48, 190, 16):
        a(blob(cx, 232, 8, 12, 7, 0.6, fill=0.08))
    a(line([(30, 246), (110, 250), (190, 246)], 0.8))
    for x in range(44, 190, 22):
        a(dot(x, 255, 1.3))
    for sx, sy in ((20, 60), (200, 70), (22, 190), (200, 176), (110, 6)):
        a(sparkle(sx, sy))
    return '\n'.join(p)


# ───────────────────────────── devotee walking with irumudi ─────────────────────────────
def walker():
    p = []
    a = p.append
    # irumudi: two cloth pouches tied on the head
    a(blob(46, 32, 17, 15, 8, 0.8, fill=0.14) + blob(78, 32, 17, 15, 8, 0.8, fill=0.14))
    a(line([(28, 42), (62, 50), (96, 42)], 0.6))
    a(line([(40, 28), (44, 38)], 0.3) + line([(50, 26), (54, 36)], 0.3) + line([(72, 26), (76, 36)], 0.3) + line([(82, 28), (86, 38)], 0.3))
    a(blob(62, 13, 8, 6, 7, 0.5) + line([(58, 17), (50, 25)], 0.4) + line([(66, 17), (74, 25)], 0.4))
    # head
    a(blob(62, 66, 14, 14, 9, 0.6, fill=0.12))
    a(dot(57, 64, 1.5) + dot(67, 64, 1.5) + line([(56, 71), (62, 75), (68, 71)], 0.2) + dot(62, 56, 1.3))
    # mala
    a(beads(46, 78, 80, 9, 7, 1.8) + blob(62, 94, 3.2, 3.6, 6, 0.3, fill=0.3))
    # body (black upper cloth) with hatch
    a(line([(40, 88), (84, 88), (90, 140), (34, 140)], 1.0, closed=True, fill=0.22))
    for hx, hy in ((48, 104), (60, 112), (72, 104), (54, 126), (68, 124)):
        a(line([(hx, hy), (hx + 5, hy + 7)], 0.2))
    # arms + hands
    a(line([(42, 94), (28, 118), (26, 140)], 0.8) + ring(26, 145, 4))
    a(line([(84, 94), (98, 114), (100, 136)], 0.8) + ring(100, 141, 4))
    # staff
    a(line([(100, 38), (101, 120), (100, 204)], 0.8) + ring(100, 33, 4.5))
    # dhoti
    a(line([(34, 140), (90, 140), (86, 176), (40, 176)], 1.0, closed=True, fill=0.1))
    a(line([(48, 146), (52, 170)], 0.3) + line([(62, 146), (63, 172)], 0.3) + line([(76, 146), (74, 170)], 0.3))
    # legs, mid-stride, with feet
    a(line([(50, 176), (44, 194), (34, 204)], 0.6) + line([(28, 204), (46, 204)], 0.4))
    a(line([(74, 176), (82, 192), (94, 200)], 0.6) + line([(90, 200), (110, 200)], 0.4))
    # motion dashes + dust puffs
    a(line([(22, 192), (12, 192)], 0.3) + line([(24, 199), (14, 199)], 0.3) + ring(10, 205, 3.2) + ring(18, 208, 2.2))
    return '\n'.join(p)


def strip(H=200):
    p = []
    a = p.append
    ground = H - 4
    a(line([(0, ground), (200, ground + 1), (420, ground - 1), (620, ground + 1), (800, ground)], 0.8))
    a(line([(0, ground - 30), (120, ground - 56), (260, ground - 34), (420, ground - 52), (600, ground - 30), (800, ground - 46)], 1.2))
    a(tree(140, ground, 52, 30) + tree(540, ground, 60, 34) + tree(745, ground, 48, 28))
    a(cloud(220, 28, 1.0) + cloud(560, 20, 0.9) + cloud(700, 44, 0.8))
    a(bird(330, 40) + bird(350, 30, 5) + bird(640, 60))
    for sx, sy in ((40, 30), (440, 50), (780, 24)):
        a(sparkle(sx, sy))
    for x, s in ((50, 0.78), (225, 0.72), (400, 0.8), (585, 0.74)):
        y = ground - 208 * s
        a(f'<g transform="translate({x} {y:.1f}) scale({s})" stroke-width="{2.4 / s:.2f}">{walker()}</g>')
    return '\n'.join(p)


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
    'ayyappa': (ayyappa, '0 0 220 262'),
    'sannidhanam': (sannidhanam, '0 0 400 300'),
    'gopuram': (gopuram, '0 0 400 320'),
    'walkers': (strip, '0 0 800 200'),
}
COLORS = {'gold': ('#C9A227', 0.85, 2.4), 'cream': ('#FFF0CC', 0.32, 2.3), 'brown': ('#8A4B14', 0.22, 2.6)}

for name, (fn, vb) in ART.items():
    rng.seed(sum(map(ord, name)))
    body = fn()
    for cname, (c, op, sw) in COLORS.items():
        if name == 'walkers' and cname == 'cream':
            continue
        with open(os.path.join(OUT, f'{name}-{cname}.svg'), 'w') as fh:
            fh.write(svg(vb, c, op, sw, body))
print('wrote doodle art to', os.path.abspath(OUT))
