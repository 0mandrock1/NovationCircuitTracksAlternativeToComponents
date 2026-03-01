# FUTUREWORK.md — Промпты для Claude Code

Этот файл содержит подробные задачи для отдельных сессий Claude Code.
Каждый раздел — самодостаточный промпт. Вставляй его в новый разговор с Claude Code.

---

## ~~1. Исправить patch fetch — он не работает~~ ✅ DONE (commit 6668ea4)

**Контекст проекта:** Vue 3 + Pinia клиент (Web MIDI API) + Node.js сервер (easymidi).
Стек: `client/` и `server/`, запуск через `npm run dev` из корня.

**Проблема:**
`fetchAllFromDevice()` в `client/src/stores/patches.js` вызывает
`sendSysExAndWait(buildRequestPatchDump(index), CMD_PATCH_DUMP, timeout)`.
Функция либо таймаутится, либо возвращает неожиданный ответ. В UI кнопка
"↓ Fetch All" запускается, прогресс идёт, но все патчи остаются `hasData: false`.

**Что нужно сделать:**

1. **Добавь отладку прямо в `client/src/composables/useMidi.js`** в функцию
   `onMidiMessage`: при приходе любого SysEx-сообщения логируй его в консоль
   (только в `import.meta.env.DEV`). Нужно увидеть, что реально присылает
   устройство в ответ на запрос патча.

2. **Проверь формат SysEx-запроса** в `client/src/midi/sysex.js`:
   `buildRequestPatchDump` строит `[F0, 00, 20, 29, 01, 64, 0x40, bank, patchIndex, F7]`.
   Сверь с Circuit Tracks Programmer's Reference v3 (ссылка в CLAUDE.md) — убедись,
   что `CMD_REQUEST_PATCH_DUMP = 0x40` правильный, а bank и patchIndex стоят в
   нужном порядке.

3. **Проверь матчинг ответа** в `useMidi.js`: `pendingResponses` ищет ответ по
   `data[6]` (7-й байт). Ответ от устройства: `[F0, 00, 20, 29, 01, 64, cmd, ...]`,
   значит `data[6]` — это команда. `CMD_PATCH_DUMP = 0x01`. Убедись, что именно
   этот байт приходит от устройства (см. логи из пункта 1).

4. **Увеличь таймаут** в `stores/patches.js`:
   ```js
   const FETCH_ONE_TIMEOUT_MS = 1000
   ```
   Попробуй 3000 или 5000 мс — устройство может отвечать медленно при первом запросе.

5. **Исправь возможную гонку:** метод `sendSysExAndWait` в `useMidi.js` регистрирует
   `pendingResponses.set(responseCmd, ...)` ПЕРЕД отправкой, но если устройство отвечает
   мгновенно (ещё до завершения `sendSysEx`), ответ может прийти до регистрации.
   Проверь порядок операций. Если это проблема — переставь регистрацию до отправки
   (уже так и есть — но убедись).

6. **Если устройство вообще не отвечает на `CMD_REQUEST_PATCH_DUMP`:** возможно
   Circuit Tracks поддерживает только `CMD_REQUEST_CURRENT_PATCH (0x63)` и
   `CMD_CURRENT_PATCH_DUMP (0x02)` в ответ. В таком случае:
   - Добавь в `stores/patches.js` альтернативный метод `fetchCurrentPatch()` с
     `buildRequestCurrentPatch()` и ожиданием `CMD_CURRENT_PATCH_DUMP`
   - Обнови `PatchList.vue` — добавь кнопку "Fetch Current" рядом с каждым патчем

7. **Проверь SysEx product bytes:** `SYSEX_PRODUCT_FAMILY = 0x01` и
   `SYSEX_PRODUCT_CIRCUIT_TRACKS = 0x64` (в `client/src/midi/constants.js`).
   Убедись, что это точно совпадает с тем, что присылает устройство в своих
   ответах (снова — по логам из пункта 1).

