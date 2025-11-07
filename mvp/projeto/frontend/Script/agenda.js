/**
 * @file agenda.js
 * @description Gerencia a interatividade da página de Agenda, 
 * incluindo a abertura/fechamento do modal e as ações de 
 * Criar, Concluir, Desfazer e Excluir compromissos.
 
 *
 * Protocolo de Visibilidade (CSS):
 * - Item '.pending':   Mostra [Concluir], Esconde [Desfazer]
 * - Item '.completed': Esconde [Concluir], Mostra [Desfazer]
 * - Ambos os estados mostram [Excluir].
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // --- Seletores do DOM ---
  // Mapeamento de todos os elementos interativos da página
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('agenda-modal');
  const agendaForm = document.getElementById('agenda-form');
  const titleInput = document.getElementById('titulo');
  const dateInput = document.getElementById('data');
  const listContainer = document.getElementById('agenda-list-container');

  // --- Funções de Controle do Modal ---
  
  /**
   * Torna o modal de "Adicionar Compromisso" visível.
   * (Esta função corrige o bug do 'display: none' vs. 'display: flex')
   */
  const openModal = () => {
    modal.style.display = 'flex';
  };

  /**
   * Oculta o modal.
   */
  const closeModal = () => {
    modal.style.display = 'none';
  };

  // --- Event Listeners do Modal ---
  
  // Abre o modal ao clicar em "Adicionar Compromisso"
  openModalBtn.addEventListener('click', openModal);
  
  // Fecha o modal ao clicar no 'X'
  closeModalBtn.addEventListener('click', closeModal);
  
  // Fecha o modal se o usuário clicar fora da caixa (no overlay)
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // --- Lógica Principal da Agenda ---

  /**
   * Manipulador para o envio do formulário de novo compromisso.
   * Cria e adiciona um novo item à lista.
   * @param {Event} event - O objeto do evento de submit.
   */
  agendaForm.addEventListener('submit', (event) => {
    // 1. Previne o recarregamento padrão da página
    event.preventDefault();

    // 2. Obter os valores dos inputs
    const title = titleInput.value;
    const rawDate = dateInput.value; // Formato: "AAAA-MM-DD"

    // 3. Formatar a data para o padrão pt-BR
    // (Esta seção corrige o bug da 'dateParts' indefinida)
    const dateParts = rawDate.split('-'); // ["AAAA", "MM", "DD"]
    const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
                            .toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    // 4. Criar o novo elemento (item da agenda)
    const newItem = document.createElement('div');
    newItem.classList.add('agenda-item');
    newItem.classList.add('pending'); // Estado inicial é "Pendente"

    /* * ==================================================================
     * ↓↓↓ ESTRUTURA DO NOVO ITEM  ↓↓↓
     * ==================================================================
     *
     * O HTML do novo item agora inclui os TRÊS botões de ação:
     * 'btn-complete' (Concluir)
     * 'btn-undo' (Desfazer) - será oculto pelo CSS por padrão
     * 'btn-delete' (Excluir)
     */
    newItem.innerHTML = `
      <div class="item-info">
        <h3>${title}</h3>
        <p>
          <span class="material-symbols-outlined">calendar_today</span>
          Data: ${formattedDate}
        </p>
      </div>
      <div class="item-status">
        Pendente
      </div>
      <div class="item-actions">
        <button class="btn-action btn-complete" title="Concluir compromisso">
          <span class="material-symbols-outlined">check_circle</span>
        </button>
        <button class="btn-action btn-undo" title="Desfazer">
          <span class="material-symbols-outlined">undo</span>
        </button>
        <button class="btn-action btn-delete" title="Excluir compromisso">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;

    // 5. Adicionar o novo item ao container da lista
    listContainer.appendChild(newItem);

    // 6. Limpar o formulário e fechar o modal
    agendaForm.reset(); 
    closeModal();       
  });

  /* * ==================================================================
   * ↓↓↓ DELEGAÇÃO DE EVENTOS  ↓↓↓
   * ==================================================================
   *
   * Um único listener no 'listContainer' gerencia todos os cliques
   * nos botões de ação dos itens, incluindo os recém-criados.
   * Agora "escuta" também o '.btn-undo'.
   */
  
  /**
   * Manipulador de cliques para todas as ações dentro da lista de agenda.
   * @param {Event} event - O objeto do evento de clique.
   */
  listContainer.addEventListener('click', (event) => {
    // Identifica o elemento exato que foi clicado
    const clickedElement = event.target;

    // Procura pelo botão de "Concluir" mais próximo
    const completeButton = clickedElement.closest('.btn-complete');
    // Procura pelo botão de "Excluir" mais próximo
    const deleteButton = clickedElement.closest('.btn-delete');
    // Procura pelo botão de "Desfazer" mais próximo
    const undoButton = clickedElement.closest('.btn-undo');

    // Chama a função de manipulação correta
    if (completeButton) {
      handleComplete(completeButton);
    } else if (deleteButton) {
      handleDelete(deleteButton);
    } else if (undoButton) {
      handleUndo(undoButton);
    }
  });

  /**
   * Ação de "Concluir" um item.
   * Apenas muda o estado para 'Concluído'.
   * @param {HTMLElement} button - O botão 'Concluir' que foi clicado.
   */
  function handleComplete(button) {
    const item = button.closest('.agenda-item');
    const status = item.querySelector('.item-status');

    item.classList.remove('pending');
    item.classList.add('completed');
    status.textContent = 'Concluído';
    // O CSS cuidará de esconder este botão e mostrar o 'Desfazer'
  }

  /**
   * Ação de "Desfazer" um item.
   * Apenas reverte o estado para 'Pendente'.
   * @param {HTMLElement} button - O botão 'Desfazer' que foi clicado.
   */
  function handleUndo(button) {
    const item = button.closest('.agenda-item');
    const status = item.querySelector('.item-status');

    item.classList.remove('completed');
    item.classList.add('pending');
    status.textContent = 'Pendente';
    // O CSS cuidará de esconder este botão e mostrar o 'Concluir'
  }

  /**
   * Ação de "Excluir" um item.
   * Pede confirmação e remove o item do DOM.
   * @param {HTMLElement} button - O botão 'Excluir' que foi clicado.
   */
  function handleDelete(button) {
    const item = button.closest('.agenda-item');
    
    // Boa prática: Pedir confirmação antes de uma ação destrutiva.
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      // Remove o item do DOM (da tela)
      item.remove();
    }
  }

});