import express from 'express';
import { processFile } from './processor';
import { insertBatch, connectWithRetry } from './db';
import dotenv from 'dotenv';
import path from 'path';
import { router as healthRouter } from './health';

dotenv.config();

//Crear servidor Express
const app = express();
const PORT = process.env.PORT || 3000;

//Middleware de health check
app.use('/health', healthRouter);

const FILE_PATH = '/app/input/CLIENTES_IN_0425.dat';

/**
 * Punto de entrada principal del servicio.
 * Intenta conectar a la base de datos y procesar el archivo de entrada.
 */
async function main(): Promise<void> {
  try {
    await connectWithRetry(10, 5000); // Intentos y delay en ms
    console.log('Conexión a la base de datos establecida');

    await processFile(FILE_PATH, async (batch) => {
      console.log(`Procesando batch de ${batch.length} clientes`);
      await insertBatch(batch);
    });

    console.log('Archivo procesado exitosamente');
  } catch (error) {
    console.error('Error en el procesamiento:', error);
    process.exit(1); // Finalizar el proceso con error
  }
}

//Init servidor Express
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  main().catch((error) => {
  console.error('Error en la ejecución principal:', error);
  });
});

