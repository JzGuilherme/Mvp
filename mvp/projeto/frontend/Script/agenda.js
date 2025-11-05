document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('agenda-modal');
  const agendaForm = document.getElementById('agenda-form');
  const titleInput = document.getElementById('titulo');
  const dateInput = document.getElementById('data');
  const listContainer = document.getElementById('agenda-list-container');

  const openModal = () => {
    // CORREÇÃO 1: Mudar o display para 'flex' (como está no CSS) em vez de usar classe
    modal.style.display = 'flex';
  };

  const closeModal = () => {
    // CORREÇÃO 1: Mudar o display para 'none'
    modal.style.display = 'none';
  };
  
  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    // Isso está correto: fecha se clicar fora do 'modal-content'
    if (event.target === modal) {
      closeModal();
    }
  });

  agendaForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value;
    const rawDate = dateInput.value; // Ex: "2025-11-20"

    // CORREÇÃO 2: A variável 'dateParts' não existia.
    // Precisamos criar ela quebrando o rawDate (que é "AAAA-MM-DD")
    const dateParts = rawDate.split('-'); // Resultado: ["2025", "11", "20"]

    // Agora o código abaixo funciona, pois 'dateParts' existe
    // Nota: O input 'date' já entrega a data no fuso local, mas usar o UTC aqui garante consistência
    const formattedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
                            .toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    
    // O resto do seu código já estava ótimo
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