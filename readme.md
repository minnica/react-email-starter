# Repositorio de correos universitarios

Proyecto JavaScript/JSX de React Email organizado por universidad, campaña, correo y versión
inmutable.

La guía completa de arquitectura, versionado y operación diaria está en
[ARQUITECTURA_Y_WORKFLOW.md](./ARQUITECTURA_Y_WORKFLOW.md).

## Inicio rápido

```bash
nvm use
npm ci
npm run email:list
npm run dev -- ulat-eml-2026-001-01@v001
```

## Comandos principales

```bash
# Crear un correo en una campaña nueva
npm run email:new -- \
  --university ulatina \
  --campaign-name "Admisiones septiembre" \
  --email-name "Lanzamiento" \
  --subject "Inicia tu proceso de admisión" \
  --preheader "Conoce las fechas y requisitos."

# Crear una nueva versión desde una entrega anterior
npm run email:new -- --from ulat-eml-2026-001-01@v001

# Previsualizar, validar y exportar una versión
npm run dev -- ulat-eml-2026-001-01@v001
npm run email:check -- ulat-eml-2026-001-01@v001
npm run export -- ulat-eml-2026-001-01@v001

# Congelar una entrega final
npm run email:release -- ulat-eml-2026-001-01@v001
```

No edites una versión con estado `delivered`. Crea una versión nueva con `--from`.
