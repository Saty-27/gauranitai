from __future__ import annotations

from pathlib import Path
from shutil import copy2
import json
import re

from PIL import Image, ImageDraw, ImageFont, ImageOps


WORKSPACE = Path("/Users/satyangupta/Desktop/divinenaturalproducts")
LOGO_PATH = WORKSPACE / "attached_assets" / "WhatsApp Image 2025-08-07 at 16.06.46_1755862448616.jpeg"
ASSET_ROOT = Path("/Users/satyangupta/Desktop/DivineAssest")
OUTPUT_SIZE = 1080

FONT_REGULAR = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
FONT_BOLD = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")

ITEMS = [
    {
        "title": "Altars (Teak Wood Temples)",
        "slug": "altars-teak-wood-temples",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13ebd1b6c88191ac6e462d80c81d8b.png",
    },
    {
        "title": "Massages - Service",
        "slug": "massages-service",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13ecc0ffdc8191992a6a1846b7d6ab.png",
    },
    {
        "title": "Astrological - Service",
        "slug": "astrological-service",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13ed180024819198cf3037a99e3837.png",
    },
    {
        "title": "Organic Vegetables & Fruits",
        "slug": "organic-vegetables-fruits",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13ed73f2fc81919a4a4e33f05e5db1.png",
    },
    {
        "title": "Organic Grains",
        "slug": "organic-grains",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13edaa0d648191bce74c9e983d6a9e.png",
    },
    {
        "title": "Panchakarma - Service",
        "slug": "panchakarma-service",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13edfe46c88191880517ffe0337264.png",
    },
    {
        "title": "Deity Painting - Service",
        "slug": "deity-painting-service",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13ee56a1d881919a53b5f0510ae2b4.png",
    },
    {
        "title": "Deity Dress - Service",
        "slug": "deity-dress-service",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13eebb76288191aca77c2f25284e22.png",
    },
    {
        "title": "Deities",
        "slug": "deities",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13f21898e48191a0ec2cde6147e04a.png",
    },
    {
        "title": "Cow Dung Patties",
        "slug": "cow-dung-patties",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13f271c9188191b63bf8148d8e3003.png",
    },
    {
        "title": "Agarbatti & Dhup",
        "slug": "agarbatti-dhup",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13f2cc5ad88191b64a37757ab734f1.png",
    },
    {
        "title": "Musical Instruments: Mridanga, Kartal, Harmonium, Jambe, Whompers",
        "slug": "musical-instruments-mridanga-kartal-harmonium-jambe-whompers",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13f32ad9a08191ae6dc4d6d145c0ca.png",
    },
    {
        "title": "Japa Mala",
        "slug": "japa-mala",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13f388d834819197d03d006ae547d3.png",
    },
    {
        "title": "Bakery Items",
        "slug": "bakery-items",
        "source": "/Users/satyangupta/.codex/generated_images/019e5dcc-f0a4-7553-a544-5ad29c79e234/ig_0ae20b2c9cb9e54c016a13f3e51fac81918e5629e209c8f77d.png",
    },
]


def unique_dir(base: Path) -> Path:
    if not base.exists():
        return base
    for index in range(2, 100):
        candidate = base.with_name(f"{base.name}-v{index}")
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"Could not find free output directory near {base}")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def rounded_rectangle(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, **kwargs) -> None:
    draw.rounded_rectangle(box, radius=radius, **kwargs)


def text_bbox(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.FreeTypeFont) -> tuple[int, int]:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=selected_font)
    return right - left, bottom - top


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = word if not current else f"{current} {word}"
        width, _ = text_bbox(draw, test, selected_font)
        if width <= max_width:
            current = test
            continue
        if current:
            lines.append(current)
        current = word
    if current:
        lines.append(current)
    return lines


