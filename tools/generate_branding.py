"""Draws the Dice Roller branding into assets/ (needs Pillow: pip install pillow).

Run from the project root:  python3 tools/generate_branding.py
The mark is a fanned stack of dice, in the colors of the default Navy theme.
"""
import os
import subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

NAVY, NAVY_LIGHT = (0, 25, 53), (10, 62, 112)
ACCENT, ACCENT_DARK = (0, 184, 255), (14, 112, 178)
WHITE = (255, 255, 255)
PIP = (11, 42, 77)
HOT = (255, 92, 138)  # the centre pip
SS = 4  # supersampling
OUT = "assets"

DIE, DIE_R = 0.40, 0.095  # side and corner radius, as a fraction of the mark size


def gradient(w, h):
    """Navy with a soft cyan-blue glow from the top left."""
    img = Image.new("RGB", (w, h), NAVY)
    glow = Image.radial_gradient("L").resize((int(w * 1.6), int(h * 1.6)))
    layer = Image.new("RGB", glow.size, NAVY_LIGHT)
    mask = ImageChops.invert(glow).point(lambda v: int(v * 0.9))
    img.paste(layer, (int(-w * 0.45), int(-h * 0.45)), mask)
    return img


def die_layer(size, unit, details):
    """One die, centered on a transparent canvas of size x size."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = size / 2
    s, r = DIE * unit, DIE_R * unit
    d.rounded_rectangle((c - s / 2, c - s / 2, c + s / 2, c + s / 2), r, fill=WHITE)
    if details:
        details(d, c, unit)
    return layer


def pips(d, c, u, colors=None):
    """The five pips on the front die. `colors` overrides the paint (used for cut-outs)."""
    corner, centre = colors or (PIP, HOT)
    off, rad = 0.105 * u, 0.036 * u
    for dx in (-off, off):
        for dy in (-off, off):
            d.ellipse((c + dx - rad, c + dy - rad, c + dx + rad, c + dy + rad), fill=corner)
    rc = 0.042 * u
    d.ellipse((c - rc, c - rc, c + rc, c + rc), fill=centre)


def tint(layer, color):
    solid = Image.new("RGBA", layer.size, color + (255,))
    solid.putalpha(layer.getchannel("A"))
    return solid


def shadow(layer, dy, blur, opacity):
    a = layer.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    a = a.point(lambda v: int(v * opacity))
    s = Image.new("RGBA", layer.size, (0, 8, 24, 255))
    s.putalpha(a)
    return ImageChops.offset(s, 0, dy)


def render_mark(size, scale):
    """The fanned stack of dice on a transparent size x size canvas."""
    big = size * SS
    unit = big * scale
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    for angle, color in ((-38, ACCENT_DARK), (-19, ACCENT)):  # back die, middle die
        die = tint(die_layer(big, unit, None), color).rotate(-angle, resample=Image.BICUBIC)
        canvas.alpha_composite(shadow(die, int(0.012 * unit), 0.012 * unit, 0.45))
        canvas.alpha_composite(die)
    front = die_layer(big, unit, pips)
    canvas.alpha_composite(shadow(front, int(0.014 * unit), 0.014 * unit, 0.5))
    canvas.alpha_composite(front)
    return canvas.resize((size, size), Image.LANCZOS)


def render_mono(size, scale):
    """One-color version for Android's themed icons: only the alpha matters."""
    big = size * SS
    unit = big * scale
    dice = [die_layer(big, unit, None).rotate(a, resample=Image.BICUBIC) for a in (38, 19)]
    sil = ImageChops.lighter(dice[0].getchannel("A"), dice[1].getchannel("A"))
    gap = die_layer(big, unit * 1.08, None).getchannel("A")  # clear gap around the front die
    sil = ImageChops.subtract(sil, gap)
    sil = ImageChops.lighter(sil, die_layer(big, unit, None).getchannel("A"))
    holes = Image.new("L", (big, big), 0)  # the pips become holes
    pips(ImageDraw.Draw(holes), big / 2, unit, colors=(255, 255))
    sil = ImageChops.subtract(sil, holes)
    out = Image.new("RGBA", (big, big), (255, 255, 255, 0))
    out.putalpha(sil)
    return out.resize((size, size), Image.LANCZOS)


def save(img, name, mode=None):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.convert(mode).save(path, optimize=True) if mode else img.save(path, optimize=True)
    print("wrote", path, img.size)


def icon_on_gradient(size, scale):
    base = gradient(size, size).convert("RGBA")
    base.alpha_composite(render_mark(size, scale))
    return base


def find_font():
    """Poppins Bold wherever it is installed (asks fontconfig), else any bold sans."""
    for query in ("Poppins:bold", "sans:bold"):
        try:
            path = subprocess.run(
                ["fc-match", "-f", "%{file}", query],
                capture_output=True, text=True, check=True,
            ).stdout.strip()
        except (OSError, subprocess.CalledProcessError):
            continue
        if path and os.path.exists(path):
            return path
    raise SystemExit("No bold font found. Install Poppins (or any bold sans font) and run again.")


_FONT_PATH = None


def font(size):
    global _FONT_PATH
    if _FONT_PATH is None:
        _FONT_PATH = find_font()
        print("using font", _FONT_PATH)
    return ImageFont.truetype(_FONT_PATH, size)


def main():
    # App icon (full bleed, no transparency, so the OS can round it)
    save(icon_on_gradient(1024, 1.55), "icon.png", "RGB")
    # Android adaptive icon: background, foreground (kept in the 66dp safe zone), monochrome
    save(gradient(512, 512), "android-icon-background.png", "RGB")
    save(render_mark(512, 1.1), "android-icon-foreground.png")
    save(render_mono(432, 1.1), "android-icon-monochrome.png")
    # Splash: just the mark, the background color comes from app.json
    save(render_mark(1024, 1.1), "splash-icon.png")
    # The little mark next to the name in the app's header
    save(render_mark(256, 1.6), "logo.png")
    # Web favicon
    save(icon_on_gradient(256, 1.6).resize((48, 48), Image.LANCZOS), "favicon.png", "RGB")
    # Play Store: 512 icon and 1024x500 feature graphic
    save(icon_on_gradient(512, 1.55), "store/play-icon-512.png", "RGB")
    fg = gradient(1024, 500).convert("RGBA")
    mark = render_mark(500, 1.45)
    fg.alpha_composite(mark, (560, 0))
    d = ImageDraw.Draw(fg)
    d.text((70, 160), "Dice Roller", font=font(84), fill=WHITE)
    d.text((74, 275), "Throw 3D dice on a tray.", font=font(34), fill=ACCENT)
    save(fg, "store/feature-graphic-1024x500.png", "RGB")


if __name__ == "__main__":
    main()
