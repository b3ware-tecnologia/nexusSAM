# Symantec Endpoint Security Portal — Design Reference para nexusSAM

## Paleta de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| Sidebar bg | `#213C60` (rgb 33, 60, 96) | Painel de navegação principal |
| Sidebar links | `#FFFFFF` | Texto dos links na sidebar |
| Top Header bg | `#FFFFFF` | Barra superior com logo + usuário |
| Page bg | `#F2F2F2` (rgb 242, 242, 242) | Fundo da área de conteúdo |
| Primary Blue | `#366BB2` (rgb 54, 107, 178) | Botões CTA primários |
| Body text | `#212424` (rgb 33, 36, 36) | Texto padrão |
| Input border | `#6E7070` (rgb 110, 112, 112) | Bordas de inputs |
| Card/Input bg | `#FFFFFF` | Fundo de cards e inputs |
| Link hover active | `#19385C` | Azul mais escuro para hover |

## Tipografia

- **Família:** `Noto-Sans, "Noto Sans", sans-serif`
- **Body:** 14px, cor `#212424`
- **Sidebar links:** 16px, weight 400, cor `#FFFFFF`
- **H3 Headings:** 18px, weight 400, cor `#212424`
- **Table headers:** 14px (default body)

## Layout

```
┌──────────────────────────────────────────────────────┐
│  Top Header (46px, bg: #FFF)                         │
│  [Logo]                    [Tenant] [User ▼]         │
├──────────┬───────────────────────────────────────────┤
│ Sidebar  │  Content Area (bg: #F2F2F2)              │
│ 300px    │                                           │
│ bg:#213C60│  ┌──────────────────────────────┐        │
│          │  │  Sub-nav                      │        │
│ HOME     │  │  [Item1] [Item2] [Item3]      │        │
│ MY TASKS │  ├──────────────────────────────┤        │
│ INVEST.  │  │  KPI Cards Row                │        │
│ DEVICES  │  │  [Card1] [Card2] [Card3]      │        │
│ DISCOVER │  ├──────────────────────────────┤        │
│ POLICIES │  │  Filters | Table              │        │
│ INCIDENTS│  │  [Filter Panel] [Data Grid]   │        │
│ REPORTS  │  │                [Pagination]   │        │
│ INTEG.   │  └──────────────────────────────┘        │
│ QUICK    │                                           │
│ SETTINGS │                                           │
├──────────┴───────────────────────────────────────────┤
│  Footer: Copyright © 2026 Broadcom. All rights       │
│  reserved. | License Agreement | Privacy Policy      │
└──────────────────────────────────────────────────────┘
```

## Navegação

### Sidebar Principal (300px, fundo azul escuro)
- HOME, MY TASKS, INVESTIGATE, DEVICES, DISCOVERED ITEMS, POLICIES, INCIDENTS AND ALERTS, REPORTS AND TEMPLATES, INTEGRATION, QUICK SETUP, SETTINGS
- Texto branco 16px, uppercase no active state
- Active item com highlight

### Sub-navigation (por seção)
- Abaixo do título da página, estilo tabs/menus horizontais
- Ex: Devices → Managed Devices | Unmanaged Devices | Device Groups
- Ex: Policies → Policies | Policy Groups | Policy Components | Policy Target Rules

## Padrões de Página

### 1. Dashboard (Home)
- **Widgets/KPIs:** Cards com métricas em grid (Threat Protection, Agent Security Status, Open Incidents)
- **Gráficos:** PieChart, BarChart, AreaChart (Recharts ou similar)
- **Time range selectors:** Checkbox group (24h, 7d, 30d, 90d, 180d, 365+d)
- **Tabelas compactas:** Top 5 latest Incidents, Recent Devices, Recent Security Events
- **Seções:** MITRE ATT&CK Tactics, Adaptive Protection Insights, SEP Version Distribution, OS Distribution, Seat Count/Usage Status, Device Management

### 2. Data Tables (Devices, Policies, Reports, Discovered Items, Incidents)
- **Filter Panel (esquerda):**
  - "Filter by" heading
  - Quick Filters / Custom Filter toggle
  - Boolean operators: ( ) AND OR
  - Categorias de filtro expansíveis
  - "Run Query" button
- **Action Buttons (acima da tabela):**
  - Create/Add button (primary blue)
  - Download Grid (export)
  - Import (quando aplicável)
  - Invite Users, Installation Package (específicos)
- **Column Selector:** "N of M Columns Selected" — dropdown para selecionar colunas
- **Table:**
  - Select All checkbox no header
  - Sort columns (clicar no header)
  - Row clicável (abre detalhes)
  - Striped/hover rows
- **Pagination:**
  - First, Previous, [page number], Next, Last
  - Items per page: 25 (dropdown)

### 3. Card Grid Pages (Settings, Integration)
- Grid de cards com ícone + heading (H3, 18px) + descrição
- Card clicável (link para página de configuração)
- Layout responsivo, 2-3 colunas

### 4. Journey / Quick Setup
- Progress steps: "N of M steps completed"
- Cards de setup: Endpoint Security, Antimalware, EDR, Network Integrity, etc.
- Quick actions: Import policies, Go to My Tasks, Create installation package
- Go to Dashboard button (primary blue)

## Componentes Específicos

### Botão Primário
- bg: `#366BB2`, text: `#FFFFFF`
- border-radius: 3px
- padding: 10px 24px 10px 20px
- font-size: ~14px

### Input Fields
- bg: `#FFFFFF`, border: `1px solid #6E7070`
- border-radius: 0px
- font-size: 14px
- padding: 4.9px 7px

### Tabela
- Header bg: herda de página
- Header text: default body cor
- Font-weight: normal (não bold)
- Row hover: highlight sutil
- Border: bordas horizontais finas

### KPI Cards
- Grid flexível
- Número grande + label
- Cores de status (Secure/At Risk/Compromised)

### Status Badges
- Secure: verde
- At Risk: laranja
- Compromised: vermelho
- Online/Offline: verde/cinza

## Estrutura de Navegação por Seção

| Seção | Sub-nav | Tipo de Página |
|-------|---------|----------------|
| Home | — | Dashboard com KPIs |
| My Tasks | — | Journey/Quick Setup |
| Investigate | Cloud Database, Endpoint, Script Library | Filter + Table |
| Devices | Managed Devices, Unmanaged Devices, Device Groups | Filter + Table |
| Discovered Items | Files, Mobile Applications, Mobile Vulnerabilities | KPI cards + Filter + Table |
| Policies | Policies, Policy Groups, Policy Components, Policy Target Rules, AD Domain Settings, Adaptive Protection, Adaptive EAR Rules | Filter + Table |
| Incidents | Incidents, Incident Rules, Alerts, Alert Rules | Filter + Table |
| Reports | Report Templates, Generated Reports, Report Recipients | Filter + Table |
| Integration | — | Card Grid |
| Quick Setup | — | Journey/Setup |
| Settings | — | Card Grid |

## Fluxo de Filtragem (Padrão)
1. Selecione Quick Filters ou Custom Filter
2. Adicione condições com boolean operators (AND/OR)
3. Ou use os accordions de filtro pré-definidos
4. Clique "Run Query"
5. Resultados aparecem na tabela à direita
6. Ajuste colunas visíveis com column selector
7. Exporte com Download Grid
