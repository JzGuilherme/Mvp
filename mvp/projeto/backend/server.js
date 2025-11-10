/* === ARQUIVO: server.js (Atualizado com Logs de Debug) === */

// 1. Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// 2. Configurar o App Express
const app = express();
const port = 3000;

// 3. Middlewares (Ajudantes)
app.use(express.urlencoded({ extended: true }));
// Também aceitar JSON (AJAX) e facilitar testes
app.use(express.json());

// --- Configuração de Caminhos ---
// Define o caminho para a pasta 'frontend'
const frontendPath = path.join(__dirname, '../frontend');
const pagesPath = path.join(__dirname, '../frontend/pages');

// Diz ao Express para servir arquivos estáticos (CSS, JS, Imagens)
app.use(express.static(frontendPath)); // Para style.css, etc.
app.use(express.static(pagesPath)); // Para eye-close.png, etc.
// --- Fim da Configuração ---


// 4. Conectar/Criar o Banco de Dados SQLite
// Usar caminho absoluto para garantir que o arquivo fique na pasta backend
const dbPath = path.join(__dirname, 'login.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite em', dbPath);
    }
});

// 5. Criar a Tabela (se não existir)
db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_completo TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('Erro ao criar tabela:', err.message);
    } else {
        console.log('Tabela "usuarios" pronta ou já existente.');
    }
});


// --- ROTAS DA APLICAÇÃO ---

// Rota principal para servir seu login.html
app.get('/', (req, res) => {
    // Envia o arquivo login.html que está em 'frontend/pages/'
    res.sendFile(path.join(pagesPath, 'login.html'));
});

/*
 * ROTA DE CADASTRO (recebe dados do register.html/cadastro.html)
 */
// <--- INÍCIO DA MUDANÇA (Logs de Debug) --->
app.post('/cadastro', async (req, res) => {
    console.log("========================================");
    console.log("Recebi uma tentativa de cadastro!");
    console.log("Dados recebidos do formulário:", req.body);

    // aceitar tanto nome_completo quanto username (caso o frontend use username)
    const nome_completo = req.body.nome_completo || req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    // Checagem de segurança simples
    if (!nome_completo || !email || !password) {
        console.error("ERRO: Dados incompletos. Um dos campos estava vazio.");
        return res.status(400).send("Erro no cadastro: Todos os campos são obrigatórios.");
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO usuarios (nome_completo, email, password_hash) VALUES (?, ?, ?)';

        db.run(sql, [nome_completo, email, passwordHash], function(err) {
            // determinar se o cliente espera JSON (AJAX/fetch)
            const wantsJson = (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) || (req.headers['accept'] && req.headers['accept'].includes('application/json')) || req.xhr;

            if (err) {
                console.error("ERRO DO SQLITE AO TENTAR SALVAR:", err.message);
                console.log("========================================");
                // tratar duplicata de email
                if (err.message && err.message.includes('UNIQUE')) {
                    if (wantsJson) return res.status(409).json({ success: false, message: 'Erro: esse email já está cadastrado.' });
                    return res.status(409).send('Erro: esse email já está cadastrado.');
                }
                if (wantsJson) return res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário.' });
                return res.status(500).send('Erro ao cadastrar usuário.');
            }

            console.log(`SUCESSO: Usuário cadastrado com ID: ${this.lastID}`);
            console.log("========================================");

            if (wantsJson) return res.json({ success: true, message: 'Usuário cadastrado com sucesso!' });
            return res.send('Usuário cadastrado com sucesso! <a href="/">Fazer Login</a>');
        });

    } catch (err) {
        console.error('Erro interno no cadastro:', err);
        return res.status(500).send('Erro interno no servidor.');
    }
});
// <--- FIM DA MUDANÇA --->


/*
 * ROTA DE LOGIN (recebe dados do login.html)
 */
app.post('/login', (req, res) => {
    // Pega email e password do formulário
    const { email, password } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.get(sql, [email], async (err, user) => {
        // detectar se o cliente espera JSON (AJAX)
        const wantsJson = (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) || (req.headers['accept'] && req.headers['accept'].includes('application/json')) || req.xhr;

        if (err) {
            console.error('Erro na consulta:', err);
            if (wantsJson) return res.status(500).json({ success: false, message: 'Erro no servidor.' });
            return res.status(500).send('Erro no servidor.');
        }

        if (!user) {
            if (wantsJson) return res.status(400).json({ success: false, message: 'Email ou senha inválidos.' });
            return res.status(400).send('Email ou senha inválidos. <a href="/">Tentar novamente</a>');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            console.log(`Login bem-sucedido para: ${user.email}`);
            // Se for AJAX, retornar JSON com redirect para dashboard
            if (wantsJson) return res.json({ success: true, message: 'Login bem-sucedido', redirect: '/pages/dashboard.html' });
            // Resposta de sucesso personalizada com o nome completo
            res.send(`<h1>Login bem-sucedido!</h1><p>Bem-vindo, ${user.nome_completo}!</p>`);
        } else {
            if (wantsJson) return res.status(400).json({ success: false, message: 'Email ou senha inválidos.' });
            res.status(400).send('Email ou senha inválidos. <a href="/">Tentar novamente</a>');
        }
    });
});


// 6. Iniciar o Servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Acesse http://localhost:3000 no seu navegador');
});