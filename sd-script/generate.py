import requests
import base64
import os

# Automatic1111 API
API_URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"

OUTPUT_DIR = "assets/images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generation settings
SETTINGS = {
    "checkpoint:": "3DCartoonip_v20.safetensors [522ab0e863]",
    "steps": 30,
    "width": 512,
    "height": 512,
    "cfg_scale": 4.5,
    "sampler_name": "Euler a",
    "seed": -1,
    "negative_prompt": "easynegative, text, letters, words, watermark"
}

PROMPTS_FILE = "prompts.txt"

sex = ["male", "female"]
ethnicity = ["white", "asian", "black", "hispanic", "middle eastern", "indian"]


def slugify(value):
    """Turn a string into a safe filename slug."""
    slug = "".join(c if c.isalnum() or c in " _-" else "_" for c in value)
    return slug[:80].rstrip(" _-")


def load_prompts(filepath):
    """Load variable parts from a text file.

    Expected format: one variable per line.
    Each line is inserted into the template prompt:
        'a Harry Potter style, white, male, wizard character, [variable], centered
         character, full upper body, clearly visible features, masterpiece,
         best quality, 3D cartoon, render, simple plain background, children'

    Lines starting with # are treated as comments and skipped.
    Empty lines are skipped.
    """
    if not os.path.exists(filepath):
        print(f"Error: '{filepath}' not found.")
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Template with placeholders: {ethnicity}, {sex}, {variable}
    base_prompt = (
        "a Harry Potter style, {ethnicity}, {sex}, wizard character, {variable}, "
        "centered character, full upper body, clearly visible features, "
        "masterpiece, best quality, 3D cartoon, render, simple plain background, children"
    )

    jobs = []
    for i, line in enumerate(lines):
        line = line.strip()
        # Skip empty lines and comments
        if not line or line.startswith("#"):
            continue
        filename = f"{slugify(line)}.png"
        # Cycle through sex and ethnicity in lockstep (same index)
        s = sex[i % len(sex)]
        e = ethnicity[i % len(ethnicity)]
        prompt = base_prompt.format(
            ethnicity=e,
            sex=s,
            variable=line,
        )
        jobs.append({"filename": filename, "prompt": prompt})

    return jobs


# Load prompts from file
JOBS = load_prompts(PROMPTS_FILE)

if not JOBS:
    print("No prompts to process. Exiting.")
    exit()

print(f"Loaded {len(JOBS)} prompt(s) from '{PROMPTS_FILE}'.\n")

for i, job in enumerate(JOBS, start=1):
    print(f"[{i}/{len(JOBS)}] Generating: {job['filename']}")
    print(f"  Prompt: {job['prompt']}")

    payload = {
        **SETTINGS,
        "prompt": job["prompt"]
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=600)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"  Error: {e}")
        continue

    result = response.json()

    # Save first generated image
    image_data = base64.b64decode(result["images"][0])

    output_path = os.path.join(OUTPUT_DIR, job["filename"])

    with open(output_path, "wb") as f:
        f.write(image_data)

    print(f"  Saved: {output_path}\n")

print("All jobs completed!")
