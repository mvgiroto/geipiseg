# GEPISEG — abrir e executar no Visual Studio Code

O projeto **já está pronto**: não é necessário criar arquivos, instalar Node.js, PHP ou executar comandos no terminal.

## 1. Abrir no VS Code

1. Extraia o arquivo `GEPISEG_Projeto_VSCode.zip`.
2. Abra a pasta extraída **`GEPISEG_Projeto_VSCode`**.
3. Clique com o botão direito dentro da pasta e escolha **Abrir com Code**, se essa opção estiver disponível.
   - Alternativa: abra o **Visual Studio Code**, selecione **Arquivo > Abrir Pasta...** e escolha a pasta `GEPISEG_Projeto_VSCode`.
   - Você também pode abrir `GEPISEG.code-workspace` pelo VS Code (Arquivo > Abrir Área de Trabalho do Arquivo...).
4. Se o VS Code perguntar se você confia nos arquivos da pasta, confirme **somente se baixou este projeto da fonte esperada**.

## 2. Rodar e ver o site

**Opção A — sem instalar extensões (recomendada para testar rapidamente):**
- No painel do VS Code, clique com o botão direito em `index.html` e use **Reveal in File Explorer / Revelar no Explorador de Arquivos**.
- Abra `index.html` com **Microsoft Edge** ou **Google Chrome**.
- O site deve carregar porque a API simulada e o Bootstrap já estão inclusos localmente.

**Opção B — com pré-visualização automática no VS Code:**
- Instale a extensão **Live Server** (Ritwick Dey), sugerida pelo próprio projeto.
- Abra `index.html` no editor e clique em **Go Live** na barra inferior (ou clique direito > **Open with Live Server**).
- O endereço padrão será `http://127.0.0.1:5500/` quando a porta estiver disponível. Se estiver ocupada, a extensão poderá usar outra.
- Ao salvar alterações em HTML/CSS/JS, o navegador atualizará automaticamente.

**Opção C — depurar com F5:**
- No VS Code, abra **Executar e Depurar** (`Ctrl+Shift+D`).
- Escolha **Visualizar GEPISEG (Microsoft Edge)** ou **Visualizar GEPISEG (Google Chrome)** e pressione `F5`.
- É necessário ter o navegador correspondente instalado. As duas configurações usam o arquivo `index.html`, sem servidor.

## 3. Onde editar

| Arquivo ou pasta | Uso |
| --- | --- |
| `index.html` | Conteúdo estático e estrutura Bootstrap. |
| `css/style.css` | Cores, fontes, espaçamento e design. |
| `js/app.js` | Lógica da interface e chamadas da biblioteca simulada. |
| `js/dados.js` | **Original do professor — NÃO EDITAR.** |
| `js/gepiseg-api.js` | **Original do professor — NÃO EDITAR.** |
| `vendor/bootstrap/` | Bootstrap 5 incluído localmente. |
| `json/` | Arquivos de dados de apoio originais. |
| `.vscode/` | Configurações de execução para VS Code. |

## 4. Para entregar ao professor

- Entregue o projeto inteiro compactado em ZIP, mantendo as subpastas.
- O arquivo `GEPISEG_Projeto_VSCode.zip` já contém tudo necessário.
- Informe no e-mail os nomes dos integrantes (máximo de 3), conforme instruções.
- Prazo do documento disponibilizado: **04/11/2026**.

> Não precisa executar `npm install`. Este site foi construído em HTML, CSS e JavaScript sem etapa de compilação.
> Se imagens externas não carregarem sem internet, o layout contém alternativas visuais.
