
# 🧪 Challenge Técnico – Worldsys

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![SQL%20Server](https://img.shields.io/badge/SQL%20Server-compatible-red)

---

## 📘 Contexto

Este microservicio desarrollado en **Node.js** se encarga de procesar diariamente un archivo de gran tamaño (~1 GB) con registros de clientes. Corre dentro de un contenedor Docker y está preparado para ejecutarse en un entorno Kubernetes con Linux como sistema operativo.

El objetivo principal es **leer, validar y almacenar eficientemente** los datos válidos del archivo en una base de datos **SQL Server**, exponiendo al mismo tiempo un endpoint `/health` para monitorear el estado del servicio incluso durante el procesamiento.

---

## 🎯 Objetivo cumplido

✅ Procesar correctamente el contenido del archivo `CLIENTES_IN_0425.dat`  
✅ Insertar los datos procesados en la base `clientes_db`, tabla `Clientes`  
✅ Exponer el endpoint `/health` mientras se procesa  
✅ Preparado para escalar a archivos 5 veces más grandes  
✅ Validación y descarte de líneas corruptas  
✅ Logs informativos y seguimiento de progreso  
✅ Reintentos automáticos si la base de datos aún no está lista
✅ **Separación entre lectura y escritura mediante `queue` y `worker` para mayor concurrencia y rendimiento**
---

## 📦 Estructura del proyecto

```
backend-service/
│
├── src/
│   ├── index.ts               # Punto de entrada del servicio
│   ├── processor.ts           # Lógica de procesamiento 
│   ├── db.ts                  # Conexión a la DB y bulk insert
│   ├── health.ts              # Endpoint /health
│   └── types.ts               # Interface Cliente
│
├── sql/
│   └── init.sql               # Script de creación de base de datos y tabla
│
├── input/                     # Carpeta donde debe colocarse el archivo .dat
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

1. Cloná este repositorio:

```bash
git clone https://github.com/<tu-usuario>/worldsys-backend-challenge.git
cd worldsys-backend-challenge/backend-service
```

2. Configurá tu archivo `.env`:

```env
DB_USER=sa
DB_PASSWORD=tu_password
DB_NAME=clientes_db
DB_SERVER=sqlserver
DB_PORT=1433
FILE_PATH=/app/input/CLIENTES_IN_0425.dat
PORT=3000
```

3. Agregá el archivo a procesar en la ruta `backend-service/input/CLIENTES_IN_0425.dat`.  
   Si no contás con uno, podés generarlo con el generador incluido (ver más abajo).

4. Levantá los servicios con Docker Compose:

```bash
docker-compose up --build
```

Esto hará lo siguiente:

- Iniciará SQL Server en un contenedor
- Ejecutará `init.sql` para crear la base de datos `clientes_db` y la tabla `Clientes`
- Iniciará el microservicio en Node.js
- Procesará automáticamente el archivo ubicado en `input/`

> 💡 Se recomienda **eliminar la clave `version` del archivo `docker-compose.yml`** si ves advertencias al ejecutarlo.

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

Copialo manualmente a `backend-service/input/` antes de levantar los contenedores.

---

## 🗃️ Formato esperado del archivo

Cada línea debe tener el siguiente formato, separado por `|`:

```txt
<nombre>|<apellido>|<dni>|<estado>|<fechaIngreso>|<esPep>|<esSujetoObligado>
```

### Ejemplo válido

```
María|Gómez|45678901|Activo|13/11/2021|true|false
```

### Ejemplo inválido (descartado)

```
Carlos|Pérez|32165498|Inactivo|99/99/9999||
```

---

## 🧩 Definición de tabla en SQL Server

```sql
CREATE TABLE Clientes (
  NombreCompleto NVARCHAR(100) NOT NULL,
  DNI BIGINT NOT NULL,
  Estado VARCHAR(10) NOT NULL,
  FechaIngreso DATE NOT NULL,
  EsPEP BIT NOT NULL,
  EsSujetoObligado BIT NULL,
  FechaCreacion DATETIME NOT NULL
);
```

---

## 🔍 Logs y control de errores

- Se descartan automáticamente las líneas malformadas
- Se muestran mensajes como:

```bash
✅ Conexión a la base de datos establecida
📚 Usando base de datos: clientes_db
❌ Líneas inválidas descartadas: 3
✅ Procesamiento completado
```
- **Ahora se utiliza una cola (`queue`) para almacenar los batches validados y un `worker` que los inserta asincrónicamente en la base.**
- Esto desacopla la lectura e inserción y mejora el rendimiento general.
- Se insertan los datos válidos en batches usando bulk insert

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

- Lectura en streaming (con `readline`) para bajo uso de RAM
- Procesamiento por lotes (batch size configurable)
- Compatible con archivos de hasta 5 GB
- Recursos limitados: `128Mi / 100m`
- Reintentos automáticos y logs claros
- **Procesamiento concurrente mediante `queue` + `worker`**
- **Separación clara de responsabilidades entre lectura, validación y escritura**

---

## 🙋‍♂️ Autor

Desarrollado por [Matías Senia](https://www.linkedin.com/in/matiassenia/)

📧 matiasseniadev@gmail.com  
💼 Backend Developer | Node.js | Python | SQL | Docker | Kubernetes
