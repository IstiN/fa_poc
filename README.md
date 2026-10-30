# Fa 2.0 UX POC

**Live demo:** https://istin.github.io/fa_poc/  
**Repository:** https://github.com/IstiN/fa_poc

Кликабельные wireframes для вариантов **A — Fa Messenger** и **C — Fa Pulse**.
Без framework, сборки, production visual design и backend-запросов. Mobile chat
содержит grayscale Liquid-Glass-like bubbles и floating composer для проверки UX.

## Открыть SPA

```bash
cd /Users/Uladzimir_Klyshevich/git/references/fa-pocs/fa2.0
npm start
```

Затем открыть **http://127.0.0.1:4173**.

`npm install` не требуется. Нужны только Python 3 для статического сервера и
современный браузер.

## Контролы прототипа

Верхняя серая полоса не является частью продуктового UX:

- **A · Messenger** — стартовый раздел Chats: агенты, quick chats и каналы в
  одном списке.
- **C · Pulse** — стартовый раздел Inbox: approvals, фоновые задачи, результаты
  и непрочитанное.
- **Desktop / Mobile / Fold** — переключение адаптивного preview. Fold показывает
  двухпанельный layout с правым navigation rail: Chats, Activity, Apps и
  Settings (New и Search — в шапке списка). Центральный splitter можно перетаскивать, меняя ширину
  списка и диалога. На обычном телефоне mobile-layout включается по ширине.
- **Keyboard** — включает экранную wireframe-клавиатуру в mobile preview. Она
  также открывается по тапу на текстовое поле; клавиши вводят текст, `Hide` или
  `return` скрывают её. Composer и mobile bottom-sheet остаются над клавиатурой.
- **Empty** — non-destructive first-run preview: пустые Chats, Inbox, My Apps и
  My Boards. Повторное нажатие возвращает заполненное demo без потери его данных.
- **Styleguide** — отдельная страница `styleguide.html`: четыре визуальных
  направления (Liquid Glass, Nebula, Graphite, Porcelain), light/dark, палитра с живым WCAG
  расчётом, типографика, иконки и логотипы (только inline SVG), галерея
  компонентов и воспроизводимые переходы с spec-строкой. Выбор направления
  сохраняется через `Choose this direction`.
- **Logos Lab** — отдельная страница `logos.html`: детальная лаборатория бренд-знака
  и логотипа Fa с 8 интерактивными секциями (канонический A1 Horizon, бабблы C1,
  развитие капсулы B3, пропорции F/a, ядро агента в отверстии "a").

Прямой вход в mobile-диалог сразу с keyboard:

- **A:** `http://127.0.0.1:4173/?keyboard=1#/a/chats/agent:my:0`
- **C:** `http://127.0.0.1:4173/?keyboard=1#/c/chats/agent:my:0`

Другие прямые preview:

- **A + Mobile + FAB:** `http://127.0.0.1:4173/?viewport=mobile#/a/chats`
- **A + Mobile + channel (без Model chip):** `http://127.0.0.1:4173/?viewport=mobile#/a/chats/channel:my:1`
- **A + Networks manager:** `http://127.0.0.1:4173/#/a/directory`
- **A + Fold + action rail/splitter:** `http://127.0.0.1:4173/?viewport=fold#/a/chats`
- **A + Mobile + My Apps/Boards/Store:** `http://127.0.0.1:4173/?viewport=mobile#/a/apps`
- **A + Mobile + command chips:** `http://127.0.0.1:4173/?viewport=mobile#/a/chats/agent:my:0`
- **A + Mobile + Empty:** `http://127.0.0.1:4173/?empty=1&viewport=mobile#/a/chats`
- **Styleguide направления:** `styleguide.html#direction=glass|nebula|graphite|porcelain&mode=light|dark`

`Cmd/Ctrl K` — глобальный поиск по агентам, каналам, networks и Apps.
`Escape` — сначала скрыть keyboard, затем закрыть modal/fullscreen App или вернуться к списку.

## Упрощённая навигация A (после UX review)

- **Один create-вход:** `New` в шапке списка (desktop/Fold) или floating New
  (mobile) → New chat, Add agent, New channel, Networks, Manage channels/networks.
- **Один поиск:** поле Search в шапке = `Cmd/Ctrl K`.
- **Фильтр-чипы вместо select:** All · Unread · Agents · Channels и network-чип
  (только если сетей больше одной). `Agents` заменяет вкладку Directory: сверху
  строка Add agent, далее все агенты, даже без переписки.
