# CI/CD do zero: aprenda com o API Quality Lab

Este guia transforma o API Quality Lab em um exercício prático. Você vai acompanhar os testes rodando automaticamente no GitHub e, quando estiver pronto, configurar uma publicação opcional no Render.

## O que você vai aprender

Ao terminar, você saberá:

- o que CI e CD querem dizer;
- como uma alteração sai do seu computador e chega ao GitHub;
- como um workflow executa comandos em uma máquina limpa;
- por que os testes podem bloquear uma publicação;
- onde encontrar o resultado e o relatório de uma execução;
- como guardar uma URL secreta e usá-la para disparar uma publicação.

Não precisa conhecer CI/CD antes. É útil saber abrir o terminal e ter noções básicas de Git, como commit e branch. O serviço Render é opcional até a parte de publicação.

## A ideia em uma frase

CI/CD automatiza o caminho entre uma alteração no código, as verificações de qualidade e a entrega ou publicação do software.

- **CI — Integração Contínua:** cada alteração é integrada ao repositório e verificada automaticamente. Aqui, o GitHub instala as dependências e roda os testes da API.
- **CD — Entrega Contínua:** depois das verificações, o software fica pronto para publicar, normalmente aguardando uma decisão humana.
- **CD — Implantação Contínua:** depois das verificações, a publicação acontece automaticamente. Neste projeto, isso é opcional e só ocorre quando você configura o Render e ativa a variável `RENDER_DEPLOY_ENABLED`.

Uma equipe pode fazer CI sem fazer CD. Ter testes automáticos já é um ótimo primeiro passo.

## O caminho da alteração

```text
Você altera o código
        ↓
Envia a branch ao GitHub e abre um Pull Request para main
        ↓
GitHub Actions instala dependências e roda os testes (CI)
        ↓
Se algum teste falhar, a execução fica vermelha e a publicação não acontece
        ↓
Depois de revisar e integrar à main, os testes rodam de novo
        ↓
Se o CD opcional estiver ativado, o GitHub pede ao Render para publicar
```

## As peças do workflow

