# GEPISEG — Portal de Pesquisa em Segurança Digital

**Trabalho final:** Ferramentas Front-End (Bootstrap) + Extensão — Desenvolvimento de Site  
**Instituição:** UniALFA Umuarama  
**Professor:** Pedro Maia  
**Data de entrega prevista nas instruções:** 04/11/2026

## Como executar

1. Extraia o arquivo ZIP, mantendo **todas as pastas**.
2. Abra o arquivo **`index.html` com dois cliques** (Chrome, Edge ou outro navegador atualizado).
3. Pronto. O portal usa a API simulada por meio dos arquivos JavaScript originais e **não necessita de instalação nem servidor**.

O Bootstrap **5.3.6 foi incluído localmente**, para que os estilos e componentes funcionem mesmo sem conexão. As imagens de capas e avatares são fornecidas como URLs externas nos dados originais; sem internet, o site exibe fundos coloridos e iniciais.

## Funcionalidades desenvolvidas

- Página inicial com publicações em destaque e indicadores calculados a partir da biblioteca.
- Filtros por pesquisa livre, tema, ano e tipo de publicação.
- Ordenação de artigos por data, citações e título.
- Paginação de artigos e de pesquisadores.
- Seleção visual de temas com quantidade de publicações.
- Perfis de pesquisadores: linhas de pesquisa, biografias, indicadores e artigos relacionados.
- Detalhes completos de publicações, incluindo conteúdo e autores relacionados.
- Navegação entre autores e artigos usando **`api.seguir()`**.
- Botão para copiar uma referência bibliográfica construída a partir dos dados da API.
- Layout adaptado a celulares, tablets e computadores.
- Estados de carregamento, ausência de resultados e falha de consulta.

## Bibliotecas e arquivos

```
index.html                      Página do site
css/style.css                   Estilos autorais
js/app.js                       Integração e interface implementadas
js/dados.js                     ORIGINAL do professor — NÃO ALTERADO
js/gepiseg-api.js               ORIGINAL do professor — NÃO ALTERADO
vendor/bootstrap/              Bootstrap 5.3.6 (CSS e JS com bundle)
json/                           Arquivos JSON originais (material de apoio)
assets/favicon.svg              Ícone original do portal
```

O funcionamento usa `GepisegAPI.criar()` e os métodos:

| Função da biblioteca | Para que foi usada |
|---|---|
| `api.artigos.listar(filtros)` | Buscar, filtrar, ordenar e paginar publicações. |
| `api.artigos.porId(id)` | Exibir a publicação selecionada. |
| `api.pesquisadores.listar(filtros)` | Buscar, filtrar, ordenar e paginar pesquisadores. |
| `api.pesquisadores.porId(id)` | Exibir perfil e métricas individuais. |
| `api.seguir(ref)` | Obter autores de artigos e artigos dos pesquisadores. |
| `api.filtros()` | Preencher seletores de temas, anos, tipos e áreas. |

**Nota:** Dados acadêmicos dos pesquisadores e artigos são fictícios, gerados para a atividade, conforme o `LEIAME.md` original do professor. Esta interface não representa uma pesquisa acadêmica real.

## Critérios do enunciado

| Critério da disciplina | Implementação |
|---|---|
| Bootstrap corretamente configurado | Bootstrap v5.3.6, CSS/JS no diretório `vendor/bootstrap/` |
| Pelo menos 5 componentes | Navbar, Card, Button, Modal, Carousel, Badge, Pagination, Form, Alert, Toast, Spinner |
| Grid `row` e `col` | Seções hero, estatísticas, cards, áreas e pesquisadores |
| CSS próprio e visual personalizado | `css/style.css`, cores, responsividade e componentes autorais |
| Biblioteca JavaScript fornecida | Scripts originais importados e utilizados via `GepisegAPI` |
| Todas as informações do acervo vindas da biblioteca | Artigos, pesquisadores, destaques, filtros, temas, métricas e detalhes acessados pela API |
| JavaScript fornecido não alterado | Cópia binária intacta de `dados.js` e `gepiseg-api.js` |
| Exibição visual organizada | Portal de pesquisa em seções com interação, filtros e detalhes |

## Informações para o envio

**Preencher no e-mail ao professor:** nome completo de cada integrante do grupo (máximo de 3), identificação da turma (caso solicitada) e o arquivo ZIP anexado.

## Créditos

- API simulada GEPISEG, dados e documentação-base: material didático disponibilizado pelo professor.
- Bootstrap v5.3.6 © The Bootstrap Authors (licença MIT, https://github.com/twbs/bootstrap/blob/main/LICENSE).
- Interface, estilos e integração: implementação específica deste trabalho.
