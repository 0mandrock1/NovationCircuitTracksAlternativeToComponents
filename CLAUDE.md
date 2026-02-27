# CLAUDE.md — Novation Circuit Tracks Web UI

## Что это за проект

Веб-приложение — альтернатива Novation Components для устройства **Novation Circuit Tracks**.
Предоставляет полноценный браузерный интерфейс для редактирования патчей, управления сэмплами,
настройки MIDI и работы с сессиями через Web MIDI API.

Стек: **Vue 3** (frontend) + **Node.js** (backend/MIDI-мост).

---

## Структура вкладок UI

Интерфейс повторяет логику Novation Components и расширяет её.
Навигация — горизонтальная панель вкладок сверху.

### 1. Patches (Патчи)

Редактор синтезаторных патчей для Synth Track 1 и Synth Track 2.

**Подвкладки внутри Patches:**

| Подвкладка    | Содержимое |
|---------------|------------|
| **Synth**     | Оба осциллятора, фильтр (cutoff/resonance), огибающие (ADSR amp + filter), LFO, хорус, дисторшн |
| **Macros**    | 8 макро-назначений, матрица модуляции (20 слотов), drag-and-drop routing |
| **Effects**   | Ревербератор, дилей (16 пресетов дилея, 8 пресетов реверба), параметры send/return |
| **Modulation**| Полная модуляционная матрица: 3 ADSR + 2 LFO + 8 Macro → любой параметр |

**Боковая панель Patches:**
- Список 64 патчей текущего банка
- Кнопки: загрузить патч на устройство, скачать .syx, переименовать, удалить
- Импорт .syx файла (одиночный патч или банк из 64)

---

### 2. Samples (Сэмплы)

Управление барабанными сэмплами для 4 drum-треков.

**Элементы:**
- Список сэмплов текущего пака (64 слота)
- Воспроизведение сэмпла в браузере (preview)
- Действия с сэмплом: переименовать, заменить файлом (WAV/AIFF/MP3 → авто-конвертация в 48kHz Mono 16-bit), отправить на устройство, скачать, удалить
- Drag-and-drop для замены сэмплов

---

### 3. Sequencer (Секвенсор)

Визуальный редактор паттернов для всех 8 треков.

**Элементы:**
- Сетка шагов: 16 или 32 шага на паттерн
- Треки: Synth 1, Synth 2, MIDI 1–4, Drum 1–4 — каждый своей строкой
- Для каждого шага: velocity, длительность ноты, вероятность (probability), микротайминг (off-grid)
- Мьютирование треков
- Список паттернов (до 8 на сессию), переключение между ними

---

### 4. Mixer (Микшер)

Управление уровнями и эффектами в реальном времени.

**Элементы:**
- 8 вертикальных фейдеров — volume для каждого трека
- Pan (панорама) для каждого трека
- Кнопки Mute/Solo на каждый трек
- Send-уровни на Reverb и Delay для каждого трека
- Отображение состояния 8 макро-кноб в реальном времени

---

### 5. MIDI Settings (MIDI-настройки)

Конфигурация MIDI-треков и шаблонов.

**Элементы:**

| Блок              | Содержимое |
|-------------------|------------|
| **MIDI Templates**| 8 шаблонов, каждый с назначением CC для 8 макро-кноб (по умолчанию CC 1,2,5,11,12,13,71,74) |
| **Track Routing** | MIDI-канал для каждого из 4 MIDI-треков (каналы 1–15, канал 16 зарезервирован) |
| **Clock Sync**    | Настройки синхронизации: MIDI clock in/out, sync out (3.5mm) |
| **DIN / USB**     | Выбор источника/назначения для каждого MIDI-порта |

---

### 6. Sessions (Сессии / Проекты)

Управление проектами и паками.

**Элементы:**
- Сетка 64 слота проектов (как на устройстве)
- Переименование, копирование, удаление проекта
- Экспорт/импорт проекта (.syx)
- Паки: список до 32 паков, экспорт на microSD
- Сцены (Scenes): список сцен внутри проекта, просмотр привязанных паттернов

