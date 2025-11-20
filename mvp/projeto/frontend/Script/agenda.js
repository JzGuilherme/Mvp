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
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('agenda-modal');
  const agendaForm = document.getElementById('agenda-form');
  const titleInput = document.getElementById('titulo');
  const dateInput = document.getElementById('data');
  const listContainer = document.getElementById('agenda-list-container');

  // Novos Modais (Confirmação e Sucesso)
  const confirmModal = document.getElementById('confirm-modal');
  const btnConfirmYes = document.getElementById('btn-confirm-yes');
  const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
  
  const successModal = document.getElementById('success-modal');
  const btnSuccessOk = document.getElementById('btn-success-ok');

  // Variável para guardar qual item será excluído
  let itemToDelete = null;

  // --- Funções Auxiliares de Modal ---

  const openModalGeneric = (modalElement) => {
    modalElement.style.display = 'flex';
  };

  const closeModalGeneric = (modalElement) => {
    modalElement.style.display = 'none';
  };

  // --- Event Listeners do Modal de Formulário ---
  
  openModalBtn.addEventListener('click', () => openModalGeneric(modal));
  closeModalBtn.addEventListener('click', () => closeModalGeneric(modal));
  
  // Fecha ao clicar fora
  window.addEventListener('click', (event) => {
    if (event.target === modal) closeModalGeneric(modal);
    if (event.target === confirmModal) closeModalGeneric(confirmModal);
    if (event.target === successModal) closeModalGeneric(successModal);
  });

  // --- Lógica Principal da Agenda ---

  agendaForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value;
    const rawDate = dateInput.value; 

    const dateParts = rawDate.split('-'); 
    const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
                            .toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const newItem = document.createElement('div');
    newItem.classList.add('agenda-item');
    newItem.classList.add('pending');

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

    listContainer.appendChild(newItem);
    agendaForm.reset(); 
    closeModalGeneric(modal); // Fecha o formulário
    
    // Mostra o modal de sucesso
    document.getElementById('success-message').textContent = 'Compromisso agendado com sucesso!';
    openModalGeneric(successModal);
  });

  // Fechar modal de sucesso
  btnSuccessOk.addEventListener('click', () => closeModalGeneric(successModal));


  // --- Delegação de Eventos (Lista) ---
  
  listContainer.addEventListener('click', (event) => {
    const clickedElement = event.target;
    const completeButton = clickedElement.closest('.btn-complete');
    const deleteButton = clickedElement.closest('.btn-delete');
    const undoButton = clickedElement.closest('.btn-undo');

    if (completeButton) {
      handleComplete(completeButton);
    } else if (deleteButton) {
      handleDeleteRequest(deleteButton); // Chama a nova função de solicitação
    } else if (undoButton) {
      handleUndo(undoButton);
    }
  });

  function handleComplete(button) {
    const item = button.closest('.agenda-item');
    const status = item.querySelector('.item-status');
    item.classList.remove('pending');
    item.classList.add('completed');
    status.textContent = 'Concluído';
  }

  function handleUndo(button) {
    const item = button.closest('.agenda-item');
    const status = item.querySelector('.item-status');
    item.classList.remove('completed');
    item.classList.add('pending');
    status.textContent = 'Pendente';
  }

  /**
   * Inicia o processo de exclusão (abre o modal).
   */
  function handleDeleteRequest(button) {
    const item = button.closest('.agenda-item');
    itemToDelete = item; // Guarda a referência do item
    openModalGeneric(confirmModal); // Abre a confirmação
  }

  // --- Lógica do Modal de Confirmação (Excluir) ---

  btnConfirmYes.addEventListener('click', () => {
    if (itemToDelete) {
      itemToDelete.remove(); // Exclui de verdade
      itemToDelete = null; // Limpa a referência
      closeModalGeneric(confirmModal);
    }
  });

  btnConfirmCancel.addEventListener('click', () => {
    itemToDelete = null; // Cancela a ação
    closeModalGeneric(confirmModal);
  });

});