-- File: backend-service/sql/init.sql
-- Crear base de datos y tabla si no existen
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'clientes_db')
BEGIN
  CREATE DATABASE clientes_db;
END
GO

--Crear tabla Clientes si no existe
USE clientes_db;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' and xtype='U')
BEGIN
  CREATE TABLE Clientes (
    NombreCompleto NVARCHAR(100) NOT NULL,
    DNI BIGINT NOT NULL,
    Estado VARCHAR(10) NOT NULL,
    FechaIngreso DATETIME NOT NULL,
    EsPEP BIT NOT NULL,
    EsSujetoObligado BIT NULL,
    FechaCreacion DATETIME NOT NULL
  );
END
GO
