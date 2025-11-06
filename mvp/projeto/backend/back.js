// =======================================================
// ARQUIVO: back.js (Versão com Login e Cadastro)
// =======================================================

// 1. IMPORTAÇÕES
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Use 'mysql2/promise' para async/await
const bcrypt = require('bcryptjs');      // Para hash de senhas
const jwt = require('jsonwebtoken');   // Para tokens de autenticação
require('dotenv').config();            // Para carregar o .env

// 2. CONFIGURAÇÃO DO EXPRESS
const app = express();
app.use(cors());
app.use(express.json()); // Permite que o Express leia JSON

// 3. CONFIGURAÇÃO DO POOL DO MYSQL (Lendo do .env)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Pool do MySQL configurado.');

// =======================================================
// 4. ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
// =======================================================

/**
 * ROTA DE CADASTRO (REGISTRO)
 * Pública: POST /api/registrar
 */
app.post('/api/registrar', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // VERIFICA SE O USUÁRIO JÁ EXISTE
        const [users] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (users.length > 0) {
            return res.status(400).json({ error: 'Este email já está em uso.' });
        }

        // CRIA O HASH DA SENHA (NUNCA SALVE A SENHA PURA)
        const senhaHash = await bcrypt.hash(senha, 10);

        // INSERE O NOVO USUÁRIO NO BANCO
        const sql = "INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)";
        const [result] = await pool.query(sql, [email, senhaHash]);

        res.status(201).json({ 
            message: 'Usuário criado com sucesso!', 
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Erro ao registrar:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

/**
 * ROTA DE LOGIN
 * Pública: POST /api/login
 */
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // 1. BUSCA O USUÁRIO PELO EMAIL
        const [users] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        const usuario = users[0];

        // 2. COMPARA A SENHA ENVIADA COM O HASH SALVO NO BANCO
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // 3. SE O LOGIN ESTÁ CORRETO, CRIE O TOKEN JWT
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email }, // O que vai dentro do token
            process.env.JWT_SECRET,                  // A chave secreta do .env
            { expiresIn: '1h' }                      // Duração do token
        );

        // 4. ENVIA O TOKEN PARA O FRONTEND
        res.json({ message: 'Login bem-sucedido!', token: token });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// =======================================================
// 5. MIDDLEWARE DE VERIFICAÇÃO DE TOKEN (SEGURANÇA)
// =======================================================
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer <token>"

    if (token == null) {
        return res.sendStatus(401); // Não autorizado (sem token)
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            return res.sendStatus(403); // Proibido (token inválido/expirado)
        }
        
        // Se o token é válido, salva o usuário no 'req' para a próxima rota usar
        req.usuario = usuario;
        next(); // Continua para a rota
    });
}

// =======================================================
// 6. ROTAS DE DADOS (PROTEGIDAS)
// =======================================================

/**
 * ROTA GET: Busca todos os compromissos DO USUÁRIO LOGADO
 * Protegida: GET /api/compromissos
 */
app.get('/api/compromissos', verificarToken, async (req, res) => {
    try {
        // Graças ao middleware, agora temos 'req.usuario' com o ID do usuário logado
        const usuarioId = req.usuario.id;

        const sql = "SELECT * FROM compromissos WHERE usuario_id = ? ORDER BY data_compromisso ASC";
        
        const [rows] = await pool.query(sql, [usuarioId]); 
        
        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar compromissos:', error);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

/**
 * ROTA POST: Cria um novo compromisso PARA O USUÁRIO LOGADO
 * Protegida: POST /api/compromissos
 */
app.post('/api/compromissos', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        // Ajuste aqui para os nomes que seu formulário envia (ex: nome_compromisso)
        const { nome_compromisso, data_compromisso } = req.body; 
        
        if (!nome_compromisso || !data_compromisso) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        const sql = "INSERT INTO compromissos (nome_compromisso, data_compromisso, usuario_id) VALUES (?, ?, ?)";
        
        const [result] = await pool.query(sql, [nome_compromisso, data_compromisso, usuarioId]);

        res.status(201).json({ 
            message: 'Compromisso criado!', 
            insertId: result.insertId 
        });

    } catch (error) {
        console.error('Erro ao inserir compromisso:', error);
        res.status(500).json({ error: 'Erro ao inserir dados.' });
    }
});

// Adicione aqui suas rotas de DELETE e UPDATE (PUT)
// Lembre-se de sempre adicionar o 'verificarToken' nelas!


// =======================================================
// 7. INICIAR O SERVIDOR
// =======================================================
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`✅ Servidor backend rodando na porta ${port}`);
});