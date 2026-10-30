# Redesign "grande terminal" — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a UI do portfólio público (`/`) para o tema de terminal com a capa em pixel art, mantendo seções, dados, navegação e analytics.

**Architecture:** `PortfolioClient.tsx` vira um compositor fino de componentes por seção, que ficam em `src/app/_portfolio/` (pasta privada, não vira rota). Todo o visual novo vive em `src/app/_portfolio/terminal.css`, com escopo no contêiner raiz `.term` e classes `t-*`. As regras antigas do público saem de `globals.css`, e as do admin ficam intactas. A capa usa camadas PNG→WebP posicionadas em % de um quadro de 1344×768. O movimento é CSS puro, com variáveis definidas por JS leve. Um script inline no `page.tsx` define `data-motion` e `data-boot` no `<html>` antes da primeira pintura.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19.2, CSS próprio (sem Tailwind no público), `next/font/google`, `next/image`.

**Spec:** `docs/superpowers/specs/2026-10-29-terminal-redesign-design.md`

## Global Constraints

- Não alterar `/admin`, o banco, as APIs, os textos vindos do banco nem as props de `PortfolioClient` (`initialProfile`, `initialProjects`, `initialExperience`, `initialSocials`).
- Manter `recordClickAction("cv")`, `recordClickAction("certificate")` e `recordClickAction("contact", social.platform)` nos mesmos elementos.
- Manter os ganchos estruturais que o IntersectionObserver usa:
  - classe `content-section` nas 5 seções, com os ids `home`, `sobre`, `habilidades`, `projetos` e `contatos`
  - classe `nav-item` com `data-section`
  - classes `in-view` e `active`
- Next 16: usar `preload`/`fetchPriority="high"` em vez de `priority` (deprecado) no `next/image`. As camadas de pixel art vão com `unoptimized` (o redimensionamento do otimizador borra os pixels).
- Paleta (spec §5.2):
  - fundo `#0a0e13`
  - superfícies `#0f151c` / `#141c25`
  - borda `rgba(0,229,229,.14)`
  - fósforo `#00adb5`, glow `#00e5e5`
  - CTA `#ffb347`
  - roxo `#8b5cf6`, verde `#3ddc84`
  - texto `#e6edf3` / `#9fb0c0` / `#5c6b7a`
- Fontes (spec §5.3):
  - `VT323` só em títulos display
  - `JetBrains Mono` em labels, comandos, botões e nav
  - `Geist` no texto corrido
- Cantos ≤ 4px, bordas de 1px, scanlines com opacidade ≤ 0,04, animações de 150–400 ms (o boot pode chegar a 2,5 s).
- Sem música. Sem nova dependência npm (nem Playwright).
- Responsivo:
  - larguras de teste 1440×900, 768×1024 e 375×812
  - sem rolagem horizontal
  - alvos de toque ≥ 44px
  - breakpoints existentes: 1024, 768 e 480
- Textos visíveis em português com acentuação correta (regra do Lucas).
- Commits: **não commitar** sem pedido explícito do Lucas. Cada tarefa termina num checkpoint.
- Validação: usar o navegador embutido do app (`preview_start` com `name: "dev"`, que roda `npm run dev` na porta 3000).
  - Não há `.env` local, então a página usa o fallback e não grava visitas.
  - As asserções abaixo são expressões JS para `javascript_tool`.
  - Lint só nos arquivos tocados: `npx eslint <arquivos>`.

## Review Focus

