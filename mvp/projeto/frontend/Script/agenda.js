
document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('agenda-modal');
  const agendaForm = document.getElementById('agenda-form');
  const titleInput = document.getElementById('titulo');
  const dateInput = document.getElementById('data');
  const listContainer = document.getElementById('agenda-list-container');

  const openModal = () => {
    modal.classList.add('visible');
  };

  const closeModal = () => {
    modal.classList.remove('visible');
  };
  
  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  agendaForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value;
    const rawDate = dateInput.value; 
    const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
                            .toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const newItem = document.createElement('div');
    newItem.classList.add('agenda-item');

    newItem.innerHTML = `
      <div class="item-info">
        <h3>${title}</h3>
        <p>
          <span class="material-symbols-outlined">calendar_today</span>
          Data: ${formattedDate}
        </p>
      </div>
      <div class="item-status pending">
        Pendente
      </div>
    `;

    listContainer.appendChild(newItem);
    agendaForm.reset(); 
    closeModal();       
  });

});