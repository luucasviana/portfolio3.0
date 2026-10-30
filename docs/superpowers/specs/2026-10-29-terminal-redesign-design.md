# Redesign visual do portfólio: tema "grande terminal"

Data: 2026-10-29 · Autor: Lucas Viana (com Claude)

## 1. Intenção

O portfólio público (`/`) ganha uma nova identidade visual. A estrutura e a experiência continuam as mesmas. O tema é **um grande terminal de computador**: futurista e tecnológico, inspirado na qualidade de acabamento de glaucialemos.dev/pt (animações, tipografia tech, personagem próprio na capa), sem copiar. O tema dela é galáxia; o nosso é terminal e cidade neon à noite.

A capa traz um personagem em pixel art do Lucas com as duas gatas num terraço sobre uma cidade cyberpunk. A arte está pronta e aprovada.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Trocar a UI (cores, tipografia, componentes, animações) para a linguagem de terminal.
- Capa no formato da referência: cena grande à direita e texto à esquerda, sobre a área escurecida.
- Manter as seções, a ordem, os textos vindos do banco, a navegação e o rastreamento de cliques (`recordClickAction`).
- Responsividade refinada em desktop, tablet e celular, sem rolagem horizontal.
- Respeitar `prefers-reduced-motion` e oferecer um botão para reduzir animações.

**Não-objetivos**
- Mudar o painel `/admin`, que continua com o visual atual (shadcn), sem regressão.
- Mudar o banco, as APIs, o conteúdo dos textos ou a lógica de visitas.
- Adicionar música ou som.
- Criar um terminal interativo de verdade (digitar comandos). Os comandos são decorativos.

**Anti-objetivos (seria fracasso mesmo funcionando)**
- Parecer cópia do site da Glaucia: mesma paleta roxa de galáxia, mesmos componentes, mesmo layout pixel a pixel.
- Ficar ilegível: texto verde-fosforescente em excesso, scanlines fortes, fonte pixelada em textos longos.
- Capa pesada que atrasa o carregamento ou "pula" no celular.
- Quebrar o admin, que compartilha o `layout.tsx` e o `globals.css`.

## 3. Restrições

- Next.js 16.2.6, React 19.2 e Tailwind v4. O `AGENTS.md` exige ler os guias em `node_modules/next/dist/docs/` antes de codar (fontes, imagens, metadata).
- O site público usa CSS próprio (BEM) em `src/app/globals.css`. O admin usa os tokens shadcn do mesmo arquivo. Os novos estilos do público não podem alterar `:root`/`.dark` de forma que afete o admin.
  - Conflito conhecido: `.dark` sobrescreve `--accent` (oklch).
  - Bug conhecido: `--font-family` referencia a si mesmo.
- `layout.tsx` é compartilhado. Novas fontes entram como variáveis CSS e só são aplicadas nas classes do público.
- Os dados vêm de `page.tsx`, que é dinâmico e tem fallback. O contrato `PortfolioClient` (props) não muda.
- Ícones: o Font Awesome 6.4 via CDN já está em uso e pode continuar.
- Validação (regra do usuário): escopo mínimo, só nos fluxos alterados (capa, navegação do dock, seções) e nas três larguras (desktop, tablet 768 e celular 375).
  - O projeto não tem Playwright configurado. Validar com o navegador embutido do app contra `npm run dev`, sem adicionar dependência.
  - Não há `.env` local, então a página usa os dados de fallback e não grava visitas no banco real. Manter assim durante os testes.

## 4. Decisões do Lucas

- Tema: grande terminal de computador, futurista e tecnológico.
- Manter a UX: mesmas seções, a mesma ordem e o dock de navegação à esquerda.
- Manter as animações (a referência foi elogiada) e não ter música.
- Fontes com cara tecnológica, no espírito da referência.
- Remover o rastro do mouse (já feito, ainda sem commit). O brilho que segue o mouse (`.bg-glow`) pode ficar.
- Capa: cena em pixel art aprovada, com o Lucas no terraço, a frajola à esquerda e a rajada à direita.
- Trabalhar direto na branch `main`, sem commits até o Lucas pedir.

## 5. Direção visual (decisões do Claude, aprovadas junto com este documento)

### 5.1 Conceito
O site inteiro é uma sessão de terminal do usuário `lucas@viana:~$`. Cada seção é aberta por um "comando" que aparece digitado no título:

| Seção | id | Comando no cabeçalho | Título humano (mantido) |
|---|---|---|---|
| Início | `home` | `./start.sh` (no boot) | nome + subtítulo |
| Sobre | `sobre` | `whoami` | Minha Trajetória |
| Competências | `habilidades` | `ls skills/` | Especialidades & Diferenciais |
| Trabalhos | `projetos` | `ls projetos/` | Projetos em Destaque |
| Conexão | `contatos` | `./contato.sh` | Vamos conversar? |

