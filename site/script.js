const API_URL = 'https://pxghelperapi.onrender.com';

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
  const nome = document.getElementById('searchInput').value.trim();
  if (!nome) return;

  fetch(`https://pxghelperapi.onrender.com/market/search?name=${encodeURIComponent(nome)}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('itemList');
      list.innerHTML = '';

      const nomesUnicos = [...new Set(data.map(r => r.PVIITNAME))];

      nomesUnicos.forEach(nome => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="item.html?name=${encodeURIComponent(nome)}">${nome}</a>`;
        list.appendChild(li);
      });
    })
    .catch(err => {
      alert('Erro ao carregar dados: ' + err);
      console.error(err);
    });
}

