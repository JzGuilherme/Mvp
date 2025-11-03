const form = document.getElementById('imc-form');
const alturaInput = document.getElementById('altura');
const pesoInput = document.getElementById('peso');
const imcValueElement = document.getElementById('imc-value');
const imcStatusElement = document.getElementById('imc-status');
const imcMessageElement = document.getElementById('imc-message');

function classify(imc) {
    if (imc < 18.5) return { status: 'Abaixo do peso'; message = 'Você está abaixo do peso ideal. Considere consultar um nutricionista para orientações.'}; 
    if (imc < 24.9) return { status: 'Peso normal'; message = 'Parabéns! Você está com o peso ideal. Mantenha hábitos saudáveis para continuar assim.'};
    if (imc < 29.9) return { status: 'Sobrepeso'; message = 'Você está com sobrepeso. Avalie sua alimentação e pratique atividades físicas regularmente.'};
} 
 
form.addEventListener('submit', function(event) {