A tag atual (`01 / SOBRE MIM`) vira a linha de prompt: `lucas@viana:~$ whoami`. O título humano continua grande logo abaixo. O comando é tempero, não substitui o texto.

### 5.2 Paleta
- Fundo: quase preto azulado (`#0a0e13`), com superfícies `#0f151c` e `#141c25` e bordas de 1px `rgba(0,229,229,.14)`.
- Fósforo principal: ciano `#00adb5` (a cor atual da marca), com brilho `#00e5e5` para destaques e glow.
- CTA: âmbar `#ffb347`, uma única cor quente para as ações principais (Download CV). Vem das lanternas e do horizonte da capa.
- Energia secundária: roxo da cidade `#8b5cf6` (pouco, em detalhes) e verde de sucesso `#3ddc84` (status "online", checks).
- Texto: `#e6edf3` (primário), `#9fb0c0` (secundário) e `#5c6b7a` (apagado).
- As cores das categorias de skills (`#00adb5`, `#a29bfe`, `#00b894`, `#fdcb6e`) podem ficar como "cores de tag" de cada pasta.

### 5.3 Tipografia (três níveis)
- **Títulos de display:** `VT323`, a fonte de terminal CRT. Só em títulos grandes (nome na capa, títulos de seção), nunca em parágrafos.
- **Labels, comandos, tags, botões, nav:** `JetBrains Mono`, em caixa alta com tracking nas labels.
- **Texto corrido:** `Geist`, que já está carregada, para legibilidade.

Todas via `next/font/google`, como variáveis CSS.

### 5.4 Forma e textura
- Cantos retos ou de no máximo 4px, com bordas de 1px. Cards como "janelas" de terminal, com barra de título fina (`● ● ●` + caminho, ex.: `~/projetos/ecoaai`).
- Scanlines CRT bem sutis em overlay fixo (opacidade ≤ 0,04) e uma vinheta leve nas bordas.
- Cursor de bloco piscando `▍` no fim dos títulos digitados.
- O brilho do mouse continua, mais fraco, na cor do fósforo.

## 6. Seções

### 6.1 Boot (intro)
- Na primeira visita da sessão, uma sequência curta de boot (≤ 2,5 s), em texto mono sobre fundo preto. Exemplo:
  - `[ OK ] montando /home/lucas`
  - `[ OK ] iniciando gatas.service`
  - `[ OK ] carregando portfolio v3.0`
  - em seguida, a tela "liga" como um CRT (risco horizontal que abre).
- Pode ser pulada por clique, tecla ou toque. Não aparece de novo na mesma sessão (`sessionStorage`).
- Não aparece com `prefers-reduced-motion` nem com animações reduzidas.
- Não pode bloquear o LCP. O conteúdo é renderizado por baixo, e o boot é só uma camada por cima.

### 6.2 Capa (`#home`)
- **Desktop:** a cena ocupa a seção inteira (100svh, atrás do conteúdo, à direita do dock). O texto fica à esquerda, sobre a área escurecida:
  1. prompt `lucas@viana:~$ ./start.sh`
  2. "Olá, eu sou"
  3. nome em VT323 grande, com efeito de digitação
  4. subtítulo
  5. descrição
  6. botões: Download CV em âmbar, Certificado Bubble e Ver Projetos em contorno
- **Barra de status** estilo tmux no rodapé da capa: `lucas@viana | ● online | [frajola] dormindo | [rajada] caçando bugs | 23:41`. O relógio é local. Os nomes das gatas dependem do Lucas (ver §9).
- **Animação da cena:**
  - parallax leve entre o fundo e os personagens (mouse no desktop, rolagem no celular)
  - "respiração" sutil dos personagens (1–2px)
  - piscar das luzes da cidade com overlay CSS
  - piscar dos olhos das gatas: desejável, mas só se der para fazer de forma limpa (overlay de 1–2 pixels), senão fica de fora
- **Tablet:** a cena continua de fundo, com o enquadramento puxado para a direita e o texto com fundo semitransparente mais forte.
- **Celular:**
  - A cena vira um banner no topo (~55svh), recortado para mostrar o Lucas e as gatas (`object-position` à direita).
  - O texto e os botões ficam abaixo, empilhados, com os botões em largura total e alvo de toque ≥ 44px.
  - A barra de status vira uma linha curta (só o status das gatas).
- **Acessibilidade:** a cena é decorativa para leitores de tela (`alt` descritivo único no contêiner, ex.: "Ilustração em pixel art: Lucas com suas duas gatas num terraço sobre uma cidade neon à noite").

