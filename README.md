# ¿De qué casa es? · Game of Thrones

Juego para adivinar a qué casa pertenece cada personaje de Game of Thrones, con 4 alternativas.
Usa ThronesAPI (https://thronesapi.com/api/v2/Characters), gratis y sin clave.

## Cómo ejecutarlo en Visual Studio Code

1. Descomprime la carpeta `got-quiz` y ábrela en VS Code (Archivo → Abrir carpeta).
2. Instala la extensión **Live Server** (de Ritwick Dey), si aún no la tienes.
3. Clic derecho en `index.html` → **Open with Live Server**.
4. Se abrirá el juego en tu navegador.

## Archivos

- `index.html` – estructura de la página
- `style.css` – estilos (tema oscuro y dorado)
- `script.js` – lógica del juego y llamada a la API

## Personalizar

En `script.js`:
- `TOTAL_ROUNDS` – número de preguntas
- `HOUSES` – casas que reconoce el juego. Los personajes sin casa conocida
  (por ejemplo "Unknown" o "None" en la API) se omiten.

## Si no cargan los datos (error CORS)

El juego prueba varios proxys gratuitos automáticamente. Si aun así falla, usa el
servidor incluido (necesitas Node.js 18+, descárgalo en https://nodejs.org):

1. En VS Code abre la terminal: Terminal → Nueva terminal.
2. Escribe `node server.js` y presiona Enter.
3. Abre http://localhost:3000 en el navegador.
