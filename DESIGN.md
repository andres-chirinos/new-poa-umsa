# Documento de Diseño: Sistema POA UMSA

Este documento detalla las directrices de diseño y experiencia de usuario (UX/UI) establecidas para el nuevo Sistema de Formulación del Plan Operativo Anual (POA) de la Universidad Mayor de San Andrés (UMSA).

## 1. Identidad Visual Institucional

Para asegurar que la plataforma refleje el carácter formal y la identidad de la UMSA, se han establecido los siguientes lineamientos de diseño:

- **Tema Principal:** `Claro (Light Mode)`. Se ha deshabilitado el modo oscuro (dark mode) para mantener un diseño diáfano, formal y consistente, semejante a los documentos impresos y al software administrativo tradicional.
- **Color Primario (Azul UMSA):** `#003366`. Utilizado en encabezados principales, botones de acción positiva (Guardar), cabeceras de tablas y elementos de énfasis.
- **Color Secundario (Rojo UMSA):** `#cc0000`. Utilizado en acciones destructivas (Eliminar), resaltes críticos y detalles decorativos.
- **Fondo General:** Gris muy claro (`#f8fafc` o `slate-50`) que reduce la fatiga visual frente al blanco puro (`#ffffff`), reservando el blanco puro exclusivamente para las celdas de entrada de datos y los contenedores principales.

## 2. Tipografía y Legibilidad

- **Fuente:** Se utiliza una fuente *sans-serif* moderna (Geist Sans / Inter / Arial), optimizada para pantallas de alta resolución y alta densidad de datos.
- **Jerarquía:** 
  - **Títulos:** En negrita y color Azul UMSA.
  - **Textos de Cabecera de Tabla:** Blancos sobre fondo Azul UMSA para máximo contraste.
  - **Datos ingresados:** Color gris oscuro (`slate-900`) para excelente legibilidad.

## 3. Experiencia de Usuario (UX) Orientada a Usuarios Mayores

El sistema fue rediseñado alejándose de los "asistentes paso a paso" (Wizards) modernos, hacia una **Matriz de Datos Estilo Excel (Spreadsheet)**. Las razones son:

1. **Familiaridad:** La gran mayoría del personal administrativo, especialmente usuarios mayores, está ampliamente acostumbrado al ecosistema de Microsoft Excel y hojas de cálculo. 
2. **Visión Global:** Permite ver toda la programación (Enero a Diciembre) de un "Resultado Intermedio" en una sola vista, sin tener que navegar entre diferentes pantallas.
3. **Distribución Lógica:**
   - **Metas y Presupuesto:** Separados en dos filas distintas pero agrupadas bajo el mismo "Resultado Intermedio". Las Metas se resaltan en un tono azul claro, y el Presupuesto en un tono rojo/carmesí claro para evitar confusiones al ingresar los datos.
   - **Ingreso de Datos Fluido:** Las celdas de la tabla son de tipo `input` directo. El usuario puede tabular entre celdas rápidamente.
   - **Cálculo Automático:** La última columna suma automáticamente los valores introducidos a lo largo de los 12 meses, evitando errores humanos de cálculo manual.

## 4. Estructura de la Interfaz

- **Cabecera Institucional:** Muestra el nombre de la Universidad, asegurando que el contexto de trabajo sea evidente desde el primer instante.
- **Ribbon (Cinta de Opciones):** Una barra de herramientas superior que contiene las acciones globales: *Exportar a PDF* y *Guardar Cambios*.
- **Filtros Estratégicos:** Justo por debajo del Ribbon, se encuentra la sección para definir la articulación (PDES, PDU, PEI, ACP) que afecta a toda la matriz inferior.
- **Grid de Datos (Tabla):** El corazón de la aplicación. Ocupa el 95% del ancho de la pantalla para maximizar el espacio horizontal requerido por los 12 meses más las columnas de descripción y totales.

## 5. Accesibilidad

- Alto contraste entre texto y fondo.
- Botones con íconos claros (proporcionados por *Lucide React*) acompañados de texto descriptivo.
- Focus visible (anillos de enfoque azules) cuando se navega por el teclado entre las celdas de los meses.
