<div align="center">

<img src="./src/assets/logo.png" alt="BOO Sportswear" width="180" />

# BOO Sportswear

**Plataforma de e-commerce full stack para moda esportiva.**

[![CI](https://github.com/mathpferreira/boosportswear/actions/workflows/ci.yml/badge.svg)](https://github.com/mathpferreira/boosportswear/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)

</div>

---

## Visão geral

A **BOO Sportswear** é uma aplicação de e-commerce desenvolvida de ponta a ponta, reunindo experiência de compra, gestão operacional e infraestrutura de produção em um único projeto.

O frontend é construído com **React + Vite**, enquanto a API utiliza **NestJS + Prisma + PostgreSQL**. O projeto também contempla autenticação, pagamentos, frete, e-mails transacionais, administração da loja, auditoria e rotinas de deploy/backup.

> Este repositório é apresentado como **portfólio e demonstração técnica**. O código-fonte não é distribuído sob uma licença open source.

---

## Funcionalidades

### Loja e cliente

- Catálogo e páginas de produto
- Carrinho de compras
- Cadastro, login e autenticação JWT
- Verificação de e-mail e recuperação de senha
- Área de conta do cliente
- Histórico de pedidos
- Cupons de desconto
- Cálculo de frete
- Fluxo de checkout e pagamento

### Operação

- Integração de pagamentos com InfinitePay
- Integração de frete com Frenet
- E-mails transacionais
- Gestão de produtos e categorias
- Gestão de pedidos e usuários
- Configurações administrativas
- Registro de auditoria
- Processamento de imagens

### Infraestrutura

- API REST em NestJS
- Persistência com PostgreSQL e Prisma ORM
- Nginx como proxy reverso
- Processo da API gerenciado com PM2
- Backups automatizados com retenção e checksum
- Configuração de usuário de banco com privilégio mínimo
- CI com lint, validação do Prisma e build de frontend/backend

---

## Arquitetura

```text
Cliente
  │
  ▼
React + Vite
  │
  ▼
Nginx
  │
  ▼
NestJS API
  ├── Autenticação e usuários
  ├── Produtos e categorias
  ├── Pedidos e cupons
  ├── Frete
  ├── Pagamentos
  ├── E-mails
  └── Auditoria
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
```

Uma visão mais detalhada está em [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS |
| Backend | Node.js, NestJS 11, TypeScript |
| Dados | PostgreSQL, Prisma ORM |
| Integrações | InfinitePay, Frenet, Resend |
| Infraestrutura | Ubuntu Linux, Nginx, PM2, systemd |
| Qualidade | ESLint, Jest, GitHub Actions |

---

## Estrutura

```text
boosportswear/
├── .github/workflows/     # Integração contínua
├── boo-api/               # API NestJS
│   ├── prisma/            # Schema e migrations
│   ├── src/               # Módulos de domínio
│   └── test/              # Testes da API
├── deploy/                # Nginx, PM2, backup e PostgreSQL
├── docs/                  # Documentação técnica
├── public/                # Assets públicos
└── src/                   # Aplicação React
    ├── components/
    ├── config/
    └── pages/
```

---

## Qualidade e operação

O repositório possui um pipeline de **CI** que valida automaticamente alterações antes de serem integradas à branch principal:

- instalação reproduzível com `npm ci`;
- lint do frontend e backend;
- geração e validação do Prisma Client;
- build do frontend;
- build da API.

As configurações de produção ficam separadas do código sensível: arquivos `.env` reais não são versionados e o repositório mantém apenas exemplos de configuração.

---

## Documentação técnica

- [`boo-api/README.md`](./boo-api/README.md) — visão geral da API
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — arquitetura e responsabilidades
- [`deploy/DEPLOY.md`](./deploy/DEPLOY.md) — processo operacional de deploy

---

## Status

🚧 **Em desenvolvimento ativo**

A plataforma continua recebendo melhorias de interface, segurança, operação e funcionalidades.

---

## Autor

Desenvolvido por **Matheus Ferreira** — [@mathpferreira](https://github.com/mathpferreira)

<div align="center">

**BOO Sportswear © 2026**

</div>
