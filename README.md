# Gestor de Desejos e Parcelamentos

O Gestor de Desejos e Parcelamentos é um aplicativo desktop projetado para ajudar usuários a organizar sua lista de
desejos de compras, acompanhar o histórico de cotações de preços de produtos em lojas online e gerenciar
informações sobre pagamentos parcelados. O principal problema que resolve é a dificuldade em centralizar informações
de compras desejadas, monitorar variações de preço ao longo do tempo e manter um controle claro sobre parcelamentos
ativos.

## Funcionalidades Principais

*   **Gerenciamento da Lista de Desejos:** Adicione, visualize, edite e remova produtos que você deseja comprar.
*   **Controle de Parcelamentos:** Registre e acompanhe seus pagamentos parcelados.
*   **Histórico de Cotações:** Monitore os preços dos produtos desejados ao longo do tempo (requer implementação dos
    scrapers).
*   **Consulta Manual de Preços:** Busque preços de produtos em tempo real (requer implementação dos scrapers).
*   **Configurações Personalizadas:** Ajuste as configurações do aplicativo, como CEP para cotações.
*   **Notificações Desktop:** Receba alertas sobre atualizações importantes (ex: novas ofertas encontradas).
*   **Logging Detalhado:** Registros de atividades e erros para facilitar o diagnóstico de problemas.

## Como Instalar e Rodar o Projeto

Siga os passos abaixo para configurar e executar o Gestor de Desejos em seu ambiente de desenvolvimento.

**Pré-requisitos:**

