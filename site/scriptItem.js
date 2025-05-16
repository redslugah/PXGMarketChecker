const params = new URLSearchParams(window.location.search);
const itemName = params.get('name');
document.getElementById('itemTitle').textContent = itemName;
const API = 'https://pxghelperapi.onrender.com';

// HISTÓRICO
fetch(`${API}/market/hist/search?name=${encodeURIComponent(itemName)}`)
  .then(res => res.json())
  .then(data => {
    const priceMap = {};
    const histTable = document.querySelector('#histTable tbody');
    histTable.innerHTML = '';

    data.forEach(r => {
      const preco = r.PHIUPRICE === null ? 'Oferta' : r.PHIUPRICE;
      const dia = r.PHICRDATE.split(' ')[0];
      if (r.PHIUPRICE !== null) {
        if (!priceMap[dia]) priceMap[dia] = { total: 0, quantidade: 0 };
          priceMap[dia].total += r.PHIUPRICE * r.PHIQNTITY;
          priceMap[dia].quantidade += r.PHIQNTITY;
      }
      histTable.innerHTML += `<tr><td>${r.PHIUSNAME}</td><td>${r.PHIQNTITY}</td><td>${preco}</td><td>${r.PHICRDATE}</td></tr>`;
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
  });

// VIGENTE
fetch(`${API}/market/search?name=${encodeURIComponent(itemName)}`)
  .then(res => res.json())
  .then(data => {
    const vigenteTable = document.querySelector('#vigenteTable tbody');
    vigenteTable.innerHTML = '';

    data.forEach(r => {
      const preco = r.PVIUPRICE === null ? 'Oferta' : r.PVIUPRICE;
      vigenteTable.innerHTML += `<tr><td>${r.PVIUSNAME}</td><td>${r.PVIQNTITY}</td><td>${preco}</td><td>${r.PVICRDATE}</td></tr>`;
    });
  });