**Файлы для изменения:**
- `client/src/composables/useMidi.js` — отладочное логирование
- `client/src/midi/constants.js` — проверка констант
- `client/src/stores/patches.js` — таймаут, возможно альтернативный fetch
- `client/src/midi/sysex.js` — если формат запроса неправильный

---

## ~~2. Починить вкладку Samples — понять что работает, что нет, привести в порядок~~ ✅ DONE (commit 2f22e6f)

**Контекст:**
Вкладка Samples (`client/src/views/SamplesView.vue`, store в
`client/src/stores/samples.js`). Сервер: `server/routes/samples.js`.

**Текущие проблемы:**

**Проблема A — "Fetch from device" ничего не делает:**
`fetchFromDevice(index)` в store вызывает `GET /api/samples/${index}`.
Сервер возвращает данные из `sampleBank[]` — массива, который инициализируется
при старте сервера пустыми объектами (`filename: null, size: 0`). Т.е. "fetch"
фактически получает пустые данные с сервера, не с реального устройства.
Circuit Tracks не поддерживает чтение сэмплов обратно через SysEx — это
**невозможно** через MIDI вообще. Нужно убрать эту иллюзию.

**Проблема B — "Send to device" вызывает несуществующий endpoint:**
`sendToDevice(index)` вызывает `POST /api/samples/${index}/send` — этот
маршрут отсутствует в `server/routes/samples.js`. В логах сервера будет 404.
Есть только `/:index/upload` (сохраняет файл на диск сервера), но нет
логики отправки на устройство через SysEx.

**Что нужно сделать:**

1. **Удали кнопки "↓ Fetch All" и "↑ Send All"** из `SamplesView.vue` и
   методы `fetchAllFromDevice` / `sendAllToDevice` / `fetchFromDevice` /
   `sendToDevice` из `stores/samples.js`. Вместо них замени на понятный
   статический текст `"Управление сэмплами: загружай локальные файлы →
   отправляй через сервер (экспериментально)"`.

2. **Сохрани и сделай рабочим upload через сервер:**
   В `SampleItem.vue` кнопка `↑` (`openFilePicker`) загружает файл локально.
   После локальной загрузки добавь автоматический upload на сервер:
   ```js
   // После store.loadFile(props.index, file):
   const formData = new FormData()
   formData.append('file', file)
   await fetch(`/api/samples/${props.index}/upload`, { method: 'POST', body: formData })
   ```
   Маршрут `/api/samples/:index/upload` уже существует в сервере.

3. **Исправь endpoint "Send to device"** в `server/routes/samples.js`:
   Добавь маршрут `POST /:index/send` который:
   - Принимает `multipart/form-data` с файлом (или берёт уже загруженный по `filename`)
   - Отвечает честно: `{ ok: false, message: "Sample SysEx transfer not implemented. Use SD card." }`
   - В UI (`SampleItem.vue`) кнопку "→" (send to device) измени: при клике показывай
     `alert` с сообщением "Отправка сэмплов на устройство через MIDI не поддерживается. Используйте SD-карту или Novation Components."

4. **Убедись, что preview работает:** `playPreview()` использует `sample.audioUrl`
   (Object URL). Это работает только после локальной загрузки через `loadFile()`.
   Убедись, что после загрузки файла `audioUrl` устанавливается корректно.

5. **Добавь `SampleList.vue`** если он отсутствует (файл не найден в Glob-результатах).
   Он должен рендерить `<ul>` из 64 `<SampleItem>`, передавая `sample` и `index`.

6. **Обнови hint-текст** в `SamplesView.vue`:
   ```
   Загрузи WAV/MP3 локально — превью работает сразу.
   Загрузка на физическое устройство через MIDI недоступна — используй SD-карту.
   ```

**Файлы для изменения:**
- `client/src/stores/samples.js`
- `client/src/views/SamplesView.vue`
- `client/src/components/samples/SampleItem.vue`
- `client/src/components/samples/SampleList.vue` (проверь/создай)
- `server/routes/samples.js`

