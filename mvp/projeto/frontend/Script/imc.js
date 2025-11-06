/**
 * @file imc.js
 * @description Gerencia a lógica da calculadora de IMC (Índice de Massa Corporal).
 * @author Equipe ManUp (Assistido por Alfred)
 *
 * Funcionalidades:
 * 1. Captura os dados de altura e peso do formulário.
 * 2. Calcula o IMC.
 * 3. Classifica o resultado (Abaixo do peso, Normal, Sobrepeso, Obesidade).
 * 4. Exibe o resultado dinamicamente na interface, atualizando o painel direito.
 */

// Mapeamento dos elementos do DOM para evitar múltiplas buscas.
// Padrão profissional: Obter todas as referências de elementos no início.
const form = document.getElementById('imc-form');
const alturaInput = document.getElementById('altura');
const pesoInput = document.getElementById('peso');

// Referências ao painel de resultado (que está oculto por padrão)
const resultPanel = document.getElementById('imc-result');
const imcValueElement = document.getElementById('imc-value');
const imcStatusElement = document.getElementById('imc-status');
const imcMessageElement = document.getElementById('imc-message');

/**
 * Classifica o valor do IMC de acordo com os padrões da OMS.
 * Além da mensagem, retorna uma classe CSS para colorir o status.
 * * @param {number} imc - O valor numérico do IMC calculado.
 * @returns {object} Um objeto contendo {status, message, className}.
 */
function classify(imc) {
  /* * ==================================================================
   * ↓↓↓ MUDANÇA SINALIZADA (Protocolo Alfred) ↓↓↓
   * ==================================================================
   * * A lógica de classificação anterior estava incorreta (invertia Sobrepeso e Obesidade).
   * Esta lógica segue a ordem correta e também retorna um 'className' 
   * que será usado para aplicar as cores definidas no seu 'calculadoraimc.css'.
   */
  if (imc < 18.5) {
    return {
      status: 'Abaixo do peso',
      message: 'Você está abaixo do peso ideal. Considere consultar um nutricionista.',
      className: 'status-magreza'
    };
  } else if (imc <= 24.9) {
    return {
      status: 'Peso normal',
      message: 'Parabéns! Você está com o peso ideal. Mantenha hábitos saudáveis.',
      className: 'status-normal'
    };
  } else if (imc <= 29.9) {
    return {
      status: 'Sobrepeso',
      message: 'Você está com sobrepeso. Avalie sua alimentação e pratique atividades.',
      className: 'status-sobrepeso'
    };
  } else {
    // Se for maior que 29.9
    return {
      status: 'Obesidade',
      message: 'Você está com Obesidade. Procure orientação médica e nutricional.',
      className: 'status-obesidade'
    };
  }
}

/**
 * Manipulador de evento para o envio (submit) do formulário.
 * Função principal que orquestra o cálculo e a exibição.
 * @param {Event} event - O objeto do evento de submit.
 */
function handleSubmit(event) {
  // Previne o recarregamento padrão da página ao enviar o formulário.
  event.preventDefault();

  /*
   * ==================================================================
   * ↓↓↓ MUDANÇA SINALIZADA (Protocolo Alfred) ↓↓↓
   * ==================================================================
   * * Corrigido o erro de variável. O nome 'alturaC' foi mudado para 'alturaCm'
   * para ser consistente com o resto da lógica (e com o label 'em cm').
   */
  const alturaCm = parseFloat(alturaInput.value);
  const peso = parseFloat(pesoInput.value);

  // Validação de entrada: Garante que os números são válidos e positivos.
  if (!alturaCm || !peso || alturaCm <= 0 || peso <= 0) {
    alert('Por favor, insira valores válidos para altura e peso.');
    return; // Interrompe a execução se os dados forem inválidos.
  }

  // Lógica de Cálculo
  const alturaM = alturaCm / 100; // Converte altura de CM para Metros
  const imc = peso / (alturaM * alturaM);
  
  // Obtém o objeto de resultado (status, mensagem, classe)
  const resultado = classify(imc);

  /* * ==================================================================
   * ↓↓↓ MUDANÇA SINALIZADA (Protocolo Alfred) ↓↓↓
   * ==================================================================
   *
   * Esta é a correção principal para o seu problema.
   * Em vez de usar 'alert()', estamos atualizando o DOM
   * com os valores calculados e, o mais importante,
   * tornando o painel de resultados visível.
   */

  // 1. Atualiza o conteúdo de texto dos elementos no painel
  //    Usamos toFixed(1) para formatar o IMC para 1 casa decimal (ex: 22.8)
  imcValueElement.textContent = imc.toFixed(1);
  imcStatusElement.textContent = resultado.status;
  imcMessageElement.textContent = resultado.message;

  // 2. Atualiza a classe de cor do status
  //    Removemos classes antigas para garantir que só a cor certa seja aplicada
  imcStatusElement.className = ''; // Limpa classes anteriores
  imcStatusElement.classList.add(resultado.className); // Adiciona a nova classe de cor

  // 3. Torna o painel de resultados visível
  //    O CSS usa 'display: flex' para centralizar o conteúdo deste painel.
  resultPanel.style.display = 'flex';
}

/* * ==================================================================
 * ↓↓↓ MUDANÇA SINALIZADA (Protocolo Alfred) ↓↓↓
 * ==================================================================
 * * Corrigido o erro de sintaxe. 
 * Havia um ')' extra: form.addEventListener('submit'), (event) => { ... }
 * O correto é:         form.addEventListener('submit', (event) => { ... });
 * * Para melhor organização, movi a lógica para uma função separada 'handleSubmit'.
 */
form.addEventListener('submit', handleSubmit);