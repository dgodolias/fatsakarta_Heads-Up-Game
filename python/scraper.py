"""
Download portrait images for a list of Greek celebrities.

Install deps:
    pip install ddgs pillow requests unidecode

Run:
    python python/scraper.py
"""

import os
import re
import time
import random
import json
import sys
from io import BytesIO

import requests
from PIL import Image
from ddgs import DDGS
from unidecode import unidecode

# Add current directory to sys.path to ensure we can import lists if running from root
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

import lists

# ---------------------------
# 1) Helpers
# ---------------------------
def strip_parentheses(name: str) -> str:
    """Remove any disambiguation like 'Light (Trapper)' -> 'Light'."""
    return re.sub(r"\s*\(.*?\)\s*", " ", name).strip()


def slugify_filename(name: str) -> str:
    """
    Convert a person name to a safe ascii filename.
    Parentheses are ignored for filenames.
    Example: 'Light (Trapper)' -> 'light'
    """
    base = strip_parentheses(name)
    ascii_name = unidecode(base).lower()
    ascii_name = re.sub(r"[^a-z0-9\s_-]+", "", ascii_name)
    ascii_name = re.sub(r"[\s_-]+", "_", ascii_name).strip("_")
    if not ascii_name:
        ascii_name = "unknown"
    return ascii_name


def pick_best_image_url(results):
    """
    Prefer likely portrait photos by basic heuristics.
    """
    bad_ext = (".svg", ".gif")
    for r in results:
        url = r.get("image")
        if not url:
            continue
        low = url.lower()
        if low.endswith(bad_ext):
            continue
        return url
    return None


def download_image(url: str, timeout=15) -> bytes:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0 Safari/537.36"
        ),
        "Referer": "https://duckduckgo.com/",
    }
    resp = requests.get(url, headers=headers, timeout=timeout)
    resp.raise_for_status()
    return resp.content


def resize_to_width(img: Image.Image, target_w=500) -> Image.Image:
    w, h = img.size
    if w <= target_w:
        return img
    new_h = int(h * (target_w / w))
    return img.resize((target_w, new_h), Image.LANCZOS)


def parse_category_info(list_name: str):
    """
    Parses variable name like 'politics_men_greece' into metadata.
    Returns dict: {topic, gender, location}
    """
    parts = list_name.split('_')
    # Default fallback
    meta = {"topic": "Other", "gender": "Any", "location": "Any"}
    
    if len(parts) >= 3:
        # Assuming format: topic_gender_location (e.g. politics_men_greece)
        # But some topics might have underscores (e.g. trap_music)
        # Let's try to map known keywords
        
        # Location is usually last
        if parts[-1] in ["greece", "international"]:
            meta["location"] = parts[-1].capitalize()
        
        # Gender is usually second to last or middle
        if "men" in parts:
            meta["gender"] = "Men"
        elif "women" in parts:
            meta["gender"] = "Women"
            
        # Topic is everything else
        # We can reconstruct topic from the list name by removing gender and location
        topic_parts = [p for p in parts if p not in ["men", "women", "greece", "international"]]
        meta["topic"] = " ".join(topic_parts).title()
        
    return meta


# ---------------------------
# 2) Main routine
# ---------------------------
def main():
    os.makedirs("assets", exist_ok=True)
    
    # Collect all lists from lists.py
    # We look for variables that are lists and not private (start with _)
    all_lists = {k: v for k, v in vars(lists).items() if isinstance(v, list) and not k.startswith('_')}
    
    final_json_data = []
    
    total_items = sum(len(l) for l in all_lists.values())
    processed_count = 0

    print(f"Found {len(all_lists)} categories with {total_items} total celebrities.")

    try:
        for list_name, celebrities in all_lists.items():
            meta = parse_category_info(list_name)
            category_slug = list_name.replace('_', '-') 
            
            print(f"\n--- Processing Category: {list_name} ({meta}) ---")

            for name in celebrities:
                processed_count += 1
                
                name_slug = slugify_filename(name)
                filename = f"{name_slug}-{category_slug}.jpg"
                out_path = os.path.join("assets", filename)
                
                display_name = strip_parentheses(name)
                
                # Add to JSON data regardless of whether we download it now or it exists
                final_json_data.append({
                    "name": display_name,
                    "image": f"assets/{filename}",
                    "category": list_name,
                    "topic": meta["topic"],
                    "gender": meta["gender"],
                    "location": meta["location"]
                })

                if os.path.exists(out_path):
                    print(f"[{processed_count}/{total_items}] {name}: already exists, skipping")
                    continue

                print(f"[{processed_count}/{total_items}] Downloading {name}...", end=" ", flush=True)
                
                # Retry logic for 403 Ratelimit
                retries = 0
                max_retries = 3
                success = False
                
                while retries <= max_retries and not success:
                    try:
                        # Re-init DDGS for every request to avoid session issues
                        with DDGS() as ddgs:
                            # Search for images
                            query = f"{name} {meta['topic']} portrait"
                            results = list(ddgs.images(query, max_results=10, safesearch="moderate"))
                            
                            if not results:
                                print(f"[No results found]")
                                break
                                
                            # Try the first few images
                            for res in results[:3]:
                                img_url = res.get("image")
                                if not img_url: continue
                                
                                try:
                                    img_data = requests.get(img_url, timeout=10).content
                                    with open(out_path, "wb") as f:
                                        f.write(img_data)
                                        
                                    # Verify image
                                    try:
                                        with Image.open(out_path) as img:
                                            img.verify()
                                        print("[OK]")
                                        success = True
                                        break
                                    except Exception:
                                        print("[Invalid Image]", end=" ")
                                        if os.path.exists(out_path):
                                            os.remove(out_path)
                                            
                                except Exception as e:
                                    print(f"[Download Error: {e}]", end=" ")
                                    
                            if not success:
                                print("[Failed to find working image]")
                                break # Stop retrying this person if images fail
                                
                    except Exception as e:
                        if "403" in str(e) or "Ratelimit" in str(e):
                            wait_time = (2 ** retries) * 15 # 15s, 30s, 60s
                            print(f"\n[Rate Limit hit. Waiting {wait_time}s...]", end=" ", flush=True)
                            time.sleep(wait_time)
                            retries += 1
                        else:
                            print(f"[Search Error: {e}]")
                            break

                # Sleep to be nice to the API
                time.sleep(random.uniform(3.0, 6.0))

    except KeyboardInterrupt:
        print("\n\n[!] Script interrupted by user. Saving progress...")
    except Exception as e:
        print(f"\n\n[!] Unexpected error: {e}. Saving progress...")
    finally:
        print("\nGenerating assets/images.json...")
        with open(os.path.join("assets", "images.json"), "w", encoding="utf-8") as f:
            json.dump(final_json_data, f, ensure_ascii=False, indent=2)
        print(f"Done! Saved {len(final_json_data)} items to assets/images.json")


if __name__ == "__main__":
    main()
