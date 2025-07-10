import express from 'express';
import { processFile } from './processor';
import { insertBatch, connectToDb } from './db';
import dotenv from 'dotenv';
import path from 'path';
import { router as healthRouter } from './health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/health', healthRouter);

const FILE_PATH = path.resolve(__dirname, '../../data-generator/challenge/input/CLIENTES_IN_0425.dat');

async function main() {
  try {
    await connectToDb();
    console.log('Conexión a la base de datos establecida');

    await processFile(FILE_PATH, async (batch) => {
      console.log(`Procesando batch de ${batch.length} clientes`);
      await insertBatch(batch);
      console.log('Batch insertado correctamente');
    });

    console.log('Archivo procesado exitosamente');
  } catch (error) {
    console.error('Error en el procesamiento:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  main().catch((error) => {
  console.error('Error en la ejecución principal:', error);
  });
});

