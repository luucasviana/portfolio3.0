# 🚀 Lucas Viana | Portfólio Professional & Admin Console (v3.0)

Este repositório contém o portfólio profissional de **Lucas Viana (Desenvolvedor & Designer UI)**, construído sobre uma arquitetura estática dinâmica de alto desempenho utilizando **Next.js 16**, **Tailwind CSS v4** e as integrações da nuvem da Vercel (**Postgres** e **Blob**).

A aplicação conta com uma landing page SPA (Single Page Application) minimalista de altíssima performance visual para os usuários e um **Console Administrativo** premium e seguro, inspirado nos padrões visuais da biblioteca **shadcn/ui**, permitindo a gestão em tempo real de todo o conteúdo do site sem a necessidade de novos deploys.

---

## 🎨 O Portfólio: Visão Geral do Design & Performance

O portfólio foi desenhado com foco em **estética premium de nível SaaS**, utilizando cores profundas e alto contraste:
- **Fundo Principal (BG)**: `#12151a` (Escuro profundo sofisticado)
- **Acento Primário**: `#00adb5` (Ciano elétrico vibrante para indicações ativas, botões e hover)
- **Efeitos Visuais**: Glassmorphism sutil, gradientes radiais dinâmicos que seguem o movimento e rastro do cursor canvas, animações de fade-in/slide-up coordenadas por *Intersection Observer*.
- **Sem Placeholders**: Foco absoluto em tipografia limpa (**Plus Jakarta Sans**), badges de tecnologia nítidos e grade de projetos minimalista.

---

## 🔒 O Console Administrativo (Admin Portal)

Acessível por `/admin`, o console fornece uma experiência de gerenciamento de conteúdo (CMS pessoal) completa e segura:
- **Autenticação Segura**: Barreira de login baseada em *cookies* criptografados e verificação de chave mestra via Server Actions.
- **Visual shadcn/ui**: Card de login centralizado em vidro fosco, inputs padronizados com bordas nítidas, rótulos legíveis em tons Slate e botões primários Teal de alta legibilidade (texto escuro sobre fundo ciano sólido).
- **Gestão de Perfil**: Edição em tempo real do nome, subtítulo, bio detalhada e upload direto de arquivos via **Vercel Blob** (com badges inteligentes indicando arquivos de Currículo PDF e Certificado ativos).
- **Gestão de Projetos**: CRUD completo em lista vertical. Criação e edição de cards de projetos, tags de tecnologias, links principais e secundários em tempo real.
- **Empresas & Logos**: Controle das logos textuais e gráficas das empresas participantes do carrossel infinito da página principal.
- **Conexões & Redes**: Ativação, desativação (visibilidade) e edição instantânea de links de redes sociais (WhatsApp, E-mail, GitHub, LinkedIn, Instagram).

---

## 🛠️ Stack Tecnológica

- **Framework Core**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização (CSS)**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS customizado para o motor de animações
- **Banco de Dados Relacional**: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (powered by Neon Serverless)
- **Armazenamento de Arquivos**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (para uploads de arquivos PDF de currículos e certificados)
- **Tipografia & Ícones**: Google Fonts (Plus Jakarta Sans) e FontAwesome 6 Pro

---

## 🚀 Como Iniciar Localmente

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** (versão 18 ou superior) instalado em sua máquina.

### 2. Configurar Variáveis de Ambiente
Crie um arquivo chamado `.env.local` na raiz do projeto e configure as seguintes credenciais:

```env
# Banco de Dados Postgres (Vercel Postgres / Neon)
POSTGRES_URL="sua_string_de_conexao_aqui"
POSTGRES_PRISMA_URL="sua_string_de_conexao_prisma_aqui"
POSTGRES_URL_NON_POOLING="sua_string_de_conexao_sem_pool_aqui"

# Armazenamento de Arquivos (Vercel Blob Token)
BLOB_READ_WRITE_TOKEN="seu_token_do_vercel_blob_aqui"

# Senha de Acesso do Painel Administrativo
ADMIN_PASSWORD="sua_senha_secreta_do_console_aqui"
```

### 3. Instalar Dependências
Instale todas as dependências requeridas utilizando o npm:
```bash
npm install
```

### 4. Executar Servidor de Desenvolvimento
Inicie o ambiente de testes local:
```bash
npm run dev
```
Abra o navegador em [http://localhost:3000](http://localhost:3000) para ver o portfólio. Para gerenciar os dados, acesse `/admin`.

### 5. Compilação para Produção
Valide o build estático e dinâmico otimizado:
```bash
npm run build
```

---

## 📁 Estrutura do Código

```
├── public/                 # Imagens, favicons e arquivos públicos estáticos
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── admin/          # Console do Administrador
│   │   │   ├── login/      # Tela de login seguro com design premium
│   │   │   ├── actions.ts  # Server Actions seguros (CRUD, upload e logout)
│   │   │   └── AdminDashboardClient.tsx # Painel CMS do dashboard
│   │   ├── globals.css     # Design system, tokens e animações customizadas
│   │   ├── layout.tsx      # Layout global da aplicação com imports de fontes
│   │   └── page.tsx        # Landing Page do Portfólio SPA principal (SSR)
│   └── lib/
│       └── db.ts           # Inicializador seguro do cliente SQL do Postgres
├── package.json            # Manifesto do projeto e dependências da stack
└── tsconfig.json           # Configuração de tipos estritos do TypeScript
```

---

## ⚡ Deploy em Produção (Vercel)

O projeto está totalmente configurado para deploy automático na **Vercel**:
1. Conecte o repositório do GitHub à sua conta Vercel.
2. Nas configurações do projeto Vercel, adicione as variáveis de ambiente equivalentes ao seu `.env.local` (`POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD`).
3. Adicione as integrações nativas de **Vercel Postgres** e **Vercel Blob** diretamente no dashboard do projeto.
4. Ao empurrar as alterações para a branch `main`, a Vercel compila e publica a aplicação automaticamente de ponta a ponta.

---
*Desenvolvido com carinho e precisão por **Lucas Viana**.*
