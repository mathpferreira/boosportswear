# Arquitetura — BOO Sportswear

Este documento registra a organização técnica da plataforma BOO Sportswear em alto nível. O objetivo é apresentar as responsabilidades de cada camada sem expor configurações sensíveis de produção.

## Visão geral

```text
Navegador
   │
   ▼
React + Vite
   │ HTTP/JSON
   ▼
Nginx
   │ reverse proxy
   ▼
NestJS API
   │
   ├── Auth / Users / Minha Conta
   ├── Produtos / Categorias
   ├── Cupons / Pedidos
   ├── Frete
   ├── Pagamentos
   ├── E-mails
   ├── Configurações
   └── Auditoria
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL
```

## Frontend

A aplicação web fica na raiz do repositório e utiliza React com Vite.

Responsabilidades principais:

- navegação e experiência de compra;
- catálogo e páginas de produto;
- carrinho;
- autenticação e área do cliente;
- histórico de pedidos;
- páginas institucionais;
- painel administrativo;
- comunicação com a API REST.

## Backend

A API está localizada em `boo-api/` e utiliza NestJS com TypeScript.

Os módulos são separados por domínio para evitar concentração de regras de negócio em uma única camada.

### Domínios principais

| Módulo | Responsabilidade |
| --- | --- |
| `auth` | autenticação, sessões e autorização |
| `users` | gestão de usuários |
| `minha-conta` | operações da conta do cliente |
| `produtos` | catálogo e gestão de produtos |
| `categorias` | organização do catálogo |
| `cupons` | regras e utilização de descontos |
| `pedidos` | criação e ciclo de vida dos pedidos |
| `frete` | cálculo e integração de opções de envio |
| `pagamentos` | fluxo de pagamento e integração externa |
| `emails` | comunicação transacional |
| `configuracoes` | parâmetros operacionais da loja |
| `audit` | rastreabilidade de ações relevantes |

## Persistência

O acesso a dados é realizado através do Prisma ORM sobre PostgreSQL.

A camada de dados contém:

- schema versionado;
- migrations;
- relacionamentos entre entidades;
- validação do schema no pipeline de CI.

## Integrações externas

A aplicação possui pontos de integração para serviços que fazem parte do fluxo operacional da loja:

- **InfinitePay** — pagamentos;
- **Frenet** — cálculo de frete;
- **Resend** — e-mails transacionais.

Credenciais não são armazenadas no código-fonte e são fornecidas ao ambiente através de variáveis de ambiente.

## Produção

Os artefatos de infraestrutura ficam em `deploy/`.

A configuração contempla:

- Nginx como servidor web e reverse proxy;
- PM2 para gerenciamento do processo Node.js;
- usuário de runtime dedicado para a API;
- usuário de banco com privilégio mínimo;
- backup automatizado do banco e uploads;
- retenção de backups e geração de checksum;
- execução de tarefas recorrentes via systemd.

## Integração contínua

O workflow `.github/workflows/ci.yml` executa verificações de frontend e backend a cada alteração relevante na branch principal ou em pull requests.

O pipeline valida:

1. instalação das dependências;
2. lint do código;
3. Prisma Client e schema;
4. build do frontend;
5. build da API.

## Segurança de configuração

Os arquivos `.env` reais são ignorados pelo Git. Somente arquivos `.env.example`, contendo valores de exemplo, permanecem versionados.

A documentação de deploy também evita imprimir credenciais de banco e orienta o uso de permissões reduzidas em produção.
