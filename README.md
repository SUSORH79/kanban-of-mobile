# 🏭 Kanban O.F. - PWA Móvil

Aplicación web progresiva (PWA) para gestión de Órdenes de Fabricación con sistema Kanban, optimizada para dispositivos móviles.

## ✨ Características

- ✅ **100% Móvil**: Diseñada específicamente para pantallas táctiles
- ✅ **Instalable**: Se puede instalar como app nativa en tu móvil
- ✅ **Offline**: Funciona sin conexión a internet
- ✅ **Rápida**: Sin dependencias, carga instantánea
- ✅ **Persistente**: Los datos se guardan localmente en el dispositivo

## 🚀 Cómo usar

### Opción 1: Abrir directamente (desarrollo)

1. Abre el archivo `index.html` directamente en tu navegador
2. **Limitación**: El service worker no funcionará con `file://`

### Opción 2: Servidor local (recomendado)

Necesitas servir los archivos con un servidor HTTP. Opciones:

#### Con Python:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Con PHP:
```bash
php -S localhost:8000
```

#### Con Node.js (si lo instalas):
```bash
npx serve
```

Luego abre `http://localhost:8000` en tu navegador.

## 📱 Instalar en el móvil

### Android (Chrome):
1. Abre la app en Chrome
2. Toca el menú (⋮)
3. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"
4. Confirma la instalación

### iOS (Safari):
1. Abre la app en Safari
2. Toca el botón de compartir (□↑)
3. Selecciona "Añadir a pantalla de inicio"
4. Dale un nombre y confirma

## 🎨 Funcionalidades

### Gestión de Órdenes
- ✏️ Crear nuevas órdenes de fabricación
- 📝 Editar órdenes existentes
- 🗑️ Eliminar órdenes
- 🔄 Mover entre etapas del proceso

### Etapas del proceso
1. **Pendiente** - Órdenes programadas
2. **Corte / Mecanizado** - En proceso de corte
3. **Ensamblaje / Montaje** - En ensamblaje
4. **Control de Calidad** - Verificación
5. **Expedición** - Listas para envío

### Filtros y ordenación
- 🎯 Filtrar por prioridad (Alta, Media, Baja)
- 📅 Ordenar por fecha de entrega
- ⚡ Ordenar por prioridad

### Indicadores visuales
- 🔴 **Retrasadas**: Fecha de entrega vencida
- 🟡 **Urgentes**: ≤ 3 días para entrega
- 🟢 **A tiempo**: > 3 días para entrega

## 📂 Estructura del proyecto

```
kanban-of-mobile/
├── index.html          # Página principal
├── app.js              # Lógica de la aplicación
├── styles.css          # Estilos móviles
├── manifest.json       # Configuración PWA
├── sw.js              # Service Worker (offline)
├── icons/             # Iconos de la app
└── README.md          # Este archivo
```

## 🔧 Personalización

### Cambiar colores
Edita las variables CSS en `styles.css`:
```css
:root {
  --slate-900: #0f172a;
  --blue-600: #2563eb;
  /* ... más colores */
}
```

### Modificar etapas
Edita el array en `app.js`:
```javascript
const STAGES = ["Etapa 1", "Etapa 2", ...];
```

### Cambiar nombre de la app
Edita `manifest.json`:
```json
{
  "name": "Tu Nombre de App",
  "short_name": "TuApp"
}
```

## 💾 Almacenamiento de datos

Los datos se guardan en **localStorage** del navegador:
- ✅ Persisten entre sesiones
- ✅ No requieren servidor
- ⚠️ Limitado a ~5-10MB
- ⚠️ Se borran si se limpia el caché del navegador

**Recomendación**: Haz backups periódicos exportando los datos si es crítico.

## 🌐 Compatibilidad

- ✅ Chrome/Edge (Android/Windows/Mac)
- ✅ Safari (iOS/Mac)
- ✅ Firefox (Android/Windows/Mac)
- ✅ Samsung Internet (Android)

## ⚠️ Notas importantes

1. **Iconos**: Genera tus propios iconos o usa el icono base incluido
2. **HTTPS**: Para PWA completa en producción, necesitas HTTPS
3. **Datos locales**: Los datos solo existen en el dispositivo donde se crearon
4. **Backup**: No hay sincronización en la nube por defecto

## 🆘 Solución de problemas

### La app no se instala
- Verifica que estés usando HTTPS (o localhost)
- Asegúrate de que el service worker esté registrado
- Revisa la consola del navegador para errores

### Los datos no se guardan
- Verifica que localStorage esté habilitado
- No uses modo incógnito/privado del navegador
- Revisa el espacio disponible del navegador

### El diseño se ve raro
- Limpia la caché del navegador
- Refresca con Ctrl+F5 (o Cmd+Shift+R en Mac)

## 📝 Licencia

Código de uso libre para tu empresa.

---

**Desarrollado para gestión de órdenes de fabricación móvil** 🏭📱
