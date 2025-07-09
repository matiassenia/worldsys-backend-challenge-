import fs, { read } from 'fs';
import path from 'path';    
import readline  from 'readline';
import { Cliente } from './types';


/**
 * Procesa un archivo línea por línea y devuelve los registros válidos en batches
 * @param filePath Ruta al archivo .dat
 * @param onBatch Callback para procesar cada batch de clientes
 */

export async function processFile(
    filePath:string,
    onBatch: (batch: Cliente[]) => Promise<void>,
    batchSize: number = 1000
) : Promise<void> {
    
    const inputStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: inputStream,
        crlfDelay : Infinity,
    });

    const batch: Cliente[] = [];
    let lineNumber = 0;

    for await (const line of rl) {
        lineNumber++;

        const fields = line.split('|');
        if (fields.length < 7) {
            console.warn(`Linea ${lineNumber} invalida (campos faltantes): ${line}`);
            continue;
        }

        const [nombre, apellido, dni, estado, fechaIngreso, esPep, esSujetoObligado] = fields;

        const cliente: Cliente = {
            nombreCompleto: `${nombre} ${apellido}`.trim(),
            dni : parseInt(dni),
            estado: estado.trim(),
            fechaIngreso: parseFecha(fechaIngreso),
            esPep: parseBoolean(esPep),
            esSujetoObligado: parseOptionalBoolean(esSujetoObligado),
            fechaCreacion: new Date(),
        };

        //Validación
        if (isNaN(cliente.dni) || isNaN(cliente.fechaIngreso.getTime())) {
            console.warn(`Linea ${lineNumber} invalida (DNI o fecha): ${line}`);
            continue;
        }

        batch.push(cliente);
    
        if (batch.length === batchSize) {
            await onBatch(batch.splice(0, batchSize));
        }
    }

    //Procesamiento de los ultimos elementos
    if (batch.length > 0) {
        await onBatch(batch);
    }
}