1. **Nome ou descrição longos vindos do banco:** a digitação e o título VT323 devem quebrar linha sem rolagem horizontal em 375px. Teste na Tarefa 5.
2. **`localStorage`/`sessionStorage` inacessíveis (Safari privado lança exceção):** o script de pré-boot e o hook não podem quebrar a página; o boot é pulado e o movimento fica "full". Teste na Tarefa 2.
3. **Acesso direto por âncora (`/#projetos`):** o boot não deve tapar a seção pedida; com hash na URL, o boot é pulado. Teste na Tarefa 8.
4. **Teclado:** dock, botão de animações, CTAs e cards de contato alcançáveis por Tab, com foco visível; o boot fecha com qualquer tecla. Testes nas Tarefas 3 e 8.
5. **CV ou certificado ocultos (`cv_visible=false`):** a linha de botões continua alinhada, sem buraco. Teste na Tarefa 5.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/app/layout.tsx` (mod.) | Registrar as variáveis de fonte `--font-vt323` e `--font-jbmono` |
| `src/app/page.tsx` (mod.) | Injetar `<script>` de pré-boot antes de `<PortfolioClient>` |
| `src/app/globals.css` (mod.) | Remover as regras do público antigo (linhas 83–987: de "Custom Scrollbar" até o fim do `@media (max-width: 480px)`) e manter o resto |
| `src/app/PortfolioClient.tsx` (mod.) | Raiz `.term`, glow, observer, `handleNavClick` e composição das seções |
| `src/app/_portfolio/types.ts` | Interfaces movidas de `PortfolioClient.tsx` |
| `src/app/_portfolio/terminal.css` | Tokens, base, scanlines e todas as classes `t-*` |
| `src/app/_portfolio/motion.ts` | Chaves de storage, string `PREBOOT_SCRIPT` e hook `useReducedMotion` |
| `src/app/_portfolio/Dock.tsx` | Dock de navegação + botão de animações |
| `src/app/_portfolio/hero-layout.ts` | Quadro e posições das camadas |
| `src/app/_portfolio/HeroScene.tsx` | Camadas da cena, parallax e respiração |
| `src/app/_portfolio/Hero.tsx` | Texto, CTAs e status bar da capa |
| `src/app/_portfolio/PromptHeader.tsx` | Linha `lucas@viana:~$ <cmd>` digitada + título |
| `src/app/_portfolio/TermWindow.tsx` | Card "janela" com barra `● ● ●  <path>` |
| `src/app/_portfolio/sections/About.tsx`, `Skills.tsx`, `Projects.tsx`, `Contact.tsx` | Seções |
| `src/app/_portfolio/BootIntro.tsx` | Sequência de boot |
| `public/hero/{bg,shadows,lucas,tux,tabby}.webp` | Camadas da capa |

---

### Task 1: Fundação — fontes, tokens, raiz `.term`, limpeza do CSS antigo

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css` (remover linhas 83–987), `src/app/PortfolioClient.tsx`
- Create: `src/app/_portfolio/types.ts`, `src/app/_portfolio/terminal.css`

**Interfaces:**
- Produces:
  - `types.ts` exporta `Project`, `SkillCategory`, `Company`, `SocialLink` e `Profile` (copiados sem mudança de `PortfolioClient.tsx`).
  - Variáveis CSS globais `--font-vt323` e `--font-jbmono`.
  - Em `.term`:
    - cores: `--t-bg`, `--t-surface`, `--t-surface-2`, `--t-border`, `--t-phosphor`, `--t-glow`, `--t-cta`, `--t-purple`, `--t-ok`, `--t-text`, `--t-text-2`, `--t-muted`
    - fontes: `--t-display`, `--t-mono`, `--t-body`
    - `--t-dock-w: 128px`
  - Classe raiz `.term` no wrapper de `PortfolioClient`.

- [ ] **Step 1: Capturar o "antes" do admin.** Subir `preview_start {name:"dev"}`, abrir `http://localhost:3000/admin/login` e tirar uma screenshot de referência (o admin não pode mudar).
- [ ] **Step 2: Registrar as fontes em `layout.tsx`.**
  - `VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" })` e `JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" })`.
  - Acrescentar os dois `.variable` ao `className` do `<html>`.
  - Não remover Plus Jakarta nem Geist (o admin usa).
- [ ] **Step 3: Mover as interfaces para `types.ts`** e importá-las em `PortfolioClient.tsx`.
- [ ] **Step 4: Remover de `globals.css` as linhas 83–987.**
  - O bloco começa no comentário `/* Custom Scrollbar */` e termina no `}` do `@media (max-width: 480px)`.
  - Nada desse intervalo é usado pelo admin (conferido via grep: o admin só usa `.animate-shake`, `.animate-toast-in` e `.dark`, que ficam fora do intervalo).
- [ ] **Step 5: Criar `terminal.css`** com:
  - tokens em `.term` (valores das Global Constraints)
  - `html:has(.term) body { background: #0a0e13 }`
  - `.term` com `color: var(--t-text)`, `font-family: var(--t-body)` e `min-height: 100svh`
  - scrollbar fina na cor do fósforo
  - `.term::after` fixo com scanlines (`repeating-linear-gradient`, opacidade ≤ 0,04, `pointer-events:none`) e vinheta radial leve
  - `.bg-glow` refeito: fixo, `pointer-events:none`, `rgba(0,173,181,.04)`
  - estrutura de layout recriada em `t-*`: `.term .app-container`, `.term .content-area` (margem do dock, `max-width:1200px`), `.term .content-section` (`min-height:100vh`, `scroll-snap-align:start`)
  - revelação da seção (`opacity:0 → 1` e `translateY(16px) → 0` em 400 ms ao ganhar `.in-view`)
  - **exceção: `#home` sempre visível** (`opacity:1; transform:none`)
  - `@media (max-width:768px)`: `.content-area` sem margem lateral, padding `40px 16px 100px`, sem scroll-snap
