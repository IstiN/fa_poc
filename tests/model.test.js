import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEMO_NETWORK_INVITE,
  MY_NETWORK_ID,
  addAgent,
  approveEvent,
  buildChannelInvite,
  completeTask,
  composeChat,
  convertQuickChatToAgent,
  createAgentTask,
  createBoard,
  createChannel,
  createApp,
  createDemoData,
  createEmptyPreviewData,
  createNetwork,
  createQuickChat,
  findConversation,
  filterConversations,
  getMessages,
  humanStatus,
  isLocalConversation,
  installWidget,
  joinNetwork,
  linkQuickChatToAgent,
  listFilters,
  relativeTime,
  requestCrossNetworkInvite,
  rowMeta,
  searchAll,
  sendMessage,
} from '../model.js';

test('demo data matches the UX stress test', () => {
  const data = createDemoData();
  assert.equal(data.networks.length, 6);
  assert.equal(data.agents.length, 118);
  assert.equal(data.channels.length, 65);
  assert.equal(data.quickChats.length, 14);
  assert.equal(data.quickChats.filter((chat) => !chat.archived).length, 4);
  assert.equal(data.channels.filter((channel) => channel.creatorType === 'agent').length, 17);
  assert.equal(data.channels.filter((channel) => channel.taskBound).length, 9);
  assert.equal(data.agents.filter((agent) => agent.networkId === MY_NETWORK_ID).length, 32);
});

test('a new persistent agent automatically joins only My Network', () => {
  const data = createDemoData();
  const agent = addAgent(data, { name: 'Release Analyst', purpose: 'Analyze releases' });

  assert.equal(agent.networkId, MY_NETWORK_ID);
  assert.deepEqual(agent.networkIds, [MY_NETWORK_ID]);
  assert.equal(agent.persistent, true);
  assert.equal(agent.purpose, 'Analyze releases');
  assert.equal(data.agents.at(-1), agent);
  assert.ok(searchAll(data, 'Release Analyst').some((result) => result.id === agent.id));
  assert.ok(!agent.networkIds.some((id) => id !== MY_NETWORK_ID));
});

test('quick chat gets a useful title and converts without losing history', () => {
  const data = createDemoData();
  const before = data.agents.length;
  const quick = createQuickChat(data, 'Проверить почему не работает DNS после смены роутера');

  assert.match(quick.title, /DNS/);
  assert.equal(quick.archived, false);
  assert.ok(!quick.title.includes('Oct '));
  assert.ok(!quick.title.toLowerCase().includes('session'));

  const agent = convertQuickChatToAgent(data, quick.id);
  assert.equal(data.agents.length, before + 1);
  assert.equal(agent.networkId, MY_NETWORK_ID);
  assert.equal(quick.archived, true);
  assert.ok(data.messages[agent.id].some((message) => message.text.includes('DNS')));
  assert.equal(findConversation(data, agent.id).kind, 'agent');
});

test('compose with no recipients starts a local quick chat', () => {
  const data = createDemoData();
  const agentCount = data.agents.length;
  const result = composeChat(data, { recipientIds: [], message: 'Think through a local draft' });

  assert.equal(result.kind, 'quick');
  assert.equal(result.conversation.title, 'Think through a local draft');
  assert.equal(data.agents.length, agentCount);
});

test('compose with one agent reuses the endless direct conversation', () => {
  const data = createDemoData();
  const agent = data.agents.find((item) => item.networkId === MY_NETWORK_ID);
  const before = getMessages(data, agent.id).length;
  const result = composeChat(data, { recipientIds: [agent.id], message: 'Continue directly' });

  assert.equal(result.kind, 'agent');
  assert.equal(result.conversation, agent);
  assert.equal(data.messages[agent.id].length, before + 1);
  assert.equal(data.messages[agent.id].at(-1).text, 'Continue directly');
});

test('compose creates a mixed group without granting external network membership', () => {
  const data = createDemoData();
  const local = data.agents.find((item) => item.networkId === MY_NETWORK_ID);
  const external = data.agents.find((item) => item.networkId === 'ai-conf');
  const result = composeChat(data, {
    recipientIds: [local.id, external.id, external.id],
    message: 'Review this together',
    groupName: 'Mixed review',
  });

  assert.equal(result.kind, 'channel');
  assert.equal(result.conversation.networkId, MY_NETWORK_ID);
  assert.deepEqual(result.conversation.memberIds, [local.id, external.id]);
  assert.deepEqual(result.conversation.externalMemberIds, [external.id]);
  assert.ok(!external.networkIds.includes(MY_NETWORK_ID));
  assert.equal(data.messages[result.conversation.id].at(-1).text, 'Review this together');
});