---

## ~~3. Реализовать SysEx-обновление параметров при изменении кнобов в редакторе патча~~ ✅ DONE (commit 5a21157)

**Контекст:**
Редакторы патча: `client/src/components/patches/SynthEditor.vue`,
`MacroEditor.vue`, `EffectsEditor.vue`, `ModMatrix.vue`.
Store: `client/src/stores/patches.js`.
SysEx: `client/src/midi/sysex.js` → `buildReplaceCurrentPatch(rawBytes, synthTrack)`.
Кноб: `client/src/components/ui/Knob.vue`.

**Проблема:**
Сейчас при перетаскивании кноба в SynthEditor изменяется `params` в store,
но `rawBytes` не обновляется и SysEx на устройство не отправляется.
Звук на устройстве не меняется в реальном времени.

**Что нужно сделать:**

1. **Добавь в `stores/patches.js` метод `updateParam(partialParams)`:**
   ```js
   import { paramsToBytesPartial } from '@/midi/sysex.js'
   import { sendSysEx } from '@/composables/useMidi.js'
   import { buildReplaceCurrentPatch } from '@/midi/sysex.js'

   function updateParam(partialParams) {
     const slot = patches.value[activeTrack.value][activePatchIndex.value]
     if (!slot) return
     const newRaw = paramsToBytesPartial(partialParams, slot.rawBytes ?? defaultPatchBytes())
     slot.rawBytes = newRaw
     slot.params   = rawBytesToParams(newRaw)
     slot.hasData  = true
     // Fire-and-forget: send live preview to device
     sendSysEx(buildReplaceCurrentPatch(newRaw, _synthTrack(activeTrack.value)))
   }
   ```
   Экспортируй `updateParam` из store.

2. **Добавь дебаунс** чтобы не заваливать устройство SysEx при быстром вращении:
   ```js
   import { buildReplaceCurrentPatch } from '@/midi/sysex.js'
   let _sendTimer = null
   function _scheduleSend(rawBytes) {
     clearTimeout(_sendTimer)
     _sendTimer = setTimeout(() => {
       sendSysEx(buildReplaceCurrentPatch(rawBytes, _synthTrack(activeTrack.value)))
     }, 30) // 30 мс дебаунс
   }
   ```
   Используй `_scheduleSend` вместо прямого вызова в `updateParam`.

3. **Обнови `SynthEditor.vue`** — при изменении значения кноба вызывай
   `store.updateParam({ oscA: { ...store.activePatch.params.oscA, wave: newValue } })`.
   Паттерн для каждого кноба:
   ```vue
   <Knob
     :value="patch.params?.oscA?.wave ?? 2"
     :min="0" :max="5"
     label="Wave A"
     @update:value="v => store.updateParam({ oscA: { ...patch.params.oscA, wave: v } })"
   />
   ```
   Убедись, что `Knob.vue` эмитит `update:value` при изменении.

4. **Проверь `Knob.vue`:** откры файл. Должен эмитить `'update:value'` при перетаскивании.
   Если эмитит что-то другое — исправь в SynthEditor чтобы слушать правильное событие.

5. **Сделай то же самое для `MacroEditor.vue`** — при изменении макро-значения:
   ```js
   store.updateParam({ macros: store.activePatch.params.macros.map((v, i) => i === idx ? newVal : v) })
   ```

6. **Для `EffectsEditor.vue`** — аналогично для `chorus`, `distortion`, `reverbSend`, `delaySend`.

7. **Для `ModMatrix.vue`** — при изменении слота матрицы:
   ```js
   const newMm = [...store.activePatch.params.modMatrix]
   newMm[slotIndex] = { source, destination, depth }
   store.updateParam({ modMatrix: newMm })
   ```

8. **Добавь `defaultPatchBytes` и `rawBytesToParams`** в импорты store если их ещё нет.
   Они уже экспортируются из `client/src/midi/sysex.js`.

