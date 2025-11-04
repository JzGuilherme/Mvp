// back.js

// 1. Importa os pacotes que instalamos
const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); 
const app = express();
const PORT = 3000; // Porta onde a API vai rodar

// =================================================================
//          AJUSTE AQUI AS CREDENCIAIS DO SEU BANCO DE DADOS
// =================================================================
const connection = mysql.createConnection({
    host: 'localhost',      
    user: 'root',           // SEU usuário do MySQL
    password: '',           // SUA senha do MySQL (se for vazia, deixe '')
    database: 'agenda_db'   // O banco de dados que você criou
});

connection.connect(err => {
    if (err) {
        console.error('❌ Erro ao conectar ao MySQL:', err.stack);
        process.exit(1); 
    }
    console.log('✅ Conectado ao banco de dados MySQL.');
});
// =================================================================

// 2. CONFIGURAÇÃO DO EXPRESS
app.use(cors());          // Permite que o Frontend se conecte
app.use(express.json());  // Permite que o Express leia o JSON (dados) do Frontend


// 3. ROTAS DA API

// ROTA GET: Busca todos os compromissos (Para carregar a agenda na abertura)
// Endpoint: GET /api/compromissos
app.get('/api/compromissos', (req, res) => {
    const sql = 'SELECT * FROM compromissos ORDER BY data_compromisso ASC';
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao buscar dados.' });
        }
        res.json(results);
    });
});


// ROTA POST: Adiciona um novo compromisso (Seu Frontend vai chamar esta rota)
// Endpoint: POST /api/compromissos
app.post('/api/compromissos', (req, res) => {
    // Pega os dados JSON enviados pelo Frontend
    const { title, date } = req.body; 

    const sql = 'INSERT INTO compromissos (titulo, data_compromisso) VALUES (?, ?)';
    
    connection.query(sql, [title, date], (err, result) => {
        if (err) {
            console.error('Erro de Inserção:', err);
            return res.status(500).json({ error: 'Erro ao inserir no banco de dados.' });
        }
        
        // Retorna o item salvo com o ID gerado e os dados originais
        res.status(201).json({ 
            id: result.insertId, 
            title: title, 
            date: date,
            status: 'Pendente' 
        });
    });
});


// 4. INICIA O SERVIDOR
app.listen(PORT, () => {
    console.log(`🚀 Servidor da Agenda rodando em http://localhost:${PORT}`);
});