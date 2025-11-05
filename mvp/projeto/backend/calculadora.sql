CREATE TABLE imc_historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  
  altura_cm DECIMAL(5, 2) NOT NULL, 
  peso_kg DECIMAL(5, 2) NOT NULL, 
  imc_valor DECIMAL(4, 2) NOT NULL, 
  imc_status VARCHAR(50) NOT NULL, 
  
  data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);