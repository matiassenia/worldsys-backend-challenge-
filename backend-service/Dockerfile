# Imagen base oficial con soporte para Node.js y TS
FROM node:18

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de configuración e instalar dependencias
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copiar el archivo .env
COPY .env .env

# Copiar el código fuente
COPY ./src ./src

# Comando para ejecutar el servicio con ts-node
CMD [ "npx", "ts-node", "src/index.ts" ]