### 6.3 Sobre (`#sobre`) — `whoami`
- Os três parágrafos da bio ficam numa "janela" de terminal (`~/sobre.md`).
- O carrossel vertical de empresas vira um "log" que rola: `> InfoEduc`, `> Ecoaai`, … com o mesmo comportamento de loop infinito.

### 6.4 Competências (`#habilidades`) — `ls skills/`
- Cada categoria é uma "pasta" (`desenvolvimento/`, `design/`, `produto/`, `diferenciais/`) em card-janela, com a cor da categoria na borda e no ícone.
- As skills aparecem como linhas de arquivo (`├── Bubble`, `└── APIs REST`).
- Grade com 2 colunas no desktop e 1 no celular.

### 6.5 Projetos (`#projetos`) — `ls projetos/`
- Card-janela com barra `~/projetos/<id>`, categoria em label mono, título, descrição, tags no estilo `[React]` e as mesmas ações (link principal e secundário).
- Hover com borda acesa e leve deslocamento. No toque, sem depender de hover.

### 6.6 Contato (`#contatos`) — `./contato.sh`
- Os mesmos cards de redes, como linhas de saída do script: ícone, título, subtítulo e seta. A cor da marca aparece só no hover/foco.
- O rodapé vira a última linha do terminal: `logout — sessão encerrada. Feito sob efeito de cafeína ☕ © 2026 Lucas Viana`, com cursor piscando.

### 6.7 Dock de navegação
- Mesma posição e comportamento: fixo à esquerda no desktop e barra inferior no celular (≤ 768px). A sincronização com a rolagem continua.
- Visual: painel escuro de borda fina, ícones em ciano quando ativos, indicador de item ativo como um "cursor" lateral, e tooltip em mono (`cd sobre`).
- O logo `LV.` vira `LV_` com o underline piscando.
- O botão "reduzir animações" entra no dock, na parte de baixo, perto do GitHub. No celular vai para o fim da barra.

## 7. Movimento

- As animações de entrada das seções (classe `in-view`) continuam, com efeito de "digitação" do comando e fade/slide curto do conteúdo.
- Durações curtas (150–400 ms), sem easing elástico exagerado.
- **Reduzir animações:** a mídia `prefers-reduced-motion` ou o botão do dock (salvo em `localStorage`) desligam o boot, a digitação, o parallax, a respiração, o pisca-pisca e as scanlines animadas. O conteúdo aparece pronto.

## 8. Arte da capa (assets)

- A origem fica fora do repositório, em `C:\Users\lucas\sd-local\out\v4\layers_c\`. Os arquivos **já estão prontos e não devem ser regerados**:
  - `bg.png`: 1344×768, já pixelado ×3.
  - `shadows.png`: sombras de chão, no quadro inteiro de 1344×768, com fundo transparente.
  - `lucas.png`, `tux.png` e `tabby.png`: recortes já pixelados e com a luz da cena.
  - `positions.json`: x, y, largura e altura de cada camada no quadro 1344×768 (lucas em 882,128 com 312×600; tux em 752,544 com 160×190; tabby em 1154,536 com 180×200). Posicionar em % desse quadro.
- A montagem de referência aprovada é `out/v4/hero_c.png`: fundo + sombras + personagens + gradiente à esquerda.
- `shadows.png` se move junto com os personagens no parallax (mesma profundidade), não com o fundo.
- Basta copiar e converter para WebP/AVIF sem perda visível. Meta: < 350 KB somando todas as camadas. Nenhum script Python precisa rodar na implementação.
- Destino: `public/hero/`. Renderizar com `next/image`, com o fundo como prioridade (LCP) e `image-rendering: pixelated` em tudo.
- O escurecimento à esquerda vira gradiente CSS (não fica "assado" no fundo), para ajustar por breakpoint.

## 9. Em aberto

- **Nomes das gatas:** usados na barra de status e no alt da capa. Até o Lucas responder, usar "frajola" e "rajada".

## 10. Fica a cargo de quem implementar

- Estrutura dos componentes: pode quebrar o `PortfolioClient.tsx` em componentes por seção, sem mudar as props de entrada.
- Valores exatos de espaçamento, tamanhos de fonte por breakpoint e curvas de animação, dentro do que está descrito acima.
- Como isolar os tokens do público dos do admin (ex.: escopo `.portfolio` no contêiner raiz).
- Se o parallax usa CSS (`transform` em scroll/mouse via variáveis) ou JS leve. Sem biblioteca nova de animação.
- Técnica do boot e da digitação, desde que respeite o §7 e não atrase o LCP.