- [ ] **Step 6: Importar `./_portfolio/terminal.css` em `PortfolioClient.tsx`** e trocar o fragmento raiz por `<div className="term">…</div>`. O glow e o observer continuam como estão.
- [ ] **Step 7: Verificar no navegador** (`/`, 1440×900). Asserções:
  - `getComputedStyle(document.querySelector('.term')).getPropertyValue('--t-phosphor').trim() === '#00adb5'`
  - `document.fonts.check('16px "VT323"') || [...document.fonts].some(f => f.family.includes('VT323'))` → `true`
  - `document.querySelector('#home').getBoundingClientRect().height >= innerHeight * 0.95`
  - `document.documentElement.scrollWidth <= innerWidth`
- [ ] **Step 8: Regressão do admin.** Recarregar `/admin/login` e comparar com a screenshot do Step 1: deve estar idêntico.
- [ ] **Step 9: Lint.** `npx eslint src/app/layout.tsx src/app/PortfolioClient.tsx src/app/_portfolio/types.ts` → 0 erros.
- [ ] **Step 10: Checkpoint** (não commitar sem pedido).

---

### Task 2: Preferência de movimento + script de pré-boot

**Files:**
- Create: `src/app/_portfolio/motion.ts`
- Modify: `src/app/page.tsx`, `src/app/_portfolio/terminal.css`

**Interfaces:**
- Produces (`motion.ts`):
  - `export const MOTION_KEY = "lv-reduce-motion"` (valor `"1"` = reduzido)
  - `export const BOOT_KEY = "lv-booted"` (`sessionStorage`)
  - `export const PREBOOT_SCRIPT: string`, uma IIFE que, envolta em try/catch:
    - define `document.documentElement.dataset.motion = "reduced"` se `matchMedia('(prefers-reduced-motion: reduce)').matches` ou `localStorage[MOTION_KEY]==="1"`; senão `"full"`;
    - define `dataset.boot = "1"` só se o movimento for `full`, `sessionStorage[BOOT_KEY]` não existir e `location.hash` estiver vazio;
    - **qualquer exceção ⇒ `motion="full"` e sem `boot`.**
  - `export function useReducedMotion(): { reduced: boolean; toggle: () => void }`:
    - lê `dataset.motion` após montar;
    - `toggle` inverte o valor, grava em `localStorage` (em try/catch) e atualiza `dataset.motion`.
- CSS: `:root[data-motion="reduced"] .term *, :root[data-motion="reduced"] .term *::before, :root[data-motion="reduced"] .term *::after { animation: none !important; transition: none !important; }`, e o mesmo dentro de `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 1: Teste (falha antes).** Em `/`:
  - `document.documentElement.dataset.motion` → hoje `undefined`.
  - Esperado após a tarefa: `"full"`.
- [ ] **Step 2: Implementar `motion.ts`.** Em `page.tsx`, retornar `<><script id="lv-preboot" dangerouslySetInnerHTML={{ __html: PREBOOT_SCRIPT }} /><PortfolioClient …/></>`. Server component, então o script roda antes da hidratação. O `<html>` já tem `suppressHydrationWarning`.
- [ ] **Step 3: Adicionar as regras de movimento reduzido** em `terminal.css`.
- [ ] **Step 4: Verificar no navegador.**
  - `document.documentElement.dataset.motion === "full"`
  - `localStorage.setItem("lv-reduce-motion","1"); location.reload()` → depois: `document.documentElement.dataset.motion === "reduced"` e `document.documentElement.dataset.boot === undefined`
  - `localStorage.removeItem("lv-reduce-motion")` para limpar.
- [ ] **Step 5: Teste do Review Focus 2.** Executar o script com storage quebrado:

  ```js
  const s = document.getElementById("lv-preboot").textContent;
  const d = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); }, configurable: true });
  delete document.documentElement.dataset.motion; eval(s);
  const r = document.documentElement.dataset.motion;
  Object.defineProperty(window, 'localStorage', d); r
  ```

  Esperado: `"full"`, sem exceção.
- [ ] **Step 6: Lint** em `motion.ts` e `page.tsx` → 0 erros.
- [ ] **Step 7: Checkpoint.**

---

### Task 3: Dock de navegação

**Files:**
- Create: `src/app/_portfolio/Dock.tsx`
- Modify: `src/app/PortfolioClient.tsx`, `src/app/_portfolio/terminal.css`

**Interfaces:**
- Consumes: `useReducedMotion()` (Tarefa 2), `SocialLink` (Tarefa 1).
- Produces: `export function Dock({ github, onNavigate }: { github?: SocialLink; onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void })`.
- Markup obrigatório:
  - `<aside class="t-dock">`
  - logo `LV<span class="t-blink">_</span>` com link para `#home`
  - 5 `<a class="nav-item" data-section="…">` com os mesmos ícones Font Awesome de hoje e `aria-label` (Início, Sobre, Habilidades, Projetos, Contato)
  - tooltips `<span class="t-dock__tip">cd sobre</span>` (`cd ~`, `cd sobre`, `cd skills`, `cd projetos`, `cd contato`)
  - `<button class="t-dock__motion" aria-pressed={reduced} aria-label="Reduzir animações">` com o ícone `fa-solid fa-wand-magic-sparkles`
  - GitHub (se visível) no rodapé

