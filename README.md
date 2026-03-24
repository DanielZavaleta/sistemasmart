# 🚀 Tech4Biss - Sistema Smart POS

**Tech4Biss** es un sistema de Punto de Venta (POS) inteligente y moderno diseñado para optimizar la gestión de ventas, inventarios y operaciones comerciales de tu negocio. Combina la potencia de un backend robusto en Python con una interfaz de usuario fluida y reactiva en React, todo empaquetado como una aplicación de escritorio mediante Electron.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto está organizado en un monorepo dentro del directorio `standalone`, dividiéndose en tres componentes principales:

*   **💻 Frontend**: Desarrollado con **React**, proporcionando una interfaz de usuario moderna, ágil y reactiva.
*   **⚙️ Backend**: Construido con **Django (Python)**, encargado de la lógica de negocio, APIs REST y persistencia de datos con **SQLite**.
*   **📦 Desktop (Electron)**: Un wrapper que empaqueta el Frontend y el Backend en una aplicación de escritorio nativa para sistemas operativos (Windows, etc.).

---

## 📂 Estructura del Proyecto

```text
biss4tech/
├── README.md                  # Este archivo de documentación
├── standalone/                # Código fuente de la aplicación
    ├── backend/               # Servidor Django (Lógica y Base de datos)
    │   ├── src/               # Código fuente del Backend
    │   │   ├── api/           # Endpoints para ventas, inventario, etc.
    │   │   └── config/        # Configuración de Django
    │   └── requirements.txt    # Dependencias de Python
    ├── frontend/              # Cliente React (Interfaz de Usuario)
    │   ├── src/
    │   │   ├── components/    # Componentes reutilizables (Corte, Tablas, etc.)
    │   │   └── pages/         # Vistas: Dashboard, POS, Inventario, etc.
    │   └── package.json       # Dependencias de npm
    ├── electron/              # Configuración y Proceso Principal de Electron
    │   ├── main.js            # Punto de entrada de Electron
    │   └── preload.js         # Script preload para seguridad/comunicación IPC
    └── package.json           # Configuración del empaquetador (Electron)
```

---

## 🛠️ Guía de Desarrollo (Setup)

Sigue estos pasos para levantar el entorno de desarrollo localmente:

### 1. ⚙️ Servidor Backend (Django)

1.  Navega a la carpeta del backend:
    ```bash
    cd standalone/backend
    ```
2.  Crea un entorno virtual (recomendado):
    ```bash
    python -m venv venv
    ```
3.  Activa el entorno virtual:
    *   **Windows**: `venv\Scripts\activate`
    *   **Mac/Linux**: `source venv/bin/activate`
4.  Instala las dependencias:
    ```bash
    pip install -r requirements.txt
    ```
5.  Configura las variables de entorno si existe un archivo `.env` en `src/` (revisa `standalone/backend/src/.env`).
6.  Corre las migraciones y levanta el servidor:
    ```bash
    cd src
    python manage.py migrate
    python manage.py runserver
    ```
    *El backend correrá en `http://127.0.0.1:8000/`.*

---

### 2. 💻 Cliente Frontend (React)

1.  Navega a la carpeta del frontend:
    ```bash
    cd standalone/frontend
    ```
2.  Instala las dependencias de Node:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm start
    ```
    *El frontend correrá en `http://localhost:3000/`.*

---

### 3. 📦 Entorno de Escritorio (Electron)

Para desarrollo, puedes correr Electron para visualizar la app de escritorio cargando la URL del frontend:

1.  Navega a la raíz del directorio standalone:
    ```bash
    cd standalone
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia la aplicación de Electron:
    ```bash
    npm start
    ```

---

## 📦 Empaquetado para Producción

Para generar el ejecutable (`.exe`) para distribución en Windows:

1.  **Construir Frontend**: Asegúrate de que el frontend esté compilado.
    ```bash
    cd standalone/frontend
    npm run build
    ```
2.  **Construir Backend**: Compila el backend a un ejecutable usando PyInstaller (revisar `backend.spec`).
3.  **Empaquetar Electron**:
    ```bash
    cd standalone
    npm run dist
    ```
    *Esto generará un archivo instalador (`.nsis`) en el directorio `dist/`.*

---

## ✨ Características Principales

*   📊 **Dashboard**: Visualización en tiempo real de métricas de ventas, KPIs y alertas de bajo stock.
*   🛒 **Punto de Venta (POS)**: Interfaz ágil para escaneo, búsqueda de productos y selección de métodos de pago (Efectivo, Tarjeta, Crédito).
*   📦 **Gestión de Inventario**: Módulos de gestión de productos, categorías, entradas de stock, transferencias y reportes.
*   👥 **Módulo de Personas**: Administración de Clientes (con sistema de abonos) y Proveedores.
*   💰 **Cortes y Arqueos de Caja**: Control estricto de flujo de efectivo y auditoría de ventas por cajero.
*   ⚙️ **Configuraciones Personalizables**: Control de usuarios, perfiles, descuentos y personalización del Ticket de venta.

---

Desarrollado por **DanielRodZa** 🚀
