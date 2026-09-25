# Job Search Copilot · Plantilla gratuita

**Un tablero para organizar tu búsqueda de empleo, dentro de Google Sheets.** Gratis, sin programar y sin necesidad de usar inteligencia artificial.

Lo construí para mi propia búsqueda de trabajo remoto. Ya conseguí trabajo, así que lo convertí en una plantilla para que tú también lo uses.

[**Hacer mi copia**](https://docs.google.com/spreadsheets/d/1aMhLnESFdDVQW_BF3mCvEKvnzSgsn_lmgHHoIvxBlzY/copy) · [**Guía paso a paso**](sheets-template/SETUP_GUIDE.es.md) · [Ver demo](https://job-search-copilot-demo.vercel.app) · [English](README.md)

![Tablero de la plantilla](docs/img/template-board.png)

![Métricas de la plantilla](docs/img/template-metrics.png)

## Qué hace

- **Tablero kanban:** una columna por etapa (Guardada, Aplicada, En proceso, Entrevista, Oferta…). Arrastras la tarjeta y listo.
- **Varias rondas de entrevista:** registra cada ronda (RR. HH., técnica, final…) con sus notas, sin inventar etapas nuevas.
- **Historial automático:** cada cambio de etapa queda registrado con fecha, y puedes agregar notas (por ejemplo, qué te preguntaron en la entrevista).
- **Alertas de seguimiento:** marca en naranja lo que lleva 7 días (o los que elijas) sin moverse. Opcional: te llega un correo, uno solo por postulación.
- **Métricas que sirven para decidir:**
  - Tasa de respuesta real (sin contar las que solo guardaste o retiraste).
  - En qué etapa se caen más procesos.
  - Cuántos días pasan en cada etapa.
  - Postulaciones por semana.
  - Qué fuente te trae más respuestas (LinkedIn, referidos, páginas de empresas…).
- **Evita duplicados:** te avisa si ya registraste esa vacante (mismo link o misma empresa y cargo).
- **IA opcional:** un botón copia un prompt con los datos de la postulación, listo para pegar en ChatGPT, Gemini o Claude. Incluye reglas para que la IA **no invente experiencia** en tu CV.

## Cómo empezar (5 minutos)

1. Abre el link de copia y pulsa **Hacer una copia**.
2. Menú **Job Tracker → Configurar por primera vez** y acepta los permisos (la guía explica la pantalla de "app no verificada").
3. Menú **Job Tracker → Abrir tablero**.

Guía completa con capturas: [SETUP_GUIDE.es.md](sheets-template/SETUP_GUIDE.es.md).

## Prompts para cualquier IA

Si usas ChatGPT, Gemini o Claude, estos prompts te ayudan sin inventar nada:

- [Analizar una vacante](ai-prompts/analizar-vacante.md): % de match, fortalezas, brechas y recomendación.
- [Adaptar tu CV sin inventar](ai-prompts/adaptar-cv-sin-inventar.md): te muestra cada cambio y de dónde sale.
- [Preparar una entrevista](ai-prompts/preparar-entrevista.md): preguntas probables y respuestas con tus ejemplos reales.

## ¿Qué hay en este repositorio?

| Carpeta | Para quién | Qué encuentras |
|---|---|---|
| [`sheets-template/`](sheets-template/) | **Para usar** | La plantilla de Google Sheets (código y [guía paso a paso](sheets-template/SETUP_GUIDE.es.md)). Es lo principal. |
| [`ai-prompts/`](ai-prompts/) | Para usar | Prompts para cualquier IA: analizar vacantes, adaptar el CV sin inventar, preparar entrevistas. |
| [`original-copilot/`](original-copilot/) | Modo avanzado | **Cómo usaba mi tracker conectado a Claude**, con el código y [los pasos para montarlo tú](original-copilot/README.md). |
| [`dashboard-nextjs/`](dashboard-nextjs/) | Técnico | El dashboard web de la [demo](https://job-search-copilot-demo.vercel.app) (Next.js). No lo necesitas para usar la plantilla. |
| [`docs/`](docs/) | Técnico | Arquitectura, decisiones, cómo se calcula cada métrica y lecciones aprendidas (en inglés). |

## Modo avanzado: conectado a Claude

Durante mi búsqueda no llenaba el Sheet a mano: le decía a Claude *"apliqué a X en Y"* y él lo registraba, además de analizar vacantes y prepararme para las entrevistas. Si usas Claude y quieres montarlo igual, los pasos están en [original-copilot/README.md](original-copilot/README.md).

## Privacidad

Tu copia vive en **tu** Google Drive. El script no envía datos a ningún servidor: todo el código está a la vista en **Extensiones → Apps Script**.

## Licencia

[MIT](LICENSE): úsala, modifícala y compártela.
