const params = new URLSearchParams(window.location.search);
let itemName = params.get('name') || '';
itemName = itemName.replace(/\s+/g, '');
document.getElementById('itemTitle').textContent = itemName;
const API = 'https://pxghelperapi.onrender.com';

let priceMap = {};
let todosPrecos = [];
let histData = [];
let vigData = [];
let mediaGlobal = 0;
let desvioGlobal = 0;
let modoMedia = 'metade_baixa'; // 'sem_outliers'/'metade_baixa'

// Função auxiliar
function adicionarAoMapa(dia, preco, qtd) {
  if (!priceMap[dia]) priceMap[dia] = { total: 0, quantidade: 0 };
  priceMap[dia].total += preco * qtd;
  priceMap[dia].quantidade += qtd;
}

// Primeiro fetch: histórico
fetch(`${API}/market/hist/search?name=${encodeURIComponent(itemName)}`)
  .then(res => res.json())
  .then(hist => {
    histData = hist;
    const histTable = document.querySelector('#histTable tbody');
    histTable.innerHTML = '';

    histData.forEach(r => {
      const preco = r.PHIUPRICE === null ? 'Oferta' : r.PHIUPRICE;
      const dia = r.PHICRDATE.split(' ')[0];
      if (r.PHIUPRICE !== null) {
        todosPrecos.push(...Array(r.PHIQNTITY).fill(r.PHIUPRICE));
      }
      histTable.innerHTML += `<tr><td>${r.PHIUSNAME}</td><td>${r.PHIQNTITY}</td><td>${preco}</td><td>${r.PHICRDATE}</td></tr>`;
    });

    // Segundo fetch: vigente
    fetch(`${API}/market/search?name=${encodeURIComponent(itemName)}`)
      .then(res => res.json())
      .then(vig => {
        vigData = vig;
        const vigenteTable = document.querySelector('#vigenteTable tbody');
        vigenteTable.innerHTML = '';

        vigData.forEach(r => {
          const preco = r.PVIUPRICE === null ? 'Oferta' : r.PVIUPRICE;
          const dia = r.PVICRDATE.split(' ')[0];
          if (r.PVIUPRICE !== null) {
            todosPrecos.push(...Array(r.PVIQNTITY).fill(r.PVIUPRICE));
          }
          vigenteTable.innerHTML += `<tr><td>${r.PVIUSNAME}</td><td>${r.PVIQNTITY}</td><td>${preco}</td><td>${r.PVICRDATE}</td></tr>`;
        });

        // Calcular média e desvio padrão globais
        if (todosPrecos.length) {
          mediaGlobal = todosPrecos.reduce((a, b) => a + b, 0) / todosPrecos.length;
          const variancia = todosPrecos.reduce((acc, val) => acc + Math.pow(val - mediaGlobal, 2), 0) / todosPrecos.length;
          desvioGlobal = Math.sqrt(variancia);
        }

        atualizarGraficoEEstatisticas();
      });
  });

// Função para atualizar tudo com base no modo de média
function atualizarGraficoEEstatisticas() {
  let precosFiltrados = [];

  if (modoMedia === 'sem_outliers') {
    const limiteInferior = mediaGlobal - 3 * desvioGlobal;
    const limiteSuperior = mediaGlobal + 3 * desvioGlobal;
    precosFiltrados = todosPrecos.filter(p => p >= limiteInferior && p <= limiteSuperior);
  } else if (modoMedia === 'metade_baixa') {
    const ordenados = [...todosPrecos].sort((a, b) => a - b);
    const metade = Math.floor(ordenados.length / 2);
    precosFiltrados = ordenados.slice(0, metade);
  }

  // Recriar priceMap com base nos dados filtrados
  priceMap = {};
  histData.forEach(r => {
    if (r.PHIUPRICE !== null && precosFiltrados.includes(r.PHIUPRICE)) {
      adicionarAoMapa(r.PHICRDATE.split(' ')[0], r.PHIUPRICE, r.PHIQNTITY);
    }
  });
  vigData.forEach(r => {
    if (r.PVIUPRICE !== null && precosFiltrados.includes(r.PVIUPRICE)) {
      adicionarAoMapa(r.PVICRDATE.split(' ')[0], r.PVIUPRICE, r.PVIQNTITY);
    }
  });

  // Preparar dados para o gráfico
  const labels = [];
  const avgPrices = [];
  Object.keys(priceMap).sort().forEach(date => {
    const { total, quantidade } = priceMap[date];
    const media = total / quantidade;
    labels.push(date);
    avgPrices.push(media);
  });

  // Desenhar gráfico
  const ctx = document.getElementById('priceChart').getContext('2d');
  if (window.graficoAtual instanceof Chart) {
    window.graficoAtual.destroy();
  }
  window.graficoAtual = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Preço médio por dia',
        data: avgPrices,
        borderColor: 'rgba(0, 200, 255, 1)',
        backgroundColor: 'rgba(0, 200, 255, 0.2)',
        tension: 0.3,
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: '#ccc' } },
        y: { ticks: { color: '#ccc' } }
      }
    }
  });

  // Estatísticas na tela
  if (precosFiltrados.length) {
    const media = (precosFiltrados.reduce((a, b) => a + b, 0) / precosFiltrados.length).toFixed(2);
    const max = Math.max(...precosFiltrados);
    const min = Math.min(...precosFiltrados);
    document.getElementById('mediaValor').textContent = media;
    document.getElementById('maxValor').textContent = max;
    document.getElementById('minValor').textContent = min;
  }
}

// Botão para alternar modo de média
document.getElementById('toggleMedia').addEventListener('click', () => {
  modoMedia = (modoMedia === 'sem_outliers') ? 'metade_baixa' : 'sem_outliers';
  const texto = (modoMedia === 'sem_outliers') ? 'Tipo de média: Sem outliers' : 'Tipo de média: 50% lower';
  document.getElementById('toggleMedia').textContent = texto;
  atualizarGraficoEEstatisticas();
});
document.getElementById('voltar').addEventListener('click', () => {
  window.location.href = 'index.html';
});
