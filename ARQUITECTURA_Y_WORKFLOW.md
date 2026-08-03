# Arquitectura y workflow de correos universitarios

## 1. Objetivo

Este repositorio está preparado para producir cientos o miles de correos para distintas
universidades sin perder la capacidad de localizar, reconstruir y modificar una entrega
histórica concreta.

La unidad de trabajo no es un archivo suelto llamado `NewEmail`, sino una versión identificada:

```text
universidad -> campaña -> correo -> versión -> fuente + manifiesto + HTML
```

La solución combina cuatro mecanismos:

1. Carpetas inmutables por versión.
2. Componentes, layouts y marcas reutilizables con revisiones explícitas.
3. HTML final y checksum conservados junto a la fuente.
4. Git con ramas cortas y una etiqueta por entrega final.

## 2. Diagnóstico de la estructura anterior

La estructura original tenía un `NewEmail.jsx`, datos globales de ULatina, un tema global y
componentes compartidos sin revisión.

### Problemas detectados

- `NewEmail.jsx` no identificaba universidad, campaña, propósito, año ni versión.
- `universidades/data/uLatina.js` mezclaba identidad universitaria con textos y enlaces de una
  entrega particular.
- Modificar los datos o el tema global podía cambiar retroactivamente correos históricos.
- Modificar un componente compartido podía producir un HTML distinto al reconstruir una entrega
  antigua.
- No existían campañas, mensajes, versiones, manifiestos ni IDs únicos.
- React Email exportaba también `CtaButton.preview.jsx` y `CtaSection.preview.jsx`, porque cualquier
  `.js`, `.jsx` o `.tsx` con `export default` dentro de una carpeta visible se considera una
  plantilla.
- `package-lock.json` estaba ignorado, por lo que una instalación futura no tenía garantizadas las
  mismas dependencias.
- El `tsconfig` solo incluía `.ts` y `.tsx`, mientras que el código propio estaba en `.jsx`.
- No había compilador TypeScript, validación, búsqueda, exportación individual ni comparación.
- El HTML final no se conservaba en el repositorio.
- Git solo contenía el estado general del proyecto, no hitos identificables por entrega.

En una prueba de la estructura anterior, `npm run export` generaba tres HTML: el correo real y dos
previews de componentes. La arquitectura nueva elimina esa ambigüedad.

## 3. Decisión de arquitectura

Se eligió una arquitectura híbrida de carpetas inmutables más biblioteca compartida versionada.

No se eligió depender únicamente del historial de Git porque obligaría a hacer arqueología de
commits para localizar y previsualizar una versión. Tampoco se eligió copiar todos los componentes
y temas dentro de cada correo, porque produciría duplicación excesiva.

Una versión normal necesita únicamente:

```text
email.tsx                 # fuente editable
version.json              # identidad y trazabilidad
artifacts/email.html      # resultado generado
```

`content.ts`, estilos locales y recursos se crean solo cuando aportan claridad. No son obligatorios.

## 4. Árbol actual

```text
.
├── emails/
│   ├── _shared/
│   │   ├── kits/
│   │   │   └── v001/
│   │   │       ├── components/
│   │   │       │   ├── CtaButton.tsx
│   │   │       │   └── CtaSection.tsx
│   │   │       └── index.ts
│   │   ├── layouts/
│   │   │   ├── legacy/
│   │   │   │   └── v001.tsx
│   │   │   └── promotional/
│   │   │       └── v001.tsx
│   │   ├── starters/
│   │   │   └── promotional/
│   │   │       └── v001/
│   │   │           └── email.tsx.template
│   │   └── types/
│   │       └── email.ts
│   ├── _universities/
│   │   └── ulatina/
│   │       ├── university.json
│   │       └── brand/
│   │           └── v001/
│   │               └── theme.ts
│   ├── _previews/
│   │   └── cta-section.tsx
│   └── deliveries/
│       └── ulatina/
│           └── 2026/
│               └── ulat-cmp-2026-001--maestria-ia/
│                   ├── campaign.json
│                   └── messages/
│                       └── ulat-eml-2026-001-01--lanzamiento/
│                           ├── email.json
│                           └── versions/
│                               └── v001/
│                                   ├── email.tsx
│                                   ├── version.json
│                                   └── artifacts/
│                                       └── email.html
├── scripts/
│   └── email-cli.mjs
├── schemas/
│   ├── campaign.schema.json
│   ├── email.schema.json
│   └── version.schema.json
├── catalog/
│   └── email-index.generated.json
├── .github/workflows/
│   └── email-check.yml
├── .nvmrc
├── package-lock.json
├── package.json
└── tsconfig.json
```

