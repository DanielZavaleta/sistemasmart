import os, re

root = r"c:\Users\zaval\OneDrive\Documentos\ProyectosFreelance\FullStack_SistemaSmart\standalone\frontend\src\pages"

light_bgs = ['bg-white', 'bg-gray-50', 'bg-slate-50', 'bg-slate-100']

def fix_classes(match):
    class_str = match.group(1)
    # Check if any light background string is present in the classes list
    if any(bg in class_str for bg in light_bgs) and 'text-white' in class_str:
        # Avoid breaking absolute buttons that might use high dark contrasts like bg-blue-600
        # If it ALSO declares a dark bg like bg-blue-600, then it might be styling on that dark bg
        if not re.search(r'\b(bg-(?:blue|green|red|purple|cyan|teal|indigo|gray-700|gray-800)-)', class_str):
             class_str = class_str.replace('text-white', 'text-gray-800')
    return f'className="{class_str}"'

count = 0
for dirpath, _, filenames in os.walk(root):
    for f in filenames:
        if f.endswith('.js'):
            path = os.path.join(dirpath, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            new_content = re.sub(r'className="([^"]+)"', fix_classes, content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Fixed: {path}")
                count += 1

print(f"Total files fixed: {count}")
