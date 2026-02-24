from PIL import Image
import os

def remove_white_background(image_path):
    print(f"Processing {image_path}...")
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check for white or near-white (give a small tolerance for artifacting)
            if item[0] >= 240 and item[1] >= 240 and item[2] >= 240:
                newData.append((255, 255, 255, 0)) # Replace with transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(image_path, "PNG")
        print("Successfully removed background!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    logo_path = r"d:\Shreeji Ceramica\Shreeji Ceramica\public\logo.png"
    remove_white_background(logo_path)