---

### 7. Device (Устройство)

Системные настройки подключённого Circuit Tracks.

**Элементы:**
- Статус подключения (Web MIDI API)
- Выбор MIDI-порта
- Версия прошивки
- Обновление прошивки (firmware update через SysEx)
- Глобальные настройки: транспонирование, tempo, swing

---

## Архитектура приложения

```
browser (Vue 3)
    │
    │  WebSocket / REST
    ▼
Node.js server (backend)
    │
    │  node-midi / easymidi
    ▼
Circuit Tracks (USB MIDI / MIDI DIN)
```

**Почему нужен Node.js-бэкенд:**
Web MIDI API работает только в Chrome/Opera и имеет ограничения на SysEx.
Node.js-сервер обеспечивает надёжную передачу SysEx и работает как мост.
Фронтенд общается с ним через WebSocket (реалтайм) и HTTP REST (управление файлами).

---

## Структура проекта

```
/
├── CLAUDE.md
├── README.md
├── package.json                  # root: запуск dev/build обоих частей
│
├── client/                       # Vue 3 приложение
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/
│       │   └── index.js          # vue-router: маршруты вкладок
│       ├── stores/               # Pinia stores
│       │   ├── device.js         # статус подключения, MIDI-порт
│       │   ├── patches.js        # список патчей, текущий патч
│       │   ├── samples.js        # список сэмплов
│       │   ├── sequencer.js      # паттерны, шаги, треки
│       │   ├── mixer.js          # volume, pan, mute, sends
│       │   ├── midi.js           # MIDI-шаблоны, роутинг
│       │   └── sessions.js       # проекты, паки, сцены
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppHeader.vue
│       │   │   ├── TabNav.vue
│       │   │   └── StatusBar.vue
│       │   ├── patches/
│       │   │   ├── PatchList.vue
│       │   │   ├── SynthEditor.vue
│       │   │   ├── MacroEditor.vue
│       │   │   ├── EffectsEditor.vue
│       │   │   └── ModMatrix.vue
│       │   ├── samples/
│       │   │   ├── SampleList.vue
│       │   │   └── SampleItem.vue
│       │   ├── sequencer/
│       │   │   ├── StepGrid.vue
│       │   │   ├── TrackRow.vue
│       │   │   └── StepCell.vue
│       │   ├── mixer/
│       │   │   ├── MixerChannel.vue
│       │   │   └── FxSends.vue
│       │   ├── midi/
│       │   │   ├── TemplateEditor.vue
│       │   │   └── TrackRouting.vue
│       │   ├── sessions/
│       │   │   ├── ProjectGrid.vue
│       │   │   └── SceneList.vue
│       │   ├── device/
│       │   │   └── DevicePanel.vue
│       │   └── ui/               # переиспользуемые примитивы
│       │       ├── Knob.vue
│       │       ├── Fader.vue
│       │       ├── StepButton.vue
│       │       ├── Toggle.vue
│       │       └── Tooltip.vue
│       ├── views/
│       │   ├── PatchesView.vue
│       │   ├── SamplesView.vue
│       │   ├── SequencerView.vue
│       │   ├── MixerView.vue
│       │   ├── MidiView.vue
│       │   ├── SessionsView.vue
│       │   └── DeviceView.vue
│       └── assets/
│           ├── styles/
│           │   ├── main.css
│           │   ├── variables.css  # цвета, размеры
│           │   └── components.css
│           └── icons/
│
└── server/                       # Node.js бэкенд
    ├── package.json
    ├── index.js                  # точка входа, HTTP + WebSocket сервер
    ├── midi/
    │   ├── MidiManager.js        # обнаружение портов, подключение
    │   ├── SysExParser.js        # разбор входящих SysEx сообщений
    │   ├── SysExBuilder.js       # построение исходящих SysEx сообщений
    │   └── constants.js          # SysEx ID, CC номера, константы
    ├── routes/
    │   ├── patches.js            # REST: GET/POST /api/patches
    │   ├── samples.js            # REST: GET/POST /api/samples
    │   └── sessions.js           # REST: GET/POST /api/sessions
    └── ws/
        └── WebSocketHandler.js   # реалтайм MIDI события → клиент
```