React Email 6.9.1 omite en el escaneo normal los directorios cuyo nombre comienza con `_`.
Por eso `_shared`, `_universities` y `_previews` pueden contener código con `export default` sin
convertirse accidentalmente en entregas. Esta conducta debe comprobarse cuando se actualice React
Email.

## 5. Responsabilidad de cada nivel

### `emails/_shared/kits`

Contiene componentes reutilizables. Una revisión usada por una entrega final no se modifica si el
cambio altera el HTML. Se crea `v002`, `v003`, etc.

Una corrección puramente interna también debe tratarse con cuidado: si cambia el resultado
renderizado, necesita una revisión nueva.

### `emails/_shared/layouts`

Contiene estructuras de correo reutilizables: promocional, informativo, recordatorio, newsletter,
confirmación, entre otras. Cada layout tiene su propia revisión.

`legacy/v001` conserva la estructura de render utilizada por la plantilla que existía antes de esta
reestructuración. Los correos nuevos parten de `promotional/v001`.

### `emails/_shared/starters`

Son puntos de partida para `npm run email:new`. Un starter crea un `email.tsx` independiente; el
correo resultante no importa el archivo starter y puede modificarse libremente.

### `emails/_universities`

Contiene configuración e identidad visual de cada universidad. `university.json` registra el slug,
prefijo de IDs y revisión de marca predeterminada.

Cada carpeta `brand/vNNN` es inmutable después de usarse en una entrega final.

### `emails/_previews`

Contiene galerías internas de componentes. Se abren con:

```bash
npm run dev:components
```

No forman parte de `npm run export:all`.

### `emails/deliveries`

Es el archivo editable de entregas. La jerarquía separa universidad, año, campaña, mensaje y
versión.

### `campaign.json`

Identifica una iniciativa que puede contener varios correos: lanzamiento, recordatorio, cierre,
seguimiento, etc.

### `email.json`

Identifica un mensaje concreto dentro de la campaña. Su ID no cambia cuando se crean nuevas
versiones.

### `version.json`

Registra:

- ID completo de entrega.
- Versión y versión de origen.
- Universidad y campaña.
- Revisiones de kit, layout y marca.
- Asunto y preheader.
- Estado `draft` o `delivered`.
- Fechas de creación, generación y entrega.
- Ruta de la fuente y del HTML.
- SHA-256 del HTML final.
- SHA-256 combinado de la fuente, kit, layout y marca usados para generarlo.

### `artifacts/email.html`

Es el archivo entregable exacto. No se edita manualmente. La fuente de cambios es `email.tsx` y el
HTML se vuelve a generar.

### `catalog/email-index.generated.json`

Índice generado para búsqueda o integración con otras herramientas. No debe editarse manualmente.

## 6. Convenciones de identidad

Ejemplo:

```text
Universidad:  ulatina
Campaña:      ulat-cmp-2026-014
Correo:       ulat-eml-2026-014-01
Versión:      v003
Entrega:      ulat-eml-2026-014-01-v003
```

Carpetas:

```text
ulat-cmp-2026-014--maestria-ia
ulat-eml-2026-014-01--lanzamiento
v003
```

