/* === ARQUIVO: server.js (Atualizado com Gmail e Reset de Senha) === */

// 1. Importar os pacotes
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config(); // <--- MUDANÇA: Carrega as variáveis do .env

// 2. Configurar o App Express
const app = express();
const port = 3000;

// 3. Middlewares (Ajudantes)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Configuração de Caminhos ---
const frontendPath = path.join(__dirname, '../frontend');
const pagesPath = path.join(__dirname, '../frontend/pages');

app.use(express.static(frontendPath)); 
app.use(express.static(pagesPath)); 
// --- Fim da Configuração ---


// 4. Conectar/Criar o Banco de Dados SQLite
const dbPath = path.join(__dirname, 'login.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite em', dbPath);
    }
});

// 5. Criar a Tabela "usuarios" (se não existir)
db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_completo TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reset_token TEXT,
        reset_token_expires INTEGER
    )
`, (err) => {
    if (err) {
        console.error('Erro ao criar/verificar tabela usuarios:', err.message);
    } else {
        console.log('Tabela "usuarios" pronta.');
        
        db.all("PRAGMA table_info(usuarios)", (err, columns) => {
            if (err) return console.error("Erro ao checar colunas:", err);

            const hasTokenCol = columns.some(col => col.name === 'reset_token');
            const hasExpiresCol = columns.some(col => col.name === 'reset_token_expires');

            if (!hasTokenCol) {
                db.run("ALTER TABLE usuarios ADD COLUMN reset_token TEXT", 
                    (e) => e ? console.error("Erro ao add reset_token:", e) : console.log("Coluna reset_token adicionada."));
            }
            if (!hasExpiresCol) {
                db.run("ALTER TABLE usuarios ADD COLUMN reset_token_expires INTEGER", 
                    (e) => e ? console.error("Erro ao add reset_token_expires:", e) : console.log("Coluna reset_token_expires adicionada."));
            }
        });
    }
});

// Tabela "agendamentos" (Sua tabela nova)
db.run(` CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        data_hora TIMESTAMP NOT NULL,
        descricao TEXT,
        FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