---

## Стандарты написания кода

### Vue 3

- **Всегда** использовать `<script setup>` (Composition API).
- Не использовать Options API (`data()`, `methods:`, `computed:` как опции объекта).
- Один компонент = одна ответственность. Если компонент >200 строк — разбить.
- Имена файлов компонентов: `PascalCase.vue`.
- Props объявлять через `defineProps` с типами:
  ```js
  const props = defineProps({
    patch: { type: Object, required: true },
    index: { type: Number, default: 0 }
  })
  ```
- Emit объявлять через `defineEmits`:
  ```js
  const emit = defineEmits(['update:patch', 'select'])
  ```
- Для двустороннего связывания использовать `v-model` с `defineModel()` (Vue 3.4+).
- Вычисляемые значения — `computed()`, реактивные переменные — `ref()` / `reactive()`.
- Сайд-эффекты — `watch()` / `watchEffect()`, очищать в `onUnmounted()`.
- CSS — `<style scoped>` внутри компонента. Глобальные переменные — в `variables.css`.
- Не использовать `any` для пропсов — всегда указывать конкретный тип.

**Пример компонента:**
```vue
<script setup>
import { ref, computed } from 'vue'
import { usePatchesStore } from '@/stores/patches'

const props = defineProps({
  patchIndex: { type: Number, required: true }
})

const emit = defineEmits(['select'])

const store = usePatchesStore()
const patch = computed(() => store.patches[props.patchIndex])

function handleSelect() {
  emit('select', props.patchIndex)
}
</script>

<template>
  <button class="patch-item" @click="handleSelect">
    {{ patch.name }}
  </button>
</template>

<style scoped>
.patch-item {
  /* ... */
}
</style>
```

### Pinia (State Management)

- Один store = один домен (patches, samples, sequencer и т.д.).
- Использовать `defineStore` с Composition API синтаксисом (не Options):
  ```js
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'

  export const usePatchesStore = defineStore('patches', () => {
    const patches = ref([])
    const activePatchIndex = ref(0)

    const activePatch = computed(() => patches.value[activePatchIndex.value])

    function setPatch(index, data) {
      patches.value[index] = data
    }

    return { patches, activePatchIndex, activePatch, setPatch }
  })
  ```
- Асинхронные операции (запросы к серверу) — методы внутри store, не в компонентах.
- Не мутировать state напрямую снаружи store.

### Vue Router

- Каждая вкладка = отдельный маршрут (`/patches`, `/samples`, `/sequencer` и т.д.).
- Использовать `createRouter` + `createWebHashHistory` (для работы без сервера).
- Lazy-loading для всех View-компонентов:
  ```js
  { path: '/patches', component: () => import('@/views/PatchesView.vue') }
  ```

### Node.js (сервер)

- Использовать ES-модули (`import`/`export`), указать `"type": "module"` в `package.json`.
- HTTP-сервер: **Express.js**.
- WebSocket: **ws** (пакет `ws`, не socket.io — проще и легче).
- MIDI: **easymidi** или **midi** (node-midi).
- Структура роутов Express — отдельные файлы в `server/routes/`.
- Обработка ошибок — middleware `(err, req, res, next)` в конце цепочки.
- Все MIDI-константы (SysEx ID, номера CC, таймауты) — в `server/midi/constants.js`.

**SysEx правила:**
- Минимальная задержка между SysEx-сообщениями: **20 мс**.
- Между байтами внутри одного сообщения задержка не нужна.
- Ответы устройства всегда приходят на USB-порт, независимо от источника запроса.
- Формат одиночного патча: SysEx `Replace Current Patch` (Synth 1 = канал 1, Synth 2 = канал 2).
- Формат банка: 64 последовательных `Replace Patch` сообщения, номера 0–63.