test('linking a quick chat reuses an existing agent', () => {
  const data = createDemoData();
  const quick = createQuickChat(data, 'Собрать список рисков релиза');
  const target = data.agents.find((agent) => agent.name === 'Release Manager');
  const before = data.agents.length;

  const linked = linkQuickChatToAgent(data, quick.id, target.id);
  assert.equal(linked, target);
  assert.equal(data.agents.length, before);
  assert.equal(quick.archived, true);
  assert.equal(quick.linkedAgentId, target.id);
  assert.ok(data.messages[target.id].some((message) => message.text.includes('рисков релиза')));
});

test('agents can group same-network agents through channels', () => {
  const data = createDemoData();
  const creator = data.agents.find((agent) => agent.name === 'Release Manager');
  const members = data.agents
    .filter((agent) => agent.networkId === MY_NETWORK_ID && agent.id !== creator.id)
    .slice(0, 3)
    .map((agent) => agent.id);

  const channel = createChannel(data, {
    name: 'Release audit',
    purpose: 'Audit the next release',
    creatorId: creator.id,
    memberIds: members,
    taskBound: true,
  });

  assert.equal(channel.networkId, MY_NETWORK_ID);
  assert.equal(channel.creatorType, 'agent');
  assert.equal(channel.taskBound, true);
  assert.ok(channel.memberIds.includes(creator.id));
  assert.equal(channel.memberIds.length, 4);
});

test('channel creation rejects an implicit cross-network member', () => {
  const data = createDemoData();
  const local = data.agents.find((agent) => agent.networkId === MY_NETWORK_ID);
  const external = data.agents.find((agent) => agent.networkId === 'ai-conf');

  assert.throws(() => createChannel(data, {
    name: 'Unsafe group',
    creatorId: local.id,
    memberIds: [external.id],
  }), /another network/i);
  assert.ok(!external.networkIds.includes(MY_NETWORK_ID));
});

test('agent task creates a running event and task channel, completion archives it', () => {
  const data = createDemoData();
  const agent = data.agents.find((item) => item.name === 'Release Manager');
  const { event, channel } = createAgentTask(data, {
    agentId: agent.id,
    title: 'Audit release 2.60',
    createChannel: true,
  });

  assert.equal(event.status, 'running');
  assert.equal(channel.creatorId, agent.id);
  assert.equal(channel.creatorType, 'agent');
  assert.equal(channel.taskBound, true);
  assert.equal(channel.memberIds.length, 4);
  assert.equal(channel.archived, false);

  completeTask(data, event.id);
  assert.equal(event.status, 'done');
  assert.equal(channel.archived, true);
  assert.ok(searchAll(data, 'Audit release 2.60').some((result) => result.id === channel.id));
});

test('cross-network membership changes only after explicit approval', () => {
  const data = createDemoData();
  const channel = data.channels.find((item) => item.networkId === MY_NETWORK_ID && !item.archived);
  const external = data.agents.find((agent) => agent.networkId === 'ai-conf');
  const originalMembers = [...channel.memberIds];

  const request = requestCrossNetworkInvite(data, { channelId: channel.id, agentId: external.id });
  assert.equal(request.status, 'needs');
  assert.deepEqual(channel.memberIds, originalMembers);
  assert.ok(!channel.memberIds.includes(external.id));

  approveEvent(data, request.id);
  assert.equal(request.status, 'done');
  assert.ok(channel.memberIds.includes(external.id));

  approveEvent(data, request.id);
  assert.equal(channel.memberIds.filter((id) => id === external.id).length, 1);
});

test('an endless agent keeps one identity across messages', () => {
  const data = createDemoData();
  const agent = data.agents[0];
  const agentCount = data.agents.length;
  const before = getMessages(data, agent.id).length;

  sendMessage(data, agent.id, 'Continue the same work');
  assert.equal(data.agents.length, agentCount);
  assert.equal(findConversation(data, agent.id).item, agent);
  assert.equal(data.messages[agent.id].length, before + 1);
  assert.equal(data.messages[agent.id].at(-1).text, 'Continue the same work');
});

