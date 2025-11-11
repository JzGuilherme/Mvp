/**
 * @file faq.js
 * @description Gerencia a lógica do Fórum da Comunidade (v2.3).
 * (Com correções para o bug da paginação "Anterior")
 */

// --- Constantes Globais ---
const POSTS_PER_PAGE = 10;
const DB_COLLECTION_NAME = 'forum-posts';
const LIKE_STORAGE_PREFIX = 'manup_liked_post_';

// --- Mapeamento do DOM ---
let form, input, submitButton, feed, feedStatus, paginationControls, nextBtn, prevBtn;
let db, auth, postsCollectionPath, postsCollection;
let fb; // Referência global para o 'window.firebase'

// --- Estado da Paginação ---
let lastVisibleDoc = null; // O último documento da página atual
let firstVisibleDoc = null; // O primeiro documento da página atual

/* * ==================================================================
 * ↓↓↓ CORREÇÃO (v2.3) - Lógica de Paginação Atualizada ↓↓↓
 * ==================================================================
 *
 * A lógica anterior estava muito complexa e falhava.
 * Esta abordagem é mais robusta. Armazenamos apenas os cursores
 * (o último documento de cada página) numa pilha.
 */
let pageCursors = [null]; // O cursor da Página 1 é 'null' (começa do início)
let currentPage = 0; // Índice da página atual (baseado em pageCursors)


/**
 * Função de inicialização principal.
 */
async function main() {
  mapDOMElements();
  const initSuccess = await initializeFirebase();
  if (!initSuccess) {
    showStatusMessage("Erro crítico: Não foi possível conectar ao banco de dados.", true);
    return;
  }
  setupEventListeners();
  loadPosts(0); // Carrega a primeira página
}

/**
 * Mapeia todos os elementos HTML necessários.
 */
function mapDOMElements() {
  form = document.getElementById('post-form');
  input = document.getElementById('post-input');
  submitButton = document.getElementById('submit-button');
  feed = document.getElementById('post-feed');
  feedStatus = document.getElementById('feed-status-message');
  paginationControls = document.getElementById('pagination-controls');
  nextBtn = document.getElementById('next-page-btn');
  prevBtn = document.getElementById('prev-page-btn');
}

/**
 * Inicializa a conexão com o Firebase (App, Auth, Firestore).
 * @returns {boolean} Verdadeiro se a inicialização for bem-sucedida.
 */
async function initializeFirebase() {
  try {
    fb = window.firebase;
    if (!fb) throw new Error("SDK do Firebase não foi carregado.");

    const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
    const appId = window.__app_id || 'default-app-id';
    
    if (!firebaseConfig.apiKey) throw new Error("Configuração do Firebase não encontrada.");

    const app = fb.initializeApp(firebaseConfig);
    db = fb.getFirestore(app);
    auth = fb.getAuth(app);

    postsCollectionPath = `artifacts/${appId}/public/data/${DB_COLLECTION_NAME}`;
    postsCollection = fb.collection(db, postsCollectionPath);

    await setupAuth();
    return true;
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
    return false;
  }
}

/**
 * Realiza o login (seja com token ou anônimo).
 */
async function setupAuth() {
  const authToken = window.__initial_auth_token;
  try {
    if (authToken) {
      await fb.signInWithCustomToken(auth, authToken);
    } else {
      await fb.signInAnonymously(auth);
    }
  } catch (error) {
    console.error("Falha na autenticação:", error);
    showStatusMessage("Não foi possível autenticar. O fórum pode não funcionar.", true);
  }
}

/**
 * Configura todos os event listeners da página.
 */
function setupEventListeners() {
  form.addEventListener('submit', handlePostSubmit);
  
  /* * ==================================================================
   * ↓↓↓ CORREÇÃO (v2.3) - Event Listeners da Paginação ↓↓↓
   * ==================================================================
   */
  nextBtn.addEventListener('click', () => {
    currentPage++; // Avança
    loadPosts(currentPage);
  });
  
  prevBtn.addEventListener('click', () => {
    currentPage--; // Retrocede
    loadPosts(currentPage);
  });
  
  feed.addEventListener('click', handleFeedClick);
}

