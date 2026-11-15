"""Collect an unreviewed, attributed plant-photo set for human verification."""

import argparse
import csv
import html
import io
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


API = "https://api.inaturalist.org/v1/observations"
HEADERS = {"User-Agent": "WILD-AI plant dataset curation (contact: project maintainer)"}
LICENSES = {"cc0", "cc-by"}
SOURCE_TAXA = {"Acacia catechu": "Senegalia catechu", "Myrica esculenta": "Morella esculenta"}
FIELDS = (
    "decision", "reviewed_label", "review_notes", "proposed_label", "image_path",
    "observation_id", "photo_id", "observation_url", "photo_url", "license",
    "attribution", "photographer", "observed_on", "place_guess", "scope", "source_taxon",
)
last_api_request = 0.0


def roster():
    text = (Path(__file__).parent / "SPECIES_CANDIDATES.md").read_text()
    names = re.findall(r"\*([A-Z][a-z]+ [a-z]+)\*", text.split("**Evidence used")[0])
    assert len(names) == 25 and len(set(names)) == 25, "Unexpected species roster"
    return names


def observations(name, place_id, page):
    global last_api_request
    delay = 1.0 - (time.monotonic() - last_api_request)
    if delay > 0:
        time.sleep(delay)
    params = {
        "taxon_name": name, "quality_grade": "research", "photos": "true",
        "photo_license": "cc0,cc-by", "per_page": 200, "page": page,
        "order_by": "observed_on", "order": "desc",
    }
    if place_id:
        params["place_id"] = place_id
    request = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=HEADERS)
    last_api_request = time.monotonic()
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def image_url(photo):
    url = photo["url"]
    if not re.search(r"/square\.(jpe?g|png)$", url):
        raise ValueError(f"Unexpected photo URL: {url}")
    return url.replace("/square.", "/medium.")


def save_image(url, path):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        content = response.read(3_000_001)
    if len(content) > 3_000_000:
        raise ValueError("Photo exceeded 3 MB download limit")
    with Image.open(io.BytesIO(content)) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if min(image.size) < 224:
            raise ValueError(f"Photo too small: {image.size}")
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, format="JPEG", quality=90)