test('widget store installs into My Apps without duplicating a widget', () => {
  const data = createDemoData();
  const before = data.apps.length;
  const installed = installWidget(data, 'widget:timer');
  assert.equal(data.apps.length, before + 1);
  assert.equal(installed.name, 'Focus Timer');
  assert.equal(installWidget(data, 'widget:timer'), installed);
  assert.equal(data.apps.length, before + 1);
});

test('My Boards and networks can be created independently of chats', () => {
  const data = createDemoData();
  const board = createBoard(data, { name: 'Morning Board' });
  const network = createNetwork(data, { name: 'Research Lab' });
  assert.equal(board.appIds.length, 0);
  assert.ok(data.boards.includes(board));
  assert.equal(network.agentCount, 0);
  assert.ok(data.networks.includes(network));
});

test('empty preview is a fresh workspace and does not mutate demo data', () => {
  const data = createDemoData();
  const empty = createEmptyPreviewData(data);
  assert.equal(data.agents.length, 118);
  assert.equal(empty.networks.length, 1);
  assert.equal(empty.networks[0].id, MY_NETWORK_ID);
  assert.equal(empty.agents.length, 0);
  assert.equal(empty.channels.length, 0);
  assert.equal(empty.apps.length, 0);
  assert.equal(empty.boards.length, 0);
  assert.equal(empty.events.length, 0);
  assert.ok(empty.widgetCatalog.length > 0);
});

test('My Apps supports custom apps and Networks supports demo join', () => {
  const data = createEmptyPreviewData(createDemoData());
  const app = createApp(data, { name: 'Release Cockpit', description: 'Custom operational app' });
  assert.equal(app.custom, true);
  assert.ok(data.apps.includes(app));
  const joined = joinNetwork(data, DEMO_NETWORK_INVITE);
  assert.equal(joined.name, 'Research Lab');
  assert.equal(joinNetwork(data, 'DEMO-RESEARCH'), joined);
  assert.equal(data.networks.filter((network) => network.id === joined.id).length, 1);
  assert.throws(() => joinNetwork(data, 'bad-invite'), /not recognized/);
});

