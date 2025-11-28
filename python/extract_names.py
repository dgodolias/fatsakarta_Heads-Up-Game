import json
import os

def main():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "assets", "images.json")
    output_path = os.path.join(base_dir, "names.txt")
    
    print(f"Reading from: {json_path}")

    if not os.path.exists(json_path):
        print("Error: assets/images.json not found!")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    names = []
    for entry in data:
        name = entry.get("name")
        if name:
            names.append(name)
    
    # Sort names alphabetically for better readability
    names.sort()

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            for name in names:
                f.write(f"{name}\n")
        print(f"Successfully wrote {len(names)} names to: {output_path}")
    except Exception as e:
        print(f"Error writing to text file: {e}")

if __name__ == "__main__":
    main()
