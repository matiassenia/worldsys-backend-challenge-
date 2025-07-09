export interface Cliente {
  nombreCompleto: string;       // Nombre + Apellido
  dni: number;                  // Número de documento
  estado: string;               // "Activo" o "Inactivo"
  fechaIngreso: Date;           // Fecha de ingreso
  esPep: boolean;               // Persona Expuesta Políticamente
  esSujetoObligado: boolean | null; // Puede ser null
  fechaCreacion: Date;          // Fecha de inserción en DB
}