**Файлы для изменения:**
- `client/src/stores/patches.js` — добавить `updateParam` + дебаунс
- `client/src/components/patches/SynthEditor.vue` — подключить `updateParam`
- `client/src/components/patches/MacroEditor.vue` — подключить `updateParam`
- `client/src/components/patches/EffectsEditor.vue` — подключить `updateParam`
- `client/src/components/patches/ModMatrix.vue` — подключить `updateParam`
- `client/src/components/ui/Knob.vue` — проверить/исправить emit

---

## 4. Реализовать fetch для Sessions (насколько это возможно через MIDI)

**Контекст:**
Store: `client/src/stores/sessions.js` (если существует, иначе
`client/src/views/SessionsView.vue`).
Сервер: `server/routes/sessions.js` — хранит данные только в памяти,
никакого взаимодействия с устройством нет.

**Проблема:**
Circuit Tracks **не предоставляет** SysEx-протокол для чтения/записи проектов
(sessions/projects). Это не задокументировано в Programmer's Reference v3.
Проекты хранятся во внутренней flash-памяти устройства и недоступны напрямую
через SysEx или MIDI.

Единственное что доступно через SysEx:
- Чтение/запись патчей (Synth 1, Synth 2)
- `Replace Current Patch`, `Write Patch`, `Request Patch Dump`

**Что нужно сделать:**

1. **Удали или скрой кнопки fetch/sync с устройством** в `SessionsView.vue`
   если они есть. Оставь только локальные операции: переименование, копирование,
   удаление, импорт/экспорт JSON.

2. **Добавь честное сообщение** в UI:
   ```
   Сессии не синхронизируются с устройством через MIDI.
   Circuit Tracks не поддерживает SysEx-дамп проектов.
   Используй функцию экспорта/импорта JSON для резервных копий.
   ```

3. **Реализуй сохранение sessions в файл на сервере** (вместо только памяти):
   - Добавь в `server/routes/sessions.js` чтение/запись `data/sessions.json` при старте/изменении
   - При запуске сервера: `loadSessionsFromFile()` читает JSON, при изменениях: `saveSessionsToFile()`
   - Это обеспечит сохранность данных между перезапусками сервера

4. **Добавь в `SessionsView.vue` кнопку "Export All as JSON"** и "Import from JSON":
   - Export: `GET /api/sessions/export-all` — возвращает JSON всех 64 проектов
   - Import: `POST /api/sessions/import-all` с JSON-телом

5. **Привяжи цвета к реальным слотам:** В Circuit Tracks проекты имеют цвета
   (отображаются на кнопках устройства). Добавь в `ProjectGrid.vue` выбор цвета
   из палитры Circuit Tracks: `[0='off', 1='red', 2='orange', 3='yellow',
   4='green', 5='cyan', 6='blue', 7='violet']`.
   При изменении цвета: `PUT /api/sessions/:index` с `{ color: newColor }`.

6. **Добавь поиск/фильтр проектов** в `SessionsView.vue`:
   Input для поиска по имени — фильтрует сетку 8×8 в реальном времени.

**Файлы для изменения:**
- `server/routes/sessions.js` — персистентность в JSON-файл
- `client/src/views/SessionsView.vue` — убрать device sync, добавить правдивый UX
- `client/src/components/sessions/ProjectGrid.vue` — выбор цвета, поиск

---

## 5. Реализовать глобальный "Fetch All from Device" — синхронизация всего сразу

**Контекст:**
Устройство: Novation Circuit Tracks подключён через Web MIDI API.
Текущее состояние: каждая вкладка (Patches, Samples, Sessions) имеет свои
отдельные кнопки fetch. Нужна единая операция синхронизации.

**Что нужно сделать:**

1. **Добавь кнопку "⟳ Sync Device" в `StatusBar.vue`** (или `AppHeader.vue`):
   - Видна только когда устройство подключено (`device.connected === true`)
   - При клике запускает глобальный fetch

