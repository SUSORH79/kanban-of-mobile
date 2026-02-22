# 🔧 INSTRUCCIONES PARA SOLUCIONAR "NO HAY MÁQUINAS"

## Problema
Las máquinas CNC no aparecen en el selector porque tienes datos antiguos guardados en el navegador.

## Solución Rápida

### Opción 1: Usar el botón "Limpiar Datos"
1. Abre `manager.html` (Panel del Encargado)
2. Haz clic en el botón **"🗑️ Limpiar Datos"** (arriba a la derecha)
3. La página se refrescará automáticamente
4. Las máquinas ahora serán: **CNC BIESSE, CNC SCM, CNC MORBIDELLI, FRESA**

### Opción 2: Limpiar desde el navegador
1. Abre el navegador (Chrome/Edge/Firefox)
2. Presiona **F12** para abrir las herramientas de desarrollo
3. Ve a la pestaña **"Console"** (Consola)
4. Escribe esto y presiona Enter:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
5. Listo! Las máquinas aparecerán

### Opción 3: Borrar caché del navegador
1. Presiona **Ctrl + Shift + Delete**
2. Selecciona "Datos de sitios" o "LocalStorage"
3. Haz clic en "Borrar"
4. Recarga la página

---

## ✅ Verificación
Después de limpiar los datos, cuando abras `operator.html` deberías ver en el selector:
- ✅ CNC BIESSE
- ✅ CNC SCM
- ✅ CNC MORBIDELLI
- ✅ FRESA

---

## 📄 Formulario Imprimible
He creado **`formulario_operario.html`** en la carpeta `app_cnc`.

### Cómo usarlo:
1. Abre **`formulario_operario.html`** con doble clic
2. Haz clic en el botón azul **"🖨️ IMPRIMIR"** (o presiona Ctrl+P)
3. Selecciona **"Guardar como PDF"** o imprime directamente
4. El operario puede rellenar el formulario a mano

### Contenido del formulario:
- Datos generales (fecha, hora, máquina, turno)
- Orden de producción (OP)
- ¿Hubo problemas? (Sí/No)
- Tipos de problema (checkboxes)
- Descripción detallada
- Tiempo de parada y piezas rechazadas
- Severidad (Baja/Media/Alta/Crítica)
- Firmas (Operario y Encargado)

**Tamaño**: 1 hoja A4 exacta ✅