def contact_sheet(rows, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    width, height, columns = 300, 300, 4
    sheet = Image.new("RGB", (width * columns, height * ((len(rows) + columns - 1) // columns)), "white")
    draw = ImageDraw.Draw(sheet)
    for index, row in enumerate(rows):
        x, y = (index % columns) * width, (index // columns) * height
        with Image.open(output.parent.parent / row["image_path"]) as image:
            tile = ImageOps.contain(image, (width - 8, 260))
            sheet.paste(tile, (x + (width - tile.width) // 2, y))
        draw.text((x + 4, y + 264), f"{row['scope']} · photo {row['photo_id']}", fill="black")
        draw.text((x + 4, y + 280), f"obs {row['observation_id']}", fill="black")
    sheet.save(output, quality=88)


def review_page(rows, output):
    groups = []
    for name in sorted({row["proposed_label"] for row in rows}):
        photos = [row for row in rows if row["proposed_label"] == name]
        cards = "".join(
            f'<article><img loading="lazy" src="{html.escape(row["image_path"])}" alt="Candidate {html.escape(name)}">'
            f'<p>Photo {html.escape(row["photo_id"])} · {html.escape(row["scope"])} · {html.escape(row["license"])}</p>'
            f'<p>{html.escape(row["place_guess"])}</p>'
            f'<a href="{html.escape(row["observation_url"])}">Original observation</a></article>'
            for row in photos
        )
        groups.append(f'<details><summary>{html.escape(name)} ({len(photos)})</summary><div class="grid">{cards}</div></details>')
    output.write_text(
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>WILD-AI photo review</title>'
        '<style>body{font:16px system-ui;max-width:1200px;margin:auto;padding:24px}details{margin:12px 0}'
        '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}'
        'article{border:1px solid #bbb;padding:8px}img{width:100%;height:220px;object-fit:contain}'
        'p{margin:6px 0;overflow-wrap:anywhere}</style><h1>Candidate plant photos</h1>'
        '<p>Unreviewed. Record accept, reject, or unsure by photo ID in review.csv before training.</p>'
        + "".join(groups) + '</html>', encoding="utf-8"
    )


def collect_species(name, output, limit):
    selected = []
    seen_observations = set()
    photographer_counts = Counter()
    slug = name.lower().replace(" ", "_")
    source_name = SOURCE_TAXA.get(name, name)
    scopes = (("uttarakhand", 96903, min(6, limit)), ("india", 6681, min(18, limit)), ("global", None, limit))
    for scope, place_id, cap in scopes:
        for page in (1, 2):
            result = observations(source_name, place_id, page)
            for item in result["results"]:
                if len(selected) >= cap:
                    break
                if (item.get("taxon") or {}).get("name") != source_name or item["id"] in seen_observations:
                    continue
                photographer = (item.get("user") or {}).get("login", "")
                if photographer_counts[photographer] >= 2:
                    continue
                photo = next((p for p in item.get("photos", []) if p.get("license_code") in LICENSES), None)
                if not photo:
                    continue
                try:
                    url = image_url(photo)
                    relative = f"images/{slug}/{photo['id']}.jpg"
                    save_image(url, output / relative)
                except (OSError, ValueError, KeyError) as error:
                    print(f"  skipped photo {photo.get('id')}: {error}", flush=True)
                    continue
                selected.append({
                    "decision": "", "reviewed_label": "", "review_notes": "",
                    "proposed_label": name, "image_path": relative,
                    "observation_id": str(item["id"]), "photo_id": str(photo["id"]),
                    "observation_url": item.get("uri") or f"https://www.inaturalist.org/observations/{item['id']}",
                    "photo_url": url, "license": photo["license_code"],
                    "attribution": photo.get("attribution", ""), "photographer": photographer,
                    "observed_on": item.get("observed_on", ""),
                    "place_guess": item.get("place_guess", ""), "scope": scope,
                    "source_taxon": source_name,
                })
                seen_observations.add(item["id"])
                photographer_counts[photographer] += 1
            if len(selected) >= cap or page * 200 >= result["total_results"]:
                break
        if len(selected) >= limit:
            break
    if selected:
        contact_sheet(selected, output / f"contact_sheets/{slug}.jpg")
    print(f"{name}: {len(selected)}/{limit} photos", flush=True)
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).parent / "output" / f"review_{date.today()}")
    parser.add_argument("--limit", type=int, default=30, help="Maximum photos per species")
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument("--species", help="Collect only one species for a small trial")
    selection.add_argument("--species-file", type=Path, help="Plain-text species list for a separate review set")
    args = parser.parse_args()
    assert 1 <= args.limit <= 100
    names = ([line.strip() for line in args.species_file.read_text().splitlines() if line.strip()]
             if args.species_file else [args.species] if args.species else roster())
    assert len(names) == len(set(names)) and all(re.fullmatch(r"[A-Z][a-z]+ [a-z]+", name) for name in names)
    output = args.output.resolve()
    if (output / "review.csv").exists():
        parser.error(f"Review already exists; refusing to overwrite: {output}")
    output.mkdir(parents=True, exist_ok=True)
    partial = output / "review.partial.csv"
    if partial.exists():
        with partial.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
    else:
        rows = []
    for name in names:
        if any(row["proposed_label"] == name for row in rows):
            continue
        rows.extend(collect_species(name, output, args.limit))
        with partial.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(rows)
    summary = {name: Counter(row["scope"] for row in rows if row["proposed_label"] == name) for name in names}
    (output / "summary.json").write_text(json.dumps(summary, indent=2))
    review_page(rows, output / "index.html")
    partial.rename(output / "review.csv")
    print(f"Review set: {output} ({len(rows)} photos)")


if __name__ == "__main__":
    main()