### Общие правила

- Не добавлять `console.log` в продакшн-код. Для отладки использовать условный `import.meta.env.DEV`.
- Не создавать файлы-хелперы для одноразовых операций.
- Не добавлять обработку ошибок для сценариев, которые не могут произойти.
- Комментарии — только там, где логика неочевидна.
- Именование: переменные и функции — `camelCase`, константы — `UPPER_SNAKE_CASE`, компоненты — `PascalCase`.

---

## План разработки (поэтапно)

### Этап 1 — Фундамент (основа проекта)

**Цель:** рабочий скелет с подключением к устройству.

- [ ] Инициализация `client/` через `npm create vite@latest` (Vue 3)
- [ ] Инициализация `server/` — Express + ws сервер
- [ ] Установка зависимостей: `pinia`, `vue-router`, `easymidi`, `express`, `ws`
- [ ] Настройка Vite proxy: `/api` → `localhost:3000`, WebSocket проксирование
- [ ] `MidiManager.js` — обнаружение MIDI-портов, подключение к Circuit Tracks
- [ ] WebSocket канал: сервер → клиент (MIDI события в реальном времени)
- [ ] `DeviceView.vue` — отображение статуса подключения, выбор порта
- [ ] `useDevice` store — статус, имя порта, версия прошивки
- [ ] `TabNav.vue` + `AppHeader.vue` + vue-router маршруты для всех вкладок

**Результат:** браузер видит Circuit Tracks, показывает статус подключения.

---

### Этап 2 — Патчи: список и загрузка

**Цель:** просмотр и загрузка патчей из банка устройства.

- [ ] `SysExBuilder.js` — `buildCurrentPatchDumpRequest()`, разбор ответа
- [ ] `SysExParser.js` — парсинг входящего SysEx в объект патча
- [ ] `usePatchesStore` — хранение 64 патчей, активный патч
- [ ] REST endpoint `GET /api/patches` — запрос всех патчей с устройства
- [ ] `PatchList.vue` — список из 64 патчей с именами
- [ ] Загрузка патча на устройство по клику (SysEx `Replace Current Patch`)
- [ ] Импорт .syx файла (одиночный патч / банк), экспорт .syx

**Результат:** можно видеть все патчи в браузере и переключать их на устройстве.

---

### Этап 3 — Редактор патча (Synth Editor)

**Цель:** визуальное редактирование всех параметров синтезатора.

- [ ] Определить полную структуру данных патча (все параметры синтезатора)
- [ ] `Knob.vue` — интерактивная ручка (mouse drag / touch), min/max/value
- [ ] `SynthEditor.vue` — осцилляторы (OSC A/B: waveform, pitch, detune, pulse width)
- [ ] Фильтр: cutoff, resonance, drive, тип фильтра
- [ ] Огибающие: Filter Env ADSR, Amp Env ADSR
- [ ] LFO: waveform, speed, depth, destination
- [ ] Хорус и дисторшн: on/off, параметры
- [ ] Отправка изменений на устройство в реальном времени (MIDI CC / SysEx per-parameter)
- [ ] `MacroEditor.vue` — 8 слотов макро с текущими значениями

**Результат:** полноценный редактор патча с визуальными контролами.

---

### Этап 4 — Матрица модуляции

**Цель:** drag-and-drop редактор модуляции (20 слотов).

- [ ] `ModMatrix.vue` — таблица 20 строк: source, destination, depth
- [ ] Источники: 3 Env, 2 LFO, 8 Macro (13 источников)
- [ ] Назначения: все модулируемые параметры синтезатора
- [ ] Drag-and-drop (источник → параметр)
- [ ] `EffectsEditor.vue` — reverb/delay пресеты, параметры

**Результат:** полная редакция модуляций патча.

---

### Этап 5 — Сэмплы

**Цель:** управление барабанными сэмплами.