/**
 * Carrega um lote (página) de postagens do Firestore.
 * @param {number} pageIndex - O índice da página a carregar.
 */
async function loadPosts(pageIndex) {
  showStatusMessage("Carregando postagens...", false);
  let q;

  try {
    const baseQuery = fb.query(postsCollection, fb.orderBy("createdAt", "desc"));
    const cursor = pageCursors[pageIndex]; // Obtém o cursor para a página desejada

    if (cursor) {
      q = fb.query(baseQuery, fb.startAfter(cursor), fb.limit(POSTS_PER_PAGE));
    } else {
      q = fb.query(baseQuery, fb.limit(POSTS_PER_PAGE)); // Página 1 (cursor é null)
    }

    const querySnapshot = await fb.getDocs(q);
    
    if (querySnapshot.empty && pageIndex === 0) {
      showStatusMessage("Seja o primeiro a postar!", false);
      feed.innerHTML = '';
      updatePaginationButtons(false, false);
      return;
    }
    
    feed.innerHTML = ''; 
    const docs = querySnapshot.docs;
    
    if (docs.length === 0) {
        // Isso pode acontecer se o usuário voltar para uma página que foi esvaziada
        showStatusMessage("Não há mais postagens.", false);
        // Força o desabR ilitar do botão "Próximo"
        lastVisibleDoc = null; 
    } else {
        firstVisibleDoc = docs[0];
        lastVisibleDoc = docs[docs.length - 1];
    }


    docs.forEach(doc => {
      renderPost(doc.id, doc.data());
    });

    /* * ==================================================================
     * ↓↓↓ CORREÇÃO (v2.3) - Lógica de Paginação Atualizada ↓↓↓
     * ==================================================================
     */
    
    // Se estamos avançando e esta é a primeira vez que vemos esta página
    if (pageIndex === currentPage && docs.length > 0 && pageIndex === pageCursors.length - 1) {
        pageCursors.push(lastVisibleDoc); // Adiciona o cursor da próxima página
    }
    
    // Verifica se existe uma próxima página (ou se temos mais cursores)
    const hasNext = (pageCursors.length > currentPage + 1) || (docs.length === POSTS_PER_PAGE);
    const hasPrev = currentPage > 0;
    
    updatePaginationButtons(hasNext, hasPrev);

  } catch (error) {
    console.error("Erro ao carregar postagens:", error);
    showStatusMessage("Erro ao carregar o fórum. Tente atualizar a página.", true);
  }
}


/**
 * Renderiza um único card de postagem no feed.
 * @param {string} id - O ID do documento.
 * @param {object} data - O objeto de dados (text, createdAt, likeCount).
 */
function renderPost(id, data) {
  if (feedStatus) {
    feedStatus.style.display = 'none';
  }

  const postElement = document.createElement('div');
  postElement.className = 'post-card';
  postElement.dataset.id = id; 

  const timestamp = data.createdAt 
    ? data.createdAt.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Agora mesmo';

  const isLiked = localStorage.getItem(LIKE_STORAGE_PREFIX + id) === 'true';
  const likeClass = isLiked ? 'liked' : '';
  const likeIcon = isLiked ? 'favorite' : 'favorite_border';
  const likeCount = data.likeCount || 0;

  postElement.innerHTML = `
    <div class="post-content">${escapeHTML(data.text)}</div>
    
    <div class="post-footer">
      <div class="post-actions">
        <button class="btn-action btn-like ${likeClass}" data-action="like" title="Curtir">
          <span class="material-symbols-outlined">${likeIcon}</span>
          <span class="like-count">${likeCount}</span>
        </button>
        <button class="btn-action btn-reply" data-action="reply" title="Responder">
          <span class="material-symbols-outlined">reply</span>
          Responder
        </button>
      </div>
      <div class="post-timestamp">em ${timestamp}</div>
    </div>
    
    <div class="reply-form" id="reply-form-${id}"></div>
    <div class="replies-container" id="replies-${id}"></div>
  `;

  feed.appendChild(postElement);
  loadReplies(id);
}