Los IDs son permanentes. El slug descriptivo puede cambiar, aunque conviene evitar renombrarlo una
vez entregado.

El script asigna automáticamente el siguiente ID de campaña y correo cuando no se proporcionan.

## 7. Regla de inmutabilidad

Una versión es editable mientras tiene `status: draft`.

En el momento en que se envía como entrega final se ejecuta `email:release`. Desde ese momento:

- No se modifica `email.tsx`.
- No se modifica `version.json`.
- No se reemplaza `artifacts/email.html`.
- No se modifica ninguna revisión compartida que cambie su render.
- Cualquier corrección genera una versión nueva.

`basedOn` documenta el origen, pero una versión nunca importa el contenido de otra. El script copia
el punto de partida para que ambas sigan siendo independientes.

## 8. Preparación del entorno

```bash
nvm use
npm ci
npm run check
```

`package-lock.json`, Node y npm están fijados para reducir variaciones de render entre equipos y a
lo largo del tiempo.

## 9. Comandos disponibles

```bash
npm run email:list
npm run email:catalog
npm run email:new -- [opciones]
npm run dev -- <email-id>@<versión>
npm run dev:all
npm run dev:components
npm run email:check -- <email-id>@<versión>
npm run email:check -- --all
npm run export -- <email-id>@<versión>
npm run export:all
npm run email:diff -- <versión-a> <versión-b>
npm run email:release -- <email-id>@<versión>
npm run typecheck
npm run check
```

`dev` y `export` permiten omitir el ID únicamente cuando existe una sola versión en el repositorio.
Al crecer el catálogo se debe indicar siempre la versión.

## 10. Workflow general de una entrega

1. Crear o recuperar el correo.
2. Crear una rama corta.
3. Editar la versión `draft`.
4. Previsualizar esa versión.
5. Validar tipos y manifiestos.
6. Exportar el HTML de revisión.
7. Repetir edición y exportación mientras siga siendo borrador.
8. Comparar con la versión anterior cuando corresponda.
9. Ejecutar `email:release` cuando el HTML sea la entrega final.
10. Hacer commit y crear una etiqueta Git anotada.

## 11. Workflows por casuística

### Caso A: correo nuevo en una campaña nueva usando un layout existente

```bash
git switch -c email/ulatina/nueva-campana/lanzamiento

npm run email:new -- \
  --university ulatina \
  --campaign-name "Admisiones septiembre" \
  --email-name "Lanzamiento" \
  --subject "Inicia tu proceso de admisión" \
  --preheader "Conoce las fechas y requisitos."
```

El script asigna IDs, crea campaña, mensaje, `v001`, `email.tsx`, manifiestos y actualiza el
catálogo. Después se sustituye el contenido provisional del starter.

### Caso B: correo nuevo dentro de una campaña existente

```bash
npm run email:new -- \
  --university ulatina \
  --campaign-id ulat-cmp-2026-014 \
  --email-name "Recordatorio de cierre" \
  --subject "Últimos días para inscribirte" \
  --preheader "Completa tu proceso antes de la fecha límite."
```

No se crea otra campaña. El script asigna el siguiente `emailId` dentro de ella.

### Caso C: correo completamente nuevo y estructura única

Se crea primero desde el starter más cercano para obtener IDs y manifiestos:

```bash
npm run email:new -- \
  --university ulatina \
  --campaign-name "Evento especial" \
  --email-name "Invitación"
```

Después se reemplaza la estructura de `email.tsx`. Puede seguir usando componentes del kit o usar
directamente componentes de React Email. No es obligatorio convertir una estructura única en un
layout compartido.

Solo se extrae un layout nuevo cuando haya una segunda utilización real o una probabilidad clara de
reutilización.

### Caso D: cambio sobre una versión todavía no entregada

Si `version.json` continúa en `draft`, se edita la misma versión:

```bash
npm run dev -- ulat-eml-2026-014-01@v003
npm run export -- ulat-eml-2026-014-01@v003
```

