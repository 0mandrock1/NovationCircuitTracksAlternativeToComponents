<script setup>
import { onMounted, ref } from 'vue'
import { usePatchesStore } from '@/stores/patches'
import { useDeviceStore }  from '@/stores/device'
import PatchList      from '@/components/patches/PatchList.vue'
import SynthEditor    from '@/components/patches/SynthEditor.vue'
import MacroEditor    from '@/components/patches/MacroEditor.vue'
import EffectsEditor  from '@/components/patches/EffectsEditor.vue'
import ModMatrix      from '@/components/patches/ModMatrix.vue'

const store  = usePatchesStore()
const device = useDeviceStore()

const subTab = ref('synth')
const SUB_TABS = [
  { id: 'synth',  label: 'Synth'      },
  { id: 'macros', label: 'Macros'     },
  { id: 'fx',     label: 'Effects'    },
  { id: 'mod',    label: 'Modulation' },
]

onMounted(() => store.fetchPatches())
</script>

<template>
  <div class="patches-view">
    <aside class="patches-view__sidebar">
      <PatchList />
    </aside>

    <div class="patches-view__main">
      <!-- Toolbar -->
      <div class="patches-view__toolbar">
        <div class="patches-view__patch-name">
          <span class="patches-view__patch-num">{{ String(store.activePatchIndex + 1).padStart(2, '0') }}</span>
          <span class="patches-view__patch-title">{{ store.activePatch?.name ?? '—' }}</span>
          <span v-if="store.activePatch?.hasData" class="patches-view__data-badge" title="Data loaded">●</span>
        </div>

        <div class="patches-view__track-select">
          <button
            v-for="(label, idx) in ['Synth 1', 'Synth 2']"
            :key="idx"
            class="track-btn"
            :class="{ 'track-btn--active': store.activeTrack === idx }"
            @click="store.activeTrack = idx; store.fetchPatches()"
          >{{ label }}</button>
        </div>

        <div class="patches-view__actions">
          <button
            class="btn btn--sm"
            :disabled="!device.connected || store.fetchingAll"
            @click="store.fetchAllFromDevice()"
            :title="device.connected ? 'Download all patches from device' : 'Connect device first'"
          >{{ store.fetchingAll ? 'Fetching…' : '↓ Fetch All' }}</button>
          <button class="btn btn--sm" @click="store.exportBankSyx()" title="Export all 64 patches as .syx">↑ Export Bank</button>
          <label class="btn btn--sm" title="Import .syx file (single patch or bank)">
            ↓ Import .syx
            <input type="file" accept=".syx" style="display:none"
              @change="e => e.target.files[0] && store.importSyx(e.target.files[0])" />
          </label>
        </div>
      </div>

      <!-- Sub-tab navigation -->
      <nav class="patches-view__subtabs">
        <button
          v-for="tab in SUB_TABS"
          :key="tab.id"
          class="subtab"
          :class="{ 'subtab--active': subTab === tab.id }"
          @click="subTab = tab.id"
        >{{ tab.label }}</button>
      </nav>

      <!-- Editor -->
      <div class="patches-view__editor">
        <template v-if="store.activePatch">
          <SynthEditor   v-if="subTab === 'synth'"  :patch="store.activePatch" :patch-index="store.activePatchIndex" />
          <MacroEditor   v-else-if="subTab === 'macros'" :patch="store.activePatch" :patch-index="store.activePatchIndex" />
          <EffectsEditor v-else-if="subTab === 'fx'"     :patch="store.activePatch" :patch-index="store.activePatchIndex" />
          <ModMatrix     v-else-if="subTab === 'mod'"    :patch="store.activePatch" :patch-index="store.activePatchIndex" />
        </template>
        <div v-else class="patches-view__empty">Select a patch from the list.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.patches-view {
  display: flex;
  gap: var(--spacing-md);
  height: 100%;
  overflow: hidden;
}

.patches-view__sidebar {
  width: 220px;
  flex-shrink: 0;
  overflow-y: auto;
}

.patches-view__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow: hidden;
  min-width: 0;
}

.patches-view__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.patches-view__patch-name {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 0;
}

.patches-view__patch-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.patches-view__patch-title {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.patches-view__data-badge { color: var(--color-success); font-size: 0.6rem; }

.patches-view__track-select { display: flex; gap: 2px; }

.track-btn {
  padding: 3px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--transition-fast);
}
.track-btn--active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }

.patches-view__actions { display: flex; gap: var(--spacing-xs); }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  transition: all var(--transition-fast);
}
.btn:hover:not(:disabled) { border-color: var(--color-text-muted); }
.btn:disabled { opacity: 0.4; cursor: default; }

.patches-view__subtabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.subtab {
  padding: 5px var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.subtab:hover { color: var(--color-text); }
.subtab--active { color: var(--color-accent); border-bottom-color: var(--color-accent); }

.patches-view__editor { flex: 1; overflow-y: auto; padding-top: var(--spacing-sm); }
.patches-view__empty { color: var(--color-text-muted); padding: var(--spacing-md); font-size: 0.9rem; }
</style>