/**
 * Manipula o envio do formulário principal de postagem.
 * @param {Event} e - O evento de submit.
 */
async function handlePostSubmit(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  setSubmitButtonState(true, "Publicando...");

  try {
    await fb.addDoc(postsCollection, {
      text: text,
      createdAt: fb.serverTimestamp(),
      likeCount: 0
    });
    
    form.reset();
    // Reseta a paginação e volta para a página 1
    currentPage = 0;
    pageCursors = [null];
    lastVisibleDoc = null;
    loadPosts(0); 

  } catch (error) {
    console.error("Erro ao enviar postagem:", error);
    alert("Não foi possível enviar sua postagem. Tente novamente.");
  } finally {
    setSubmitButtonState(false, "Publicar");
  }
}

/**
 * Manipulador de clique centralizado para o feed (Like, Responder, etc.).
 * @param {Event} e - O evento de clique.
 */
function handleFeedClick(e) {
  const target = e.target;
  const actionButton = target.closest('.btn-action');
  if (!actionButton) return;

  const postCard = target.closest('.post-card');
  const postId = postCard.dataset.id;
  const action = actionButton.dataset.action;

  if (action === 'like') {
    handleLike(postId, actionButton, postCard);
  } else if (action === 'reply') {
    toggleReplyForm(postId, postCard);
  }
}

/**
 * Manipula a ação de "Curtir" (Like).
 * @param {string} postId - O ID do post a ser curtido.
 * @param {HTMLElement} button - O botão de like que foi clicado.
 */
async function handleLike(postId, button) {
  const storageKey = LIKE_STORAGE_PREFIX + postId;
  const isLiked = localStorage.getItem(storageKey) === 'true';
  const postRef = fb.doc(db, postsCollectionPath, postId);
  
  try {
    const incrementAmount = isLiked ? -1 : 1;
    await fb.updateDoc(postRef, {
      likeCount: fb.increment(incrementAmount)
    });

    const countElement = button.querySelector('.like-count');
    let currentCount = parseInt(countElement.textContent, 10);
    
    if (isLiked) {
      localStorage.removeItem(storageKey);
      button.classList.remove('liked');
      button.querySelector('.material-symbols-outlined').textContent = 'favorite_border';
      countElement.textContent = Math.max(0, currentCount - 1); // Garante que não fique negativo
    } else {
      localStorage.setItem(storageKey, 'true');
      button.classList.add('liked');
      button.querySelector('.material-symbols-outlined').textContent = 'favorite';
      countElement.textContent = currentCount + 1;
    }
    
  } catch (error) {
    console.error("Erro ao atualizar like:", error);
  }
}

/**
 * Mostra ou esconde o formulário de resposta abaixo de uma postagem.
 * @param {string} postId - O ID do post a ser respondido.
 * @param {HTMLElement} postCard - O card da postagem.
 */
function toggleReplyForm(postId, postCard) {
  const formContainer = postCard.querySelector(`#reply-form-${postId}`);
  
  if (formContainer.innerHTML) {
    formContainer.innerHTML = '';
    formContainer.style.display = 'none';
    return;
  }
  
  formContainer.style.display = 'block';
  formContainer.innerHTML = `
    <form class="reply-form-inner">
      <textarea class="reply-textarea" placeholder="Escreva sua resposta..." required></textarea>
      <div class="reply-form-actions">
        <button type="button" class="btn-secondary btn-cancel-reply">Cancelar</button>
        <button type="submit" class="btn-primary-small">Responder</button>
      </div>
    </form>
  `;

  // Adiciona listeners aos novos botões do formulário
  formContainer.querySelector('.reply-form-inner').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = formContainer.querySelector('.reply-textarea').value.trim();
    if (text) {
      handleReplySubmit(postId, text, formContainer);
    }
  });

  formContainer.querySelector('.btn-cancel-reply').addEventListener('click', () => {
    formContainer.innerHTML = '';
    formContainer.style.display = 'none';
  });
}

