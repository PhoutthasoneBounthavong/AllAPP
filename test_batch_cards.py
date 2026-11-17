import os
import glob
import time
import json
from dotenv import load_dotenv

# Load env from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
load_dotenv(env_path)

from backend.app.ai_vision_service import extract_card_with_gemini

TEST_DIR = os.path.join(os.path.dirname(__file__), "test_cards")

def run_tests():
    valid_exts = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    files = []
    for ext in valid_exts:
        files.extend(glob.glob(os.path.join(TEST_DIR, ext)))
        files.extend(glob.glob(os.path.join(TEST_DIR, ext.upper())))

    files = list(set(files))
    if not files:
        print(f"No card images found in: {TEST_DIR}")
        print("Please place .jpg / .png business card photos into this folder.")
        return

    print(f"\nFound {len(files)} test card(s) in {TEST_DIR}")
    print("=" * 70)

    for i, path in enumerate(files, 1):
        filename = os.path.basename(path)
        print(f"\n[{i}/{len(files)}] Testing: {filename} ...")
        t0 = time.time()
        result = extract_card_with_gemini(path)
        duration = round(time.time() - t0, 2)

        if not result:
            print(f"FAILED to extract card in {duration}s")
            continue

        print(f"SUCCESS in {duration}s (Model: {result.get('model_used', 'AI')})")
        print(f"  * Name:    {result.get('full_name') or 'N/A'}")
        print(f"  * Title:   {result.get('job_title') or 'N/A'}")
        print(f"  * Company: {result.get('company') or 'N/A'}")
        print(f"  * Phone:   {result.get('phone') or 'N/A'}")
        print(f"  * Email:   {result.get('email') or 'N/A'}")
        print(f"  * Website: {result.get('website') or 'N/A'}")
        print(f"  * Address: {result.get('address') or 'N/A'}")
        if result.get("notes"):
            print(f"  * Notes:   {result.get('notes')}")

    print("\n" + "=" * 70)
    print("Batch test completed!")

if __name__ == "__main__":
    run_tests()
