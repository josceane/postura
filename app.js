(function(){
  // Simple utilities
  function escapeHTML(str){ return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function highlight(text, term){
    if(!term) return escapeHTML(text);
    try{
      const rx = new RegExp('('+term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')+')','gi');
      return escapeHTML(text).replace(rx,'<mark>$1</mark>');
    }catch(e){
      return escapeHTML(text);
    }
  }

  if(!window.LAW_TEXT || !window.LAW_TEXT.trim()){
    document.addEventListener('DOMContentLoaded', ()=>{
      const res = document.getElementById('results');
      res.innerHTML = '<div class="card"><p>Não consegui carregar o texto da lei. Verifique os arquivos.</p></div>';
    });
    return;
  }

  const LAW = window.LAW_TEXT.replace(/\r/g,'').replace(/\u00a0/g,' ').trim();

  const articleRegex = /(^|\n)(Art\.\s*\d+[ºo]?)(\s*[\u2013\-–—]\s*)?/g;
  let match, indices = [];
  while((match = articleRegex.exec(LAW))){
    indices.push({idx: match.index + (match[1] ? match[1].length : 0)});
  }
  const articles = [];
  for(let i=0;i<indices.length;i++){
    const start = indices[i].idx;
    const end = (i+1<indices.length)? indices[i+1].idx : LAW.length;
    const chunk = LAW.slice(start, end).trim();
    const m = chunk.match(/^Art\.\s*(\d+)[ºo]?/);
    if(m){
      articles.push({num: parseInt(m[1],10), text: chunk});
    }
  }
  const headingRx = /(T[ÍI]TULO\s+[IVXLCDM]+.*|CAP[ÍI]TULO\s+[IVXLCDM]+.*|Se[cç][aã]o\s+[IVXLCDM]+.*|SEÇÃO\s+[IVXLCDM]+.*)/g;
  const toc = [];
  let hm;
  while((hm = headingRx.exec(LAW))){
    toc.push(hm[0].trim());
  }

  const MULTA_INTERVALOS = [
    {inicio: 7, fim: 10, faixa: "De 15 a 30 UFM"},
    {inicio: 11, fim: 17, faixa: "De 15 a 30 UFM"},
    {inicio: 18, fim: 30, faixa: "De 15 a 30 UFM"},
    {inicio: 32, fim: 44, faixa: "De 10 a 20 UFM"},
    {inicio: 45, fim: 50, faixa: "De 15 a 30 UFM"},
    {inicio: 51, fim: 59, faixa: "De 15 a 30 UFM"},
    {inicio: 60, fim: 61, faixa: "De 15 a 30 UFM"},
    {inicio: 62, fim: 68, faixa: "De 69 a 120 UFM"},
    {inicio: 69, fim: 69, faixa: "De 15 a 30 UFM"},
    {inicio: 70, fim: 74, faixa: "De 10 a 20 UFM"},
    {inicio: 75, fim: 85, faixa: "De 20 a 40 UFM"},
    {inicio: 86, fim: 86, faixa: "De 15 a 30 UFM"},
    {inicio: 87, fim: 88, faixa: "De 15 a 30 UFM"},
    {inicio: 89, fim: 92, faixa: "De 15 a 30 UFM"},
    {inicio: 93, fim: 100, faixa: "De 15 a 30 UFM"},
    {inicio: 101, fim: 110, faixa: "De 15 a 30 UFM"},
    {inicio: 111, fim: 120, faixa: "De 10 a 20 UFM"},
    {inicio: 121, fim: 126, faixa: "De 15 a 40 UFM"},
    {inicio: 127, fim: 130, faixa: "De 20 a 40 UFM"},
    {inicio: 131, fim: 131, faixa: "De 15 a 30 UFM"}
  ];

  function faixaMultaPorArtigo(num) {
    const intervalo = MULTA_INTERVALOS.find(r => num >= r.inicio && num <= r.fim);
    return intervalo ? intervalo.faixa : "Não há faixa de multa definida";
  }

  function renderArticle(n){
    const res = document.getElementById('results');
    const found = articles.find(a => a.num === n);
    if(!found){
      res.innerHTML = `<div class="card"><p>Nenhum artigo <code class="badge">Art. ${n}</code> encontrado.</p></div>`;
      return;
    }
    const faixa = faixaMultaPorArtigo(n);
    res.innerHTML = `<article class="card">
      <h3>Art. ${n}</h3>
      <p><strong>Faixa de multa:</strong> ${faixa}</p>
      <pre style="white-space:pre-wrap">${escapeHTML(found.text)}</pre>
      <p class="meta">Total de artigos detectados: ${articles.length}</p>
    </article>`;
  }

  function renderKeyword(q){
    const res = document.getElementById('results');
    if(!q || !q.trim()){
      res.innerHTML = `<div class="card"><p>Digite uma palavra para pesquisar.</p></div>`;
      return;
    }
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const hits = articles.filter(a => rx.test(a.text));
    if(hits.length === 0){
      res.innerHTML = `<div class="card"><p>Nenhum resultado para "<strong>${escapeHTML(q)}</strong>".</p></div>`;
      return;
    }
    res.innerHTML = hits.slice(0,50).map(a => {
      const faixa = faixaMultaPorArtigo(a.num);
      return `<article class="card">
        <h3>Art. ${a.num}</h3>
        <p><strong>Faixa de multa:</strong> ${faixa}</p>
        <pre style="white-space:pre-wrap">${highlight(a.text, q)}</pre>
      </article>`;
    }).join('') + (hits.length>50? `<div class="card"><p>Mostrando 50 de ${hits.length} resultados. Refine a busca.</p></div>` : '');
  }

  function renderTOC(){
    const res = document.getElementById('results');
    if(toc.length===0){
      res.innerHTML = `<div class="card"><p>Sumário não detectado.</p></div>`;
      return;
    }
    res.innerHTML = `<div class="card"><h3>Sumário detectado</h3><ul>${toc.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul></div>`;
  }

  function setup(){
    const rNumero = document.querySelector('input[value="numero"]');
    const rPalavra = document.querySelector('input[value="palavra"]');
    const boxNum = document.getElementById('search-by-number');
    const boxKW  = document.getElementById('search-by-keyword');
    rNumero.addEventListener('change', ()=>{
      boxNum.classList.remove('hidden'); boxKW.classList.add('hidden');
    });
    rPalavra.addEventListener('change', ()=>{
      boxKW.classList.remove('hidden'); boxNum.classList.add('hidden');
    });

    document.getElementById('btnBuscarArt').addEventListener('click', ()=>{
      const v = document.getElementById('artInput').value.trim();
      const n = parseInt(v, 10);
      if(Number.isFinite(n)) renderArticle(n);
      else document.getElementById('results').innerHTML = '<div class="card"><p>Digite um número de artigo válido.</p></div>';
    });

    document.getElementById('btnBuscarKW').addEventListener('click', ()=>{
      const v = document.getElementById('kwInput').value.trim();
      renderKeyword(v);
    });

    document.getElementById('btnListarTodos').addEventListener('click', renderTOC);

    document.getElementById('btnCompartilhar').addEventListener('click', async ()=>{
      const url = location.href;
      if(navigator.share){
        try{ await navigator.share({title: document.title, url}); }catch(e){}
      }else{
        navigator.clipboard.writeText(url).then(()=>{
          alert('Link copiado para a área de transferência!');
        }, ()=>{
          prompt('Copie o link:', url);
        });
      }
    });

    const params = new URLSearchParams(location.search);
    if(params.has('art')){
      const n = parseInt(params.get('art'), 10);
      if(Number.isFinite(n)){ 
        document.querySelector('input[value="numero"]').checked = true;
        boxNum.classList.remove('hidden'); boxKW.classList.add('hidden');
        document.getElementById('artInput').value = String(n);
        renderArticle(n);
      }
    } else if(params.has('q')){
      const q = params.get('q') || '';
      document.querySelector('input[value="palavra"]').checked = true;
      boxKW.classList.remove('hidden'); boxNum.classList.add('hidden');
      document.getElementById('kwInput').value = q;
      renderKeyword(q);
    }
  }

  document.addEventListener('DOMContentLoaded', setup);
})();