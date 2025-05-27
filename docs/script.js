const API_URL = 'https://pxghelperapi.onrender.com';

document.getElementById("searchInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    buscarItem();
  }
});

function loadData(endpoint) {
  fetch(`${API_URL}/${endpoint}`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#resultTable tbody');
      tbody.innerHTML = ''; // limpa tabela

      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.PVIITNAME || row.PHIITNAME}</td>
          <td>${row.PVIUSNAME || row.PHIUSNAME}</td>
          <td>${row.PVIQNTITY || row.PHIQNTITY}</td>
          <td>${row.PVIUPRICE || row.PHIUPRICE}</td>
          <td>${row.PVICRDATE || row.PHICRDATE}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(error => {
      alert("Erro ao carregar dados: " + error);
    });
}

function buscarItem() {
  const loadingEl = document.getElementById('loading');
  const table = document.getElementById('resultTable');
  const tbody = table.querySelector('tbody');
  const nomeBuscado = document.getElementById('searchInput').value.trim().replace(/\s+/g, '');
  if (!nomeBuscado) return;

  loadingEl.style.display = 'block';
  table.style.display = 'none';
  tbody.innerHTML = '';

  fetch(`https://pxghelperapi.onrender.com/market/search?name=${encodeURIComponent(nomeBuscado)}`)
    .then(res => res.json())
    .then(data => {
      const agrupado = {};

      data.forEach(row => {
        const nome = row.PVIITNAME;
        const preco = row.PVIUPRICE;
        const qtd = row.PVIQNTITY;

        if (!agrupado[nome]) {
          agrupado[nome] = {
            total: 0,
            min: null,
            max: null
          };
        }

        agrupado[nome].total += qtd;

        if (preco !== null) {
          if (agrupado[nome].min === null || preco < agrupado[nome].min) {
            agrupado[nome].min = preco;
          }
          if (agrupado[nome].max === null || preco > agrupado[nome].max) {
            agrupado[nome].max = preco;
          }
        }
      });

      const nomesEncontrados = Object.keys(agrupado);

      if (nomesEncontrados.length > 0) {
        // Monta a tabela normalmente
        preencherTabela(agrupado);
        loadingEl.style.display = 'none';
        table.style.display = '';
      } else {
        // Verifica se existe no histórico
        fetch(`https://pxghelperapi.onrender.com/market/hist/search?name=${encodeURIComponent(nomeBuscado)}`)
          .then(res => res.json())
          .then(histData => {
            loadingEl.style.display = 'none';
            if (histData.length > 0) {
              const agrupadoHist = {};
              agrupadoHist[nomeBuscado] = {
                total: 0,
                min: null,
                max: null
              };
              preencherTabela(agrupadoHist);
              table.style.display = '';
            } else {
              alert("Item não encontrado no mercado nem no histórico.");
            }
          });
      }
    })
    .catch(err => {
      alert('Erro ao carregar dados: ' + err);
      loadingEl.style.display = 'none';
    });
}

function preencherTabela(agrupado) {
  const table = document.getElementById('resultTable');
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  Object.entries(agrupado).forEach(([nome, info]) => {
    const min = info.min === null ? '-' : info.min;
    const max = info.max === null ? '-' : info.max;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="item.html?name=${encodeURIComponent(nome)}">${nome}</a></td>
      <td>${info.total}</td>
      <td>${min}</td>
      <td>${max}</td>
    `;
    tbody.appendChild(tr);
  });
}
