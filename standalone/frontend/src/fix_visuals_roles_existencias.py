import os, re

# Fix RoleManagement.js
path_role = r"c:\Users\zaval\OneDrive\Documentos\ProyectosFreelance\FullStack_SistemaSmart\standalone\frontend\src\pages\people\RoleManagement.js"

if os.path.exists(path_role):
    with open(path_role, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('className="text-white p-4">Cargando roles...', 'className="text-gray-800 p-4 font-semibold animate-pulse">Cargando roles...')
    content = content.replace('className="text-xl font-bold text-white"', 'className="text-xl font-bold text-gray-800"')
    content = re.sub(r'className="w-full bg-gray-700 text-white[^"]*"', 'className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded p-2 outline-none focus:border-cyan-500"', content)
    content = content.replace('focus:ring-cyan-500 bg-gray-700', 'focus:ring-cyan-500 bg-white')
    content = content.replace('className="p-3 font-medium text-white"', 'className="p-3 font-medium text-gray-800"')
    content = content.replace('className="p-4 font-bold text-white"', 'className="p-4 font-bold text-gray-800"')
    with open(path_role, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed RoleManagement.js")

print("Done with script fixes.")