- [ ] **Step 1: Extrair o dock** de `PortfolioClient.tsx` para `Dock.tsx`, mantendo `handleNavClick` no pai, passado como `onNavigate`.
- [ ] **Step 2: Escrever o CSS.**
  - Desktop: fixo à esquerda (left/top/bottom 24px, largura 72px), fundo `--t-surface` a 85%, borda de 1px `--t-border`, raio 4px.
  - `.nav-item.active`: ícone em `--t-phosphor` e barra-cursor de 2px à esquerda.
  - Tooltip em `--t-mono` caixa alta.
  - Foco: `:focus-visible` com contorno de 1px `--t-glow` e offset de 2px.
  - `≤768px`: barra inferior (left/right/bottom 16px, altura 64px), logo oculto, tooltips ocultos, itens 44×44, botão de animações no fim da barra, GitHub oculto.
- [ ] **Step 3: Verificar a navegação** (1440×900):
  - clicar `[data-section=projetos]` → após ~800 ms, `document.querySelector('[data-section=projetos]').classList.contains('active')` e `location.hash==='#projetos'`
  - clicar `.t-dock__motion` → `document.documentElement.dataset.motion==='reduced'` e `aria-pressed==='true'`
  - clicar de novo para restaurar
- [ ] **Step 4: Teclado (Review Focus 4).** Focar o primeiro `.nav-item` e pressionar Tab 6 vezes → o `document.activeElement` percorre os 5 itens e depois o botão de movimento. `getComputedStyle(document.activeElement).outlineStyle !== 'none'`.
- [ ] **Step 5: Celular** (375×812):
  - `const r=document.querySelector('.t-dock').getBoundingClientRect(); r.bottom<=innerHeight && r.height===64`
  - todo `.nav-item` com `getBoundingClientRect().width>=44`
  - `document.documentElement.scrollWidth<=innerWidth`
- [ ] **Step 6: Lint e checkpoint.**

---

### Task 4: Cena da capa (camadas, parallax, respiração)

**Files:**
- Create: `public/hero/{bg,shadows,lucas,tux,tabby}.webp`, `src/app/_portfolio/hero-layout.ts`, `src/app/_portfolio/HeroScene.tsx`
- Modify: `src/app/PortfolioClient.tsx`, `src/app/_portfolio/terminal.css`

**Interfaces:**
- Produces:
  - `hero-layout.ts`:
    - `export const FRAME = { w: 1344, h: 768 } as const`
    - `export const LAYERS = { lucas: { x: 882, y: 128, w: 312, h: 600 }, tux: { x: 752, y: 544, w: 160, h: 190 }, tabby: { x: 1154, y: 536, w: 180, h: 200 } } as const` (valores de `positions.json`)
    - `export const pct = (v: number, of: number) => \`${(v / of) * 100}%\``
  - `export function HeroScene(): JSX.Element`, sem props. Renderiza fora do `<main>`, como primeiro filho de `.app-container`.

- [ ] **Step 1: Converter os assets** (fonte já aprovada, não regerar):

  ```bash
  C:/Users/lucas/sd-local/venv/Scripts/python -c "from PIL import Image; import os; s='C:/Users/lucas/sd-local/out/v4/layers_c'; d='C:/Users/lucas/portfolio3.0/public/hero'; os.makedirs(d,exist_ok=True); [Image.open(f'{s}/{n}.png').save(f'{d}/{n}.webp', lossless=True, method=6) for n in ('bg','shadows','lucas','tux','tabby')]"
  ```

  Conferir o total: `du -cb public/hero/*.webp | tail -1` < 358400. Se passar, salvar só o `bg` com `quality=90` (lossy) e reconferir.
