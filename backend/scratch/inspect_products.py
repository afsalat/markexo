import json

with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    print(f"ID: {p.get('id')}, Slug: {p.get('slug')}, Name: {p.get('name')[:40]}")
