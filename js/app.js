(() => {
  'use strict';

  const api = GepisegAPI.criar();
  const $ = (selector) => document.querySelector(selector);
  const state = {
    artigos: { pagina: 1, porPagina: 6, q: '', tema: '', ano: '', tipo: '', ordenar: 'recentes' },
    pesquisadores: { pagina: 1, porPagina: 8, q: '', area: '', ordenar: 'nome' },
    articleRequest: 0,
    personRequest: 0,
    modalRequest: 0,
  };

  const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtNumber = (n) => Number(n || 0).toLocaleString('pt-BR');
  const fmtDate = (date) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return escapeHtml(date);
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const typeName = (type) => ({ artigo_evento: 'Artigo em evento', artigo_periodico: 'Artigo em periódico', relatorio_tecnico: 'Relatório técnico', capitulo_livro: 'Capítulo de livro' })[type] || String(type || '').replaceAll('_', ' ');
  const startLoading = (msg) => `<div class="col-12"><div class="load-state"><div class="spinner-border spinner-border-sm me-2" role="status" aria-label="Carregando"></div>${escapeHtml(msg)}</div></div>`;
  const blankState = (title, desc, target) => `<div class="col-12"><div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p><button type="button" class="btn btn-outline-secondary reset-${target}">Limpar filtros</button></div></div>`;
  const errorState = (msg) => `<div class="col-12"><div class="alert alert-warning" role="alert">${escapeHtml(msg)}</div></div>`;
  const avatarHtml = (person) => `<span class="avatar-frame" aria-hidden="true">${escapeHtml(person.iniciais || '?')}</span>`;

  function fillOptions(element, values, labeler = (v) => v) {
    const firstOption = element.querySelector('option');
    element.replaceChildren(firstOption);
    (values || []).forEach((v) => { const option = document.createElement('option'); option.value = v; option.textContent = labeler(v); element.appendChild(option); });
  }

  function drawHero(artigos) {
    const article = artigos.slice().sort((a, b) => b.citacoes - a.citacoes)[0];
    if (!article) return;
    $('#heroFeatured').innerHTML = `<p class="featured-label">Publicação em destaque</p><h2>${escapeHtml(article.titulo)}</h2><p>${escapeHtml(article.tema)} · ${escapeHtml(article.ano)} · ${fmtNumber(article.citacoes)} citações</p><button type="button" class="btn btn-outline-primary article-open" data-article-id="${Number(article.id)}">Ver publicação</button>`;
  }

  function drawStats(articles, researchers, filters) {
    $('#statArtigos').textContent = fmtNumber(articles.length);
    $('#statPesquisadores').textContent = fmtNumber(researchers.length);
    $('#statTemas').textContent = fmtNumber(filters.temas.length);
    $('#statCitacoes').textContent = fmtNumber(articles.reduce((sum, a) => sum + Number(a.citacoes || 0), 0));
    $('#articleTotalLabel').textContent = `${fmtNumber(articles.length)} estudos disponíveis`;
    $('#researcherTotalLabel').textContent = `${fmtNumber(researchers.length)} perfis disponíveis`;
  }

  function drawTopics(articles) {
    const counts = new Map();
    articles.forEach((article) => counts.set(article.tema, (counts.get(article.tema) || 0) + 1));
    const topics = [...counts.entries()].sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 8);
    $('#topicsGrid').innerHTML = topics.map(([theme, count]) => `<div class="col-sm-6 col-lg-3"><button type="button" class="topic-card topic-open" data-theme="${escapeHtml(theme)}"><strong>${escapeHtml(theme)}</strong><small>${fmtNumber(count)} ${count === 1 ? 'publicação' : 'publicações'}</small></button></div>`).join('');
  }

  function drawArticleCard(article) {
    const mainAuthor = article.autorPrincipal?.nome || article.autores?.[0]?.nome || '';
    return `<div class="col-md-6"><article class="article-card">
      <div class="article-card-body"><p class="article-topic">${escapeHtml(article.tema)}</p><div class="article-top-meta">${fmtDate(article.dataLancamento)} · ${fmtNumber(article.citacoes)} citações</div><h3>${escapeHtml(article.titulo)}</h3>
        <p class="article-summary">${escapeHtml(article.resumo)}</p>
        <div class="article-footer"><span class="article-author" title="${escapeHtml(mainAuthor)}">${escapeHtml(mainAuthor)}</span><button type="button" class="btn btn-sm btn-outline-primary article-open" aria-label="Ler: ${escapeHtml(article.titulo)}" data-article-id="${Number(article.id)}">Ver detalhes</button></div>
      </div></article></div>`;
  }

  function makePagination(selector, page, pages, group) {
    const node = $(selector);
    if (pages <= 1) { node.innerHTML = ''; return; }
    const navItem = (label, n, disabled, active, aria) => `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}"><button type="button" class="page-link" data-page-group="${group}" data-page="${n}" ${disabled ? 'disabled' : ''} ${active ? 'aria-current="page"' : ''} aria-label="${escapeHtml(aria || label)}">${label}</button></li>`;
    const pageNumbers = [...new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))].sort((a, b) => a - b);
    let buttons = navItem('&lsaquo;', page - 1, page === 1, false, 'Página anterior');
    pageNumbers.forEach((n, i) => { if (i > 0 && n > pageNumbers[i - 1] + 1) buttons += '<li class="page-ellipsis" aria-hidden="true">…</li>'; buttons += navItem(String(n), n, false, n === page, `Página ${n}`); });
    buttons += navItem('&rsaquo;', page + 1, page >= pages, false, 'Próxima página');
    node.innerHTML = buttons;
  }

  async function loadArticles(scroll = false) {
    const current = ++state.articleRequest;
    $('#articleGrid').innerHTML = startLoading('Buscando publicações...');
    $('#articleResultCount').textContent = 'Consultando biblioteca...';
    $('#articlePagination').innerHTML = '';
    try {
      const result = await api.artigos.listar(state.artigos);
      if (current !== state.articleRequest) return;
      $('#articleGrid').innerHTML = result.results.map(drawArticleCard).join('');
      const first = (state.artigos.pagina - 1) * state.artigos.porPagina + 1;
      const last = Math.min(state.artigos.pagina * state.artigos.porPagina, result.info.count);
      $('#articleResultCount').innerHTML = `Exibindo <strong>${first}–${last}</strong> de <strong>${result.info.count}</strong> publicações`;
      makePagination('#articlePagination', state.artigos.pagina, result.info.pages, 'artigos');
    } catch (err) {
      if (current !== state.articleRequest) return;
      $('#articlePagination').innerHTML = '';
      if (err.status === 404) {
        $('#articleGrid').innerHTML = blankState('Nenhuma publicação encontrada', 'Tente outro termo ou remova um dos filtros.', 'articles');
        $('#articleResultCount').textContent = '0 resultados encontrados';
      } else {
        $('#articleGrid').innerHTML = errorState('Não foi possível carregar as publicações. Atualize a página para tentar novamente.');
        $('#articleResultCount').textContent = 'Erro na consulta';
        console.error('Falha ao consultar artigos:', err);
      }
    }
    if (scroll) $('#publicacoes').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function drawResearcherCard(person) {
    const areas = person.areas.slice(0, 2).map((a) => `<span class="person-area">${escapeHtml(a)}</span>`).join('');
    return `<div class="col-md-6 col-xl-3"><article class="researcher-card">
      <span class="researcher-label">${escapeHtml(person.titulacao)}</span><h3 class="researcher-name">${escapeHtml(person.nome)}</h3>
      <p class="researcher-line">${escapeHtml(person.linhaPesquisa)}</p><div class="person-area-list">${areas}</div>
      <div class="person-stats"><span>${fmtNumber(person.metricas.totalArtigos)} artigos</span><span>${fmtNumber(person.metricas.totalCitacoes)} citações</span></div>
      <button type="button" class="btn btn-sm btn-outline-primary person-open" data-person-id="${Number(person.id)}" aria-label="Ver perfil de ${escapeHtml(person.nome)}">Ver perfil</button>
    </article></div>`;
  }

  async function loadResearchers(scroll = false) {
    const current = ++state.personRequest;
    $('#researcherGrid').innerHTML = startLoading('Buscando pesquisadores...');
    $('#researcherPagination').innerHTML = '';
    try {
      const result = await api.pesquisadores.listar(state.pesquisadores);
      if (current !== state.personRequest) return;
      $('#researcherGrid').innerHTML = result.results.map(drawResearcherCard).join('');
      makePagination('#researcherPagination', state.pesquisadores.pagina, result.info.pages, 'pesquisadores');
    } catch (err) {
      if (current !== state.personRequest) return;
      if (err.status === 404) $('#researcherGrid').innerHTML = blankState('Nenhum pesquisador encontrado', 'Ajuste a pesquisa ou selecione outra área.', 'researchers');
      else { $('#researcherGrid').innerHTML = errorState('Não foi possível carregar os pesquisadores.'); console.error('Falha ao consultar pesquisadores:', err); }
    }
    if (scroll) $('#pesquisadores').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bodyMarkdown(text) {
    return String(text || '').split(/\r?\n/).reduce((acc, raw) => {
      const line = raw.trim();
      if (!line) return acc;
      if (/^#{1,3} /.test(line)) acc.push(`<h3>${escapeHtml(line.replace(/^#{1,3} /, ''))}</h3>`);
      else if (/^[-*] /.test(line)) acc.push(`<p>• ${escapeHtml(line.slice(2))}</p>`);
      else acc.push(`<p>${escapeHtml(line)}</p>`);
      return acc;
    }, []).join('');
  }

  function showModalLoading() {
    $('#detailModalBody').innerHTML = `<div class="load-state"><div class="spinner-border text-success spinner-border-sm me-2" role="status"></div>Preparando os detalhes do acervo...</div>`;
    bootstrap.Modal.getOrCreateInstance($('#detailModal')).show();
  }

  async function openArticle(id) {
    const current = ++state.modalRequest;
    showModalLoading();
    try {
      const article = await api.artigos.porId(id);
      const people = await api.seguir(article.pesquisadores);
      if (current !== state.modalRequest) return;
      const authors = people.map((p) => `<button type="button" class="related-person person-open" data-person-id="${Number(p.id)}">${avatarHtml(p)}<span><strong>${escapeHtml(p.nome)}</strong><small>${escapeHtml(p.titulacao)} · ${fmtNumber(p.metricas.totalArtigos)} artigos</small></span></button>`).join('');
      const tags = article.palavrasChave.map((tag) => `<span class="badge rounded-pill">${escapeHtml(tag)}</span>`).join('');
      $('#detailModalBody').innerHTML = `<div class="row g-4"><div class="col-lg-8">
        <p class="modal-kicker">${escapeHtml(article.tema)} · ${escapeHtml(typeName(article.tipo))}</p>
        <h2 class="detail-title" id="detailModalTitle">${escapeHtml(article.titulo)}</h2>
        <div class="detail-meta"><span>${fmtDate(article.dataLancamento)}</span><span>${escapeHtml(article.veiculo)}</span><span>${fmtNumber(article.citacoes)} citações</span></div>
        <div class="detail-abstract"><strong>RESUMO DA PUBLICAÇÃO</strong>${escapeHtml(article.resumo)}</div>
        <div class="detail-paper">${bodyMarkdown(article.conteudo)}</div>
        <div class="detail-tags">${tags}</div>
      </div><aside class="col-lg-4"><div class="detail-side"><h4>Pesquisadores envolvidos</h4>${authors}
        <div class="detail-divider"></div><h4>Ficha da publicação</h4>
        <p><strong>Tipo:</strong> ${escapeHtml(typeName(article.tipo))}<br><strong>Ano:</strong> ${escapeHtml(article.ano)}<br><strong>Veículo:</strong> ${escapeHtml(article.veiculo)}<br><strong>Páginas:</strong> ${escapeHtml(article.paginas)}<br><strong>Status:</strong> ${escapeHtml(article.status)}</p>
        <button type="button" class="btn btn-outline-secondary detail-action-btn copy-citation" data-article-id="${Number(article.id)}">Copiar referência</button></div></aside></div>`;
      $('#detailModalBody').scrollTop = 0;
    } catch (err) {
      if (current !== state.modalRequest) return;
      $('#detailModalBody').innerHTML = errorState('Não foi possível abrir a publicação.');
      console.error('Falha no detalhe do artigo:', err);
    }
  }

  async function openResearcher(id) {
    const current = ++state.modalRequest;
    showModalLoading();
    try {
      const person = await api.pesquisadores.porId(id);
      const articles = await api.seguir(person.artigos);
      if (current !== state.modalRequest) return;
      const cards = articles.map((a) => `<button type="button" class="related-article article-open" data-article-id="${Number(a.id)}"><span>${escapeHtml(a.titulo)}<small>${escapeHtml(a.tema)} · ${escapeHtml(a.ano)}</small></span></button>`).join('');
      $('#detailModalBody').innerHTML = `<div class="row g-4"><div class="col-lg-8"><div class="profile-detail-top">${avatarHtml(person)}<div><p class="modal-kicker">PESQUISADOR(A) · ${escapeHtml(person.titulacao)}</p><h2 class="detail-title" id="detailModalTitle">${escapeHtml(person.nome)}</h2><div class="detail-meta"><span>${escapeHtml(person.cargo)}</span><span>${escapeHtml(person.instituicao)}</span></div></div></div>
        <p class="profile-bio">${escapeHtml(person.bio)}</p><div class="detail-divider"></div>
        <h3 class="fs-6 fw-bold mb-2">Linha de pesquisa</h3><p class="profile-bio mb-2">${escapeHtml(person.linhaPesquisa)}</p>
        <div class="detail-tags">${person.areas.map((a) => `<span class="badge rounded-pill">${escapeHtml(a)}</span>`).join('')}</div>
        <div class="detail-divider"></div><h3 class="fs-6 fw-bold mb-3">Publicações relacionadas</h3>${cards || '<p class="profile-bio">Nenhuma publicação relacionada.</p>'}
      </div><aside class="col-lg-4"><div class="detail-side"><h4>Indicadores acadêmicos</h4><div class="mini-metrics"><div class="mini-metric"><strong>${fmtNumber(person.metricas.totalArtigos)}</strong><small>Artigos</small></div><div class="mini-metric"><strong>${fmtNumber(person.metricas.totalCitacoes)}</strong><small>Citações</small></div><div class="mini-metric"><strong>${fmtNumber(person.metricas.indiceH)}</strong><small>Índice H</small></div></div>
      <p><strong>Instituição:</strong> ${escapeHtml(person.instituicao)}<br><strong>Titulação:</strong> ${escapeHtml(person.titulacao)}<br><strong>Ingresso:</strong> ${fmtDate(person.ingresso)}<br><strong>Contato:</strong> <a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a></p></div></aside></div>`;
      $('#detailModalBody').scrollTop = 0;
    } catch (err) {
      if (current !== state.modalRequest) return;
      $('#detailModalBody').innerHTML = errorState('Não foi possível abrir o perfil.');
      console.error('Falha no detalhe do pesquisador:', err);
    }
  }

  async function copyCitation(id) {
    try {
      const a = await api.artigos.porId(id);
      const citation = `${a.autores.map((x) => x.nome).join('; ')}. ${a.titulo}. ${a.veiculo}, ${a.ano}.`;
      if (navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(citation);
      else {
        const text = document.createElement('textarea'); text.value = citation;
        text.style.position = 'fixed'; text.style.opacity = '0'; document.body.appendChild(text); text.select();
        const copied = document.execCommand('copy');
        text.remove();
        if (!copied) throw new Error('A cópia não foi autorizada');
      }
      $('#toastText').textContent = 'Referência copiada para a área de transferência.';
    } catch (err) { $('#toastText').textContent = 'Não foi possível copiar automaticamente.'; }
    bootstrap.Toast.getOrCreateInstance($('#copyToast'), { delay: 3200 }).show();
  }

  function clearArticles() {
    Object.assign(state.artigos, { pagina: 1, q: '', tema: '', ano: '', tipo: '', ordenar: 'recentes' });
    $('#articleSearch').value = ''; $('#articleTheme').value = ''; $('#articleYear').value = ''; $('#articleType').value = ''; $('#articleOrder').value = 'recentes';
    loadArticles();
  }
  function clearResearchers() {
    Object.assign(state.pesquisadores, { pagina: 1, q: '', area: '', ordenar: 'nome' });
    $('#researcherSearch').value = ''; $('#researcherArea').value = ''; $('#researcherOrder').value = 'nome';
    loadResearchers();
  }

  function debounce(fn, wait = 260) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; }
  function attachEvents() {
    $('#articleSearch').addEventListener('input', debounce((ev) => { state.artigos.q = ev.target.value.trim(); state.artigos.pagina = 1; loadArticles(); }));
    [['articleTheme', 'tema'], ['articleYear', 'ano'], ['articleType', 'tipo'], ['articleOrder', 'ordenar']].forEach(([id, key]) => {
      $('#' + id).addEventListener('change', (ev) => { state.artigos[key] = ev.target.value; state.artigos.pagina = 1; loadArticles(); });
    });
    $('#clearArticleFilters').addEventListener('click', clearArticles);
    $('#researcherSearch').addEventListener('input', debounce((ev) => { state.pesquisadores.q = ev.target.value.trim(); state.pesquisadores.pagina = 1; loadResearchers(); }));
    [['researcherArea', 'area'], ['researcherOrder', 'ordenar']].forEach(([id, key]) => {
      $('#' + id).addEventListener('change', (ev) => { state.pesquisadores[key] = ev.target.value; state.pesquisadores.pagina = 1; loadResearchers(); });
    });
    document.addEventListener('click', (ev) => {
      const article = ev.target.closest('.article-open');
      if (article) { ev.preventDefault(); openArticle(Number(article.dataset.articleId)); return; }
      const person = ev.target.closest('.person-open');
      if (person) { ev.preventDefault(); openResearcher(Number(person.dataset.personId)); return; }
      const theme = ev.target.closest('.topic-open');
      if (theme) { state.artigos.tema = theme.dataset.theme; state.artigos.pagina = 1; $('#articleTheme').value = state.artigos.tema; loadArticles(true); return; }
      const p = ev.target.closest('[data-page-group]');
      if (p && !p.disabled) {
        const group = p.dataset.pageGroup; const page = Number(p.dataset.page);
        if (group === 'artigos') { state.artigos.pagina = page; loadArticles(true); }
        else { state.pesquisadores.pagina = page; loadResearchers(true); }
        return;
      }
      if (ev.target.closest('.reset-articles')) { clearArticles(); return; }
      if (ev.target.closest('.reset-researchers')) { clearResearchers(); return; }
      const citation = ev.target.closest('.copy-citation');
      if (citation) copyCitation(Number(citation.dataset.articleId));
    });
  }

  async function initialize() {
    attachEvents();
    try {
      const [articleResponse, researcherResponse, filters] = await Promise.all([
        api.artigos.listar({ porPagina: 100, ordenar: 'recentes' }),
        api.pesquisadores.listar({ porPagina: 100, ordenar: 'nome' }),
        api.filtros(),
      ]);
      fillOptions($('#articleTheme'), filters.temas);
      fillOptions($('#articleYear'), filters.anos);
      fillOptions($('#articleType'), filters.tipos, typeName);
      fillOptions($('#researcherArea'), filters.areas);
      drawStats(articleResponse.results, researcherResponse.results, filters);
      drawHero(articleResponse.results);
      drawTopics(articleResponse.results);
    } catch (err) {
      console.error('Erro ao preparar o portal GEPISEG:', err);
      $('#heroFeatured').innerHTML = '<div class="alert alert-warning">Não foi possível iniciar o portal. Confira se os arquivos js/dados.js e js/gepiseg-api.js estão presentes.</div>';
      $('#topicsGrid').innerHTML = errorState('Não foi possível carregar os temas.');
    }
    await Promise.all([loadArticles(), loadResearchers()]);
  }

  initialize();
})();