- **Разделы:** Chats · Activity · Apps (вкладки, mobile bottom nav, Fold rail).
  `More` убран; Networks, UX notes и Reset demo — в profile/settings (`Fa`).
- **Строки в 2 линии:** title + время + unread, preview. Network-тег только вне
  My Network, `task`-тег у task-bound каналов, точка на аватаре = Working.
  Автор канала — в Details.
- **Диалог:** статус по-человечески (`Online`, `Working…`, `4 agents`), одна
  кнопка ⓘ Details; Apps — в composer `+` (Files, Apps). Bubbles: свои справа.
  Model chip только у локальных агентов; placeholder `Message <name>`.
- Иконки — inline SVG (`currentColor`), у icon-only кнопок есть `aria-label`.

## Что можно кликнуть

- **New → Add agent** (или Chats → Agents → Add agent): агент автоматически попадает в `My Network`, без выбора
  Local/Network.
- **New → New chat:** Gmail-like compose с recipient chips и поиском агентов.
  Без получателей — локальный Quick chat; один — существующий endless direct;
  несколько — новая группа. Можно смешивать local и network agents: внешние
  получают доступ только к этой группе, не ко всей `My Network`.
- **Quick chat → Details:** Archive, Link to agent и Become agent.
- **New → New channel:** постоянная или task-bound группа.
- **Agent → Details → Create channel as agent:** канал создаёт сам агент.
- **Agent → Details → New task:** задача запускается в контексте конкретного
  агента, а не из глобального Quick actions. Агент создаёт task-channel и по
  умолчанию добавляет трёх других агентов; Finish архивирует канал.
- **Channel → Details → Invite agent:** QR code или CLI invite `fa agent join …`,
  инструкция по подключению, expiry и scope `This channel only`. Для уже
  существующего внешнего агента остаётся отдельный approval flow.
- **Apps разделены на три поверхности:** `My Apps` — установленные и running
  widgets, `My Boards` — личные раскладки виджетов, `Widget Store` — каталог с
  установкой в My Apps. `New app` создаёт custom app именно в My Apps. Можно
  создать board, открыть его и установить Calendar из Store. Запущенный App
  по-прежнему имеет side panel/fullscreen, Pin и явный Change context.
- **Local agent composer:** кнопка текущей модели, mobile chips `Model: Auto`
  и `Apps` без обязательного ввода `/`, плюс slash-подсказки `/model`, `/apps`,
  `/new`. Модель меняется только для текущего локального агента.
- **New → Networks / Manage networks:** Networks предлагает
  Create a network или Join a network по invite/code; оба действия не меняют
  default My Network.
- **C · Inbox:** Approve, Retry, Finish, Read, Open source и Open task channel.
- **Mobile:** floating New, нижние разделы Chats/Activity/Apps, один экран диалога,
  один Back и отсутствие composer на экранах Apps/Directory/Inbox.
- **Fold:** контент не заезжает под правый navigation rail; центральная полоса
  перетаскивается и меняет ширину списка; Apps используют те же три раздела.

Демо содержит **118 agent records, 65 channels, 6 networks и 14 quick chats**.
В `Fa (profile) → Reset demo` всё возвращается к исходному состоянию.

## UX-карты

Обоснование и сравнение трёх моделей: **[ux-maps.md](ux-maps.md)**.

## Файлы

- `index.html` — статическая точка входа.
- `styles.css` — grayscale wireframe и container-query responsive layout.
- `model.js` — демо-данные и чистые правила предметной области.
- `views.js` — HTML-рендеринг экранов и modal flows.
- `app.js` — маршрутизация, действия, состояние и localStorage preferences.
- `styleguide.html` + `styleguide.css` + `styleguide_ui.css` — страница четырёх
  визуальных направлений: tokens, typography, shape, иконки/логотипы,
  компоненты и motion demos.
- `logos.html` — отдельная витрина-лаборатория логотипов и фирменного знака Fa.
- `styleguide.js` — чистые данные направлений и WCAG-математика (тестируется в Node).
- `styleguide_icons.js` — hand-drawn inline SVG иконки и логотипы Fa.
- `styleguide_app.js` — рендеринг и взаимодействие страницы styleguide.
- `tests/` — model/view/styleguide tests, Chrome browser smoke и styleguide smoke.

## Проверка

```bash
npm run check
npm run test:browser
npm run test:styleguide
```

`test:browser` и `test:styleguide` сами поднимают временный server и используют установленный
Chrome/Chromium. Путь к браузеру можно переопределить через `CHROME_BIN`.
Скрипт проходит основные A/C/mobile flows и сохраняет screenshots в `artifacts/`.
