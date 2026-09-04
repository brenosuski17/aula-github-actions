# aula-github-actions

CI com GitHub Actions para os validadores de Cadastro de Pessoa Física
(mesmo módulo da Aula 08), com um formulário em `index.html` que consome
a mesma regra de validação usada pelos testes.

## Rodar localmente

Requer apenas Node.js 20+ (sem dependências, sem `npm install`).

```bash
node --version
node --test
```

## Ver o formulário

Abra `index.html` diretamente no navegador (duplo clique) ou use a
extensão Live Server do VS Code.

## Estrutura

```
.
├── index.html                    # formulário que usa pessoaFisica.js
├── pessoaFisica.js               # módulo de validação (Node + navegador)
├── pessoaFisica.test.js          # suíte de testes (node --test)
└── .github/workflows/testes.yml  # CI: roda a suíte a cada push/PR na main
```

## CI

Todo push ou pull request para `main` dispara o workflow **Testes**, que
instala o Node 20 e roda `node --test`. A branch `main` está protegida por
um Ruleset que exige pull request + esse check passando antes do merge.
