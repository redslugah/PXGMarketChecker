const params = new URLSearchParams(window.location.search);
let itemName = params.get('name') || '';
itemName = itemName.replace(/\s+/g, '');  // remove espaços
document.getElementById('itemTitle').textContent = itemName;
const API = 'https://pxghelperapi.onrender.com';

let priceMap = {};
let todosPrecos = [];

function adicionarAoMapa(dia, preco, qtd) {
  if (!priceMap[dia]) priceMap[dia] = { total: 0, quantidade: 0 };
  priceMap[dia].total += preco * qtd;
  priceMap[dia].quantidade += qtd;
  todosPrecos.push(...Array(qtd).fill(preco));
}

fetch(`${API}/market/hist/search?name=${encodeURIComponent(itemName)}`)
  .then(res => res.json())
  .then(histData => {
    const histTable = document.querySelector('#histTable tbody');
    histTable.innerHTML = '';

    histData.forEach(r => {
      const preco = r.PHIUPRICE === null ? 'Oferta' : r.PHIUPRICE;
      const dia = r.PHICRDATE.split(' ')[0];
      if (r.PHIUPRICE !== null) {
        adicionarAoMapa(dia, r.PHIUPRICE, r.PHIQNTITY);
      }
      histTable.innerHTML += `<tr><td>${r.PHIUSNAME}</td><td>${r.PHIQNTITY}</td><td>${preco}</td><td>${r.PHICRDATE}</td></tr>`;
    });

    fetch(`${API}/market/search?name=${encodeURIComponent(itemName)}`)
      .then(res => res.json())
      .then(vigData => {
        const vigenteTable = document.querySelector('#vigenteTable tbody');
        vigenteTable.innerHTML = '';

        vigData.forEach(r => {
          const preco = r.PVIUPRICE === null ? 'Oferta' : r.PVIUPRICE;
          const dia = r.PVICRDATE.split(' ')[0];
          if (r.PVIUPRICE !== null) {
            adicionarAoMapa(dia, r.PVIUPRICE, r.PVIQNTITY);
          }
          vigenteTable.innerHTML += `<tr><td>${r.PVIUSNAME}</td><td>${r.PVIQNTITY}</td><td>${preco}</td><td>${r.PVICRDATE}</td></tr>`;
        });

        const labels = Object.keys(priceMap).sort();
        const avgPrices = labels.map(date => {
          const { total, quantidade } = priceMap[date];
          return total / quantidade;
        });

        new Chart(document.getElementById('priceChart'), {
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

        if (todosPrecos.length) {
          const media = (todosPrecos.reduce((a, b) => a + b, 0) / todosPrecos.length).toFixed(2);
          const max = Math.max(...todosPrecos);
          const min = Math.min(...todosPrecos);
          document.getElementById('mediaValor').textContent = media;
          document.getElementById('maxValor').textContent = max;
          document.getElementById('minValor').textContent = min;
        }
      });
  });
