-- File: backend-service/sql/init.sql

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'clientes_db')
BEGIN
  CREATE DATABASE clientes_db;
END
GO

-- Usar la base de datos
USE clientes_db;
GO

-- Crear tabla Clientes si no existe
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' and xtype='U')
BEGIN
  CREATE TABLE Clientes (
    NombreCompleto NVARCHAR(100) NOT NULL,
    DNI BIGINT NOT NULL,
    Estado VARCHAR(10) NOT NULL,
    FechaIngreso DATE NOT NULL,
    EsPEP BIT NOT NULL,
    EsSujetoObligado BIT NULL,
    FechaCreacion DATETIME NOT NULL
  );
END
GO
