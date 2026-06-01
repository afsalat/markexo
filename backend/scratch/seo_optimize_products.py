import os
import sys
import json

def clean_string(s):
    if not s:
        return ""
    # Standardize smart quotes / apostrophes
    s = s.replace('\u2018', "'").replace('\u2019', "'").replace('\u0092', "'").replace('’', "'")
    # Standardize non-standard dashes / invalid characters to clean dividers
    s = s.replace('\ufffd', "|").replace('\u2013', "-").replace('\u2014', "-").replace('\u0096', "-")
    # If the character displays as a special symbol or double-hyphen, normalize it
    s = s.replace(' – ', ' | ').replace(' — ', ' | ').replace(' - ', ' | ')
    # Double spaces cleanup
    s = " ".join(s.split())
    return s

def generate_seo_description(name, original_desc, specs):
    # Standardize description paragraphs
    clean_desc = original_desc.strip()
    if not clean_desc:
        clean_desc = f"Premium {name} designed for maximum efficiency, durability, and everyday use."

    # Parse specifications to generate rich feature bullets
    spec_bullets = []
    if isinstance(specs, dict):
        # Pick relevant spec parameters to build high-converting search keywords
        for k, v in specs.items():
            if k in ['Material', 'Type', 'Net Quantity', 'Recommended Age', 'Capacity', 'Suitable For', 'Country of Origin']:
                spec_bullets.append(f"<li><strong>{k}:</strong> {v}</li>")
    
    # Standard key features fallback
    if len(spec_bullets) < 2:
        spec_bullets.append(f"<li><strong>Premium Build Quality:</strong> Crafted from highly durable, long-lasting materials.</li>")
        spec_bullets.append(f"<li><strong>Ergonomic & User-Friendly:</strong> Optimized design for comfort and straightforward everyday usage.</li>")
        spec_bullets.append(f"<li><strong>Multipurpose Utility:</strong> Suitable for a wide range of household, personal, or professional needs.</li>")

    bullets_html = "\n".join(spec_bullets)
    
    seo_desc = (
        f"<p>{clean_desc}</p>\n\n"
        f"<h3>Key Features & Specifications</h3>\n"
        f"<ul>\n{bullets_html}\n</ul>\n\n"
        f"<h3>Why Choose This Product?</h3>\n"
        f"<ul>\n"
        f"<li><strong>Value for Money:</strong> Combining top-tier quality with affordability to give you the best deal.</li>\n"
        f"<li><strong>Perfect Gift Idea:</strong> A practical and thoughtful gift choice for family, friends, or colleagues.</li>\n"
        f"<li><strong>Guaranteed Satisfaction:</strong> Engineered to meet rigorous quality standards for absolute peace of mind.</li>\n"
        f"</ul>"
    )
    return seo_desc

def optimize_catalog():
    input_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'products.json')
    if not os.path.exists(input_path):
        print(f"Error: Input file products.json not found at {input_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Opening catalog from: {input_path}")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Optimizing {len(data)} product profiles...")
    optimized_count = 0

    for item in data:
        # 1. Clean name
        old_name = item.get('name', '')
        new_name = clean_string(old_name)
        if new_name != old_name:
            item['name'] = new_name
            optimized_count += 1
            
        # 2. Enrich description with premium high-converting HTML elements
        original_desc = item.get('description', '')
        specs = item.get('specifications', {})
        
        # Prevent double-optimizing if already rich
        if "<h3>Key Features & Specifications</h3>" not in original_desc:
            item['description'] = generate_seo_description(new_name, original_desc, specs)
            optimized_count += 1

    # Save the optimized file back to products.json
    with open(input_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"\nSUCCESS: Successfully optimized names/descriptions for all {len(data)} products in products.json!")

if __name__ == '__main__':
    optimize_catalog()
