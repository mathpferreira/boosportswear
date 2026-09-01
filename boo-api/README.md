# BooSportswear API

Backend da plataforma **BooSportswear**, responsável pela autenticação, regras de negócio, persistência de dados, integrações e serviços utilizados pelo frontend.

> Este diretório faz parte do projeto BooSportswear e não é um template independente do NestJS.

## Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT / Passport
- Sharp
- Jest

## Responsabilidades

A API concentra funcionalidades como:

- autenticação e autorização;
- gerenciamento de produtos e dados da loja;
- comunicação com PostgreSQL através do Prisma;
- processamento de imagens;
- validação de dados;
- auditoria e controles de segurança;
- integrações utilizadas pelo fluxo de pedidos e pagamentos.

## Estrutura

```text
boo-api/
├── prisma/        # Schema, migrations e acesso ao banco
├── src/           # Código-fonte da aplicação
├── test/          # Testes e configuração e2e
├── .env.example   # Exemplo das variáveis necessárias
└── package.json
```

## Desenvolvimento

Scripts principais disponíveis no projeto:

```bash
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

As variáveis de ambiente esperadas estão documentadas em `.env.example`.

## Segurança

Credenciais reais, tokens, chaves e arquivos `.env` não devem ser versionados. O repositório mantém apenas valores de exemplo para documentar a configuração esperada pela aplicação.

## Uso

Este código integra o projeto BooSportswear e é disponibilizado publicamente como demonstração técnica e portfólio do desenvolvimento da aplicação.

**BooSportswear © 2026 — Todos os direitos reservados.**
