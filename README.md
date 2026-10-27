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
  двухпанельный layout с зарезервированным правым action rail: New, Search,
  Apps, Activity и More. Центральный splitter можно перетаскивать, меняя ширину
  списка и диалога. На обычном телефоне mobile-layout включается по ширине.
- **Keyboard** — включает экранную wireframe-клавиатуру в mobile preview. Она
  также открывается по тапу на текстовое поле; клавиши вводят текст, `Hide` или
  `return` скрывают её. Composer и mobile bottom-sheet остаются над клавиатурой.
- **Empty** — non-destructive first-run preview: пустые Chats, Inbox, My Apps и
  My Boards. Повторное нажатие возвращает заполненное demo без потери его данных.

Прямой вход в mobile-диалог сразу с keyboard:

- **A:** `http://127.0.0.1:4173/?keyboard=1#/a/chats/agent:my:0`
- **C:** `http://127.0.0.1:4173/?keyboard=1#/c/chats/agent:my:0`

Другие прямые preview:

- **A + Mobile + FAB:** `http://127.0.0.1:4173/?viewport=mobile#/a/chats`
- **A + Fold + action rail/splitter:** `http://127.0.0.1:4173/?viewport=fold#/a/chats`
- **A + Mobile + My Apps/Boards/Store:** `http://127.0.0.1:4173/?viewport=mobile#/a/apps`
- **A + Mobile + command chips:** `http://127.0.0.1:4173/?viewport=mobile#/a/chats/agent:my:0`
- **A + Mobile + Empty:** `http://127.0.0.1:4173/?empty=1&viewport=mobile#/a/chats`

`Cmd/Ctrl K` — глобальный поиск по агентам, каналам, networks и Apps.
`Escape` — сначала скрыть keyboard, затем закрыть modal/fullscreen App или вернуться к списку.

## Что можно кликнуть

- **+ → Add agent:** агент автоматически попадает в `My Network`, без выбора
  Local/Network.
- **+ → New chat:** Gmail-like compose с recipient chips и поиском агентов.
  Без получателей — локальный Quick chat; один — существующий endless direct;
  несколько — новая группа. Можно смешивать local и network agents: внешние
  получают доступ только к этой группе, не ко всей `My Network`.
- **Quick chat → Details:** Archive, Link to agent и Become agent.
- **+ → Group agents / Create channel:** постоянная или task-bound группа.
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
- **Local agent composer:** кнопка текущей модели, mobile chips `Model: Auto`,
  `Apps`, `New chat` без обязательного ввода `/`, плюс slash-подсказки для
  клавиатурного сценария. Модель меняется только для текущего агента.
- **Компактный `+` рядом с фильтром и Fold rail → New:** Create / manage —
  New chat, New channel, Networks, Manage channels/networks. Networks предлагает
  Create a network или Join a network по invite/code; оба действия не меняют
  default My Network.
- **C · Inbox:** Approve, Retry, Finish, Read, Open source и Open task channel.
- **Mobile:** floating `+` для quick actions, нижние разделы, один экран диалога,
  один Back и отсутствие composer на экранах Apps/Directory/Inbox.
- **Fold:** контент не заезжает под правый action rail; центральная полоса
  перетаскивается и меняет ширину списка; Apps используют те же три раздела.

Демо содержит **118 agent records, 65 channels, 6 networks и 14 quick chats**.
В `More → Reset demo` всё возвращается к исходному состоянию.

## UX-карты

Обоснование и сравнение трёх моделей: **[ux-maps.md](ux-maps.md)**.

## Файлы

- `index.html` — статическая точка входа.
- `styles.css` — grayscale wireframe и container-query responsive layout.
- `model.js` — демо-данные и чистые правила предметной области.
- `views.js` — HTML-рендеринг экранов и modal flows.
- `app.js` — маршрутизация, действия, состояние и localStorage preferences.
- `tests/` — model/view tests и Chrome browser smoke.

## Проверка

```bash
npm run check
npm run test:browser
```

`test:browser` сам поднимает временный server и использует установленный
Chrome/Chromium. Путь к браузеру можно переопределить через `CHROME_BIN`.
Скрипт проходит основные A/C/mobile flows и сохраняет screenshots в `artifacts/`.