- [ ] **Step 2: Implementar `HeroScene`.**
  - Estrutura: `<div class="t-scene" role="img" aria-label="Ilustração em pixel art: Lucas com suas duas gatas num terraço sobre uma cidade neon à noite">`, contendo `<div class="t-scene__frame">` com duas camadas de profundidade:
    - `.t-scene__bg`: `bg.webp`
    - `.t-scene__chars`: `shadows.webp`, `lucas.webp`, `tux.webp` e `tabby.webp`, cada personagem com `left/top/width/height` via `pct()`
  - Imagens com `next/image`, `unoptimized`, `alt=""`, `width`/`height` reais. O `bg` vai com `fetchPriority="high"` e `loading="eager"`.
  - Parallax:
    - `pointermove`, só se `matchMedia('(hover: hover)')` e o movimento for `full`, com rAF;
    - define `--px`/`--py` (−1..1) no `.t-scene`;
    - no celular, `scroll` define `--py` = progresso da rolagem dentro da cena.
  - Limpar os listeners no unmount.
- [ ] **Step 3: Escrever o CSS da cena.**
  - `.t-scene`: `position:absolute; inset:0 0 auto 0; height:100svh; overflow:hidden; container-type:size; z-index:0`.
  - `.t-scene__frame`: `position:absolute; right:0; bottom:0; aspect-ratio:1344/768; height:max(100cqh, calc(100cqw * 768 / 1344))`.
  - Todas as `img`: `image-rendering: pixelated`, `position:absolute`.
  - Movimento:
    - `.t-scene__bg`: `transform: scale(1.04) translate(calc(var(--px,0)*-6px), calc(var(--py,0)*-4px))`
    - `.t-scene__chars`: `translate(calc(var(--px,0)*-14px), calc(var(--py,0)*-8px))`
  - Respiração: `@keyframes t-breathe` de `translateY(0)` a `translateY(-2px)`. Lucas 4 s; gatas 3 s com `animation-delay` diferente.
  - Luzes: `@keyframes t-flicker` com `filter: brightness(1) → brightness(1.06)` a cada 6 s no `.t-scene__bg`.
  - Gradiente de texto (`.t-scene::before`): `linear-gradient(90deg, rgba(6,10,16,.82) 0%, rgba(6,10,16,.55) 38%, transparent 62%)`.
  - Tablet (≤1024): gradiente até 75% e opacidade inicial 0,9.
  - Celular (≤768):
    - `.t-scene` com `height:55svh`
    - gradiente vertical só na base (`transparent 60%` → `#0a0e13` 100%)
    - `#home` ganha `padding-top: calc(55svh - 40px)`
- [ ] **Step 4: Verificar** (1440×900):
  - `[...document.querySelectorAll('.t-scene img')].every(i => i.complete && i.naturalWidth > 0)`
  - `getComputedStyle(document.querySelector('.t-scene img')).imageRendering === 'pixelated'`
  - `const L=document.querySelector('.t-scene__chars img[src*="lucas"]').getBoundingClientRect(); L.right<=innerWidth && L.top>=0`
- [ ] **Step 5: Celular** (375×812):
  - `const L=document.querySelector('img[src*="lucas"]').getBoundingClientRect(), T=document.querySelector('img[src*="tux"]').getBoundingClientRect(); L.left>=0 && L.right<=innerWidth && T.left>=0`
  - `scrollWidth<=innerWidth`
  - Screenshot para conferir o enquadramento.
- [ ] **Step 6: Comparar o desktop** com `C:\Users\lucas\sd-local\out\v4\hero_c.png`: mesma composição, por screenshot.
- [ ] **Step 7: Lint e checkpoint.**

---

### Task 5: Texto da capa, PromptHeader e status bar

**Files:**
- Create: `src/app/_portfolio/PromptHeader.tsx`, `src/app/_portfolio/Hero.tsx`
- Modify: `src/app/PortfolioClient.tsx`, `src/app/_portfolio/terminal.css`