2. **Создай `client/src/stores/sync.js`** — Pinia store для координации:
   ```js
   import { defineStore } from 'pinia'
   import { ref } from 'vue'
   import { usePatchesStore }  from './patches'
   import { useDeviceStore }   from './device'

   export const useSyncStore = defineStore('sync', () => {
     const syncing  = ref(false)
     const progress = ref({ step: '', done: 0, total: 0 })
     const log      = ref([])  // массив строк с результатами

     async function syncAll() {
       if (syncing.value) return
       syncing.value = true
       log.value     = []

       const patches = usePatchesStore()

       try {
         // Шаг 1: патчи Synth 1
         progress.value = { step: 'Patches Synth 1', done: 0, total: 64 }
         patches.activeTrack = 0
         await patches.fetchAllFromDevice()
         log.value.push(`Synth 1: ${patches.fetchProgress.done - patches.fetchProgress.failed} OK, ${patches.fetchProgress.failed} failed`)

         // Шаг 2: патчи Synth 2
         progress.value = { step: 'Patches Synth 2', done: 0, total: 64 }
         patches.activeTrack = 1
         await patches.fetchAllFromDevice()
         log.value.push(`Synth 2: ${patches.fetchProgress.done - patches.fetchProgress.failed} OK, ${patches.fetchProgress.failed} failed`)

         // Шаг 3: сэмплы — только если сервер доступен (пинг /api/samples)
         try {
           const r = await fetch('/api/samples', { signal: AbortSignal.timeout(2000) })
           if (r.ok) log.value.push('Samples: server available (no device sync possible via MIDI)')
         } catch {
           log.value.push('Samples: server not reachable')
         }
       } finally {
         syncing.value = false
         patches.activeTrack = 0  // вернуть к Synth 1
       }
     }

     function cancel() {
       usePatchesStore().cancelFetchAll()
       syncing.value = false
     }

     return { syncing, progress, log, syncAll, cancel }
   })
   ```

3. **Добавь компонент `SyncModal.vue`** (`client/src/components/layout/`):
   - Модальное окно поверх всего (z-index высокий)
   - Показывает текущий шаг, прогресс-бар, лог строк
   - Кнопка "✕ Cancel" → `syncStore.cancel()`
   - Открывается при `syncStore.syncing === true`
   - После завершения показывает итог на 3 секунды и закрывается

4. **Подключи в `App.vue`:**
   ```vue
   <SyncModal v-if="syncStore.syncing || showSyncResult" ... />
   ```

5. **Добавь горячую клавишу** `Ctrl+Shift+S` → `syncStore.syncAll()`:
   В `App.vue` в `onMounted`:
   ```js
   window.addEventListener('keydown', e => {
     if (e.ctrlKey && e.shiftKey && e.key === 'S') {
       e.preventDefault()
       syncStore.syncAll()
     }
   })
   ```

6. **Добавь кнопку в `DevicePanel.vue`:**
   Рядом с кнопкой "Disconnect" добавь кнопку "⟳ Sync All" →
   `syncStore.syncAll()`. Disabled когда `!device.connected || syncStore.syncing`.

**Файлы для создания/изменения:**
- `client/src/stores/sync.js` — создать
- `client/src/components/layout/SyncModal.vue` — создать
- `client/src/components/layout/StatusBar.vue` — добавить кнопку Sync
- `client/src/components/device/DevicePanel.vue` — добавить кнопку Sync
- `client/src/App.vue` — подключить SyncModal, горячую клавишу

---

## Порядок выполнения

Рекомендуемая последовательность (каждый пункт — отдельная сессия):

1. **Задача 1** (patches fetch) — самое важное, остальное зависит от рабочего fetch
2. **Задача 3** (SysEx для кнобов) — делает редактор патча живым и полезным
3. **Задача 2** (samples UI) — убрать сломанное, оставить рабочее
4. **Задача 4** (sessions persistence) — локальное сохранение данных
5. **Задача 5** (global sync) — финальная интеграция

---

*Обновлено: 2026-03-01. Выполнено задач 1–3 (2026-03-01).*