test('channel invite exposes QR link and scoped CLI command', () => {
  const data = createDemoData();
  const channel = data.channels.find((item) => item.networkId === MY_NETWORK_ID);
  const invite = buildChannelInvite(data, channel.id);
  assert.equal(invite.channelId, channel.id);
  assert.equal(invite.networkId, channel.networkId);
  assert.equal(invite.scope, 'This channel only');
  assert.match(invite.link, /^fa2:\/\/channel\/my\//);
  assert.match(invite.command, /^fa agent join /);
  assert.match(invite.command, /DEMO-/);
  assert.deepEqual(buildChannelInvite(data, channel.id), invite);
});

test('global search covers agents, channels, networks and apps', () => {
  const data = createDemoData();
  assert.ok(searchAll(data, 'Mail Reader').some((result) => result.type === 'agent'));
  assert.ok(searchAll(data, 'public').some((result) => result.type === 'channel'));
  assert.ok(searchAll(data, 'My Network').some((result) => result.type === 'network'));
  assert.ok(searchAll(data, 'Files').some((result) => result.type === 'app'));
});

test('listFilters exposes compact chips and a network chip only with several networks', () => {
  const data = createDemoData();
  const filters = listFilters(data, { filter: 'all', folder: 'all' });
  assert.deepEqual(filters.chips.map((chip) => chip.id), ['all', 'unread', 'agents', 'channels']);
  assert.equal(filters.chips.find((chip) => chip.active).id, 'all');
  assert.equal(filters.network.label, 'All networks');
  assert.equal(listFilters(data, { filter: 'agents', folder: MY_NETWORK_ID }).network.label, 'My Network');
  assert.equal(listFilters(data, { filter: 'agents', folder: 'all' }).chips.find((chip) => chip.active).id, 'agents');
  const empty = createEmptyPreviewData(data);
  assert.equal(listFilters(empty, { filter: 'all', folder: 'all' }).network, null);
});

test('filterConversations folds the directory into Agents and Channels filters', () => {
  const data = createDemoData();
  const all = filterConversations(data, { filter: 'all', folder: 'all' });
  assert.deepEqual(all.map((section) => section.label), ['Pinned', 'Recent']);
  const agents = filterConversations(data, { filter: 'agents', folder: 'all' }).flatMap((section) => section.items);
  assert.equal(agents.length, data.agents.length);
  const silent = addAgent(data, { name: 'Silent Agent' });
  data.messages[silent.id] = [];
  silent.recent = false;
  assert.ok(filterConversations(data, { filter: 'agents', folder: MY_NETWORK_ID }).flatMap((section) => section.items).some(({ item }) => item.id === silent.id));
  const channels = filterConversations(data, { filter: 'channels', folder: MY_NETWORK_ID });
  assert.ok(channels.some((section) => section.label === 'Archived'));
  assert.ok(channels.flatMap((section) => section.items).every(({ kind, item }) => kind === 'channel' && item.networkId === MY_NETWORK_ID));
  const unread = filterConversations(data, { filter: 'unread', folder: 'all' }).flatMap((section) => section.items);
  assert.ok(unread.length > 0);
  assert.ok(unread.every(({ item }) => item.unread > 0));
});

test('rowMeta keeps rows to two lines and tags only non-default networks', () => {
  const data = createDemoData();
  const now = 1000;
  const home = rowMeta(data, findConversation(data, 'channel:my:0'), now);
  assert.equal(home.title, '#general');
  assert.equal(home.networkTag, null);
  const remote = rowMeta(data, findConversation(data, 'channel:istin-network:0'), now);
  assert.equal(remote.networkTag, 'istin-network');
  const task = rowMeta(data, findConversation(data, 'channel:my:2'), now);
  assert.equal(task.taskTag, true);
  assert.equal(task.working, true);
  const runningAgent = rowMeta(data, findConversation(data, 'agent:my:0'), now);
  assert.equal(runningAgent.working, true);
  assert.equal(runningAgent.avatar, 'F');
  assert.equal(rowMeta(data, findConversation(data, 'agent:my:1'), now).working, false);
  assert.equal(typeof runningAgent.time, 'string');
  assert.ok(!('creator' in home));
});

test('relativeTime renders short human labels', () => {
  assert.equal(relativeTime(1000, 1000), 'now');
  assert.equal(relativeTime(1005, 1000), 'now');
  assert.equal(relativeTime(990, 1000), '10m');
  assert.equal(relativeTime(880, 1000), '2h');
  assert.equal(relativeTime(1000 - 3000, 1000), '2d');
});

test('humanStatus replaces jargon with human status', () => {
  const data = createDemoData();
  assert.equal(humanStatus(data, findConversation(data, 'agent:my:0')), 'Working…');
  assert.equal(humanStatus(data, findConversation(data, 'agent:my:1')), 'Online');
  assert.equal(humanStatus(data, findConversation(data, 'agent:my:3')), 'Offline');
  assert.equal(humanStatus(data, findConversation(data, 'channel:my:1')), '4 agents');
  assert.equal(humanStatus(data, findConversation(data, 'channel:my:2')), '4 agents · Task');
  assert.equal(humanStatus(data, findConversation(data, 'channel:istin-network:0')), '3 agents · istin-network');
  assert.equal(humanStatus(data, findConversation(data, 'agent:ai-conf:1')), 'Online · ai_conf');
  assert.equal(humanStatus(data, findConversation(data, 'quick:0')), 'Quick chat');
  for (const id of ['agent:my:0', 'channel:my:1', 'quick:0']) {
    assert.doesNotMatch(humanStatus(data, findConversation(data, id)), /persistent/i);
  }
});

test('model choice is offered only for local conversations', () => {
  const data = createDemoData();
  assert.equal(isLocalConversation(findConversation(data, 'agent:my:0')), true);
  assert.equal(isLocalConversation(findConversation(data, 'quick:0')), true);
  assert.equal(isLocalConversation(findConversation(data, 'agent:ai-conf:1')), false);
  assert.equal(isLocalConversation(findConversation(data, 'channel:my:1')), false);
});

test('channel intro is one quiet system line', () => {
  const data = createDemoData();
  const system = getMessages(data, 'channel:my:1').filter((message) => message.from === 'system');
  assert.equal(system.length, 1);
  assert.match(system[0].text, /Researcher created this channel · 4 agents/);
  const created = createChannel(data, { name: 'solo-line', memberIds: ['agent:my:1', 'agent:my:2'] });
  assert.equal(data.messages[created.id].filter((message) => message.from === 'system').length, 1);
});
