import test from 'node:test';
import assert from 'node:assert/strict';

import { addAgent, createDemoData } from '../model.js';
import { renderShell } from '../views.js';

function baseState() {
  return {
    variant: 'a',
    section: 'chats',
    selectedId: 'agent:my:0',
    selectedEventId: 'event:deploy',
    selectedNetworkId: null,
    mobileDetail: false,
    folder: 'all',
    activityFilter: 'all',
    directoryTab: 'agents',
    directoryNetwork: 'all',
    directoryQuery: '',
    appFilter: 'all',
    modal: null,
    commandQuery: '',
    appPanel: null,
    appMobileOpen: false,
    appFullScreen: false,
    viewport: 'desktop',
  };
}

test('A renders messenger-first navigation and a continuous agent conversation', () => {
  const html = renderShell(baseState(), createDemoData());
  assert.match(html, /data-variant="a"/);
  assert.match(html, /Chats/);
  assert.match(html, /same endless conversation/);
  assert.match(html, /data-form="send-message"/);
});

test('C renders activity-first navigation with quick actions', () => {
  const state = { ...baseState(), variant: 'c', section: 'inbox' };
  const html = renderShell(state, createDemoData());
  assert.match(html, /data-variant="c"/);
  assert.match(html, /Needs you/);
  assert.match(html, /Running/);
  assert.match(html, /data-action="approve-event"/);
  assert.match(html, /data-action="complete-task"/);
});

test('mobile detail and fullscreen App are explicit shell states', () => {
  const state = {
    ...baseState(),
    mobileDetail: true,
    appMobileOpen: true,
    appFullScreen: true,
    appPanel: { appId: 'app:files', context: { kind: 'network', id: 'my' }, pinned: true },
  };
  const html = renderShell(state, createDemoData());
  assert.match(html, /detail-open/);
  assert.match(html, /app-mobile-open/);
  assert.match(html, /app-overlay/);
  assert.match(html, /Unpin/);
  assert.match(html, /My Network · Change/);
});

test('new agent flow exposes automatic My Network membership', () => {
  const state = { ...baseState(), modal: { type: 'new-agent' } };
  const html = renderShell(state, createDemoData());
  assert.match(html, /My Network membership is automatic/);
  assert.doesNotMatch(html, /name="networkId"/);
});

test('directory count updates after adding an agent', () => {
  const data = createDemoData();
  addAgent(data, { name: 'New Agent' });
  const html = renderShell(baseState(), data);
  assert.match(html, /All 119 agents and 65 channels/);
});
