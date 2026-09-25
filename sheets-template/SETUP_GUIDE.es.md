# Guía de instalación: Job Tracker en Google Sheets

Tiempo: **5 minutos**. No necesitas saber programar, ni pagar nada, ni usar inteligencia artificial.

Lo que vas a tener al final:

- Un tablero tipo kanban (columnas por etapa) para mover tus postulaciones de empleo.
- Métricas: tasa de respuesta, en qué etapa se caen tus procesos, cuánto tardan, qué fuentes funcionan mejor.
- Aviso de postulaciones "estancadas" (sin movimiento en X días), y correo opcional.
- Un botón que arma un prompt listo para pegar en ChatGPT, Gemini o Claude (opcional).

Todo queda **en tu propia cuenta de Google**. Nadie más ve tus datos, ni siquiera quien hizo la plantilla.

---

## Paso 1. Haz tu copia

1. Abre este link: **[https://docs.google.com/spreadsheets/d/1aMhLnESFdDVQW_BF3mCvEKvnzSgsn_lmgHHoIvxBlzY/copy](https://docs.google.com/spreadsheets/d/1aMhLnESFdDVQW_BF3mCvEKvnzSgsn_lmgHHoIvxBlzY/copy)**
2. Google te muestra "¿Quieres hacer una copia?". Pulsa **Hacer una copia**.

<!-- CAPTURA PENDIENTE: Pantalla "Hacer una copia" → docs/img/setup-01-copia.png -->

Listo: ese Sheet ahora es tuyo. Puedes cambiarle el nombre.

## Paso 2. Configura por primera vez

1. En tu copia, espera unos segundos a que aparezca el menú **Job Tracker** arriba (junto a "Ayuda"). Si no aparece, recarga la página.
2. Pulsa **Job Tracker → Configurar por primera vez**.

<!-- CAPTURA PENDIENTE: Menú Job Tracker → docs/img/setup-02-menu.png -->

3. Google te pide autorizar el script. Pulsa **Continuar** y elige tu cuenta.

### "Google no verificó esta app": qué es y por qué puedes continuar

Vas a ver una pantalla de advertencia. Es normal:

<!-- CAPTURA PENDIENTE: Google no verificó esta app → docs/img/setup-03-no-verificada.png -->

- **Por qué aparece:** el script es código que vive dentro de **tu** copia del Sheet y corre con **tu** cuenta. Google muestra este aviso para cualquier script que no haya pasado su proceso de verificación comercial (que es para apps que se publican para millones de personas).
- **Por qué es seguro:** el script solo pide permiso para: editar **este** Sheet (no tus otros archivos), mostrar la ventana del tablero, programar la revisión diaria y, si tú lo configuras, enviarte un correo **a ti mismo**. No se conecta a ningún servidor externo. Todo el código está a la vista en **Extensiones → Apps Script**.

Para continuar:

1. Pulsa **Configuración avanzada** (o "Advanced").
2. Pulsa **Ir a Job Tracker (no seguro)**.
3. Revisa los permisos y pulsa **Permitir**.

<!-- CAPTURA PENDIENTE: Permitir → docs/img/setup-04-permitir.png -->

4. Vuelve a pulsar **Job Tracker → Configurar por primera vez** (la primera vez solo se autoriza). Verás el mensaje **"Listo"**.

Se crearon tres pestañas:

| Pestaña | Para qué |
|---|---|
| **Postulaciones** | Una fila por postulación. Puedes editarla a mano si quieres. |
| **Historial** | Se llena sola: cada cambio de etapa queda registrado con fecha. **No la borres**: de aquí salen las métricas. |
| **Config** | Días para marcar "estancada" (7 por defecto), tu correo si quieres alertas, y la lista de etapas. |

## Paso 3. Abre el tablero

**Job Tracker → Abrir tablero.**

<!-- CAPTURA PENDIENTE: Tablero → docs/img/setup-05-tablero.png -->

¿Quieres ver cómo se ve lleno? **Job Tracker → Cargar datos de ejemplo** crea 33 postulaciones ficticias. Cuando termines de explorar: **Job Tracker → Borrar datos de ejemplo** (solo borra las de ejemplo, nunca las tuyas).

## Cómo se usa

- **Agregar:** botón **+ Nueva postulación**. Empresa, cargo y link son lo importante. Si ya existe una con el mismo link o la misma empresa y cargo, te avisa antes de duplicarla.
- **Mover de etapa:** arrastra la tarjeta a otra columna (en computador) o usa el selector **Mover a…** de la tarjeta (funciona también en el celular).
- **Detalle:** toca una tarjeta para ver su línea de tiempo, editar datos y **agregar notas** (por ejemplo, qué te preguntaron en una entrevista).
- **Estancadas:** las tarjetas muestran "X días sin movimiento" en naranja, y la fila también se pinta de naranja en la pestaña Postulaciones.
- **Varias entrevistas:** muchas empresas hacen 2, 3 o más rondas (RR. HH., técnica, final). No hace falta crear etapas nuevas: deja la postulación en **Entrevista** y, en el detalle, pulsa **+ Ronda de entrevista** cada vez que tengas una (puedes escribir antes cómo te fue). La tarjeta muestra "Ronda 2", "Ronda 3"… y cada ronda queda en la línea de tiempo.
- **Buscar:** por empresa o cargo, y **Ver cerradas** para ver aceptadas, rechazadas y retiradas.
- **Métricas:** pestaña **Métricas** del tablero. Qué significa cada número: [docs/metrics.md](../docs/metrics.md).

También puedes trabajar directo en la pestaña **Postulaciones**: si cambias la etapa en la celda, queda en el Historial igual que desde el tablero. Si escribes una fila nueva a mano, recibe su ID automáticamente.

## Opcional: alertas por correo

En la pestaña **Config**, escribe tu correo en **"Correo para alertas"**. Una vez al día (hacia las 8 a. m.) revisa las postulaciones estancadas y te manda **un solo correo por postulación**. Si esa postulación cambia de etapa, el aviso se reinicia.

Para probarlo ya: **Job Tracker → Revisar estancadas ahora.**

## Opcional: IA sin API keys

En el detalle de cualquier postulación, pulsa **Copiar prompt para IA**. Se copia un texto con los datos de esa postulación, su historial y reglas estrictas para que la IA **no invente experiencia**. Pégalo en ChatGPT, Gemini o Claude junto con la vacante y tu CV.

La tarea cambia según la etapa: analizar la vacante (guardada o aplicada), preparar la siguiente ronda de entrevista (incluye lo que anotaste de las rondas anteriores), evaluar la oferta, o sacar aprendizajes si el proceso se cerró.

Si el navegador no deja copiar automáticamente, aparece el texto seleccionado: cópialo con Ctrl+C (o mantén presionado en el celular).

Más prompts listos: carpeta [ai-prompts](../ai-prompts/).

## Opcional: usarlo desde el celular

La ventana del tablero funciona en computador. Para tenerlo como página en el celular:

1. En tu Sheet: **Extensiones → Apps Script**.
2. Arriba a la derecha: **Implementar → Nueva implementación**.
3. En el engranaje, elige **Aplicación web**.
4. **Ejecutar como: Yo**. **Quién tiene acceso: Solo yo**.
5. Pulsa **Implementar** y copia la **URL de la aplicación web**. Ábrela en el celular (con tu misma cuenta de Google) y guárdala en la pantalla de inicio.

Cada persona hace esto en **su propia copia**: la implementación no se copia con el Sheet, y la URL de otra persona no te sirve a ti.

**Por qué es seguro:** con "Solo yo", esa URL solo funciona si has iniciado sesión con tu cuenta. Si alguien más la abre, Google le pide permiso y lo rechaza. No hay contraseñas ni tokens que se puedan filtrar.

## Personalizar

- **Etapas:** en **Config**, fila "Etapas". Puedes renombrarlas o agregar etapas en el medio (por ejemplo "Prueba técnica"). Mantén el orden: la 1ª es "guardada", la 2ª "aplicada" y las **3 últimas** son los cierres (aceptada, rechazada, retirada). Después de cambiarlas, corre de nuevo **Configurar por primera vez** para actualizar las listas desplegables.
- **Textos del tablero:** en Apps Script, archivo `Scripts.html`, objeto `LABELS`.

## Problemas comunes

| Problema | Solución |
|---|---|
| No aparece el menú Job Tracker | Recarga la página y espera 5-10 segundos. |
| "No pude leer el Sheet" | Cierra la ventana del tablero y ábrela de nuevo. Si sigue, corre **Configurar por primera vez**. |
| Borré la pestaña Historial | Corre **Configurar por primera vez**: la vuelve a crear vacía. El historial anterior se pierde. |
| No me llegan correos | Revisa el correo en **Config** y la carpeta de spam. Recuerda que solo llega uno por postulación. |
| Quiero dejar de recibir correos | Borra tu correo de **Config**. |

