

(function (global) {
  'use strict';

  

  function ErroApi(status, mensagem) {
    const e = new Error(mensagem);
    e.name = 'ErroApi';
    e.status = status;
    e.corpo = { error: mensagem };
    return e;
  }

  
  const NADA_AQUI = 'Não há nada aqui';

  

  
  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function contem(texto, alvo) {
    return normalizar(texto).indexOf(normalizar(alvo)) !== -1;
  }

  
  function copiar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  
  function distintos(lista, pegar) {
    const vistos = Object.create(null);
    lista.forEach(function (item) {
      const v = pegar(item);
      (Array.isArray(v) ? v : [v]).forEach(function (x) {
        if (x !== null && x !== undefined && x !== '') vistos[x] = true;
      });
    });
    return Object.keys(vistos).sort(function (a, b) {
      return a.localeCompare(b, 'pt-BR');
    });
  }

  
  function idDaRef(ref) {
    if (ref && typeof ref === 'object' && ref.url) ref = ref.url;
    const ultimo = String(ref).split('/').pop();
    const n = parseInt(ultimo, 10);
    return isNaN(n) ? null : n;
  }

  
  function queryDe(filtros, pagina) {
    const partes = ['page=' + pagina];
    Object.keys(filtros).forEach(function (chave) {
      if (chave === 'page' || chave === 'pagina' || chave === 'porPagina') return;
      const v = filtros[chave];
      if (v === undefined || v === null || v === '') return;
      partes.push(encodeURIComponent(chave) + '=' + encodeURIComponent(v));
    });
    return '?' + partes.join('&');
  }

  

  const ORDENS_ARTIGO = {
    recentes: function (a, b) { return b.dataLancamento.localeCompare(a.dataLancamento); },
    antigos: function (a, b) { return a.dataLancamento.localeCompare(b.dataLancamento); },
    citacoes: function (a, b) { return b.citacoes - a.citacoes; },
    titulo: function (a, b) { return a.titulo.localeCompare(b.titulo, 'pt-BR'); },
  };

  const ORDENS_PESQUISADOR = {
    nome: function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); },
    artigos: function (a, b) { return b.metricas.totalArtigos - a.metricas.totalArtigos; },
    citacoes: function (a, b) { return b.metricas.totalCitacoes - a.metricas.totalCitacoes; },
  };

  

  function filtrarArtigos(artigos, f) {
    let r = artigos.slice();

    if (f.q) {
      r = r.filter(function (a) {
        return (
          contem(a.titulo, f.q) ||
          contem(a.resumo, f.q) ||
          contem(a.tema, f.q) ||
          contem(a.veiculo, f.q) ||
          a.palavrasChave.some(function (p) { return contem(p, f.q); }) ||
          a.autores.some(function (p) { return contem(p.nome, f.q); })
        );
      });
    }

    if (f.pesquisador !== undefined && f.pesquisador !== '') {
      const alvo = idDaRef(f.pesquisador);
      r = r.filter(function (a) {
        return a.pesquisadores.some(function (ref) { return idDaRef(ref) === alvo; });
      });
    }

    if (f.autorPrincipal !== undefined && f.autorPrincipal !== '') {
      const alvo = idDaRef(f.autorPrincipal);
      r = r.filter(function (a) { return idDaRef(a.autorPrincipal.url) === alvo; });
    }

    if (f.tema) r = r.filter(function (a) { return contem(a.tema, f.tema); });
    if (f.veiculo) r = r.filter(function (a) { return contem(a.veiculo, f.veiculo); });
    if (f.tipo) r = r.filter(function (a) { return a.tipo === f.tipo; });
    if (f.status) r = r.filter(function (a) { return a.status === f.status; });

    if (f.palavraChave) {
      r = r.filter(function (a) {
        return a.palavrasChave.some(function (p) { return contem(p, f.palavraChave); });
      });
    }

    if (f.ano) {
      const ano = parseInt(f.ano, 10);
      r = r.filter(function (a) { return a.ano === ano; });
    }
    if (f.de) r = r.filter(function (a) { return a.dataLancamento >= f.de; });
    if (f.ate) r = r.filter(function (a) { return a.dataLancamento <= f.ate; });

    if (f.citacoesMinimas) {
      const min = parseInt(f.citacoesMinimas, 10);
      r = r.filter(function (a) { return a.citacoes >= min; });
    }

    r.sort(ORDENS_ARTIGO[f.ordenar] || ORDENS_ARTIGO.recentes);
    return r;
  }

  function filtrarPesquisadores(pesquisadores, f) {
    let r = pesquisadores.slice();

    if (f.q) {
      r = r.filter(function (p) {
        return (
          contem(p.nome, f.q) ||
          contem(p.bio, f.q) ||
          contem(p.linhaPesquisa, f.q) ||
          p.areas.some(function (a) { return contem(a, f.q); })
        );
      });
    }

    if (f.nome) r = r.filter(function (p) { return contem(p.nome, f.nome); });
    if (f.area) {
      r = r.filter(function (p) {
        return p.areas.some(function (a) { return contem(a, f.area); });
      });
    }
    if (f.titulacao) r = r.filter(function (p) { return contem(p.titulacao, f.titulacao); });
    if (f.ativo !== undefined) r = r.filter(function (p) { return p.ativo === f.ativo; });

    r.sort(ORDENS_PESQUISADOR[f.ordenar] || ORDENS_PESQUISADOR.nome);
    return r;
  }

  

  
  function criar(opcoes) {
    opcoes = opcoes || {};

    const base = opcoes.dados || global.GEPISEG_DADOS;
    if (!base || !base.pesquisadores || !base.artigos) {
      throw new Error(
        'Dados não encontrados. Inclua <script src="dados.js"></script> antes ' +
          'deste arquivo, ou use GepisegAPI.carregar().',
      );
    }

    const atraso = opcoes.atrasoMs === undefined ? 120 : opcoes.atrasoMs;

    
    const ARQUIVO_COLECAO = {
      pesquisador: 'json/pesquisadores.json',
      artigo: 'json/artigos.json',
    };
    const PESQUISADORES = base.pesquisadores;
    const ARTIGOS = base.artigos;

    function responder(valor) {
      return new Promise(function (resolve) {
        if (atraso > 0) setTimeout(function () { resolve(valor); }, atraso);
        else resolve(valor);
      });
    }

    function recusar(erro) {
      return new Promise(function (_resolve, reject) {
        if (atraso > 0) setTimeout(function () { reject(erro); }, atraso);
        else reject(erro);
      });
    }

    
    function envelopar(recurso, achados, filtros) {
      const porPagina = Math.min(100, Math.max(1, parseInt(filtros.porPagina, 10) || 12));
      const paginas = Math.max(1, Math.ceil(achados.length / porPagina));
      const pagina = Math.min(paginas, Math.max(1, parseInt(filtros.pagina || filtros.page, 10) || 1));
      const inicio = (pagina - 1) * porPagina;

      return {
        info: {
          count: achados.length,
          pages: paginas,
          next: pagina < paginas
            ? ARQUIVO_COLECAO[recurso] + queryDe(filtros, pagina + 1)
            : null,
          prev: pagina > 1
            ? ARQUIVO_COLECAO[recurso] + queryDe(filtros, pagina - 1)
            : null,
        },
        results: copiar(achados.slice(inicio, inicio + porPagina)),
      };
    }

    
    function idsDe(entrada) {
      const bruto = Array.isArray(entrada) ? entrada : String(entrada).split(',');
      return bruto.map(function (x) { return idDaRef(String(x).trim()); });
    }

    function buscarUm(colecao, id) {
      return colecao.find(function (r) { return r.id === id; });
    }

    
    function porId(colecao, entrada, nomeRecurso) {
      const ids = idsDe(entrada);

      if (ids.some(function (n) { return n === null; })) {
        return recusar(ErroApi(404, nomeRecurso + ' não encontrado'));
      }

      const achados = ids.map(function (id) { return buscarUm(colecao, id); });
      if (achados.some(function (a) { return !a; })) {
        return recusar(ErroApi(404, nomeRecurso + ' não encontrado'));
      }

      return responder(ids.length === 1 ? copiar(achados[0]) : copiar(achados));
    }

    function listar(colecao, filtrar, recurso, filtros) {
      filtros = filtros || {};
      const achados = filtrar(colecao, filtros);
      if (achados.length === 0) return recusar(ErroApi(404, NADA_AQUI));
      return responder(envelopar(recurso, achados, filtros));
    }

    return {
      pesquisadores: {
        listar: function (filtros) {
          return listar(PESQUISADORES, filtrarPesquisadores, 'pesquisador', filtros);
        },
        porId: function (entrada) {
          return porId(PESQUISADORES, entrada, 'Pesquisador');
        },
      },

      artigos: {
        listar: function (filtros) {
          return listar(ARTIGOS, filtrarArtigos, 'artigo', filtros);
        },
        porId: function (entrada) {
          return porId(ARTIGOS, entrada, 'Artigo');
        },
      },

      
      seguir: function seguir(ref) {
        if (Array.isArray(ref)) {
          return Promise.all(ref.map(function (r) { return seguir(r); }));
        }

        if (ref && typeof ref === 'object' && ref.url) ref = ref.url;

        const partes = String(ref).split('/');
        const id = idDaRef(partes.pop());
        const tipo = partes.pop();

        if (tipo === 'artigo') return porId(ARTIGOS, id, 'Artigo');
        if (tipo === 'pesquisador') return porId(PESQUISADORES, id, 'Pesquisador');
        return recusar(ErroApi(404, 'Recurso não encontrado'));
      },

      
      filtros: function () {
        return responder({
          temas: distintos(ARTIGOS, function (a) { return a.tema; }),
          veiculos: distintos(ARTIGOS, function (a) { return a.veiculo; }),
          tipos: distintos(ARTIGOS, function (a) { return a.tipo; }),
          palavrasChave: distintos(ARTIGOS, function (a) { return a.palavrasChave; }),
          anos: distintos(ARTIGOS, function (a) { return String(a.ano); }).sort().reverse(),
          areas: distintos(PESQUISADORES, function (p) { return p.areas; }),
          titulacoes: distintos(PESQUISADORES, function (p) { return p.titulacao; }),
        });
      },
    };
  }

  
  function carregar(raiz, opcoes) {
    const dir = (raiz || 'json/').replace(/\/?$/, '/');
    return Promise.all([
      fetch(dir + 'pesquisadores.json').then(function (r) { return r.json(); }),
      fetch(dir + 'artigos.json').then(function (r) { return r.json(); }),
    ]).then(function (partes) {
      return criar(
        Object.assign({}, opcoes, {
          dados: { pesquisadores: partes[0], artigos: partes[1] },
        }),
      );
    });
  }

  global.GepisegAPI = { criar: criar, carregar: carregar };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.GepisegAPI;
  }
})(typeof window !== 'undefined' ? window : globalThis);
