-- Primeiro, cria o banco de dados (se ele ainda não existir)
CREATE DATABASE IF NOT EXISTS manup_db;

-- Segundo, diz ao MySQL para USAR esse banco daqui para frente
USE manup_db;

-- Terceiro, cria sua tabela DENTRO do banco manup_db
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);