# CLAUDE.md

Reglas del proyecto para cualquier sesión futura de Claude Code en este repo.

## Qué es esto

- `sheets-template/`: producto principal. Google Sheet + Apps Script (tablero kanban, historial de etapas, métricas). Funciona sin IA.
- `dashboard-nextjs/`: vitrina técnica. Next.js en modo demo (`DEMO_MODE=true`) con datos ficticios.
- `ai-prompts/` y `original-copilot/`: prompts genéricos para cualquier chatbot y documentación de la v1 personal.
- `docs/`: arquitectura, decisiones, métricas y lecciones.

## Reglas no negociables

1. **Cero secretos en git.** Antes de cada commit busca tokens, URLs `script.google.com/macros/s/...`, archivos `.env*`, contraseñas y cualquier contenido de `tracker-config*`. Revisa `git diff --staged`.
2. **Cero datos personales.** Nada de CVs, empresas reales a las que se aplicó, reclutadores, correos, teléfonos ni roles objetivo específicos del autor.
3. **No inventes métricas ni resultados.** Los números reales del README los aporta el autor. Los datos de demo son ficticios y están etiquetados como tales.
4. **Nada sale a internet sin confirmación** (push, cambios de visibilidad, deploys).
5. **Explica en lenguaje simple** cualquier paso manual para usuarios no técnicos.

## Comandos útiles

```bash
# Dashboard
cd dashboard-nextjs && npm install && npm test && npm run build
DEMO_MODE=true npm run dev

# Plantilla (requiere clasp login y .clasp.json local, ignorado por git)
cd sheets-template && clasp push
```

## Convenciones

- Métricas: la definición oficial está en `docs/metrics.md`. Si cambias una fórmula en `sheets-template/Code.gs` o en `dashboard-nextjs/lib/metrics.js`, actualiza las dos y el documento.
- Textos de la plantilla viven en el objeto `LABELS` (`sheets-template/Scripts.html`).
