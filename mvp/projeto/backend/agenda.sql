CREATE TABLE agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  
  especialidade VARCHAR(100) NOT NULL,
  data_agendamento DATETIME NOT NULL,
  observacoes TEXT NULL,
  
  status VARCHAR(100) NOT NULL DEFAULT 'Pendente', 
  data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);