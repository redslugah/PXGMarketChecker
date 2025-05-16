const params = new URLSearchParams(window.location.search);
let itemName = params.get('name') || '';
itemName = itemName.replace(/\s+/g, ''); // remove espaços
document.getElementById('itemTitle').textContent = itemName;
const API = 'https://pxghelperapi.onrender.com';

let priceMap = {};
let todosPrecos = [];
let mediaGlobal = 0;
let desvioGlobal = 0;

function adicionarAoMapa(dia, preco, qtd) {
  // Aplicar filtro de outliers se já tivermos média e desvio calculados
  if (mediaGlobal && desvioGlobal) {
    const limiteInferior = mediaGlobal - 3 * desvioGlobal;
    const limiteSuperior = mediaGlobal + 3 * desvioGlobal;
    if (preco < limiteInferior || preco > limiteSuperior) return;
  }

  if (!priceMap[dia]) priceMap[dia] = { total: 0, quantidade: 0 };
  priceMap[dia].total += preco * qtd;
  priceMap[dia].quantidade += qtd;
}

Promise.all([
  fetch(`${API}/market/hist/search?name=${encodeURIComponent(itemName)}`).then(res => res.json()),
  fetch(`${API}/market/search?name=${encodeURIComponent(itemName)}`).then(res => res.json())
]).then(([histData, vigData]) => {
  const histTable = document.querySelector('#histTable tbody');
  const vigenteTable = document.querySelector('#vigenteTable tbody');
  histTable.innerHTML = '';
  vigenteTable.innerHTML = '';

  // Primeiro, apenas coletar todos os preços
  histData.forEach(r => {
    const preco = r.PHIUPRICE === null ? 'Oferta' : r.PHIUPRICE;
    if (r.PHIUPRICE !== null) {
      todosPrecos.push(...Array(r.PHIQNTITY).fill(r.PHIUPRICE));
    }
    histTable.innerHTML += `<tr><td>${r.PHIUSNAME}</td><td>${r.PHIQNTITY}</td><td>${preco}</td><td>${r.PHICRDATE}</td></tr>`;
  });

  vigData.forEach(r => {
    const preco = r.PVIUPRICE === null ? 'Oferta' : r.PVIUPRICE;
    if (r.PVIUPRICE !== null) {
      todosPrecos.push(...Array(r.PVIQNTITY).fill(r.PVIUPRICE));
    }
    vigenteTable.innerHTML += `<tr><td>${r.PVIUSNAME}</td><td>${r.PVIQNTITY}</td><td>${preco}</td><td>${r.PVICRDATE}</td></tr>`;
  });

  // Calcular média e desvio padrão globais
  if (todosPrecos.length) {
    mediaGlobal = todosPrecos.reduce((a, b) => a + b, 0) / todosPrecos.length;
    desvioGlobal = Math.sqrt(todosPrecos.reduce((acc, val) => acc + (val - mediaGlobal) ** 2, 0) / todosPrecos.length);
    const limiteInferior = mediaGlobal - 3 * desvioGlobal;
    const limiteSuperior = mediaGlobal + 3 * desvioGlobal;

    // Preencher priceMap com os dados filtrados
    histData.forEach(r => {
      if (r.PHIUPRICE !== null) {
        adicionarAoMapa(r.PHICRDATE.split(' ')[0], r.PHIUPRICE, r.PHIQNTITY);
      }
    });

    vigData.forEach(r => {
      if (r.PVIUPRICE !== null) {
        adicionarAoMapa(r.PVICRDATE.split(' ')[0], r.PVIUPRICE, r.PVIQNTITY);
      }
    });

    // Atualizar gráfico com valores já filtrados
    const labels = [];
    const avgPrices = [];
    Object.keys(priceMap).sort().forEach(date => {
      const { total, quantidade } = priceMap[date];
      const precoMedio = total / quantidade;
      labels.push(date);
      avgPrices.push(precoMedio);
    });

    new Chart(document.getElementById('priceChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Preço médio por dia (sem outliers)',
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

    // Atualizar estatísticas
    const precosFiltrados = todosPrecos.filter(p => p >= limiteInferior && p <= limiteSuperior);
    const media = (precosFiltrados.reduce((a, b) => a + b, 0) / precosFiltrados.length).toFixed(2);
    const max = Math.max(...precosFiltrados);
    const min = Math.min(...precosFiltrados);
    document.getElementById('mediaValor').textContent = media;
    document.getElementById('maxValor').textContent = max;
    document.getElementById('minValor').textContent = min;
  }
});