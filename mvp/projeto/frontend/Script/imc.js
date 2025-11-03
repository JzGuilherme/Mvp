const form = document.getElementById('imc-form');
const alturaInput = document.getElementById('altura');
const pesoInput = document.getElementById('peso');
const imcValueElement = document.getElementById('imc-value');
const imcStatusElement = document.getElementById('imc-status');
const imcMessageElement = document.getElementById('imc-message');

function classify(imc) {
    if (imc <= 18.5) return { status: 'Abaixo do peso', message : 'Você está abaixo do peso ideal. Considere consultar um nutricionista para orientações.'}; 
    if (imc <= 24.9) return { status: 'Peso normal', message : 'Parabéns! Você está com o peso ideal. Mantenha hábitos saudáveis para continuar assim.'};
    if (imc > 29.9 ) return { status: 'Sobrepeso', message : 'Você está com sobrepeso. Avalie sua alimentação e pratique atividades físicas regularmente.'};
    else {return { status: 'Obesidade', message: 'Você está com Obesidade.' }
}}

 
form.addEventListener('submit'), (event)  => {
  event.preventDefault();
  const alturaC = parseFloat(alturaInput.value);
  const peso = parseFloat(pesoInput.value);
  if(!alturaCm || !peso|| alturaCm <= 0 ||peso<=0) {
    alert('Por favor, insira valores válidos para altura e peso.');
    return;
  }
 
  const alturaM = alturaCm / 100;
  const imc = peso / (alturaM * alturaM);
  const resultado = classify(imc);
alert(`Seu status: ${resultado.status}. Mensagem: ${resultado.message}`);
}