Las exportaciones de revisión actualizan el HTML y su checksum, pero no convierten la versión en
`delivered`.

### Caso E: cambio sobre una versión ya entregada

Nunca se edita la versión entregada:

```bash
npm run email:new -- --from ulat-eml-2026-014-01@v003
```

Se crea el siguiente número disponible. Si ya existen `v001`, `v002` y `v003`, se crea `v004` con
`basedOn: v003`.

### Caso F: cambios solicitados sobre una versión antigua específica

Si el revisor pide partir de `v001`, aunque ya exista `v003`:

```bash
npm run email:new -- --from ulat-eml-2026-014-01@v001
```

El resultado puede ser `v004`, pero su manifiesto registrará `basedOn: v001`. Así se conserva la
línea real de procedencia.

### Caso G: actualización de cifras o textos

1. Determinar si la versión base es `draft` o `delivered`.
2. Crear una versión si ya fue entregada.
3. Modificar `email.tsx` o `content.ts` si existe.
4. Buscar que no queden las cifras anteriores.
5. Previsualizar y exportar.
6. Comparar fuentes y HTML.

```bash
npm run email:diff -- \
  ulat-eml-2026-014-01@v001 \
  ulat-eml-2026-014-01@v002
```

### Caso H: cambios de enlaces o `href`

1. Crear versión cuando corresponda.
2. Modificar el campo `href` en la fuente.
3. Ejecutar la exportación.
4. Ejecutar `email:check`; detecta `href` vacíos, `javascript:`, HTTP sin TLS y enlaces
   provisionales a `example.com` en el HTML generado.
5. Probar manualmente los enlaces críticos y sus parámetros de tracking.

El manifiesto y checksum permiten demostrar exactamente qué enlace contenía el HTML entregado.

### Caso I: modificar, eliminar o incorporar carreras

Para listas breves, conservar los datos dentro de `email.tsx`. Para listas extensas o repetidas,
crear `content.ts` dentro de la misma versión:

```text
v004/
├── content.ts
├── email.tsx
├── version.json
└── artifacts/email.html
```

`content.ts` pertenece a esa versión; no se crea un archivo global `uLatinaData` porque volvería a
acoplar campañas sin relación.

### Caso J: ajuste visual exclusivo de un correo

El estilo se implementa localmente en `email.tsx`, o en un componente dentro de la misma carpeta si
la fuente crece demasiado. No se cambia el tema de la universidad para resolver una excepción.

### Caso K: cambio visual reusable en varios correos

1. Crear una nueva revisión del layout o kit.
2. Conservar intacta la revisión anterior.
3. Actualizar únicamente los correos nuevos.
4. Registrar la revisión nueva en `version.json`.
5. Añadir o actualizar un preview en `_previews`.

Ejemplo:

```text
emails/_shared/layouts/promotional/v001.tsx
emails/_shared/layouts/promotional/v002.tsx
```

### Caso L: cambio general de marca de una universidad

No se modifica `brand/v001`. Se crea:

```text
emails/_universities/ulatina/brand/v002/theme.ts
```

Después se actualiza `defaultBrandRevision`, `brandImport` y `brandExport` en `university.json` para
correos futuros. Las versiones anteriores continúan importando `v001`.

Si una campaña antigua debe adoptar la marca nueva, se crea una versión del correo que importe
`v002` y lo registre en su manifiesto.

### Caso M: componente compartido necesita una corrección

Si la corrección cambia el HTML:

1. Copiar el kit a `v002`.
2. Aplicar y probar la corrección en `v002`.
3. Mantener `v001` sin cambios.
4. Usar el nuevo kit solamente en versiones nuevas.

Si existe una vulnerabilidad o defecto grave, no se reescriben entregas históricas. Se crean nuevas
versiones para los correos activos y se conserva el HTML originalmente enviado.

### Caso N: agregar una universidad

