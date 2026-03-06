with open('api/views.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix indentation from line 174 to 278 (0-indexed: 173-277)
for i in range(173, min(278, len(lines))):
    if lines[i].startswith('            '):  # 12 spaces
        lines[i] = lines[i][4:]  # Remove 4 spaces

with open('api/views.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed indentation!")