/**
 * Manipula o envio de uma nova resposta.
 * @param {string} postId - O ID do post "pai".
 * @param {string} text - O texto da resposta.
 * @param {HTMLElement} formContainer - O container do formulário.
 */
async function handleReplySubmit(postId, text, formContainer) {
  const repliesCollectionPath = `${postsCollectionPath}/${postId}/replies`;
  const repliesCollection = fb.collection(db, repliesCollectionPath);
  
  try {
    await fb.addDoc(repliesCollection, {
      text: text,
      createdAt: fb.serverTimestamp()
    });
    
    formContainer.innerHTML = '';
    formContainer.style.display = 'none';
    
  } catch (error) {
    console.error("Erro ao enviar resposta:", error);
    alert("Não foi possível enviar sua resposta.");
  }
}

/**
 * Carrega e escuta por novas respostas (replies) para um post específico.
 * @param {string} postId - O ID do post "pai".
 */
function loadReplies(postId) {
  const repliesContainer = document.getElementById(`replies-${postId}`);
  if (!repliesContainer) return;

  const repliesCollectionPath = `${postsCollectionPath}/${postId}/replies`;
  const q = fb.query(fb.collection(db, repliesCollectionPath), fb.orderBy("createdAt", "asc"));

  fb.onSnapshot(q, (snapshot) => {
    repliesContainer.innerHTML = ''; 
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const replyElement = document.createElement('div');
      replyElement.className = 'post-card reply-card'; 
      
      const timestamp = data.createdAt
        ? data.createdAt.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : 'Agora';
      
      replyElement.innerHTML = `
        <div class="post-content">${escapeHTML(data.text)}</div>
        <div class="post-footer">
          <div class="post-actions"></div>
          <div class="post-timestamp">em ${timestamp}</div>
        </div>
      `;
      repliesContainer.appendChild(replyElement);
    });
    
  }, (error) => {
    console.error(`Erro ao carregar respostas para ${postId}:`, error);
    repliesContainer.innerHTML = '<p class="feed-status-message" style="font-size: 12px;">Não foi possível carregar as respostas.</p>';
  });
}

/**
 * Atualiza o estado dos botões de paginação.
 * @param {boolean} hasNext - Se existe uma próxima página.
 * @param {boolean} hasPrev - Se existe uma página anterior.
 */
function updatePaginationButtons(hasNext, hasPrev) {
  nextBtn.disabled = !hasNext;
  prevBtn.disabled = !hasPrev;
}

/**
 * Controla o estado do botão principal de submit.
 * @param {boolean} disabled - Desabilitar o botão?
 * @param {string} text - O texto a ser exibido no botão.
 */
function setSubmitButtonState(disabled, text) {
  submitButton.disabled = disabled;
  submitButton.textContent = text;
}

/**
 * Exibe uma mensagem de status no feed.
 * @param {string} message - A mensagem.
 * @param {boolean} isError - É uma mensagem de erro?
 */
function showStatusMessage(message, isError) {
  if (feedStatus) {
    feed.innerHTML = '';
    feedStatus.textContent = message;
    feedStatus.style.display = 'block';
    feedStatus.style.color = isError ? '#D32F2F' : 'var(--texto-secundario)';
  }
}

/**
 * Utilitário de segurança: Escapa HTML para prevenir XSS.
 * @param {string} str - A string de entrada.
 * @returns {string} A string "limpa".
 */
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// --- Ponto de Entrada ---
main();