from PIL import Image, ImageDraw, ImageFilter
from loguru import logger
from typing import List, Optional

def create_mask_from_bubbles(width: int, height: int, bubbles: List[dict]) -> Optional[Image.Image]:
    """
    Generates a binary mask image (PIL) from a list of bubbles.
    Background is black (0), Bubbles are white (255).
    Applies dilation to cover bubble borders.
    """
    # Cria máscara preta
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    has_bubbles = False
    logger.info(f"🧼 [MaskService] Generating Mask for {len(bubbles)} bubbles...")
    
    for i, b in enumerate(bubbles):
        # Input: [ymin, xmin, ymax, xmax] (0-1000)
        if 'box_2d' not in b: continue
        
        # Extract Normalized Coords
        box = b['box_2d']
        if len(box) != 4: continue
        
        ymin_n, xmin_n, ymax_n, xmax_n = box
        
        # Conversão para Pixels Absolutos
        x1 = int((xmin_n / 1000) * width)
        y1 = int((ymin_n / 1000) * height)
        x2 = int((xmax_n / 1000) * width)
        y2 = int((ymax_n / 1000) * height)
        
        logger.info(f"   🔹 Bubble {i}: Norm[{ymin_n}, {xmin_n}...] -> Pixels[{x1}, {y1}, {x2}, {y2}]")
        
        # PIL espera [x1, y1, x2, y2]
        draw.rectangle([x1, y1, x2, y2], fill=255)
        has_bubbles = True

    if not has_bubbles: 
        logger.warning("❌ No valid bubbles found to clean.")
        return None
    
    # Dilatação para cobrir a borda do balão (Essential!)
    # MaxFilter(25) expande a área branca em ~12px para cada lado
    logger.info("🔧 Applying Aggressive Dilation (MaxFilter 25)...")
    mask = mask.filter(ImageFilter.MaxFilter(25))
    
    return mask
