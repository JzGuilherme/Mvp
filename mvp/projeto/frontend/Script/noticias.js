/* ===================================================
   SCRIPT DO FILTRO DE ARTIGOS (noticias.js) - v2
   =================================================== */

document.addEventListener("DOMContentLoaded", function() {

    const filterButtons = document.querySelectorAll('.topic-filters .filter-btn');
    const articleCards = document.querySelectorAll('.article-card-full');

    // Função principal que faz o filtro
    function filterArticles(categoriaSelecionada) {

        articleCards.forEach(card => {
            const categoriaDoCard = card.getAttribute('data-topic');

            // 5. A Lógica:
            // SE a categoria do botão for "todos" (novo!)
            // OU SE a categoria do card for a mesma do botão...
            if (categoriaSelecionada === 'todos' || categoriaDoCard === categoriaSelecionada) {
                card.style.display = 'flex'; 
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Adiciona um "ouvinte" de clique em CADA botão de filtro
    filterButtons.forEach(button => {

        button.addEventListener('click', function() {

            // 7. Remove a classe 'active' de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // 8. Adiciona a classe 'active' apenas no botão que foi clicado
            this.classList.add('active');

            // 9. Pega a categoria DIRETO do data-topic (muito mais limpo!)
            const categoriaFiltro = this.getAttribute('data-topic');

            // 10. Chama a função principal para filtrar!
            filterArticles(categoriaFiltro);
        });
    });
});