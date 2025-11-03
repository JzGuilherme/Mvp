/**
 * @file imc.js
 * @description 
 * @author 
 * @copyright 
 */

document.addEventListener("DOMContentLoaded", function() {

    // 1. Pegar os elementos do formulário e do resultado
    const imcForm = document.getElementById("imc-form");
    const alturaInput = document.getElementById("altura");
    const pesoInput = document.getElementById("peso");
    
    const resultPanel = document.getElementById("imc-result");
    const imcValueEl = document.getElementById("imc-value");
    const imcStatusEl = document.getElementById("imc-status");
    const imcMessageEl = document.getElementById("imc-message");

    // 2. Ouvir o "submit" do formulário
    imcForm.addEventListener("submit", function(event) {
        
        // Impede o formulário de recarregar a página
        event.preventDefault(); 
        
        // 3. Pegar os valores e converter para números
        const alturaCm = parseFloat(alturaInput.value);
        const pesoKg = parseFloat(pesoInput.value);

        // Validação simples
        if (isNaN(alturaCm) || isNaN(pesoKg) || alturaCm <= 0 || pesoKg <= 0) {
            alert("Por favor, insira valores válidos para altura e peso.");
            return;
        }

        // 4. Calcular o IMC (Altura em metros)
        const alturaM = alturaCm / 100;
        const imc = pesoKg / (alturaM * alturaM);
        
        // Arredonda para 1 casa decimal
        const imcArredondado = imc.toFixed(1);

        // 5. Atualizar o painel de resultado
        imcValueEl.textContent = imcArredondado;
        
        let status = "";
        let message = "";
        let statusClass = "";

        if (imc < 18.5) {
            status = "Magreza";
            statusClass = "status-magreza";
            message = "Seu IMC indica magreza. É importante buscar orientação profissional.";
        } else if (imc < 24.9) {
            status = "Peso Normal";
            statusClass = "status-normal";
            message = "Parabéns! Seu IMC está na faixa ideal. Continue mantendo hábitos saudáveis.";
        } else if (imc < 29.9) {
            status = "Sobrepeso";
            statusClass = "status-sobrepeso";
            message = "Seu IMC indica sobrepeso. Pequenas mudanças na dieta e exercícios podem ajudar.";
        } else {
            status = "Obesidade";
            statusClass = "status-obesidade";
            message = "Seu IMC indica obesidade. É recomendado procurar um médico.";
        }

        imcStatusEl.textContent = status;
        imcMessageEl.textContent = message;

        // Remove classes de cor antigas e adiciona a nova
        imcStatusEl.className = ""; // Limpa classes
        imcStatusEl.classList.add(statusClass);

        // 6. Mostrar o painel de resultado
        resultPanel.style.display = "flex";
    });
});