// Espera o HTML carregar antes de rodar o script
document.addEventListener("DOMContentLoaded", function() {

    // 1. Pegar os elementos do HTML
    const modal = document.getElementById("agenda-modal");
    const openBtn = document.getElementById("open-modal-btn");
    const closeBtn = document.getElementById("close-modal-btn");

    // 2. Função para ABRIR o modal
    function abrirModal() {
        // O CSS padrão é 'display: none'. Mudamos para 'display: flex' 
        // (porque usamos flex para centralizar no CSS).
        modal.style.display = "flex";
    }

    // 3. Função para FECHAR o modal
    function fecharModal() {
        modal.style.display = "none";
    }

    // 4. Ligar as funções aos botões
    openBtn.addEventListener("click", abrirModal);
    closeBtn.addEventListener("click", fecharModal);

    // 5. Opcional: Fechar se clicar FORA da caixa branca
    window.addEventListener("click", function(event) {
        if (event.target == modal) {
            fecharModal();
        }
    });

    // --- PRÓXIMAS ETAPAS (Para Pessoas 2 e 3) ---
    // 1. Pegar o <form id="agenda-form">
    // 2. Adicionar um 'submit' event listener
    // 3. Dentro dele, fazer o fetch() para 'POST /api/agenda'
    // 4. Chamar a função 'fecharModal()' quando o Backend der sucesso.

    // --- PRÓXIMAS ETAPAS (Para Pessoas 2 e 3) ---
    // 1. Criar uma função 'carregarAgenda()'
    // 2. Dentro dela, fazer o fetch() para 'GET /api/agenda'
    // 3. Pegar a lista de compromissos
    // 4. Limpar o <div id="agenda-list-container">
    // 5. Criar os cards de agenda (agenda-item) dinamicamente e colocar na tela.
    // 6. Chamar essa função 'carregarAgenda()' assim que a página carregar.

});