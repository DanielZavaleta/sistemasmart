import os

# 1. Fix CaducidadReport.js
path_cadu = r"c:\Users\zaval\OneDrive\Documentos\ProyectosFreelance\FullStack_SistemaSmart\standalone\frontend\src\pages\inventory\CaducidadReport.js"

if os.path.exists(path_cadu):
    with open(path_cadu, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Empty alert text green-400 on white -> green-600
    content = content.replace('text-green-400">¡Excelente!', 'text-green-700 font-medium">¡Excelente!')
    
    # Row highlights bg-red-900 (Dark) -> bg-red-50 (Light warning)
    content = content.replace("isExpired ? 'bg-red-900 hover:bg-red-800' : 'hover:bg-gray-100'", "isExpired ? 'bg-red-50 text-red-800 hover:bg-red-100' : 'hover:bg-gray-100'")
    
    # Text cell highlight colors
    content = content.replace("isExpired ? 'text-red-400' : 'text-yellow-400'", "isExpired ? 'text-red-600 font-bold' : 'text-yellow-600'")
    content = content.replace("className=\"inline text-red-400\"", "className=\"inline text-red-600\"")
    
    with open(path_cadu, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed CaducidadReport.js")


# 2. Fix ReporteExistencias.js
path_exis = r"c:\Users\zaval\OneDrive\Documentos\ProyectosFreelance\FullStack_SistemaSmart\standalone\frontend\src\pages\inventory\ReporteExistencias.js"

if os.path.exists(path_exis):
    with open(path_exis, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace bright texts on white row lists (text-cyan-400, text-green-400)
    content = content.replace('text-cyan-400', 'text-cyan-600')
    content = content.replace('text-green-400', 'text-green-600')
    # Row conditional default color
    # Back to standard inherit or gray-800 over text-white condition
    content = content.replace("? 'text-red-500' : 'text-white'", "? 'text-red-500' : 'text-gray-800'")
    with open(path_exis, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed ReporteExistencias.js")

print("Done with script fixes.")