**Interfaces:**
- Consumes: `Profile`, `handleNavClick` (passado como prop), `recordClickAction`.
- Produces:
  - `export function Typed({ text, className }: { text: string; className?: string })`
    - renderiza `<span class="t-typed {className}" style={{"--n": text.length}}>{text}</span><span class="t-cursor" aria-hidden>▍</span>`
    - a animação roda quando um ancestral tem `.in-view` ou é `#home`
  - `export function PromptHeader({ command, title }: { command: string; title: string })`
    - renderiza `<div class="t-head"><p class="t-prompt"><span class="t-prompt__user">lucas@viana</span>:<span class="t-prompt__path">~</span>$ <Typed text={command}/></p><h2 class="t-head__title">{title}</h2></div>`
  - `export function Hero({ profile, onNavigate }: { profile: Profile; onNavigate: (e, id) => void })`
  - `export const CATS = { tux: "frajola", tabby: "rajada" }`, em `Hero.tsx`, até o Lucas informar os nomes.

- [ ] **Step 1: Escrever o CSS de digitação.**
  - `.t-typed`: `display:inline-block; overflow:hidden; white-space:nowrap; vertical-align:bottom; width:calc(var(--n)*1ch)`.
  - Em `.content-section:not(.in-view) .t-typed` (exceto em `#home`), `width:0`.
  - Em `.in-view`/`#home`: `animation: t-type calc(var(--n)*40ms) steps(var(--n)) both`.
  - `.t-cursor` pisca a 1 s.
  - **Título longo (Review Focus 1):** o nome usa `Typed` só no desktop. Com `≤768px` ou nomes acima de 22 caracteres, renderizar o nome com `white-space:normal`, sem animação de largura (aparecimento por fade).
- [ ] **Step 2: Implementar `Hero`**, na ordem do spec §6.2:
  1. prompt `./start.sh`
  2. "Olá, eu sou"
  3. `<h1 class="t-hero__name">` em `--t-display`, `clamp(56px, 8vw, 112px)`
  4. subtítulo em `--t-mono`
  5. descrição em `--t-body`
  6. ações: CV `.t-btn--cta` âmbar; Certificado e "Ver Projetos" `.t-btn--ghost` com borda `--t-phosphor`
  - Mesmas condições `cv_visible`/`certificate_bubble_visible`, os mesmos `href` `/api/download?url=…` e os mesmos `onClick`.
  - `.t-hero__actions` com `display:flex; flex-wrap:wrap; gap:12px`; no celular, botões com 100% de largura e `min-height:44px`.
- [ ] **Step 3: Status bar** (`<div class="t-status">` no rodapé de `#home`).
  - Conteúdo: `lucas@viana │ ● online │ [frajola] dormindo │ [rajada] caçando bugs │ HH:MM`.
  - Hora local `pt-BR` `2-digit`, atualizada a cada 30 s. Vazia no SSR, preenchida após montar, para evitar diferença na hidratação.
  - No celular, mostrar só `[frajola] dormindo │ [rajada] caçando bugs`.
- [ ] **Step 4: Verificar** (1440×900):
  - `document.querySelector('.t-hero__name').textContent.trim() === 'Lucas Viana'`
  - `document.querySelector('a.t-btn--cta').getAttribute('href').startsWith('/api/download?url=')`
  - `/\d{2}:\d{2}/.test(document.querySelector('.t-status').textContent)`
- [ ] **Step 5: Review Focus 1** (375×812):
  - `const h=document.querySelector('.t-hero__name'); h.textContent='Lucas Viana de Menezes Oliveira Santos'; document.documentElement.scrollWidth<=innerWidth` → `true`
  - depois, `location.reload()`
- [ ] **Step 6: Review Focus 5.**
  - `document.querySelector('a.t-btn--cta').remove(); const a=document.querySelector('.t-hero__actions'); [...a.children].every(c=>c.getBoundingClientRect().left>=a.getBoundingClientRect().left)` → `true`, sem buraco no flex
  - depois, recarregar
- [ ] **Step 7: Tablet** (768×1024): screenshot. O texto deve ficar legível sobre a cena, sem cobrir o rosto do Lucas.
- [ ] **Step 8: Lint e checkpoint.**

---

### Task 6: TermWindow, Sobre e Competências

**Files:**
- Create: `src/app/_portfolio/TermWindow.tsx`, `src/app/_portfolio/sections/About.tsx`, `src/app/_portfolio/sections/Skills.tsx`
- Modify: `src/app/PortfolioClient.tsx` (mover `skillCategories` para `Skills.tsx`), `terminal.css`