*   Node.js (que inclui npm) instalado em seu sistema. Você pode baixá-lo em [https://nodejs.org/](https://nodejs.org/).

**Passos:**

1.  **Clone o Repositório (se ainda não o fez):**
    ```bash
    git clone <URL_DO_REPOSITORIO_AQUI>
    cd <NOME_DA_PASTA_DO_PROJETO>
    ```
2.  **Instale as Dependências:**
    Abra um terminal na pasta raiz do projeto e execute o comando:
    ```bash
    npm install
    ```
    Este comando irá baixar e instalar todas as dependências listadas no arquivo `package.json`.
3.  **Execute o Aplicativo em Modo de Desenvolvimento:**
    Após a instalação das dependências, execute o seguinte comando para iniciar o aplicativo:
    ```bash
    npm start
    ```
    Isso deve abrir a janela principal do aplicativo Electron.

## Como Usar o Aplicativo

Esta seção descreve como realizar as operações básicas no Gestor de Desejos e Parcelamentos.

1.  **Adicionar um Item à Lista de Desejos:**
    *   Navegue até a aba "Lista de Desejos".
    *   Preencha os campos como nome do produto, URL (opcional para referência) e defina a prioridade.
    *   Clique no botão "Adicionar Desejo". O item aparecerá na lista.
2.  **Consultar Preços de Itens da Lista de Desejos:**
    *   Vá para a aba "Consulta Manual".
    *   Sua lista de desejos será exibida. Selecione os itens para os quais deseja buscar preços.
    *   Clique em "Buscar Ofertas Selecionadas".
    *   Um indicador de carregamento aparecerá enquanto a busca é realizada.
    *   Os resultados (ofertas encontradas) serão exibidos na tabela da aba "Consulta Manual" e também armazenados na
        aba "Histórico de Cotações".
3.  **Visualizar Histórico de Cotações:**
    *   Acesse a aba "Histórico de Cotações".
    *   Você verá uma tabela com todos os resultados de buscas de preços realizadas anteriormente.
4.  **Gerenciar Parcelamentos:**
    *   Navegue até a aba "Parcelamentos".
    *   Para adicionar um novo parcelamento, preencha os detalhes como nome do item, valor total, número de parcelas,
        etc.
    *   Clique em "Adicionar Parcelamento".
    *   Você pode visualizar e remover parcelamentos existentes nesta aba.
5.  **Ajustar Configurações:**
    *   Vá para a aba "Configurações".
    *   Aqui você pode definir informações como seu CEP (para futuras cotações de frete, se implementado) ou outras
        preferências do aplicativo.
    *   Clique em "Salvar Configurações" após fazer alterações.

## Tecnologias Utilizadas

O projeto Gestor de Desejos e Parcelamentos é construído com as seguintes tecnologias:

*   **Plataforma Principal:** Electron (para desenvolvimento de aplicativos desktop multiplataforma com HTML, CSS e
    JavaScript)
*   **Linguagem de Programação (Backend e Frontend):** JavaScript (executando no ambiente Node.js para o backend)
*   **Interface do Usuário (Frontend):** HTML5, CSS3, JavaScript
*   **Framework CSS:** Tailwind CSS (para estilização da interface)
*   **Banco de Dados:** SQLite (através da biblioteca `better-sqlite3` para persistência de dados local)
*   **Web Scraping:** Playwright (planejado para coleta de dados de preços online - implementação a cargo do usuário)
*   **Logging:** Winston (para registro de eventos e erros da aplicação)
*   **Agendamento de Tarefas:** node-cron (para execuções periódicas de tarefas, como buscas de preços)
*   **Empacotamento e Distribuição:** electron-builder (para criar instaladores)

## Como Contribuir

Contribuições para o Gestor de Desejos e Parcelamentos são bem-vindas! Se você tem ideias para novas
funcionalidades, correções de bugs ou melhorias na documentação, siga os passos abaixo:

1.  **Fork o Repositório:**
    Crie um fork do projeto para sua conta do GitHub.
2.  **Crie uma Branch para sua Feature/Correção:**
    ```bash
    git checkout -b minha-nova-feature # ou nome-da-correcao
    ```
3.  **Faça suas Alterações:**
    Implemente sua funcionalidade ou correção. Certifique-se de que o código está claro e, se aplicável, adicione
    testes.
4.  **Faça Commit das suas Alterações:**
    ```bash
    git commit -m "Adiciona nova feature X" # ou "Corrige bug Y"
    ```
5.  **Envie suas Alterações para o seu Fork:**
    ```bash
    git push origin minha-nova-feature
    ```
6.  **Abra um Pull Request:**
    Vá para o repositório original no GitHub e abra um Pull Request da sua branch para a branch principal do projeto.
    Descreva suas alterações claramente no Pull Request.

**Questões e Sugestões:**
Se você tiver dúvidas ou sugestões, sinta-se à vontade para abrir uma "Issue" no repositório do GitHub do projeto.

Documentação: Transformando o Protótipo em Aplicativo Electron Funcional Este documento descreve os passos
necessários para converter o protótipo de interface HTML/CSS/JS do "Gestor de Desejos e Parcelamentos" em um
aplicativo desktop Electron completo e funcional, conforme o README.md original do projeto.

1.  O Protótipo Atual da Interface (o que você vê ao lado) O arquivo HTML (gestor_desejos_app_ui) que
    desenvolvemos juntos representa a interface do usuário (frontend) do seu aplicativo. Ele inclui:

    Navegação por Abas: Lista de Desejos, Parcelamentos, Histórico de Cotações, Consulta Manual e Configurações.

    Interatividade Visual:

    Lista de Desejos: Adicionar, visualizar e remover (simuladamente) itens.

    Parcelamentos: Registrar, visualizar e remover (simuladamente) parcelamentos.

    Consulta Manual:

    Botão para disparar uma busca (simulada).

    Exibição de um indicador de carregamento.

    Apresentação de resultados de ofertas fictícias numa tabela.

    Mensagens informativas (ex: lista de desejos vazia).

    Histórico de Cotações: Tabela populada (simuladamente) com os resultados da consulta manual.

    Configurações: Campos para inserir dados e um botão para salvar (simuladamente).

    Design Responsivo Básico: Utiliza Tailwind CSS para uma aparência moderna.

    Comentários para Integração: O código JavaScript do protótipo contém comentários como // Em um app real:
    window.electronAPI.send(...) ou // Em um app real: window.electronAPI.on(...). Estes marcam os pontos onde a
    interface (processo de renderização do Electron) se comunicaria com o processo principal do Electron para executar
    ações reais (salvar no banco de dados, iniciar scraping, etc.).

    Importante: Todas as operações de dados (adicionar, remover, buscar) neste protótipo são simuladas e acontecem
    apenas na memória do navegador. Os dados são perdidos ao recarregar a página. Não há persistência de dados real nem
    scraping web real neste protótipo.

2.  Próximos Passos: Desenvolvendo o Aplicativo Electron Real Para transformar este protótipo visual em um aplicativo
    Electron funcional, você precisará desenvolver o backend e a lógica de integração no ambiente Node.js/Electron.

    2.1. Estrutura do Projeto Electron Uma estrutura típica de projeto Electron incluiria:

    package.json: Define as dependências (Electron, better-sqlite3, playwright, winston, node-cron,
    electron-builder), scripts de execução (start, dist), e metadados do projeto.

    main.js (ou similar): Este é o processo principal do Electron. Ele cria as janelas do navegador (BrowserWindow),
    gerencia o ciclo de vida do aplicativo e lida com toda a lógica de backend e comunicação com o sistema
    operacional.

    preload.js: Um script que roda num contexto privilegiado antes da página web ser carregada na janela. É usado para
    expor APIs do Node.js/Electron de forma segura para o processo de renderização (seu index.html) através de
    contextBridge.

    index.html: O arquivo do protótipo que criamos (será carregado na BrowserWindow).

    Pastas para Módulos:

    src/database/: Módulos para interagir com o banco de dados SQLite.

    src/scraper/: Módulos para a lógica de web scraping com Playwright.

    src/utils/: Utilitários, como o logger.

    assets/: Ícones, etc.

    logs/: Onde os arquivos de log do Winston seriam armazenados.

    2.2. Implementação das Funcionalidades do Backend (no main.js e módulos) A. Banco de Dados (SQLite com
    better-sqlite3)

    Inicialização: No main.js, inicialize a conexão com o banco de dados SQLite. Crie o arquivo do banco se ele não
    existir.

    Schema das Tabelas: Defina e crie as tabelas:

    desejos (id, nome, url, prioridade, data_adicao)

    parcelamentos (id, nome_item, valor_total, total_parcelas, parcelas_pagas, data_inicio)

    historico_cotacoes (id, desejo_id, site, preco, data_busca, url_oferta, detalhes_parcelamento_se_houver)

    configuracoes (chave, valor – ex: 'cep', '01000000')

    Módulos de Acesso a Dados (CRUD): Crie funções JavaScript para:

    Adicionar, ler, atualizar e deletar desejos.

    Adicionar, ler, atualizar e deletar parcelamentos.

    Registrar resultados de cotações no histórico.

    Ler e salvar configurações.

    B. Web Scraping (Playwright)

    Módulos por Site: Crie módulos separados para cada site (Amazon BR, Mercado Livre).

    amazonScraper.js, mercadoLivreScraper.js.

    Funções de Busca: Cada módulo deve ter uma função que recebe um termo de busca (nome do produto) e/ou URL e retorna
    uma lista de ofertas encontradas (nome, preço, URL da oferta, condições de parcelamento se possível).

    Lançamento do Navegador: Use Playwright para lançar um navegador (Chromium headless).

    Navegação e Extração: Use seletores CSS/XPath para encontrar os elementos relevantes nas páginas e extrair os dados.

    Tratamento de Erros: Implemente try-catch para lidar com falhas de rede, mudanças de layout do site, e CAPTCHAs
    (registrar no log quando um CAPTCHA for detectado).

    Gerenciamento de Concorrência: Se for buscar múltiplos itens, gerencie quantas instâncias do Playwright rodam em
    paralelo (conforme a configuração de "Concurrency Scraper").

    C. Comunicação Inter-Processos (IPC) com ipcMain e ipcRenderer

    Esta é a cola entre sua interface (HTML) e o backend (Node.js).

    No preload.js:

    ```javascript
    // Exemplo: preload.js
    const { contextBridge, ipcRenderer } = require('electron');

    contextBridge.exposeInMainWorld('electronAPI', {
        // Desejos
        addDesejo: (desejo) => ipcRenderer.invoke('add-desejo', desejo),
        getDesejos: () => ipcRenderer.invoke('get-desejos'),
        removeDesejo: (id) => ipcRenderer.invoke('remove-desejo', id),
        // Parcelamentos
        addParcelamento: (parc) => ipcRenderer.invoke('add-parcelamento', parc),
        getParcelamentos: () => ipcRenderer.invoke('get-parcelamentos'),
        removeParcelamento: (id) => ipcRenderer.invoke('remove-parcelamento', id),
        // Consulta e Histórico
        buscarOfertasManualmente: (listaDesejos) => ipcRenderer.invoke('buscar-ofertas-manualmente', listaDesejos),
        getHistorico: (filtro) => ipcRenderer.invoke('get-historico', filtro),
        // Configurações
        getConfiguracoes: () => ipcRenderer.invoke('get-configuracoes'),
        saveConfiguracoes: (configs) => ipcRenderer.invoke('save-configuracoes', configs),
        // Para receber atualizações/notificações do main process
        onNotification: (callback) => ipcRenderer.on('main-notification', callback),
    });
    ```

    No main.js (Processo Principal):

    ```javascript
    // Exemplo: main.js
    const { ipcMain } = require('electron');
    // ... import dos seus módulos de DB e Scraper ...

    ipcMain.handle('add-desejo', async (event, desejo) => {
        // Lógica para salvar desejo no DB
        // return resultado (ex: o desejo salvo com ID)
    });
    ipcMain.handle('get-desejos', async () => {
        // Lógica para ler desejos do DB
        // return listaDeDesejos
    });
    ipcMain.handle('buscar-ofertas-manualmente', async (event, listaDesejos) => {
        // Para cada desejo na lista, chamar os scrapers
        // Coletar resultados
        // Salvar no histórico_cotacoes
        // Retornar os resultados para a interface
        // Se uma nova melhor oferta for encontrada, disparar notificação nativa
    });
    // ... outros handlers para parcelamentos, config, etc. ...
    ```

    Na sua Interface (JavaScript do index.html): Substitua as chamadas simuladas pelas chamadas via
    window.electronAPI:

    ```javascript
    // Exemplo: no script do index.html
    // Para adicionar um desejo:
    // const novoDesejo = { nome: 'Produto X', url: '...', prioridade: 'Alta' };
    // const resultado = await window.electronAPI.addDesejo(novoDesejo);
    // renderListaDesejos(); // Atualizar a UI com dados do DB

    // Para buscar ofertas:
    // const resultadosReais = await window.electronAPI.buscarOfertasManualmente(listaDesejos);
    // renderizarResultadosConsulta(resultadosReais);
    ```

    D. Notificações Nativas

    Use a API de Notificações do Electron no main.js para exibir alertas quando uma nova melhor oferta for encontrada.

    E. Agendamento de Tarefas (node-cron)

    No main.js, configure o node-cron para executar a função de busca de ofertas automaticamente com base no padrão
    Cron definido nas configurações.

    Lembre-se da limitação mencionada no README.md sobre a confiabilidade do node-cron em segundo plano.

    F. Logging (Winston)

    Configure o Winston no main.js para registrar atividades, erros do scraper, e exceções em arquivos (app.log,
    exceptions.log).

    2.3. Construindo o Instalador (electron-builder) Configure a seção build no seu package.json.

    Execute npm run dist (ou o script correspondente) para gerar o instalador .exe para Windows.

3.  Minhas Limitações como IA É fundamental entender o que eu, como modelo de linguagem, não posso fazer:

    Executar Código Node.js/Electron: Não tenho um ambiente Node.js ou Electron para rodar o processo principal, o
    preload.js, ou qualquer código de backend.

    Interagir com o Sistema de Arquivos: Não posso criar, ler ou escrever arquivos no seu computador. Isso significa
    que não posso:

    Criar ou gerenciar o banco de dados SQLite real.

    Escrever arquivos de log.

    Salvar configurações localmente.

    Realizar Web Scraping Real: Não posso executar o Playwright para navegar na web e coletar dados de sites em tempo
    real.

    Compilar ou Empacotar o Aplicativo: Não posso executar o electron-builder ou qualquer ferramenta de compilação.

    Resolver Problemas de Ambiente de Desenvolvimento: Não posso ajudar com problemas de instalação de Node.js, Python,
    ferramentas de build C++, ou configurações específicas do seu sistema operacional.

    O que eu forneci é:

    Um protótipo detalhado da interface do usuário (HTML, CSS, JavaScript do lado do cliente).

    Simulações do comportamento do frontend para dar uma ideia do fluxo.

    Orientações e estrutura de código (como esta documentação) para guiar você no desenvolvimento das partes do backend
    e na integração com o Electron.

    A tarefa de escrever o código Node.js para o main.js, preload.js, os módulos de banco de dados, os scrapers, e de
    configurar e construir o projeto Electron é sua responsabilidade como desenvolvedor, utilizando o seu ambiente de
    desenvolvimento.

Espero que esta documentação detalhada ajude você a concluir seu aplicativo "Gestor de Desejos e Parcelamentos"!
