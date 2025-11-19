/**
 * faq.js - Versão API Node.js
 * Conecta-se ao servidor do fórum na porta 3001.
 */

// CONFIGURAÇÃO: Aponta para o seu novo servidor
const API_URL = 'http://localhost:3001/api/posts'; 
const POSTS_PER_PAGE = 10;
const LIKE_STORAGE_PREFIX = 'manup_liked_post_';

// Elementos do DOM
let form, input, submitButton, feed, feedStatus, nextBtn, prevBtn;
let currentPage = 0;

document.addEventListener('DOMContentLoaded', () => {
    mapDOMElements();
    setupEventListeners();
    loadPosts(0);
});

function mapDOMElements() {
    form = document.getElementById('post-form');
    input = document.getElementById('post-input');
    submitButton = document.getElementById('submit-button');
    feed = document.getElementById('post-feed');
    feedStatus = document.getElementById('feed-status-message');
    nextBtn = document.getElementById('next-page-btn');
    prevBtn = document.getElementById('prev-page-btn');
}

function setupEventListeners() {
    form.addEventListener('submit', handlePostSubmit);
    
    nextBtn.addEventListener('click', () => {
        currentPage++;
        loadPosts(currentPage);
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadPosts(currentPage);
        }
    });
    
    feed.addEventListener('click', handleFeedClick);
}

// --- FUNÇÕES DE API ---

async function loadPosts(page) {
    showStatusMessage("Carregando...", false);

    try {
        // Faz a requisição para o seu servidor Node.js na porta 3001
        const response = await fetch(`${API_URL}?page=${page}&limit=${POSTS_PER_PAGE}`);
        
        if (!response.ok) throw new Error("Erro na API");

        const data = await response.json();
        const posts = data.posts;

        if (posts.length === 0 && page === 0) {
            showStatusMessage("Seja o primeiro a postar!", false);
            feed.innerHTML = '';
            updatePagination(false, false);
            return;
        }

        if (posts.length === 0 && page > 0) {
            showStatusMessage("Não há mais postagens.", false);
            currentPage--; 
            return;
        }

        feed.innerHTML = '';
        posts.forEach(post => renderPost(post));
        
        // O servidor devolve 'hasMore' para controlar o botão Próxima
        updatePagination(data.hasMore, page > 0);

    } catch (error) {
        console.error(error);
        showStatusMessage("Erro de conexão com o servidor (Porta 3001).", true);
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    // Tenta pegar o nome do usuário do localStorage (do seu sistema de login)
    const authorName = localStorage.getItem('nomeUsuario') || "Anônimo";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, authorName })
        });

        if (response.ok) {
            form.reset();
            currentPage = 0;
            loadPosts(0);
        } else {
            alert("Erro ao enviar.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Publicar";
    }
}

// --- RENDERIZAÇÃO E INTERAÇÃO ---

function renderPost(post) {
    if (feedStatus) feedStatus.style.display = 'none';

    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.dataset.id = post.id;

    const date = new Date(post.createdAt).toLocaleString('pt-BR');
    
    // Lógica de Like Local
    const isLiked = localStorage.getItem(LIKE_STORAGE_PREFIX + post.id) === 'true';
    const likeClass = isLiked ? 'liked' : '';
    const likeIcon = isLiked ? 'favorite' : 'favorite_border';

    postElement.innerHTML = `
        <div class="post-content">${escapeHTML(post.text)}</div>
        <div class="post-footer">
            <div class="post-actions">
                <button class="btn-action btn-like ${likeClass}" data-action="like">
                    <span class="material-symbols-outlined">${likeIcon}</span>
                    <span class="like-count">${post.likeCount || 0}</span>
                </button>
                <button class="btn-action btn-reply" data-action="reply">
                    <span class="material-symbols-outlined">reply</span> Responder
                </button>
            </div>
            <div class="post-timestamp">em ${date}</div>
        </div>
        <div class="reply-form" id="reply-form-${post.id}"></div>
        <div class="replies-container" id="replies-${post.id}"></div>
    `;

    feed.appendChild(postElement);

    if (post.replies && post.replies.length > 0) {
        renderReplies(post.id, post.replies);
    }
}

function renderReplies(postId, replies) {
    const container = document.getElementById(`replies-${postId}`);
    container.innerHTML = '';
    
    replies.forEach(reply => {
        const div = document.createElement('div');
        div.className = 'post-card reply-card';
        const date = new Date(reply.createdAt).toLocaleString('pt-BR');
        
        div.innerHTML = `
            <div class="post-content">${escapeHTML(reply.text)}</div>
            <div class="post-footer">
                <div class="post-timestamp">em ${date}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function handleFeedClick(e) {
    const target = e.target;
    const btn = target.closest('.btn-action');
    if (!btn) return;

    const card = target.closest('.post-card');
    const id = card.dataset.id;
    const action = btn.dataset.action;

    if (action === 'like') handleLike(id, btn);
    if (action === 'reply') toggleReplyForm(id, card);
}

async function handleLike(id, btn) {
    const isLiked = localStorage.getItem(LIKE_STORAGE_PREFIX + id) === 'true';
    
    try {
        const response = await fetch(`${API_URL}/${id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ increment: !isLiked })
        });

        if (response.ok) {
            const data = await response.json();
            const countSpan = btn.querySelector('.like-count');
            countSpan.textContent = data.likeCount;
            
            if (isLiked) {
                localStorage.removeItem(LIKE_STORAGE_PREFIX + id);
                btn.classList.remove('liked');
                btn.querySelector('span').textContent = 'favorite_border';
            } else {
                localStorage.setItem(LIKE_STORAGE_PREFIX + id, 'true');
                btn.classList.add('liked');
                btn.querySelector('span').textContent = 'favorite';
            }
        }
    } catch (error) {
        console.error("Erro no like:", error);
    }
}

function toggleReplyForm(id, card) {
    const container = card.querySelector(`#reply-form-${id}`);
    if (container.innerHTML) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <form class="reply-form-inner">
            <textarea class="reply-input" placeholder="Sua resposta..." required></textarea>
            <div class="reply-form-actions">
                <button type="button" class="btn-secondary btn-cancel">Cancelar</button>
                <button type="submit" class="btn-primary-small">Enviar</button>
            </div>
        </form>
    `;

    container.querySelector('.btn-cancel').onclick = () => {
        container.innerHTML = '';
        container.style.display = 'none';
    };

    container.querySelector('form').onsubmit = (e) => {
        e.preventDefault();
        const text = container.querySelector('textarea').value;
        handleReplySubmit(id, text, container);
    };
}

async function handleReplySubmit(postId, text, container) {
    try {
        const response = await fetch(`${API_URL}/${postId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            container.innerHTML = '';
            container.style.display = 'none';
            // Recarrega a página atual para mostrar a resposta
            loadPosts(currentPage); 
        }
    } catch (error) {
        alert("Erro ao enviar resposta.");
    }
}

function updatePagination(hasMore, hasPrev) {
    nextBtn.disabled = !hasMore;
    prevBtn.disabled = !hasPrev;
}

function showStatusMessage(msg, isError) {
    if (feedStatus) {
        feed.innerHTML = '';
        feedStatus.textContent = msg;
        feedStatus.style.display = 'block';
        feedStatus.style.color = isError ? 'red' : '#666';
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
}