Crear:

```text
emails/_universities/<slug>/university.json
emails/_universities/<slug>/brand/v001/theme.ts
```

`university.json` debe definir un `idPrefix` único, la revisión predeterminada y el import/export de
la marca. Luego `email:new` puede asignar IDs automáticamente.

### Caso O: recursos e imágenes exclusivos

Guardar recursos fuente en `static` dentro de la versión:

```text
v001/
├── static/
│   └── banner.png
├── email.tsx
└── version.json
```

La exportación individual copia `static` a `artifacts/static`. Para envío real, usar URLs inmutables
en CDN o un proceso de publicación que no reemplace recursos existentes.

No usar la misma URL para subir una imagen diferente: el HTML conservaría la URL, pero la entrega
ya no sería visualmente reproducible.

### Caso P: revisar previews de componentes sin generar entregas

```bash
npm run dev:components
```

Los previews están separados de los datos de campañas reales y no aparecen en la exportación normal.

### Caso Q: localizar un correo o su HTML

```bash
npm run email:list
npm run email:catalog
```

También se puede buscar por ID:

```bash
rg "ulat-eml-2026-014-01" emails/deliveries catalog
```

La ruta `output` del catálogo lleva al HTML final.

### Caso R: comparar dos entregas

```bash
npm run email:diff -- \
  ulat-eml-2026-014-01@v001 \
  ulat-eml-2026-014-01@v002
```

El comando compara tanto `email.tsx` como los HTML, cuando ambos artefactos existen.

### Caso S: entrega final

Antes de liberar:

```bash
npm run typecheck
npm run email:check -- ulat-eml-2026-014-01@v003
npm run email:release -- ulat-eml-2026-014-01@v003
```

`email:release` vuelve a renderizar, escribe el HTML, calcula el checksum y cambia el estado a
`delivered`. También imprime el commit y tag sugeridos.

Después:

```bash
git add emails catalog package-lock.json
git commit -m "release(email): ulat-eml-2026-014-01-v003"
git tag -a delivery/ulatina/ulat-eml-2026-014-01/v003 \
  -m "Entrega ulat-eml-2026-014-01-v003"
```

La etiqueta se crea después del commit final para que incluya fuente, manifiesto, HTML, dependencias
y catálogo.

### Caso T: verificar una entrega inmutable

Ejecutar `export` sobre una versión `delivered` no la sobrescribe. La reconstruye temporalmente y
compara el SHA-256 con el registrado:

```bash
npm run export -- ulat-eml-2026-014-01@v003
```

Si no coincide, debe recuperarse el tag histórico o revisarse qué dependencia externa cambió. No se
actualiza el checksum para ocultar la diferencia.

## 12. Estrategia Git

### Ramas

Usar una rama corta por versión:

```text
email/ulatina/ulat-eml-2026-014-01/v003
```

No usar ramas permanentes por universidad o campaña. Dividirían la biblioteca compartida y
complicarían integraciones.

### Commits

Los commits intermedios pueden describir cambios concretos:

```text
feat(email): add ulatina admissions reminder
fix(email): update careers and tracking links
```

El commit final debe identificar la entrega:

```text
release(email): ulat-eml-2026-014-01-v003
```

### Tags

Crear una etiqueta anotada e inmutable por versión entregada:

```text
delivery/<universidad>/<email-id>/<versión>
```

Las ramas son espacios de trabajo. Los tags son hitos históricos.

## 13. Validaciones y CI

`npm run check` ejecuta:

1. TypeScript estricto.
2. Validación de todas las versiones.
3. Verificación de relaciones entre manifiestos.
4. Existencia de kit, layout, marca y fuente.
5. Checksum del artefacto cuando existe.
6. Huella de los archivos de entrada para detectar cambios posteriores en fuente, kit, layout o
   marca.
7. Inspección básica de enlaces del HTML.

