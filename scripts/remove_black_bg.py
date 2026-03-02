"""
Remove black backgrounds from brand logos, making them transparent.
Pixels that are "near black" (all RGB channels below a threshold) become transparent.
"""
from PIL import Image
import numpy as np
import os

def remove_dark_background(input_path: str, output_path: str, threshold: int = 60):
    """
    Makes pixels whose RGB values are all below `threshold` fully transparent.
    Also applies a soft edge by partially fading pixels near the threshold.
    """
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    # Darkness score: how dark is each pixel (0=pure black, 255=very bright)
    brightness = np.max(np.stack([r, g, b], axis=-1), axis=-1)

    # Hard cut: fully transparent below threshold
    mask_transparent = brightness < threshold
    # Soft transition zone: threshold to threshold+40
    soft_zone = (brightness >= threshold) & (brightness < threshold + 40)
    alpha_factor = (brightness - threshold) / 40.0  # 0.0 → 1.0

    new_alpha = np.where(mask_transparent, 0,
                np.where(soft_zone, a * alpha_factor, a))

    data[:, :, 3] = np.clip(new_alpha, 0, 255)
    result = Image.fromarray(data.astype(np.uint8), "RGBA")
    result.save(output_path, "PNG")
    print(f"✅ Saved: {output_path}")

base = os.path.join(os.path.dirname(__file__), "..", "public")

remove_dark_background(
    os.path.join(base, "aquant_logo_bg.png"),
    os.path.join(base, "aquant_logo_bg.png"),
    threshold=60
)

remove_dark_background(
    os.path.join(base, "plumber_logo.png"),
    os.path.join(base, "plumber_logo.png"),
    threshold=60
)

print("Done! Both logos now have transparent backgrounds.")
