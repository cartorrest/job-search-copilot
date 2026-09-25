# Prompt: analizar una vacante (o beca) frente a tu CV

**Para qué sirve:** decidir rápido si vale la pena aplicar y con qué versión de tu CV.
**Funciona en:** ChatGPT, Gemini, Claude, Copilot o cualquier chatbot. No necesitas cuenta de pago.

**Cómo usarlo**

1. Copia todo el bloque de abajo.
2. Reemplaza lo que está entre `[CORCHETES]`.
3. Pega la vacante completa y tu CV (texto o archivo adjunto).

> Tip: desde el tablero de la plantilla, el botón **"Copiar prompt para IA"** arma este mismo texto con los datos de la postulación ya llenos.

---

```text
Actúa como asesor de búsqueda de empleo. Tu trabajo es analizar si esta vacante encaja con mi perfil, sin exagerar ni inventar nada.

REGLAS (obligatorias):
1. No inventes experiencia, logros, herramientas, certificaciones, títulos, fechas ni métricas. Todo lo que digas de mí debe salir del CV que te doy.
2. Si algo es ambiguo o falta información, dilo o pregúntame. No supongas.
3. Distingue requisitos indispensables de los "deseables". No descartes la vacante solo porque no cumplo todo.
4. No priorices palabras clave de ATS sobre la verdad: prefiero un match más bajo que aparentar algo que no tengo.
5. Sé breve y concreto.

MI CONTEXTO:
- Roles que busco: [TUS ROLES OBJETIVO, ej. Analista de Datos, Coordinador de Proyectos]
- Modalidad: [remoto / híbrido / presencial] · País: [TU PAÍS] · Idiomas: [ej. español nativo, inglés B2]
- Tengo estas versiones de CV: [ej. CV #1 datos, CV #2 operaciones]

TAREA:
1. Identifica el rol y sus requisitos clave.
2. Compara la vacante con mi CV (o mis CVs, si te doy varios).
3. Estima el porcentaje de match según los requisitos reales.
4. Señala coincidencias fuertes y brechas importantes.
5. Recomienda qué CV usar como base.
6. Evalúa brevemente la calidad de la vacante: responsabilidades confusas, requisitos contradictorios, combinaciones irreales, información faltante.

FORMATO DE RESPUESTA (exacto):
MATCH: XX%
MEJOR CV: CV #X
WHY:
- …
GAPS:
- …
CALIDAD DE LA VACANTE:
- …
RECOMMENDATION: APLICAR / CONSIDERAR / DESCARTAR

VACANTE:
[PEGA AQUÍ EL TEXTO COMPLETO DE LA VACANTE]

MI CV:
[PEGA AQUÍ TU CV O ADJÚNTALO]
```

---

**Si es una beca:** cambia "vacante" por "convocatoria", "CV" por "CV y carta de motivación", y en MI CONTEXTO describe el programa que buscas (maestría, bootcamp, curso).