Abra [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Um workflow é a receita de automação que o GitHub Actions lê.

| Peça | O que significa neste projeto |
| --- | --- |
| `on` | Os eventos que iniciam a automação: Pull Request para `main`, push para `main` ou execução manual. |
| `jobs` | Grupos de trabalho. `ci` verifica o código; `deploy` pode pedir uma publicação. |
| `runs-on` | A máquina temporária do GitHub onde o job executa. |
| `steps` | Os passos do job, executados em ordem. |
| `actions/checkout` | Baixa uma cópia do repositório para a máquina temporária. |
| `actions/setup-node` | Instala Node.js 22 nessa máquina. |
| `npm ci` | Instala as versões registradas no `pagckage-lock.json`. |
| `npm test` | Executa os testes Playwright da API. |
| artifact | Arquivo produzido pela execução; aqui, o relatório JSON dos testes. |
| secret | Valor privado do GitHub usado para autorizar o pedido de publicação ao Render. |

O computador do GitHub começa limpo a cada execução. Isso ajuda a revelar dependências ou configurações que só existiam na sua máquina.

## Aula 1: observe o CI

O workflow já está configurado neste projeto. Para ativá-lo no GitHub e vê-lo rodando:

1. Abra o PowerShell na pasta `API Quality Lab` e crie a branch inicial:

   ```powershell
   git switch -c configurar-ci-cd
   git add .github/workflows/ci.yml src/server.js README.md lessons/ci-cd-do-zero.md
   git commit -m "Add a beginner CI/CD learning workflow"
   git push -u origin configurar-ci-cd
   ```

2. No GitHub, abra um Pull Request da branch `configurar-ci-cd` para `main` e revise as alterações.
3. Como este é o primeiro workflow do repositório, ele precisa chegar à branch padrão `main` para ficar disponível como verificação de Pull Request. Integre esse Pull Request depois de revisar. O push para `main` inicia a primeira execução do CI.
4. Para observar o CI num Pull Request, atualize seu `main` local e crie outra branch:

   ```powershell
   git switch main
   git pull
   git switch -c aprender-ci-cd
   ```

5. Faça uma pequena alteração de documentação, registre com `git add`, `git commit -m "Practice the CI workflow"` e envie com `git push -u origin aprender-ci-cd`. Abra um Pull Request dessa branch para `main`.
6. Na página do Pull Request, observe a verificação **Install and test**. Você também pode abrir a aba **Actions** do repositório e selecionar **CI and optional CD**.
7. Abra a execução e veja cada etapa. Depois de concluída, baixe o artifact `playwright-report` para consultar o relatório JSON.

O CI verifica Pull Requests destinados à branch `main` e também commits enviados diretamente para `main`. Ao fazer merge do Pull Request, haverá uma nova execução para o push em `main`.

### Exercício: veja um teste falhar

Faça este exercício somente na branch `aprender-ci-cd`:

1. Abra `tests/api/tasks.spec.js` e, no teste que lista tarefas, mude temporariamente a expectativa `expect(tasks).toEqual([])` para `expect(tasks).toEqual(["falha proposital"])`.
2. Faça commit e envie a alteração. O workflow deve ficar vermelho, porque a resposta real não corresponde à expectativa.
3. Abra o log de `Run the API tests` e encontre a diferença entre o valor esperado e o recebido.
4. Restaure a expectativa original com `git restore tests/api/tasks.spec.js`, faça outro commit e envie. O CI deve ficar verde novamente.

Não faça merge de uma alteração feita só para provocar falha.

## Aula 2: entenda quando publicar

O job `deploy` depende de `ci` (`needs: ci`), então não começa se os testes falharem. Ele também exige três condições:

1. o evento é um push, não um Pull Request nem uma execução manual;
2. a branch é `main`;
3. a variável de repositório `RENDER_DEPLOY_ENABLED` tem o valor `true`.

Assim, você pode aprender e usar o CI sem publicar nada. Sem a variável, o job de publicação aparece como ignorado. Para ativar o CD, siga a próxima aula.

## Aula 3: configure a publicação opcional no Render

Esta etapa publica uma API de demonstração na internet. Use apenas dados fictícios: o exemplo não tem autenticação e guarda tarefas somente na memória.

### 1. Crie o serviço

No Render, crie um **Web Service** conectado ao repositório `api-quality-lab` e à branch `main`. Configure:

- Build Command: `npm ci`
- Start Command: `npm start`
- variável de ambiente: `HOST` = `0.0.0.0`
- Health Check Path: `/tasks`
- Auto-Deploy: **No**

O servidor usa `127.0.0.1` por padrão para ficar acessível só localmente no seu computador. No serviço hospedado, `HOST=0.0.0.0` permite que o Render encaminhe requisições ao processo. O Render fornece a variável `PORT`; o projeto já a lê.

Desativar o Auto-Deploy do Render evita uma publicação separada antes da verificação do GitHub. O workflow será quem pede a publicação depois que o CI passar.

### 2. Guarde o deploy hook como secret

No painel do Render, abra **Settings** do serviço e crie um **Deploy Hook**. Trate a URL como uma senha: quem a tiver pode pedir uma publicação.

No GitHub, abra **Settings → Secrets and variables → Actions → New repository secret** e salve:

- Name: `RENDER_DEPLOY_HOOK_URL`
- Secret: a URL do Deploy Hook do Render

Não escreva essa URL no código, em um commit ou em uma mensagem de log.

### 3. Ative o job de publicação

No GitHub, ainda em **Settings → Secrets and variables → Actions**, abra a aba **Variables** e crie uma variável de repositório:

- Name: `RENDER_DEPLOY_ENABLED`
- Value: `true`

Depois, envie uma alteração aprovada para `main`. Primeiro o CI instala as dependências e roda os testes. Só depois, se tudo passar, o job de CD envia o pedido ao Render. Acompanhe o restante da publicação no painel do Render e abra a URL do serviço terminada em `/tasks`.

Para desligar o CD, remova a variável ou altere seu valor. O CI continua funcionando.

## Como investigar uma falha

1. Abra a execução vermelha na aba **Actions**.
2. Encontre o primeiro passo vermelho; passos posteriores podem ter sido pulados por causa dele.
3. Leia a mensagem de erro. Se foi em `npm ci`, investigue dependências e lockfile. Se foi em `npm test`, leia a asserção que falhou.
4. Faça a correção em uma branch e envie outro commit. Uma nova execução mostrará se a correção resolveu o problema.
5. Se precisar de mais detalhes, baixe o artifact `playwright-report` quando ele estiver disponível.

## Vocabulário rápido

- **Branch:** linha separada de trabalho no Git.
- **Commit:** registro de um conjunto de alterações.
- **Pull Request (PR):** pedido para revisar e integrar uma branch.
- **Workflow:** receita de automação guardada em `.github/workflows`.
- **Runner:** máquina temporária que executa o workflow.
- **Job:** conjunto de passos que rodam na mesma máquina.
- **Artifact:** arquivo que o workflow guarda para consulta ou download.
- **Secret:** valor privado guardado nas configurações do GitHub.
- **Deploy:** publicação de uma versão em um ambiente acessível.
- **Pipeline:** nome informal para o caminho automatizado das verificações e publicação.

## Próximos desafios

1. Adicionar uma etapa de lint e observar como ela pode bloquear o merge.
2. Exigir que a verificação CI passe antes de aceitar um Pull Request nas configurações da branch `main`.
3. Separar ambiente de teste e ambiente de produção, exigindo aprovação antes da publicação.
4. Adicionar um endpoint de saúde dedicado e apontar o health check para ele.

Faça um desafio por vez. Primeiro entenda a execução atual e o motivo de cada condição.

## Leituras oficiais

- [Eventos que iniciam workflows no GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Deploy Hooks do Render](https://render.com/docs/deploy-hooks)