`, (err) => {
    if (err) {
        console.error('Erro ao criar tabela "agendamentos":', err.message);
    } else {
        console.log('Tabela "agendamentos" pronta ou já existente.');
    }
});

// <--- INÍCIO DA MUDANÇA: Configuração do Nodemailer (Gmail) --->
console.log('Carregando credenciais de e-mail...');
let transporter;

// Verifica se as variáveis de ambiente foram carregadas
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("ERRO: Variáveis EMAIL_USER e EMAIL_PASS não definidas no .env.");
    console.log("Crie um arquivo .env com suas credenciais do Gmail (Senha de App).");
} else {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Servidor SMTP do Gmail
        port: 465, // Porta segura
        secure: true, // Usar SSL
        auth: {
            user: process.env.EMAIL_USER, // Seu e-mail do .env
            pass: process.env.EMAIL_PASS  // Sua SENHA DE APP do .env
        }
    });

    // Testa a conexão (opcional, mas recomendado)
    transporter.verify((error, success) => {
        if (error) {
            console.error('Erro na configuração do Nodemailer (Gmail):', error.message);
            console.log('Verifique se as credenciais no .env estão corretas (use Senha de App).');
        } else {
            console.log('Nodemailer (Gmail) está pronto para enviar e-mails.');
        }
    });
}
// <--- FIM DA MUDANÇA --->


// --- ROTAS DA APLICAÇÃO ---

// Rota principal para servir seu login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesPath, 'login.html'));
});

/*
 * ROTA DE CADASTRO 
 */
app.post('/cadastro', async (req, res) => {
    // ... (Seu código de cadastro original, sem alterações) ...
    console.log("========================================");
    console.log("Recebi uma tentativa de cadastro!");
    console.log("Dados recebidos do formulário:", req.body);
    const nome_completo = req.body.nome_completo || req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!nome_completo || !email || !password) {
        console.error("ERRO: Dados incompletos. Um dos campos estava vazio.");
        return res.status(400).send("Erro no cadastro: Todos os campos são obrigatórios.");
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO usuarios (nome_completo, email, password_hash) VALUES (?, ?, ?)';
        db.run(sql, [nome_completo, email, passwordHash], function(err) {
            const wantsJson = (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) || (req.headers['accept'] && req.headers['accept'].includes('application/json')) || req.xhr;
            if (err) {
                console.error("ERRO DO SQLITE AO TENTAR SALVAR:", err.message);
                console.log("========================================");
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


/*
 * ROTA DE LOGIN
 */
app.post('/login', (req, res) => {
    // ... (Seu código de login original, sem alterações) ...
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.get(sql, [email], async (err, user) => {
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
            if (wantsJson) return res.json({ 
                success: true, 
                message: 'Login bem-sucedido', 
                redirect: '/pages/dashboard.html', 
                nome: user.nome_completo,
                userId: user.id 
            });
            res.send(`<h1>Login bem-sucedido!</h1><p>Bem-vindo, ${user.nome_completo}!</p>`);
        } else {
            if (wantsJson) return res.status(400).json({ success: false, message: 'Email ou senha inválidos.' });
            res.status(400).send('Email ou senha inválidos. <a href="/">Tentar novamente</a>');
        }
    });
});

/*
 * SUAS ROTAS DE AGENDAMENTO (sem alterações)
 */
app.post('/api/agendamentos', (req, res) => {
    console.log("Recebi uma tentativa de adicionar agendamento!");
    const { user_id, titulo, data_hora, descricao } = req.body;

    if (!user_id || !titulo || !data_hora) {
        return res.status(400).json({ success: false, message: 'Dados incompletos: user_id, título e data são obrigatórios.' });
    }
    const sql = 'INSERT INTO agendamentos (user_id, titulo, data_hora, descricao) VALUES (?, ?, ?, ?)';
    db.run(sql, [user_id, titulo, data_hora, descricao], function(err) {
        if (err) {
            console.error("ERRO DO SQLITE AO INSERIR AGENDAMENTO:", err.message);
            return res.status(500).json({ success: false, message: 'Erro ao salvar o agendamento.' });
        }
        console.log(`SUCESSO: Agendamento criado com ID: ${this.lastID} para o User ID: ${user_id}`);
        res.status(201).json({ 
            success: true, 
            message: 'Agendamento criado com sucesso!', 
            id: this.lastID 
        });
    });
});

app.get('/api/agendamentos/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    console.log(`Buscando agendamentos para o User ID: ${user_id}`);
    const sql = 'SELECT id, titulo, data_hora, descricao FROM agendamentos WHERE user_id = ? ORDER BY data_hora ASC';
    db.all(sql, [user_id], (err, rows) => {
        if (err) {
            console.error("ERRO DO SQLITE AO BUSCAR AGENDAMENTOS:", err.message);
            return res.status(500).json({ success: false, message: 'Erro ao buscar agendamentos.' });
        }
        console.log(`SUCESSO: Encontrados ${rows.length} agendamentos.`);
        res.json({ 
            success: true, 
            agendamentos: rows 
        });
    });
});

// <--- ROTA PARA SOLICITAR RESET DE SENHA (Modificada) --->
app.post('/solicitar-reset', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório.' });
    }

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.get(sql, [email], (err, user) => {
        if (err || !user) {
            console.log(`Tentativa de reset para e-mail (não encontrado ou erro): ${email}`);
            return res.json({ message: 'Se um usuário com esse e-mail existir, um link de redefinição será enviado.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hora

        const updateSql = 'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
        db.run(updateSql, [token, expires, email], async function(err) {
            if (err) {
                console.error('Erro ao salvar token de reset:', err);
                return res.status(500).json({ message: 'Erro ao processar solicitação.' });
            }

            const resetLink = `http://localhost:3000/pages/redefinir.html?token=${token}`;

            try {
                if (!transporter) {
                    console.error("Transporter de e-mail não está pronto! Verifique o .env e a conexão.");
                    return res.status(500).json({ message: 'Serviço de e-mail indisponível.'});
                }

                let info = await transporter.sendMail({
                    // <--- MUDANÇA: Usar o e-mail do .env --->
                    from: `"Seu Sistema" <${process.env.EMAIL_USER}>`, 
                    to: email,
                    subject: 'Redefinição de Senha',
                    html: `
                        <p>Você solicitou uma redefinição de senha.</p>
                        <p>Clique neste link para criar uma nova senha (válido por 1 hora):</p>
                        <a href="${resetLink}">${resetLink}</a>
                    `
                });

                console.log(`E-mail de reset enviado para: ${email} (ID: ${info.messageId})`);
                
                // <--- MUDANÇA: Linha do Ethereal removida --->
                // A linha console.log(nodemailer.getTestMessageUrl(info)) foi removida.

                return res.json({ message: 'Se um usuário com esse e-mail existir, um link de redefinição será enviado.' });

            } catch (emailError) {
                console.error('Erro ao enviar e-mail:', emailError);
                return res.status(500).json({ message: 'Erro ao enviar e-mail de recuperação.' });
            }
        });
    });
});


// <--- ROTA PARA REDEFINIR A SENHA (Sem alterações) --->
app.post('/redefinir-senha', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }

    const sql = 'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > ?';
    db.get(sql, [token, Date.now()], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erro de servidor.' });
        }
        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Atualizar a senha E limpar o token
            const updateSql = 'UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?';
            db.run(updateSql, [passwordHash, user.id], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao atualizar senha.' });
                }
                res.json({ message: 'Senha redefinida com sucesso!' });
            });

        } catch (hashError) {
            console.error('Erro no bcrypt:', hashError);
            res.status(500).json({ message: 'Erro ao processar senha.' });
        }
    });
});


// 6. Iniciar o Servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Acesse http://localhost:3000 no seu navegador');
});