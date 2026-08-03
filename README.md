# Correos de universidades con React Email

Este repositorio usa una regla sencilla: cada entrega editable vive principalmente
en un solo archivo JSX. Las carpetas representan universidad, campaña y versión;
Git conserva el historial adicional y el HTML exacto que se entregó.

## Estructura

```text
emails/
  _shared/                         # Dos primitivas estables, no contenido de campañas
    CtaButton.jsx
    EmailShell.jsx
  catalogos/                       # Pruebas visuales; no son entregas reales
    universidad-latina/
      cta/
        2026-08-03-v01.jsx
  static/                          # Se crea cuando haya imágenes locales
    universidad-latina/
      admisiones-agosto-2026/
        hero-admisiones.jpg
    universidad-del-valle/
      becas-2026/
        banner-becas.jpg
  universidad-latina/
    admisiones-agosto-2026/
      2026-08-03-v01.jsx
      2026-08-10-v02.jsx
    maestria-inteligencia-artificial/
      2026-08-03-v01.jsx
  universidad-del-valle/
    becas-2026/
      2026-08-04-v01.jsx
out/                               # HTML generado; conserva las mismas rutas
  catalogos/
    universidad-latina/
      cta/
        2026-08-03-v01.html
  static/
    ...
  universidad-latina/
    admisiones-agosto-2026/
      2026-08-03-v01.html
      2026-08-10-v02.html
    maestria-inteligencia-artificial/
      2026-08-03-v01.html
  universidad-del-valle/
    becas-2026/
      2026-08-04-v01.html
```

El árbol muestra cómo crecerá el repositorio; no es necesario crear carpetas
vacías ni ejemplos ficticios. El correo migrado está en
`emails/universidad-latina/` y las antiguas vistas previas del CTA se conservaron
juntas en `emails/catalogos/universidad-latina/cta/`.

### Convención de nombres

- Universidad y campaña: minúsculas, palabras separadas con guiones y nombres
  reconocibles, por ejemplo `universidad-latina/admisiones-agosto-2026`.
- Entrega: `AAAA-MM-DD-vNN.jsx`, por ejemplo `2026-08-10-v02.jsx`.
- HTML: React Email usa el mismo nombre y ruta dentro de `out/`.

La fecha ordena y permite localizar la entrega en el tiempo; el número evita
ambigüedad si hay varias entregas el mismo día y deja clara la secuencia de la
campaña.

Una entrega normal usa un JSX fuente, su HTML generado y solamente las imágenes
que necesite. Textos, enlaces, colores, avisos legales y estructura específica
se quedan juntos en el JSX. No se crean archivos separados de datos o tema.

## Componentes compartidos e históricos

`_shared/` se ignora como listado de correos por React Email, pero sus módulos se
pueden importar. Solo contiene:

- `EmailShell.jsx`: documento HTML, fuente, fondo y ancho base.
- `CtaButton.jsx`: botón básico compatible con clientes de correo.

Estos componentes deben mantenerse pequeños y visualmente estables. No se
extraen encabezados, pies o secciones hasta que exista repetición real. Si un
nuevo diseño necesita un cambio incompatible, se crea una nueva variante del
componente compartido o se copia esa sección dentro del JSX nuevo. No se modifica
una primitiva de forma que cambie entregas antiguas.

El HTML de `out/` se versiona porque es el artefacto exacto entregado. Se genera
con React Email y nunca se edita a mano. Al exportar se reconstruye toda la
carpeta; antes de un commit hay que comprobar que Git no muestre cambios
inesperados en HTML históricos.

## Imágenes y recursos

Cuando una campaña tenga recursos, se guardan en:

```text
emails/static/<universidad>/<campaña>/
```

React Email sirve esa carpeta durante la previsualización y la copia a
`out/static/` al exportar. Usa nombres descriptivos como `hero-admisiones.jpg`,
`logo-universidad.png` o `icono-whatsapp.png`; la ruta de universidad/campaña
evita colisiones sin crear una carpeta por cada imagen.

Durante el trabajo se puede previsualizar una imagen con
`/static/<universidad>/<campaña>/<archivo>`. Antes de enviar el correo, su `src`
debe apuntar a una URL HTTPS pública y permanente; los clientes de correo no
pueden cargar una ruta local. Conserva también el archivo original en `static/`
como respaldo de la entrega.

## Instalación y comandos

Requiere Node.js 20 o posterior.

```bash
npm install
npm run dev
npm run export
```

- `npm run dev`: abre la previsualización normal de React Email en
  <http://localhost:3000>.
- `npm run export`: genera HTML legible en `out/` y conserva el árbol de
  universidad/campaña/versión.
- `npm run build`: valida y construye la aplicación de previsualización en
  `.react-email/`; esa carpeta es generada y está ignorada por Git. Este comando
  no es necesario para maquetar o exportar y puede tardar porque la UI de React
  Email ejecuta sus propias revisiones de compatibilidad y spam.

No hay CLI propia, generador ni proceso oculto. Los mismos scripts funcionan con
`pnpm dev`, `pnpm export` y `pnpm build` si se prefiere pnpm.

## Flujo de trabajo por caso

La decisión principal es si el correo ya fue entregado:

- **Borrador no entregado:** se puede seguir editando el mismo JSX.
- **Versión ya entregada:** es histórica; nunca se modifica. Cualquier cambio
  comienza duplicando el JSX que recibió el cliente.

Una versión pasa a ser histórica en cuanto se envía su HTML, aunque el cliente
todavía pueda pedir ajustes. Conviene hacer el commit de entrega inmediatamente.

### Caso 1: crear un correo completamente nuevo

