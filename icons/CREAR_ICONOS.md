# Instrucciones para generar los iconos PNG

Ya que el generador de imágenes no está disponible en este momento, necesitas crear los iconos PNG a partir del archivo SVG incluido.

## Opción 1: Usar una herramienta online

1. Abre https://www.iloveimg.com/es/redimensionar-imagen/redimensionar-svg
2. Sube el archivo `icon.svg`
3. Genera las siguientes versiones:
   - icon-72.png (72x72)
   - icon-96.png (96x96)
   - icon-128.png (128x128)
   - icon-144.png (144x144)
   - icon-152.png (152x152)
   - icon-192.png (192x192)
   - icon-384.png (384x384)
   - icon-512.png (512x512)

## Opción 2: Usar software gráfico

- **Inkscape** (gratuito): Abre el SVG y exporta en diferentes tamaños
- **Photoshop/Illustrator**: Similar proceso
- **GIMP**: Abre el SVG y redimensiona

## Opción 3: Usar un generador PWA

1. Ve a https://www.pwabuilder.com/imageGenerator
2. Sube el archivo SVG
3. Descarga todos los tamaños generados
4. Colócalos en la carpeta `icons/`

## Uso temporal

Si quieres probar la app sin iconos:
- La app funcionará igualmente
- No se verá el icono correcto al instalar
- Puedes agregar los iconos más tarde

---

**Nota**: Los iconos son necesarios solo para la instalación PWA. La funcionalidad de la app no se ve afectada.
