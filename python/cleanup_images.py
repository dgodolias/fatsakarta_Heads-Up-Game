import json
import os
import sys

def main():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "assets", "images.json")
    
    print(f"Checking {json_path}...")
    
    if not os.path.exists(json_path):
        print("Error: assets/images.json not found!")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    cleaned_data = []
    removed_count = 0
    
    print(f"Total entries before cleanup: {len(data)}")

    for entry in data:
        image_rel_path = entry.get("image")
        if not image_rel_path:
            print(f"Skipping entry without image path: {entry.get('name')}")
            continue
            
        # Construct absolute path to check existence
        # The paths in JSON are like "assets/filename.jpg"
        # We need to join with base_dir
        image_abs_path = os.path.join(base_dir, image_rel_path)
        
        if os.path.exists(image_abs_path):
            cleaned_data.append(entry)
        else:
            print(f"Removing missing image: {entry.get('name')} ({image_rel_path})")
            removed_count += 1

    print(f"Total entries after cleanup: {len(cleaned_data)}")
    print(f"Removed {removed_count} entries.")

    if removed_count > 0:
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
            print("Successfully updated assets/images.json")
        except Exception as e:
            print(f"Error saving JSON: {e}")
    else:
        print("No changes needed.")

if __name__ == "__main__":
    main()
