# 🚀 Cómo subir a GitHub

## Opción A: GitHub Desktop (MÁS FÁCIL con interfaz)

1. Descarga GitHub Desktop: https://desktop.github.com/
2. Instala y abre GitHub Desktop
3. File → Add Local Repository → Selecciona esta carpeta
4. Crea un nuevo repositorio
5. Publish repository

## Opción B: Con comandos Git (después de instalar Git)

```bash
# 1. Ir a la carpeta
cd C:\Users\JUKKI\.gemini\antigravity\scratch\kanban-of-mobile

# 2. Inicializar Git
git init

# 3. Añadir todos los archivos
git add .

# 4. Hacer el primer commit
git commit -m "Initial commit - PWA Kanban móvil"

# 5. Crear repositorio en GitHub primero en: https://github.com/new
# Luego conectarlo (reemplaza TU_USUARIO y TU_REPO):
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git

# 6. Subir a GitHub
git branch -M main
git push -u origin main
```

## Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from branch
4. Branch: main → /root
5. Save

¡Tu app estará en: `https://TU_USUARIO.github.io/TU_REPO/`

---

## ⚡ RECOMENDACIÓN RÁPIDA: Netlify Drop

Si solo quieres probar la app YA en tu móvil:

1. Ve a: https://app.netlify.com/drop
2. Arrastra la carpeta completa
3. Te da URL instantánea
4. Ábrela en Chrome móvil
5. ¡Instala la PWA!

**Ventaja**: Sin instalaciones, sin configuración, en 1 minuto.
