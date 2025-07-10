# 🧪 Backend Challenge – Worldsys

## 📘 Contexto

Este microservicio desarrollado en **Node.js** se encarga de procesar diariamente un archivo de gran tamaño (1 GB aprox) con registros de clientes. Corre dentro de un contenedor Docker y está preparado para ejecutarse en un entorno Kubernetes con Linux como sistema operativo.

El objetivo principal es **leer, validar y almacenar eficientemente** los datos válidos del archivo en una base de datos **SQL Server**, exponiendo al mismo tiempo un endpoint `/health` para monitorear el estado del servicio incluso durante el procesamiento.

---

## 🎯 Objetivo cumplido

✅ Procesar correctamente el contenido del archivo `CLIENTES_IN_0425.dat`  
✅ Insertar los datos procesados en una tabla SQL Server  
✅ Exponer el endpoint `/health` mientras se procesa  
✅ Preparado para escalar a archivos 5 veces más grandes  
✅ Validación y descarte de líneas corruptas  
✅ Logs informativos y seguimiento de progreso  

---

## 📦 Estructura del proyecto

```
backend-service/
│
├── src/
│   ├── index.ts               # Punto de entrada del servicio
│   ├── processor.ts           # Lógica de procesamiento línea por línea
│   ├── db.ts                  # Conexión a la DB y bulk insert
│   ├── health.ts              # Endpoint /health
│   └── types.ts               # Interface Cliente
│
├── sql/
│   └── init.sql               # Script de creación de base de datos y tabla
│
├── .env                       # Variables de entorno
├── Dockerfile                 # Imagen del microservicio
├── docker-compose.yml         # Orquestación de servicios
└── README.md                  # Este archivo
```

---

## ⚙️ Requisitos

- Docker y Docker Compose instalados
- Node.js (solo si se desea ejecutar el generador manualmente)

---

## 🚀 Instrucciones para levantar el entorno local

1. Cloná este repositorio

```bash
git clone https://github.com/tu-usuario/worldsys-backend-challenge.git
cd worldsys-backend-challenge/backend-service
```

2. Configurá tu archivo `.env` (ya provisto de ejemplo)

```env
DB_USER=sa
DB_PASSWORD=Qnf]00JX)Lv~6N3
DB_NAME=clientes_db
DB_SERVER=sqlserver
DB_PORT=1433
FILE_PATH=/app/input/CLIENTES_IN_0425.dat

PORT=3000

```

3. Levantá los servicios con Docker Compose:

```bash
docker-compose up --build
```

Esto hará lo siguiente:

- Iniciará SQL Server en un contenedor
- Ejecutará el script `init.sql` para crear la base de datos y tabla `Clientes`
- Iniciará el servicio Node.js y comenzará el procesamiento automático del archivo `CLIENTES_IN_0425.dat`

---

## 🧪 Generación del archivo de prueba

Dentro del repositorio se incluye un generador opcional de datos:

```bash
cd ../backend-challenge-file-ingestion/data-generator
npm install
npx ts-node src/generateFile.ts
```

Esto generará el archivo `CLIENTES_IN_0425.dat` en:

```
data-generator/challenge/input/
```

Este archivo será automáticamente montado en el contenedor como `/app/input/CLIENTES_IN_0425.dat`.

### Parámetros del generador (modificables en `src/generateFile.ts`):

```ts
const RECORDS = 100_000;   // Cantidad de líneas a generar
const ERROR_RATE = 0.2;    // 20% de líneas con errores intencionales
```

---

## 🗃️ Formato esperado del archivo

Cada línea debe tener el siguiente formato, separado por `|`:

```txt
<nombre>|<apellido>|<dni>|<estado>|<fechaIngreso>|<esPep>|<esSujetoObligado>
```

### Ejemplo válido

```
María|Gómez|45678901|Activo|11/13/2021|true|false
```

### Ejemplo inválido (descartado con warning)

```
Carlos|Pérez|32165498|Inactivo|99/99/9999||
```

---

## 🧩 Definición de tabla en SQL Server

El script `sql/init.sql` crea la tabla `Clientes` con los siguientes campos:

```sql
NombreCompleto NVARCHAR(100) NOT NULL,
DNI BIGINT NOT NULL,
Estado VARCHAR(10) NOT NULL,
FechaIngreso DATE NOT NULL,
EsPEP BIT NOT NULL,
EsSujetoObligado BIT NULL,
FechaCreacion DATETIME NOT NULL
```

---

## 🔍 Logs y control de errores

- El sistema descarta automáticamente líneas malformadas o con campos inválidos.
- Se muestra el conteo final de líneas válidas e inválidas.
- Cada batch se inserta usando `bulk insert` para máxima eficiencia.
- Todos los errores se registran en consola para fácil debugging.

---

## 🛠️ Endpoint disponible

```http
GET /health
```

### Ejemplo de respuesta:

```json
{
  "status": "ok",
  "timestamp": "2025-07-10T23:00:00.000Z"
}
```

---

## 📈 Consideraciones de escalabilidad

- Lectura con `readline` (streaming) para evitar uso excesivo de RAM
- Procesamiento en batches configurables (`batchSize`)
- Preparado para escalar horizontalmente si se divide el archivo por partes
- Tolerancia a errores y logs precisos
- Cumple con el límite de recursos (`128Mi / 100m`) al evitar buffers grandes o carga total en memoria

---