El workflow de GitHub Actions ejecuta `npm ci` y `npm run check` en pushes y pull requests.

Los esquemas JSON documentan la estructura formal de campaña, correo y versión. El CLI aplica las
reglas esenciales sin incorporar otra dependencia de runtime.

## 14. Exportación masiva y rendimiento

El trabajo cotidiano debe usar exportación individual. Exportar todo el repositorio se reserva para
CI, auditorías o migraciones:

```bash
npm run export:all
```

Con miles de versiones, `dev:all` y `export:all` serán más lentos. La búsqueda por catálogo y los
comandos por ID evitan que esto afecte la operación diaria.

## 15. Recuperación histórica

Existen tres niveles de recuperación:

1. `artifacts/email.html`: copia exacta de lo entregado.
2. Carpeta `versions/vNNN`: fuente editable y revisiones explícitas desde la rama principal.
3. Tag Git: snapshot integral del repositorio, dependencias y herramientas en la fecha de entrega.

Si una reconstrucción futura difiere, el HTML histórico sigue disponible y el tag permite recuperar
el árbol completo utilizado.

## 16. Riesgos y mitigaciones

### Crecimiento del repositorio

Los HTML son texto y normalmente manejables. Las imágenes pesadas deben almacenarse en Git LFS o en
un servicio de objetos inmutable.

### Cambio de recursos externos

Fuentes, imágenes o tracking remoto pueden cambiar. Usar URLs versionadas y conservar checksums de
recursos críticos.

### Edición accidental de una entrega

La combinación `status: delivered`, checksum, CI, tags y revisión de código reduce el riesgo. En una
etapa posterior puede añadirse una regla CI que compare carpetas entregadas con sus tags.

### Demasiadas revisiones compartidas

Crear una revisión solo cuando el HTML reusable cambia. Las excepciones de una entrega permanecen
locales para no multiplicar kits y layouts.

### Dependencias y Node

Actualizar React Email, React, Node o TypeScript en un PR separado. Ejecutar exportaciones de
regresión antes de adoptar la actualización. Nunca mezclar una actualización de dependencias con una
entrega urgente.

## 17. Alternativas consideradas

### Depender únicamente de Git

Reduce archivos visibles, pero dificulta localizar, comparar y editar versiones. Requiere checkout
de commits antiguos y conocimiento de la historia exacta.

### Copiar tema y componentes completos por correo

Ofrece aislamiento absoluto, pero multiplica la duplicación y hace costosa cualquier mejora.

### Centralizar todo el contenido en JSON o CMS

Funciona bien para correos uniformes. En este caso los cambios pueden modificar texto, enlaces,
carreras, diseño y estructura general, por lo que un esquema rígido terminaría acumulando
excepciones.

### Arquitectura elegida

Las versiones inmutables con dependencias compartidas revisadas conservan flexibilidad JSX, evitan
duplicación por entrega y permiten recuperar cada resultado final.

## 18. Checklist de entrega

- [ ] La versión correcta está en `draft`.
- [ ] Asunto y preheader coinciden entre requerimiento y manifiesto.
- [ ] Textos, cifras, carreras y enlaces fueron revisados.
- [ ] No quedan enlaces provisionales.
- [ ] Las imágenes tienen texto alternativo y URL estable.
- [ ] Se revisó desktop y móvil.
- [ ] `npm run typecheck` termina correctamente.
- [ ] `npm run email:check -- <id>@<versión>` termina sin errores.
- [ ] El HTML de revisión fue aprobado.
- [ ] `npm run email:release -- <id>@<versión>` fue ejecutado.
- [ ] El HTML y su checksum están en Git.
- [ ] Existe commit final identificable.
- [ ] Existe tag anotado de la entrega.

## 19. Regla final

Los archivos compartidos sirven para construir el futuro; las carpetas de versión y sus tags sirven
para preservar el pasado. Ante cualquier duda, crear una versión nueva es más seguro que modificar
una entrega existente.
