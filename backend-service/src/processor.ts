import fs, { read } from "fs";
import path from "path";
import readline from "readline";
import { Cliente } from "./types";

/**
 * Procesa un archivo línea por línea, valida los registros y los agrupa en batches para su posterior inserción.
 * Los registros inválidos son descartados y logueados.
 * 
 * @param filePath Ruta al archivo .dat
 * @param onBatch Callback para procesar cada batch de clientes
 * @param batchSize Tamaño del batch para la inserción masiva (default: 1000)
 */

export async function processFile(
  filePath: string,
  onBatch: (batch: Cliente[]) => Promise<void>,
  batchSize: number = 1000
): Promise<void> {
  const inputStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  const batch: Cliente[] = [];
  let lineNumber = 0;
  let validCount = 0;
  let invalidCount = 0;

  for await (const line of rl) {
    lineNumber++;
    const fields = line.split("|");
      
    // Validación básica de cantidad de campos
    if (fields.length < 7) {
      console.warn(`Linea ${lineNumber} invalida (campos faltantes): ${line}`);
      invalidCount++;
      continue;
    }

    const [
      nombre,
      apellido,
      dni,
      estado,
      fechaIngreso,
      esPep,
      esSujetoObligado,
    ] = fields;

    //Construcción del objeto Cliente
    const cliente: Cliente = {
      nombreCompleto: `${nombre.trim()} ${apellido.trim()}`,
      dni: parseInt(dni),
      estado: estado.trim(),
      fechaIngreso: parseFecha(fechaIngreso),
      esPep: parseBoolean(esPep),
      esSujetoObligado: parseOptionalBoolean(esSujetoObligado),
      fechaCreacion: new Date(),
    };

    //Validaciónes adicionales
    const fechaValida = !isNaN(cliente.fechaIngreso.getTime());
    const dniValido = !isNaN(cliente.dni) && cliente.dni < 99999999;
    const estadoValido = ["activo", "inactivo"].includes(cliente.estado.toLowerCase());

    // Si alguna validación falla, descartamos el registro

    if (!fechaValida || !dniValido || !estadoValido) {
      console.warn(`Linea ${lineNumber} inválida (DNI, fecha o estado): ${line}`);
      invalidCount++;
      continue;
    }

    batch.push(cliente);
    validCount++;

    // Si el batch alcanza el tamaño máximo, lo procesamos

    if (batch.length === batchSize) {
      try {
        await onBatch(batch.splice(0, batchSize));
      } catch (error) {
        console.error(`Error procesando el batch: ${error}`);
      }
    }
  }

  //Procesamiento de los últimos elementos
  if (batch.length > 0) {
    try {
      await onBatch(batch);
    } catch (error) {
      console.error(`Error procesando el último batch: ${error}`);
    }
  }

// Log final del proceso
  console.log("✅ Procesamiento completado");
  console.log(`✔️  Líneas válidas procesadas: ${validCount}`);
  console.log(`❌ Líneas inválidas descartadas: ${invalidCount}`);
}

/**
 * Parsea fechas en formato MM/DD/YYYY. Devuelve un objeto Date.
 *
 * @param fechaStr - Fecha en string (ej: "11/13/2021")
 * @returns Date válido o inválido si la fecha no se puede parsear
 */

function parseFecha(fechaStr: string): Date {
  const [mes, dia, anio] = fechaStr.split("/");
  const fecha = new Date(`${anio}-${mes}-${dia}`);

  // Verificar si la fecha es válida
  return isNaN(fecha.getTime()) ? new Date("invalid") : fecha;
}


/**
 * Convierte un string a booleano.
 *
 * @param value - String esperado como "true" o "false"
 * @returns `true` si el valor es "true", `false` en cualquier otro caso
 */
function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}


/** Convierte un string opcional a bool o null.
 * @param value - String esperado como "true", "false" o vacío
 * @return `true` si el valor es "true", `false` si es "false", o `null` si el string está vacío
 */
function parseOptionalBoolean(value: string): boolean | null {
  if (value.trim() === "") return null;
  return parseBoolean(value);
}