- [ ] `useSamplesStore` — список 64 сэмплов текущего пака
- [ ] REST endpoint `GET /api/samples`, `POST /api/samples/:id`
- [ ] `SampleList.vue` + `SampleItem.vue`
- [ ] Воспроизведение сэмпла в браузере (Web Audio API)
- [ ] Загрузка нового файла: drag-and-drop / file picker
- [ ] Авто-конвертация: ffmpeg на сервере (WAV/AIFF/MP3 → 48kHz Mono 16-bit)
- [ ] Отправка сэмпла на устройство, скачивание, удаление, переименование

**Результат:** полное управление барабанными сэмплами.

---

### Этап 6 — Секвенсор

**Цель:** визуальный редактор паттернов.

- [ ] `useSequencerStore` — паттерны, треки, шаги (16/32 шагов)
- [ ] `StepGrid.vue` — сетка 8 треков × 32 шага
- [ ] `StepCell.vue` — клик = вкл/выкл, правый клик = параметры шага
- [ ] Параметры шага: velocity, длительность, probability, microtiming
- [ ] Переключение паттернов (до 8 паттернов)
- [ ] Синхронизация с устройством в реальном времени (MIDI clock)
- [ ] Подсветка текущего шага при воспроизведении

**Результат:** визуальный секвенсор с возможностью редактирования паттернов.

---

### Этап 7 — Микшер

**Цель:** управление уровнями и эффектами.

- [ ] `useMixerStore` — volume, pan, mute, FX sends для 8 треков
- [ ] `Fader.vue` — вертикальный фейдер (mouse/touch drag)
- [ ] `MixerChannel.vue` — один канал: фейдер + pan + mute + sends
- [ ] Отправка MIDI CC на устройство при изменении
- [ ] Получение изменений от устройства (8 макро-кноб → обновление UI)

**Результат:** браузерный микшер, синхронизированный с устройством.

---

### Этап 8 — MIDI-настройки

**Цель:** конфигурация MIDI-треков и шаблонов.

- [ ] `useMidiStore` — 8 шаблонов, роутинг треков
- [ ] `TemplateEditor.vue` — таблица назначений CC для 8 макро
- [ ] `TrackRouting.vue` — MIDI-канал для каждого из 4 MIDI-треков
- [ ] Синхронизация настроек с устройством через SysEx

**Результат:** полная настройка MIDI без погружения в меню устройства.

---

### Этап 9 — Сессии

**Цель:** управление проектами и паками.

- [ ] `useSessionsStore` — 64 проекта, 32 пака, сцены
- [ ] `ProjectGrid.vue` — сетка 8×8 проектов (цвета как на устройстве)
- [ ] Переименование, копирование, удаление проекта
- [ ] Экспорт/импорт проекта (.syx)
- [ ] `SceneList.vue` — список сцен с привязанными паттернами
- [ ] Управление паками: экспорт на microSD

**Результат:** полный менеджер сессий.

---

### Этап 10 — Полировка

**Цель:** финальные улучшения.

- [ ] Адаптация под разные размеры экрана (responsive)
- [ ] Горячие клавиши (keyboard shortcuts)
- [ ] Тёмная тема (CSS variables)
- [ ] Обработка ошибок: потеря соединения, неверный SysEx, таймауты
- [ ] Индикатор активности MIDI (входящие/исходящие сообщения)
- [ ] Документация для пользователя (README)

---

## Команды разработки

```bash
# Установить зависимости (root + client + server)
npm install

# Запустить dev-режим (client + server параллельно)
npm run dev

# Только клиент
npm run dev:client

# Только сервер
npm run dev:server

# Сборка для продакшна
npm run build
```

---

## Полезные ссылки

- [Circuit Tracks Programmer's Reference v3](https://fael-downloads-prod.focusrite.com/customer/prod/downloads/circuit_tracks_programmer_s_reference_guide_v3.pdf) — SysEx спецификация
- [Circuit Tracks User Guide v3](https://fael-downloads-prod.focusrite.com/customer/prod/downloads/circuit_tracks_user_guide_v3_en.pdf) — описание всех функций
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [Vue 3 Docs](https://vuejs.org/guide/introduction)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
