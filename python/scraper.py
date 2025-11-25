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

def save_json(data, path):
    """Helper to save JSON data safely."""
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"\n[!] Error saving JSON: {e}")

# ---------------------------
# 2) Main routine
# ---------------------------
def main():
    os.makedirs("assets", exist_ok=True)
    json_path = os.path.join("assets", "images.json")
    
    # 1. Load existing JSON data to preserve history
    existing_data = []
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            print(f"Loaded {len(existing_data)} existing entries from {json_path}")
        except Exception as e:
            print(f"Error loading existing JSON: {e}. Starting fresh.")
            existing_data = []
    
    # Create a lookup map for existing entries by name to avoid duplicates/overwrite logic if needed
    # Key: name, Value: entry dict
    data_map = {item["name"]: item for item in existing_data}

    # Collect all lists from lists.py
    all_lists = {k: v for k, v in vars(lists).items() if isinstance(v, list) and not k.startswith('_')}
    
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
                
                display_name = strip_parentheses(name)
                name_slug = slugify_filename(name)
                filename = f"{name_slug}-{category_slug}.jpg"
                out_path = os.path.join("assets", filename)
                rel_path = f"assets/{filename}"

                # Construct the entry object
                entry = {
                    "name": display_name,
                    "image": rel_path,
                    "category": list_name,
                    "topic": meta["topic"],
                    "gender": meta["gender"],
                    "location": meta["location"]
                }

                # Check if image exists physically
                if os.path.exists(out_path):
                    print(f"[{processed_count}/{total_items}] {name}: Image exists.", end=" ")
                    
                    # Update/Add to data_map
                    if display_name not in data_map:
                        print("Adding to JSON.")
                        data_map[display_name] = entry
                        # Save immediately on change
                        save_json(list(data_map.values()), json_path)
                    else:
                        print("Already in JSON.")
                    continue

                # If not exists, download
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

                # If successfully downloaded, add to JSON and save
                if success and os.path.exists(out_path):
                    data_map[display_name] = entry
                    save_json(list(data_map.values()), json_path)
                
                # Sleep to be nice to the API
                time.sleep(random.uniform(3.0, 6.0))

    except KeyboardInterrupt:
        print("\n\n[!] Script interrupted by user. Progress saved.")
    except Exception as e:
        print(f"\n\n[!] Unexpected error: {e}. Progress saved.")
    finally:
        # Final save just in case
        print("\nFinalizing assets/images.json...")
        save_json(list(data_map.values()), json_path)
        print(f"Done! Saved {len(data_map)} items to assets/images.json")


if __name__ == "__main__":
    main()