def fitted_title(draw: ImageDraw.ImageDraw, title: str, max_width: int, max_height: int) -> tuple[ImageFont.FreeTypeFont, list[str], int]:
    for size in range(62, 27, -2):
        selected_font = font(FONT_BOLD, size)
        lines = wrap_lines(draw, title, selected_font, max_width)
        line_height = max(text_bbox(draw, line, selected_font)[1] for line in lines) + max(8, size // 5)
        total_height = line_height * len(lines)
        if len(lines) <= 4 and total_height <= max_height:
            return selected_font, lines, line_height
    selected_font = font(FONT_BOLD, 28)
    lines = wrap_lines(draw, title, selected_font, max_width)
    return selected_font, lines[:4], 36


def add_bottom_shadow(image: Image.Image) -> None:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for i in range(320):
        alpha = int((i / 320) ** 1.7 * 118)
        y = OUTPUT_SIZE - 320 + i
        draw.line([(0, y), (OUTPUT_SIZE, y)], fill=(28, 20, 12, alpha))
    image.alpha_composite(overlay)


def compose_card(source_path: Path, output_path: Path, title: str, logo: Image.Image) -> None:
    source = Image.open(source_path).convert("RGB")
    card = ImageOps.fit(source, (OUTPUT_SIZE, OUTPUT_SIZE), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5)).convert("RGBA")
    add_bottom_shadow(card)

    overlay = Image.new("RGBA", card.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    rounded_rectangle(draw, (38, 36, 244, 288), 26, fill=(255, 255, 250, 226), outline=(73, 129, 51, 105), width=3)

    logo_copy = logo.copy()
    logo_copy.thumbnail((172, 216), Image.Resampling.LANCZOS)
    logo_x = 38 + (206 - logo_copy.width) // 2
    logo_y = 36 + (252 - logo_copy.height) // 2
    overlay.alpha_composite(logo_copy, (logo_x, logo_y))

    band_top = 772
    rounded_rectangle(draw, (38, band_top, 1042, 1038), 30, fill=(255, 252, 242, 236), outline=(86, 55, 25, 120), width=3)
    draw.rounded_rectangle((72, band_top + 26, 216, band_top + 36), radius=5, fill=(6, 151, 74, 255))
    draw.rounded_rectangle((226, band_top + 26, 330, band_top + 36), radius=5, fill=(91, 47, 18, 255))

    brand_font = font(FONT_BOLD, 32)
    regular_font = font(FONT_REGULAR, 22)
    draw.text((72, band_top + 56), "Divine Natural", font=brand_font, fill=(4, 134, 66, 255))
    draw.text((72, band_top + 94), "Natural products and devotional services", font=regular_font, fill=(91, 47, 18, 230))

    title_font, title_lines, line_height = fitted_title(draw, title, max_width=900, max_height=126)
    y = band_top + 135
    for line in title_lines:
        draw.text((72, y), line, font=title_font, fill=(63, 35, 16, 255))
        y += line_height

    card.alpha_composite(overlay)
    card.convert("RGB").save(output_path, quality=96, optimize=True)


def build_contact_sheet(image_paths: list[Path], output_path: Path) -> None:
    thumb_size = 232
    gap = 24
    label_h = 66
    cols = 4
    rows = (len(image_paths) + cols - 1) // cols
    sheet_w = cols * thumb_size + (cols + 1) * gap
    sheet_h = rows * (thumb_size + label_h) + (rows + 1) * gap
    sheet = Image.new("RGB", (sheet_w, sheet_h), (255, 252, 242))
    draw = ImageDraw.Draw(sheet)
    label_font = font(FONT_BOLD, 18)

    for idx, image_path in enumerate(image_paths):
        row, col = divmod(idx, cols)
        x = gap + col * (thumb_size + gap)
        y = gap + row * (thumb_size + label_h + gap)
        thumb = Image.open(image_path).convert("RGB")
        thumb.thumbnail((thumb_size, thumb_size), Image.Resampling.LANCZOS)
        frame = Image.new("RGB", (thumb_size, thumb_size), (244, 239, 226))
        frame.paste(thumb, ((thumb_size - thumb.width) // 2, (thumb_size - thumb.height) // 2))
        sheet.paste(frame, (x, y))
        title = re.sub(r"^\d+-|\.png$", "", image_path.name).replace("-", " ")
        lines = wrap_lines(draw, title, label_font, thumb_size - 8)[:2]
        for line_index, line in enumerate(lines):
            draw.text((x + 4, y + thumb_size + 8 + line_index * 22), line, font=label_font, fill=(63, 35, 16))

    sheet.save(output_path, quality=94, optimize=True)


def main() -> None:
    missing = [item["source"] for item in ITEMS if not Path(item["source"]).exists()]
    if missing:
        raise FileNotFoundError("Missing generated source images:\n" + "\n".join(missing))

    output_root = unique_dir(ASSET_ROOT / "divine-natural-product-images-2026-05-25")
    branded_dir = output_root / "branded"
    raw_dir = output_root / "raw-generated"
    branded_dir.mkdir(parents=True)
    raw_dir.mkdir(parents=True)

    logo = Image.open(LOGO_PATH).convert("RGBA")
    final_paths: list[Path] = []
    manifest = {
        "brand": "Divine Natural",
        "logo": str(LOGO_PATH),
        "output_root": str(output_root),
        "items": [],
    }

    for index, item in enumerate(ITEMS, start=1):
        source_path = Path(item["source"])
        filename = f"{index:02d}-{item['slug']}.png"
        raw_path = raw_dir / filename
        branded_path = branded_dir / filename

        copy2(source_path, raw_path)
        compose_card(source_path, branded_path, item["title"], logo)
        final_paths.append(branded_path)
        manifest["items"].append(
            {
                "number": index,
                "title": item["title"],
                "branded_file": str(branded_path),
                "raw_generated_file": str(raw_path),
                "original_generated_file": str(source_path),
            }
        )

    build_contact_sheet(final_paths, output_root / "preview-contact-sheet.png")
    (output_root / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(output_root)
    for path in final_paths:
        print(path)


if __name__ == "__main__":
    main()
