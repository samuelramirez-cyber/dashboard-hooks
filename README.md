# Radar de Hooks

Dashboard de captura manual de Hook Rate para la estrategia de contenido de Grupo Auteco.
Registra el desempeño de cada pieza publicada y muestra qué días de la semana conviene pausar producción, qué pilar y qué marca rinden mejor.

Página estática (GitHub Pages) → Google Apps Script (API) → Google Sheets (base de datos). Sin costo, sin necesidad de cuenta de Claude para el equipo.

## Puesta en marcha (una sola vez)

### 1. Sube la hoja de datos a Google Sheets

Importa `Radar_de_Hooks_Datos.xlsx` (Archivo → Importar, o súbelo a Drive y ábrelo con Sheets). Trae la pestaña `Posts` con los encabezados correctos y listas desplegables — no cambies los nombres de columna, el script los usa tal cual.

### 2. Conecta el Apps Script

1. En el Sheet: **Extensiones → Apps Script**.
2. Borra el contenido de ejemplo y pega todo el contenido de [`apps-script/Code.gs`](apps-script/Code.gs).
3. Guarda el proyecto (dale un nombre, ej. "Radar de Hooks API").
4. **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
5. Autoriza el acceso (Google va a advertir que es una app no verificada — es tu propio script: **Avanzado → Ir a [proyecto] (no seguro) → Permitir**).
6. Copia la URL que termina en `/exec`.

### 3. Conecta la página con el Sheet

1. Abre la página publicada (ver abajo).
2. Pulsa el ícono **⚙** (arriba a la derecha).
3. Pega la URL `/exec` y guarda. Queda guardada solo en ese navegador — cada persona del equipo hace este paso una vez, en su propio navegador.

## Publicar en GitHub Pages

Este repo ya está listo para servirse tal cual:

1. **Settings → Pages** en este repositorio.
2. Source: **Deploy from a branch** → branch `main` → carpeta `/ (root)`.
3. Guarda. En un par de minutos queda disponible en `https://<tu-usuario>.github.io/dashboard-hooks/`.

## Estructura del repositorio

```
index.html            La página del dashboard (HTML/CSS/JS, sin dependencias de build)
apps-script/Code.gs   Código a pegar en Apps Script (paso 2 arriba)
```

## Seguridad — léelo antes de compartir el link ampliamente

El Apps Script se despliega con acceso "Cualquier usuario" para que la página estática (sin login) pueda escribir datos. Esto significa que **cualquiera con la URL `/exec` podría escribir filas**, no solo quien tenga el link de la página. Para un equipo interno esto suele ser un riesgo aceptable, pero si quieres una capa mínima de protección:

1. En `Code.gs`, pon una palabra secreta en la constante `SHARED_TOKEN`.
2. En `index.html`, agrega `"_token": "tu-palabra-secreta"` al objeto `data` antes de cada `fetch(...)` de escritura.

No es seguridad real (la palabra queda visible en el código fuente de la página), solo evita escrituras accidentales o de bots automáticos.

## Límites conocidos

- **No hay actualización en vivo entre personas** — la página revisa el Sheet cada 30 segundos y al cargar; usa el botón ⟳ para forzar una actualización.
- **Concurrencia**: Apps Script no maneja bien cientos de escrituras simultáneas — para un equipo pequeño registrando manualmente no es un problema real.
- Este README y el código fueron preparados sin una implementación real desplegada todavía — si algo falla en el primer intento (típicamente CORS o permisos), revisa que el paso 4.4 diga exactamente "Cualquier usuario" y no "Cualquier usuario con cuenta de Google".