**Interfaces:**
- Consumes: `PromptHeader` (Tarefa 5), `Profile`, `Company`, `SkillCategory`.
- Produces:
  - `export function TermWindow({ path, accent, className, children }: { path: string; accent?: string; className?: string; children: React.ReactNode })`
    - `<article class="t-win {className}" style={{"--win-accent": accent ?? "var(--t-phosphor)"}}><header class="t-win__bar"><span class="t-win__dots" aria-hidden>●●●</span><span class="t-win__path">{path}</span></header><div class="t-win__body">{children}</div></article>`
  - `export function About({ profile, experience }: { profile: Profile; experience: Company[] })`
  - `export function Skills()`

- [ ] **Step 1: CSS do `TermWindow`.**
  - Fundo `--t-surface`, borda de 1px `--t-border`, raio 4px.
  - Barra com 32px de altura, fundo `--t-surface-2`, `--t-mono` 12px `--t-muted`.
  - Hover/foco-dentro: borda `--win-accent` e `box-shadow: 0 0 0 1px var(--win-accent), 0 0 24px -8px var(--win-accent)` em 200 ms.
- [ ] **Step 2: Sobre** (`PromptHeader command="whoami" title="Minha Trajetória"`).
  - Bio em `TermWindow path="~/sobre.md"`.
  - Empresas em `TermWindow path="~/log/empresas"`, com a lista duplicada em loop vertical (keyframe `t-scroll-y`, de `translateY(0)` a `translateY(-50%)`, 20 s linear infinito). Itens no formato `> {logo_text}` em `--t-mono`.
  - Grid `1.2fr .8fr` no desktop e 1 coluna em ≤1024.
  - Se `experience` estiver vazio, a janela de log não renderiza (comportamento atual).
- [ ] **Step 3: Competências** (`command="ls skills/" title="Especialidades & Diferenciais"`).
  - Cada categoria: `TermWindow path={\`~/skills/${id}/\`} accent={color}`.
  - Ícone da categoria e título com `/` no fim (`desenvolvimento/`).
  - Itens como árvore: `├── ` para todos menos o último, que usa `└── `, em `--t-mono` 14px.
  - Grid de 2 colunas no desktop e 1 em ≤768.
- [ ] **Step 4: Verificar** (rolar até `#sobre` e `#habilidades`):
  - `document.querySelectorAll('#habilidades .t-win').length === 4`
  - `document.querySelector('#habilidades .t-win li:last-child').textContent.startsWith('└── ')`
  - `document.querySelector('#sobre .t-prompt').textContent.includes('whoami')`
  - Em 375px: `document.documentElement.scrollWidth<=innerWidth`.
- [ ] **Step 5: Lint e checkpoint.**

---

### Task 7: Projetos, Contato e rodapé

**Files:**
- Create: `src/app/_portfolio/sections/Projects.tsx`, `src/app/_portfolio/sections/Contact.tsx`
- Modify: `src/app/PortfolioClient.tsx`, `terminal.css`

**Interfaces:**
- Consumes: `TermWindow`, `PromptHeader`, `Project`, `SocialLink`, `recordClickAction`.
- Produces: `export function Projects({ projects }: { projects: Project[] })` e `export function Contact({ socials }: { socials: SocialLink[] })`.

- [ ] **Step 1: Projetos** (`command="ls projetos/" title="Projetos em Destaque"`).
  - Cada projeto: `TermWindow path={\`~/projetos/${id}\`}`.
  - Conteúdo: categoria em label mono caixa alta, título, descrição, tags como `[React]` e as mesmas duas ações, com os mesmos `href`, `target`, `rel` e regras de ícone Figma/GitHub.
  - Hover: `translateY(-2px)` em 200 ms. Não depender de hover: as ações ficam sempre visíveis.
  - Grid `repeat(auto-fill, minmax(320px, 1fr))`; em ≤480px, `minmax(0, 1fr)`.
- [ ] **Step 2: Contato** (`command="./contato.sh" title="Vamos conversar?"`).
  - Mantém o parágrafo de introdução atual.
  - Cada rede visível vira um `<a class="t-contact">`, com os mesmos `href`/`onClick`/`target`.
  - Conteúdo: ícone, título, subtítulo e a seta `→`. A `--brand-color` aparece só em `:hover`/`:focus-visible`, na borda e no ícone.
  - Altura mínima de 56px.
- [ ] **Step 3: Rodapé.** Texto exato: `logout — sessão encerrada. Feito sob efeito de cafeína ☕ © 2026 Lucas Viana`, em `--t-mono` `--t-muted`, seguido de `<span class="t-cursor">▍</span>`.
- [ ] **Step 4: Verificar.**
  - `document.querySelectorAll('#projetos .t-win').length === 3` (fallback)
  - `document.querySelector('#projetos .t-win a[href="https://ecoaai.com"]') !== null`
  - `document.querySelectorAll('#contatos a.t-contact').length === 5`
  - `document.querySelector('#contatos footer').textContent.includes('sessão encerrada')`
  - Teclado: Tab chega a cada `.t-contact` com `outlineStyle !== 'none'`.
  - Em 375px e 768px: `scrollWidth<=innerWidth`.
