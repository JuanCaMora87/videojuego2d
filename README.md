# 🚀 AstroBlast 2D

## Contexto

**AstroBlast 2D** es un videojuego de acción espacial desarrollado con la **API Canvas de HTML5** como parte del Examen de las Unidades III y IV de la materia de **Graficación** de la carrera de Ingeniería en Sistemas Computacionales en el Instituto Tecnológico de Pachuca.

El juego sitúa al jugador en el rol de un comandante de defensa planetaria que debe destruir asteroides y amenazas espaciales antes de que saturen la órbita.

---

## Objetivo

Desarrollar una aplicación web interactiva con **Canvas 2D (WebGL)** que implemente:
- Animación de 25 objetos 2D simultáneos con movimientos variados
- Sistema de colisiones con física de rebote
- Interacción con el usuario mediante el mouse
- Diseño visual atractivo con temática espacial
- Buenas prácticas de control de versiones con **Git y GitHub**

---

## Justificación

El uso de la API Canvas permite crear experiencias gráficas interactivas directamente en el navegador, sin necesidad de plugins externos. Este proyecto aplica conceptos clave de graficación computacional como:

- **Transformaciones 2D** (traslación, rotación)
- **Detección de colisiones** (distancia euclidiana entre círculos)
- **Animación por frames** (requestAnimationFrame)
- **Física básica** (rebote elástico, rebote en bordes)
- **Gradientes y efectos visuales** en Canvas

---

## Reglas de Negocio Implementadas

| # | Regla | Estado |
|---|-------|--------|
| 1 | 25 objetos con 4 tipos de movimiento (vertical, horizontal, diagonal, circular) | ✅ |
| 1a | Aparecen/desaparecen con aleatoriedad, velocidad diferente por objeto | ✅ |
| 1b | Rebote en colisiones con animación de choque (💥 BOOM!) | ✅ |
| 2 | Imágenes/formas que representan asteroides y naves espaciales | ✅ |
| 2a | Temática: Espacio sideral | ✅ |
| 3 | Clic elimina objeto → reaparece en zona aleatoria (siempre 25) | ✅ |
| 4 | Fondo espacial animado (estrellas, nebulosas) + música de fondo + favicon | ✅ |
| 5 | Cursor personalizado tipo mira/crosshair | ✅ |
| 6 | Contador de objetos destruidos, en órbita y colisiones | ✅ |
| 7 | Header + Main + Footer con Bootstrap en línea | ✅ |
| 8 | Instrucciones claras en pantalla lateral | ✅ |

---

## Operación del Videojuego

### Controles
- **🖱️ Clic izquierdo** sobre un asteroide → lo destruye con animación de explosión y reaparece en otro lugar
- **🔊 Botón "Activar Música"** → activa/desactiva música de fondo espacial

### Mecánicas
- Los **25 objetos** se mueven constantemente con 4 patrones:
  - **Vertical**: arriba y abajo, rebotando en bordes
  - **Horizontal**: izquierda y derecha, rebotando en bordes  
  - **Diagonal**: en ángulo aleatorio, rebotando en bordes
  - **Circular**: orbitan alrededor de un punto central
- Cuando dos objetos colisionan, **intercambian velocidades** (física de rebote elástico) y se muestra un **flash blanco** de impacto
- Al hacer clic en un objeto, aparece la animación de **explosión** y el objeto reaparece en una posición aleatoria del canvas tras 600ms
- El **contador** en el panel izquierdo registra: objetos destruidos, objetos activos y total de colisiones

### Tipos de Objetos
| Tipo | Color | Tamaño | Descripción |
|------|-------|--------|-------------|
| Asteroide grande | 🔴 Rojo | ~34px | Roca espacial grande con cráteres |
| Asteroide mediano | 🟡 Amarillo | ~26px | Roca mediana con cráteres |
| Asteroide pequeño | 🟢 Verde | ~20px | Fragmento pequeño |
| Nave espacial | 🔵 Azul | ~28px | Nave enemiga con motor |

---

## Estructura del Proyecto

```
videojuego2d/
├── index.html          # Estructura HTML con Bootstrap
├── style.css           # Estilos temática espacial (Orbitron font)
├── game.js             # Lógica del juego (Canvas API)
├── README.md           # Documentación del proyecto
└── assets/
    ├── favicon.svg     # Ícono del sitio (cohete + planeta)
    ├── header-img.svg  # Imagen del header (escena espacial)
    ├── cursor.svg      # Cursor personalizado (mira/crosshair)
    └── space-music.mp3 # Música de fondo espacial (agregar manualmente)
```

---

## Tecnologías Utilizadas

- **HTML5 Canvas API** — renderizado 2D de objetos y animaciones
- **CSS3** — estilos, animaciones y fuentes (Google Fonts: Orbitron, Rajdhani)
- **JavaScript ES6+** — lógica del juego con clases y arrow functions
- **Bootstrap 5.3** (CDN) — layout responsivo Header/Main/Footer
- **SVG** — assets vectoriales (favicon, imagen header, cursor)
- **Git + GitHub** — control de versiones y despliegue

---

## Instalación y Ejecución

```bash
# Clonar repositorio
git clone https://github.com/JuanCaMora87/videojuego2d.git
cd videojuego2d

# Abrir en navegador (requiere servidor local para audio)
# Opción 1: VS Code Live Server (extensión)
# Opción 2:
npx serve .
```

### Nota sobre el audio
Coloca un archivo `space-music.mp3` en la carpeta `/assets/`. Puedes encontrar música libre de derechos en:
- [freesound.org](https://freesound.org)
- [incompetech.com](https://incompetech.com)
- [pixabay.com/music](https://pixabay.com/music)

Busca: *space ambient music*, *sci-fi background loop*

---

## Control de Versiones

```bash
# Inicializar repositorio
git init
git add .
git commit -m "feat: videojuego AstroBlast 2D inicial"

# Subir a GitHub
git remote add origin https://github.com/JuanCaMora87/videojuego2d.git
git branch -M main
git push -u origin main

# Publicar en GitHub Pages
git checkout -b gh-pages
git push origin gh-pages
```

URL del repositorio: `https://github.com/JuanCaMora87/videojuego2d`  
URL de la aplicación: `https://JuanCaMora87.github.io/videojuego2d`

---

## Conclusiones

El desarrollo de **AstroBlast 2D** permitió profundizar en el uso de la API Canvas de HTML5 para crear animaciones fluidas e interactivas. Los principales aprendizajes fueron:

1. **Gestión del ciclo de animación** con `requestAnimationFrame` para obtener 60fps estables
2. **Detección y resolución de colisiones** usando distancia euclidiana y física de rebote elástico
3. **Patrones de movimiento variados** (lineal, diagonal, circular) para generar dinamismo visual
4. **Efectos visuales avanzados** con gradientes radiales, sombras (shadowBlur) y partículas
5. **Arquitectura orientada a objetos** con la clase `SpaceObject` para manejar estado individual
6. El manejo de **eventos del mouse** en coordenadas relativas al canvas fue fundamental para la interactividad
7. El uso de **Bootstrap** facilitó la creación de un layout responsivo sin esfuerzo adicional

---

## Información del Proyecto

| Campo | Valor |
|-------|-------|
| Materia | Graficación |
| Examen | Unidad 2 |
| Institución | Instituto Tecnológico de Pachuca |
| Profesor | M.T.I. Luis Alejandro Santana Valadez |
| Alumno | [Juan Carlos Mora Cisneros] |
| No. Control | [23200871] |
| Fecha | Abril 2026 |

---

*AstroBlast 2D — Desarrollado con ❤️ y Canvas API*