1. Crea `emails/<universidad>/<campaña>/` con nombres reconocibles.
2. Copia el JSX de un correo parecido como punto de partida o crea uno nuevo.
3. Usa la fecha de la primera entrega y `v01`, por ejemplo
   `2026-08-03-v01.jsx`.
4. Mantén textos, enlaces, colores, estructura y datos específicos dentro de
   ese JSX.
5. Guarda las imágenes en `emails/static/<universidad>/<campaña>/` si aplica.
6. Ejecuta `npm run dev`, revisa el resultado y genera el HTML con
   `npm run export`.
7. Entrega el HTML de `out/` y registra la entrega en Git.

No hace falta crear archivos de datos o tema. Una entrega sencilla debe empezar
con un solo JSX.

### Caso 2: editar un correo que todavía es borrador

1. Abre el JSX actual y edítalo directamente.
2. Previsualiza con `npm run dev`.
3. Ejecuta `npm run export` cuando necesites un HTML actualizado.
4. No incrementes la versión por cada corrección interna.

Mientras no se haya enviado una entrega oficial, cambios de texto, enlaces,
colores o estructura pertenecen al mismo archivo. La nueva versión se crea al
recibir cambios después de una entrega, no después de cada guardado.

### Caso 3: crear una nueva versión de un correo entregado

Duplica el JSX entregado y edita solamente la copia:

```bash
cp emails/universidad-latina/admisiones-agosto-2026/2026-08-03-v01.jsx \
  emails/universidad-latina/admisiones-agosto-2026/2026-08-10-v02.jsx
```

Después:

1. Aplica los cambios en `v02`.
2. Previsualiza y exporta.
3. Comprueba que Git no muestre cambios en `v01` ni en su HTML.
4. Entrega y confirma en Git el nuevo JSX, sus recursos y su HTML.

Si las dos entregas ocurren el mismo día, conserva la fecha y aumenta el número:
`2026-08-03-v01.jsx`, `2026-08-03-v02.jsx`.

### Caso 4: modificar una entrega antigua meses después

No es obligatorio partir de la versión más reciente. Hay que partir de la
versión exacta que el cliente quiere modificar:

1. Localiza universidad y campaña desde las carpetas.
2. Identifica la fecha y versión de la entrega solicitada.
3. Duplica ese JSX con la fecha actual y el siguiente número disponible de la
   campaña.
4. Edita únicamente la copia.
5. Indica en el commit de qué versión partió si no era la última.

Por ejemplo, si existen `v01` y `v02`, pero el cambio debe aplicarse sobre
`v01`, la nueva entrega será `v03` aunque su contenido parta de `v01`. Así cada
número sigue siendo único dentro de la campaña.

### Caso 5: cambiar solamente una imagen

Si el correo todavía es borrador, reemplaza la imagen y continúa trabajando en
la misma versión. Si ya fue entregado:

1. Crea una nueva versión del JSX.
2. Añade la imagen nueva con otro nombre, por ejemplo `hero-admisiones-v02.jpg`.
3. Cambia la referencia únicamente en el nuevo JSX.
4. No sobrescribas el recurso que utiliza una entrega histórica.

En el HTML final, el `src` debe ser una URL HTTPS permanente. No reutilices la
misma URL para un archivo visualmente diferente si eso cambiaría correos ya
enviados.

### Caso 6: reenviar exactamente un HTML anterior

Localiza el archivo ya entregado en `out/<universidad>/<campaña>/` y usa ese
HTML sin volver a generarlo. No necesitas editar ni duplicar el JSX si no hay
cambios.

Esta es una de las razones para versionar `out/`: una exportación nueva podría
variar por una actualización de dependencias, aunque el JSX no haya cambiado.

### Caso 7: cambiar un componente compartido

Antes de cambiar `_shared/`, comprueba qué entregas lo importan. Si el cambio
altera el HTML o la apariencia:

1. Conserva intacto el componente actual.
2. Crea una variante nueva, por ejemplo `CtaButtonV2.jsx`, o copia la sección
   directamente dentro del nuevo correo.
3. Haz que solo las versiones nuevas importen la variante nueva.
4. Exporta y confirma que los HTML históricos no cambiaron.

Los arreglos o actualizaciones de compartidos se registran en commits separados
de una entrega. Esto hace visible cualquier efecto transversal.

### Caso 8: previsualizar y exportar

Para trabajar con actualización automática:

```bash
npm run dev
```

Para generar todos los entregables:

```bash
npm run export
```

Si la fuente es:

```text
emails/universidad-latina/admisiones-agosto-2026/2026-08-10-v02.jsx
```

el entregable estará en:

```text
out/universidad-latina/admisiones-agosto-2026/2026-08-10-v02.html
```

React Email reconstruye `out/` al exportar. Revisa `git diff -- out` y no
confirmes cambios inesperados en entregas históricas. Los HTML se generan con el
comando; nunca se editan manualmente.

### Caso 9: registrar una entrega en Git

Se trabaja normalmente en `main`; para un cambio grande puede usarse una rama
temporal por tarea, nunca una rama permanente por universidad.

```bash
git status --short
git diff -- emails out
git add emails out package.json package-lock.json README.md .gitignore
git commit -m "feat(universidad-latina): entrega admisiones v02"
```

Una etiqueta es opcional para entregas especialmente importantes:

```bash
git tag entrega/universidad-latina/admisiones-agosto-2026/2026-08-10-v02
```

La estructura de archivos es el índice principal. Git sirve como respaldo,
auditoría y protección adicional, no como el lugar habitual donde buscar un
correo antiguo.

## Regla de mantenimiento

Antes de confirmar una entrega, `git status` debe mostrar únicamente el nuevo
JSX, sus recursos, su HTML y cualquier cambio deliberado. Las actualizaciones de
React Email o de componentes compartidos se hacen en commits separados de las
entregas para que cualquier cambio histórico sea evidente.