- [ ] **Step 5: Lint e checkpoint.**

---

### Task 8: Boot intro

**Files:**
- Create: `src/app/_portfolio/BootIntro.tsx`
- Modify: `src/app/PortfolioClient.tsx`, `terminal.css`

**Interfaces:**
- Consumes: `BOOT_KEY` e o atributo `data-boot` (Tarefa 2).
- Produces: `export function BootIntro()`.
  - Sempre renderiza `<div class="t-boot" aria-hidden="true">` com as linhas:
    - `[ OK ] montando /home/lucas`
    - `[ OK ] iniciando gatas.service`
    - `[ OK ] carregando portfolio v3.0`
    - `pressione qualquer tecla para pular`
  - Visível só com `:root[data-boot="1"] .t-boot { display:flex }`; por padrão, `display:none`.

- [ ] **Step 1: Sequência e CSS.**
  - Cada linha surge com um atraso de 450 ms; depois vem o efeito "CRT liga" (`scaleY(.005)` → `1` com flash, 300 ms).
  - Fechamento:
    - aos 2,5 s, ou em `keydown`/`pointerdown`/`touchstart`, `delete document.documentElement.dataset.boot`
    - gravar `sessionStorage[BOOT_KEY]="1"` (try/catch)
    - remover os listeners
  - O conteúdo continua renderizado por baixo; a camada é `position:fixed; inset:0; z-index:1000; background:#000`.
- [ ] **Step 2: Verificar.**
  - `sessionStorage.removeItem('lv-booted'); location.reload()` → logo após a carga, `document.documentElement.dataset.boot === '1'` e `getComputedStyle(document.querySelector('.t-boot')).display==='flex'`.
  - Após 3 s: `dataset.boot === undefined` e `sessionStorage.getItem('lv-booted')==='1'`.
  - Recarregar: o boot não aparece (`dataset.boot === undefined` imediatamente).
- [ ] **Step 3: Pular pelo teclado (Review Focus 4).** Limpar a chave, recarregar e pressionar uma tecla logo em seguida → `dataset.boot === undefined` em < 300 ms.
- [ ] **Step 4: Âncora (Review Focus 3).** `sessionStorage.removeItem('lv-booted')`, navegar para `http://localhost:3000/#projetos` → `dataset.boot === undefined` e `#projetos` visível no topo.
- [ ] **Step 5: Lint e checkpoint.**

---

### Task 9: Verificação final do escopo alterado

**Files:** nenhum novo. Ajustes pontuais só se alguma verificação falhar.

- [ ] **Step 1: Varredura de textos visíveis.** Usar `get_page_text` em `/` e conferir acentuação, caracteres quebrados (`Ã`, `â€`, `�`) e textos mal formatados. Esperado: nenhum.
- [ ] **Step 2: Três larguras** (1440×900, 768×1024, 375×812):
  - em cada uma, rolar as 5 seções e tirar uma screenshot
  - `document.documentElement.scrollWidth<=innerWidth` em todas
  - console sem erros (`read_console_messages onlyErrors`)
- [ ] **Step 3: Animações reduzidas.** Ativar pelo dock e recarregar: o boot não aparece, `.t-typed` com largura total imediata e a cena sem `animation-name` ativo (`getComputedStyle(img).animationName==='none'`).
- [ ] **Step 4: Regressão do admin.** `/admin/login` deve estar idêntico à screenshot da Tarefa 1.
- [ ] **Step 5: Checagem de tipos.** `npx tsc --noEmit` → 0 erros.
  - Justificativa para o escopo global: há ~12 arquivos TS novos e o `next dev` não checa tipos.
  - Não rodar `next build` nem o lint global.
- [ ] **Step 6: Relatório no formato da regra do Lucas.** Cobrir:
  1. o que foi alterado
  2. a validação local
  3. os fluxos testados no navegador (não houve Playwright)
  4. as integrações verificadas (nenhuma alterada; `recordClickAction` preservado)
  5. o que não foi validado (produção/Vercel, Safari real, `prefers-reduced-motion` do SO)
  6. por que a validação não foi ampliada

  Não commitar: perguntar ao Lucas.
