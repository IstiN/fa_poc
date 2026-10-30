import test from 'node:test';
import assert from 'node:assert/strict';

import { addAgent, createDemoData } from '../model.js';
import { renderShell } from '../views.js';

const count = (html, pattern) => (html.match(pattern) ?? []).length;
const sidebarOf = (html) => html.slice(html.indexOf('<aside class="sidebar"'), html.indexOf('</aside>'));

function baseState() {
  return {
    variant: 'a',
    section: 'chats',
    selectedId: 'agent:my:0',
    selectedEventId: 'event:deploy',
    selectedNetworkId: null,
    mobileDetail: false,
    folder: 'all',
    listFilter: 'all',
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
  assert.match(html, /Browse all 119 agents and 65 channels/);
});

test('A sidebar has one New entry, one search field and filter chips instead of a select', () => {
  const html = renderShell(baseState(), createDemoData());
  const sidebar = sidebarOf(html);
  assert.equal(count(sidebar, /data-action="chat-create-menu"/g), 1);
  assert.equal(count(sidebar, /data-action="command"/g), 1);
  assert.equal(count(sidebar, /data-action="quick-actions"/g), 0);
  assert.doesNotMatch(sidebar, /data-change="folder"/);
  for (const label of ['All', 'Unread', 'Agents', 'Channels']) assert.match(sidebar, new RegExp(`data-filter="[a-z]+" aria-pressed="(true|false)">${label}<`));
  assert.match(sidebar, /network-chip/);
  assert.match(sidebar, /<svg class="icon"/);
});

test('A primary nav is Chats · Activity · Apps without Directory or More', () => {
  const html = renderShell(baseState(), createDemoData());
  const tabs = html.match(/<nav class="section-tabs"[\s\S]*?<\/nav>/)[0];
  const bottom = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)[0];
  for (const nav of [tabs, bottom]) {
    assert.deepEqual([...nav.matchAll(/data-section="([a-z]+)"/g)].map((match) => match[1]), ['chats', 'activity', 'apps']);
  }
  assert.match(html, /data-action="settings"/);
});

test('rows are two lines with a network tag only outside My Network', () => {
  const html = renderShell(baseState(), createDemoData());
  assert.doesNotMatch(html, /class="item-meta"/);
  assert.match(html, /<span class="row-tag">istin-network<\/span>/);
  assert.doesNotMatch(html, /<span class="row-tag">My Network<\/span>/);
  assert.match(html, /<span class="row-tag">task<\/span>/);
  assert.match(html, /class="presence"/);
  assert.doesNotMatch(html, /by Researcher/);
});

test('Agents filter replaces Directory with an Add agent row and every agent', () => {
  const data = createDemoData();
  const html = renderShell({ ...baseState(), listFilter: 'agents' }, data);
  assert.match(html, /class="list-item add-row"[\s\S]*?data-action="new-agent"/);
  assert.equal(count(html, /class="list-item conversation-row/g), data.agents.length);
});

test('conversation header uses human status and one Details button; Apps live in the composer +', () => {
  const html = renderShell(baseState(), createDemoData());
  const head = html.match(/<header class="content-head">[\s\S]*?<\/header>/)[0];
  assert.match(head, /Working…/);
  assert.doesNotMatch(head, /persistent/);
  assert.equal(count(head, /data-action="conversation-details"/g), 1);
  assert.doesNotMatch(head, /quick-apps/);
  assert.match(html, /placeholder="Message Fa"/);
  assert.doesNotMatch(html, /for commands/);
  assert.match(html, /class="model-trigger"/);
  assert.doesNotMatch(html, /data-command="new">New chat/);
});

test('channels and network agents hide the model chip; channel intro is one line', () => {
  const data = createDemoData();
  const channel = renderShell({ ...baseState(), selectedId: 'channel:my:1' }, data);
  assert.doesNotMatch(channel, /model-trigger|Model: /);
  assert.match(channel, /4 agents/);
  assert.equal(count(channel, /class="message system"/g), 1);
  const remote = renderShell({ ...baseState(), selectedId: 'agent:ai-conf:1' }, data);
  assert.doesNotMatch(remote, /model-trigger|Model: /);
});

test('C keeps its Inbox-first navigation', () => {
  const html = renderShell({ ...baseState(), variant: 'c', section: 'inbox' }, createDemoData());
  const bottom = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...bottom.matchAll(/data-section="([a-z]+)"/g)].map((match) => match[1]), ['inbox', 'chats', 'apps', 'more']);
});
