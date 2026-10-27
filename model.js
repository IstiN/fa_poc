export const MY_NETWORK_ID = 'my';
export const DEMO_NETWORK_INVITE = 'fa2://network/research-lab/invite/DEMO-RESEARCH';

const AGENT_NAMES = [
  'Fa', 'Mail Reader', 'Researcher', 'Code Reviewer', 'Release Manager',
  'Finance', 'Home', 'Travel', 'Test Runner', 'Designer', 'Writer',
  'Translator', 'Data Analyst', 'Product Manager', 'Project Manager',
  'Security Auditor', 'DevOps', 'Support', 'Sales', 'Legal', 'HR',
  'Meeting Notes', 'Presentation', 'Spreadsheet', 'Web Researcher',
  'News Reader', 'Personal Trainer', 'Nutrition', 'Calendar', 'Smart Home',
  'Knowledge Base', 'App Builder',
];

const NETWORK_BLUEPRINTS = [
  {
    id: MY_NETWORK_ID,
    name: 'My Network',
    agentCount: 32,
    channels: ['general', 'research-team', 'release-260-audit', 'home-automation', 'writing-room', 'finance-watch', 'code-review', 'reading-list', 'travel-planning', 'agent-design'],
  },
  {
    id: 'istin-network',
    name: 'istin-network',
    agentCount: 18,
    channels: ['general', 'kb-agent', 'releases', 'support', 'ai-news', 'product', 'design', 'ops', 'random', 'research', 'incidents', 'archive'],
  },
  {
    id: 'yoclip-studio',
    name: 'yoclip-studio',
    agentCount: 9,
    channels: ['general', 'studio', 'rendering', 'mobile', 'widgets', 'releases', 'design', 'support'],
  },
  {
    id: 'ai-conf',
    name: 'ai_conf',
    agentCount: 40,
    channels: ['public', 'paper-review', 'agents', 'models', 'announcements', 'research', 'russian', 'english', 'jobs', 'showcases', 'tools', 'evals', 'infrastructure', 'events', 'random', 'safety', 'multimodal', 'robotics', 'startups', 'help'],
  },
  {
    id: 'home-lab',
    name: 'home-lab',
    agentCount: 7,
    channels: ['general', 'automation', 'servers', 'energy', 'security', 'family'],
  },
  {
    id: 'client-acme',
    name: 'client-acme',
    agentCount: 12,
    channels: ['general', 'project', 'design', 'development', 'qa', 'releases', 'support', 'billing', 'management'],
  },
];

const AGENT_CREATED = {
  my: new Set([1, 2, 4, 6, 8]),
  'istin-network': new Set([1, 2, 3, 4]),
  'yoclip-studio': new Set([1, 2]),
  'ai-conf': new Set([1, 2, 3]),
  'home-lab': new Set([1]),
  'client-acme': new Set([1, 2]),
};

const TASK_BOUND = {
  my: new Set([2, 6, 8]),
  'istin-network': new Set([1, 2, 3, 4]),
  'yoclip-studio': new Set([1]),
  'ai-conf': new Set([1]),
};

const CHANNEL_CREATORS = {
  'my:1': 'Researcher',
  'my:2': 'Release Manager',
  'my:4': 'Writer',
  'my:6': 'Code Reviewer',
  'my:8': 'Travel',
};

const QUICK_TITLES = [
  'Разобраться с DNS',
  'Сравнить варианты поездки в Вильнюс',
  'Черновик письма инвестору',
  'Посчитать бюджет ремонта',
  'Найти причину шума вентилятора',
  'Перевести короткое объявление',
  'Составить список книг',
  'Проверить условия гарантии',
  'Идеи для презентации',
  'Разобрать счёт за электричество',
  'План поездки на выходные',
  'Вопрос про страховку',
  'Сравнение двух мониторов',
  'Черновик поста для блога',
];

function nextId(data, prefix) {
  data.sequence += 1;
  return `${prefix}${data.sequence}`;
}

function touch(data, item) {
  data.clock += 1;
  item.updated = data.clock;
}

function agentBelongsToNetwork(agent, networkId) {
  return agent.networkId === networkId || agent.networkIds.includes(networkId);
}

function channelDisplayName(name) {
  return name.trim().replace(/^#+\s*/, '').replace(/\s+/g, '-');
}

function searchText(value) {
  return String(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function makeTitle(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= 46) return clean;
  return `${clean.slice(0, 45).trimEnd()}…`;
}

export function createDemoData() {
  const data = {
    networks: NETWORK_BLUEPRINTS.map(({ id, name, agentCount, channels }) => ({
      id, name, agentCount, channelCount: channels.length,
    })),
    agents: [],
    channels: [],
    quickChats: [],
    apps: [
      { id: 'app:files', name: 'Files', description: 'Browse files and hand them to agents.', favorite: true, recent: true, running: false },
      { id: 'app:mail', name: 'Mail Reader', description: 'Read digests and inspect source mail.', favorite: true, recent: true, running: false },
      { id: 'app:preview', name: 'Preview', description: 'Inspect a document, site or generated result.', favorite: true, recent: true, running: false },
      { id: 'app:export', name: 'Export', description: 'Export presentations and other artifacts.', favorite: false, recent: true, running: true },
      { id: 'app:analytics', name: 'Analytics', description: 'Inspect agent activity and task outcomes.', favorite: false, recent: false, running: false },
      { id: 'app:settings', name: 'Settings', description: 'Wireframe settings surface.', favorite: false, recent: false, running: false },
    ],
    boards: [
      { id: 'board:release', name: 'Release Control', description: 'Export, analytics and release evidence', appIds: ['app:export', 'app:analytics', 'app:preview'] },
      { id: 'board:personal', name: 'Personal Ops', description: 'Mail, files and settings in one board', appIds: ['app:mail', 'app:files', 'app:settings'] },
    ],
    widgetCatalog: [
      { id: 'widget:timer', name: 'Focus Timer', description: 'Focus and break cycles', category: 'Productivity' },
      { id: 'widget:calendar', name: 'Calendar', description: 'Schedule and upcoming events', category: 'Planning' },
      { id: 'widget:weather', name: 'Weather', description: 'Current weather and forecast', category: 'Personal' },
      { id: 'widget:calculator', name: 'Calculator', description: 'Quick calculations', category: 'Utilities' },
      { id: 'widget:contacts', name: 'Contacts', description: 'People and agent contacts', category: 'Network' },
      { id: 'widget:map', name: 'Map', description: 'Places and travel context', category: 'Personal' },
    ],
    events: [],
    messages: {},
    sequence: 0,
    clock: 1000,
  };

  for (const blueprint of NETWORK_BLUEPRINTS) {
    const networkAgents = [];
    for (let index = 0; index < blueprint.agentCount; index += 1) {
      const isHome = blueprint.id === MY_NETWORK_ID;
      const name = isHome
        ? AGENT_NAMES[index]
        : `${blueprint.name} Agent ${String(index + 1).padStart(2, '0')}`;
      const agent = {
        id: `agent:${blueprint.id}:${index}`,
        kind: 'agent',
        name,
        purpose: isHome ? `${name} · persistent agent` : `Member of ${blueprint.name}`,
        networkId: blueprint.id,
        networkIds: [blueprint.id],
        homeNetworkId: isHome ? MY_NETWORK_ID : null,
        persistent: true,
        status: index % 7 === 0 ? 'running' : index % 3 === 0 ? 'offline' : 'online',
        unread: index % 11 === 0 ? index % 4 + 1 : 0,
        pinned: isHome && index < 3,
        recent: index < (isHome ? 10 : 2),
        last: index % 2 === 0 ? 'Ready to continue' : 'Latest agent reply',
        updated: 900 - data.agents.length,
      };
      data.agents.push(agent);
      networkAgents.push(agent);
    }

    blueprint.channels.forEach((name, index) => {
      const creatorType = AGENT_CREATED[blueprint.id].has(index) ? 'agent' : 'user';
      const creatorName = CHANNEL_CREATORS[`${blueprint.id}:${index}`];
      const creator = creatorType === 'agent'
        ? networkAgents.find((agent) => agent.name === creatorName) ?? networkAgents[index % networkAgents.length]
        : null;
      const taskBound = TASK_BOUND[blueprint.id]?.has(index) ?? false;
      const otherMembers = networkAgents
        .filter((agent) => agent.id !== creator?.id)
        .slice(0, 3)
        .map((agent) => agent.id);
      const channel = {
        id: `channel:${blueprint.id}:${index}`,
        kind: 'channel',
        name,
        purpose: taskBound ? `Task coordination · ${name}` : `Persistent group · ${name}`,
        networkId: blueprint.id,
        creatorType,
        creatorId: creator?.id ?? 'user',
        creatorName: creator?.name ?? 'You',
        memberIds: creator ? [creator.id, ...otherMembers] : otherMembers,
        taskBound,
        taskId: taskBound ? (blueprint.id === 'my' && index === 2 ? 'task:release-260' : `task:${blueprint.id}:${index}`) : null,
        archived: (blueprint.id === 'my' && index === 8) || (blueprint.id === 'istin-network' && index === 4) || (blueprint.id === 'ai-conf' && index === 1),
        pinned: blueprint.id === 'my' && (index === 1 || index === 2),
        recent: (blueprint.id === 'my' && [0, 1, 2, 3, 4, 6].includes(index)) || (blueprint.id !== 'my' && index === 0),
        unread: index % 5 === 0 ? index % 3 + 1 : 0,
        last: creatorType === 'agent' ? `${creator.name} coordinated the group` : 'Latest channel message',
        updated: 1100 - data.channels.length * 3,
      };
      data.channels.push(channel);
    });
  }

  QUICK_TITLES.forEach((title, index) => {
    const quick = {
      id: `quick:${index}`,
      kind: 'quick',
      title,
      name: title,
      archived: index >= 4,
      linkedAgentId: null,
      pinned: false,
      recent: index < 4,
      unread: index === 1 ? 1 : 0,
      last: 'Quick chat · no persistent agent yet',
      updated: 950 - index,
    };
    data.quickChats.push(quick);
    data.messages[quick.id] = [
      { from: 'system', text: 'Quick chat · can be archived, linked or converted later' },
      { from: 'user', text: title },
      { from: 'agent', text: 'Quick response draft. The conversation has no persistent identity yet.' },
    ];
  });

  const homeAgent = (name) => data.agents.find((agent) => agent.networkId === 'my' && agent.name === name);
  const homeChannel = (name) => data.channels.find((channel) => channel.networkId === 'my' && channel.name === name);
  data.events = [
    { id: 'event:deploy', type: 'approval', status: 'needs', title: 'Approve production deploy', summary: 'Release Manager is waiting for approval.', networkId: 'my', sourceId: homeAgent('Release Manager').id, time: '09:42', unread: true },
    { id: 'event:permissions', type: 'approval', status: 'needs', title: 'Approve connector permissions', summary: 'Finance requests read-only access to the invoice folder.', networkId: 'my', sourceId: homeAgent('Finance').id, time: '09:31', unread: true },
    { id: 'event:mail-failed', type: 'failed', status: 'failed', title: 'Mail digest failed', summary: 'The connector returned a temporary error.', networkId: 'my', sourceId: homeAgent('Mail Reader').id, appId: 'app:mail', time: '09:18', unread: true },
    { id: 'event:mention-public', type: 'mention', status: 'unread', title: 'You were mentioned in #public', summary: 'Can you share the agent demo?', networkId: 'ai-conf', sourceId: 'channel:ai-conf:0', time: '08:57', unread: true },
    { id: 'event:mention-research', type: 'mention', status: 'unread', title: 'Research team needs your input', summary: 'Two alternatives are ready for review.', networkId: 'my', sourceId: homeChannel('research-team').id, time: '08:44', unread: true },
    { id: 'event:task-release', type: 'task', status: 'running', title: 'Release 2.60 audit', summary: 'Four agents are coordinating in a task-bound channel.', networkId: 'my', sourceId: homeAgent('Release Manager').id, channelId: homeChannel('release-260-audit').id, taskId: 'task:release-260', time: '08:20', unread: false },
    { id: 'event:app-export', type: 'app', status: 'running', title: 'Presentation export', summary: 'The app continues running in the background.', networkId: 'my', appId: 'app:export', time: '08:12', unread: false },
    { id: 'event:mail-result', type: 'result', status: 'done', title: 'Weekend mail digest is ready', summary: 'Five important threads were collected.', networkId: 'my', sourceId: homeAgent('Mail Reader').id, appId: 'app:mail', time: '07:55', unread: true },
    { id: 'event:export-result', type: 'result', status: 'done', title: 'Presentation export finished', summary: 'The artifact is ready to open.', networkId: 'my', appId: 'app:export', time: '07:40', unread: false },
    { id: 'event:scheduled', type: 'scheduled', status: 'later', title: 'Home routine scheduled', summary: 'The next run starts at 18:00.', networkId: 'my', sourceId: homeAgent('Home').id, time: 'Later', unread: false },
  ];

  return data;
}

export function getMessages(data, conversationId) {
  if (data.messages[conversationId]) return data.messages[conversationId];
  const found = findConversation(data, conversationId);
  if (!found) return [];
  const { kind, item } = found;
  if (kind === 'agent') {
    data.messages[conversationId] = [
      { from: 'system', text: `Persistent agent · ${networkById(data, item.networkId).name}` },
      { from: 'agent', text: `${item.name} is online. This is the same endless conversation.` },
      { from: 'user', text: 'Continue from where we stopped.' },
      { from: 'agent', text: 'Context restored. No new session was created.' },
    ];
  } else if (kind === 'channel') {
    data.messages[conversationId] = [
      { from: 'system', text: `${item.creatorName} created this ${item.taskBound ? 'task-bound' : 'persistent'} channel` },
      { from: 'system', text: `${item.memberIds.length} agent members · ${item.purpose}` },
      { from: 'agent', text: 'The group is ready. Share the next step here.' },
    ];
  } else {
    data.messages[conversationId] = [{ from: 'user', text: item.title }];
  }
  return data.messages[conversationId];
}

export function networkById(data, id) {
  return data.networks.find((network) => network.id === id);
}

export function findConversation(data, id) {
  const agent = data.agents.find((item) => item.id === id);
  if (agent) return { kind: 'agent', item: agent };
  const channel = data.channels.find((item) => item.id === id);
  if (channel) return { kind: 'channel', item: channel };
  const quick = data.quickChats.find((item) => item.id === id);
  if (quick) return { kind: 'quick', item: quick };
  return null;
}

export function addAgent(data, { name, purpose = '' }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Agent name is required');
  const agent = {
    id: nextId(data, 'agent:my:custom-'),
    kind: 'agent',
    name: cleanName,
    purpose: purpose.trim() || 'Persistent agent',
    networkId: MY_NETWORK_ID,
    networkIds: [MY_NETWORK_ID],
    homeNetworkId: MY_NETWORK_ID,
    persistent: true,
    status: 'online',
    unread: 0,
    pinned: false,
    recent: true,
    last: 'New agent · ready in My Network',
    updated: 0,
  };
  touch(data, agent);
  data.agents.push(agent);
  data.messages[agent.id] = [
    { from: 'system', text: 'Persistent agent created · automatically joined My Network' },
    { from: 'agent', text: `${cleanName} is ready.` },
  ];
  return agent;
}

export function createNetwork(data, { name }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Network name is required');
  const network = {
    id: nextId(data, 'network:custom-'),
    name: cleanName,
    agentCount: 0,
    channelCount: 0,
  };
  data.networks.push(network);
  return network;
}

export function createEmptyPreviewData(source) {
  const home = source.networks.find((network) => network.id === MY_NETWORK_ID);
  return {
    networks: [{ ...(home ?? { id: MY_NETWORK_ID, name: 'My Network' }), agentCount: 0, channelCount: 0 }],
    agents: [],
    channels: [],
    quickChats: [],
    apps: [],
    boards: [],
    widgetCatalog: source.widgetCatalog.map((widget) => ({ ...widget })),
    events: [],
    messages: {},
    sequence: 0,
    clock: 100,
  };
}

export function joinNetwork(data, invite) {
  const clean = invite.trim();
  const accepted = [DEMO_NETWORK_INVITE, 'DEMO-RESEARCH', `fa network join ${DEMO_NETWORK_INVITE}`];
  if (!accepted.includes(clean)) throw new Error('Invite not recognized. Use the demo invite shown in this wireframe.');
  const existing = data.networks.find((network) => network.id === 'research-lab');
  if (existing) return existing;
  const network = { id: 'research-lab', name: 'Research Lab', agentCount: 0, channelCount: 0, joined: true };
  data.networks.push(network);
  return network;
}

export function createApp(data, { name, description = '' }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('App name is required');
  const app = {
    id: nextId(data, 'app:custom-'),
    name: cleanName,
    description: description.trim() || 'Custom app created in this wireframe.',
    favorite: false,
    recent: true,
    running: false,
    custom: true,
  };
  data.apps.push(app);
  return app;
}

export function buildChannelInvite(data, channelId) {
  const channel = data.channels.find((item) => item.id === channelId);
  if (!channel) throw new Error('Channel not found');
  const code = `DEMO-${channel.name.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12) || 'CHANNEL'}`;
  const link = `fa2://channel/${encodeURIComponent(channel.networkId)}/${encodeURIComponent(channel.name)}/invite/${code}`;
  return {
    channelId,
    networkId: channel.networkId,
    link,
    command: `fa agent join ${JSON.stringify(link)}`,
    expiresLabel: '24 hours',
    scope: 'This channel only',
  };
}

export function createBoard(data, { name }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Board name is required');
  const board = {
    id: nextId(data, 'board:custom-'),
    name: cleanName,
    description: 'Personal widget board',
    appIds: [],
  };
  data.boards.push(board);
  return board;
}

export function installWidget(data, catalogId) {
  const widget = data.widgetCatalog.find((item) => item.id === catalogId);
  if (!widget) throw new Error('Widget not found');
  const installed = data.apps.find((app) => app.catalogId === catalogId);
  if (installed) return installed;
  const app = {
    id: nextId(data, 'app:custom-'),
    catalogId,
    name: widget.name,
    description: widget.description,
    favorite: false,
    recent: true,
    running: false,
  };
  data.apps.push(app);
  return app;
}

export function createQuickChat(data, firstMessage) {
  const clean = firstMessage.trim();
  if (!clean) throw new Error('Write the first message');
  const quick = {
    id: nextId(data, 'quick:custom-'),
    kind: 'quick',
    title: makeTitle(clean),
    name: makeTitle(clean),
    archived: false,
    linkedAgentId: null,
    pinned: false,
    recent: true,
    unread: 0,
    last: clean,
    updated: 0,
  };
  touch(data, quick);
  data.quickChats.push(quick);
  data.messages[quick.id] = [
    { from: 'system', text: 'Quick chat · title generated from the first message' },
    { from: 'user', text: clean },
  ];
  return quick;
}

export function convertQuickChatToAgent(data, quickId) {
  const quick = data.quickChats.find((item) => item.id === quickId);
  if (!quick) throw new Error('Quick chat not found');
  const history = getMessages(data, quickId).map((message) => ({ ...message }));
  const agent = addAgent(data, { name: quick.title, purpose: 'Created from a quick chat' });
  data.messages[agent.id] = [
    { from: 'system', text: 'Quick chat became a persistent agent · joined My Network' },
    ...history,
  ];
  quick.archived = true;
  quick.recent = false;
  quick.linkedAgentId = agent.id;
  return agent;
}

export function linkQuickChatToAgent(data, quickId, agentId) {
  const quick = data.quickChats.find((item) => item.id === quickId);
  const agent = data.agents.find((item) => item.id === agentId);
  if (!quick || !agent) throw new Error('Quick chat or agent not found');
  const history = getMessages(data, quickId).map((message) => ({ ...message }));
  getMessages(data, agentId).push(
    { from: 'system', text: `Linked quick chat: ${quick.title}` },
    ...history,
  );
  quick.archived = true;
  quick.recent = false;
  quick.linkedAgentId = agentId;
  touch(data, agent);
  return agent;
}

export function createChannel(data, {
  name,
  purpose = '',
  networkId = MY_NETWORK_ID,
  creatorId = 'user',
  memberIds = [],
  taskBound = false,
  taskId = null,
  allowExternalMembers = false,
}) {
  const cleanName = channelDisplayName(name);
  if (!cleanName) throw new Error('Channel name is required');
  const network = networkById(data, networkId);
  if (!network) throw new Error('Network not found');
  const creator = creatorId === 'user' ? null : data.agents.find((agent) => agent.id === creatorId);
  if (creatorId !== 'user' && !creator) throw new Error('Creating agent not found');
  if (creator && !agentBelongsToNetwork(creator, networkId)) {
    throw new Error('The creating agent belongs to another network');
  }
  const members = data.agents.filter((agent) => memberIds.includes(agent.id));
  for (const member of members) {
    if (!allowExternalMembers && !agentBelongsToNetwork(member, networkId)) {
      throw new Error('Cannot implicitly add an agent from another network');
    }
  }
  if (members.length !== new Set(memberIds).size) throw new Error('Channel member not found');
  const channel = {
    id: nextId(data, `channel:${networkId}:custom-`),
    kind: 'channel',
    name: cleanName,
    purpose: purpose.trim() || 'Agent group',
    networkId,
    creatorType: creator ? 'agent' : 'user',
    creatorId,
    creatorName: creator?.name ?? 'You',
    memberIds: [...new Set([...(creator ? [creator.id] : []), ...memberIds])],
    externalMemberIds: members.filter((agent) => !agentBelongsToNetwork(agent, networkId)).map((agent) => agent.id),
    taskBound,
    taskId,
    archived: false,
    pinned: false,
    recent: true,
    unread: 0,
    last: `${creator?.name ?? 'You'} created the channel`,
    updated: 0,
  };
  touch(data, channel);
  data.channels.push(channel);
  data.messages[channel.id] = [
    { from: 'system', text: `${channel.creatorName} created #${channel.name} · ${channel.purpose}` },
    { from: 'system', text: `${channel.memberIds.length} agent members · ${network.name}` },
  ];
  if (channel.externalMemberIds.length) {
    data.messages[channel.id].push({ from: 'system', text: `${channel.externalMemberIds.length} external member(s) · access is limited to this group, not ${network.name}` });
  }
  return channel;
}

export function composeChat(data, { recipientIds = [], message, groupName = '' }) {
  const cleanMessage = message.trim();
  if (!cleanMessage) throw new Error('Write the first message');
  const uniqueIds = [...new Set(recipientIds)];
  const recipients = uniqueIds.map((id) => data.agents.find((agent) => agent.id === id));
  if (recipients.some((agent) => !agent)) throw new Error('Recipient agent not found');

  if (!recipients.length) {
    const conversation = createQuickChat(data, cleanMessage);
    return { kind: 'quick', conversation, externalCount: 0 };
  }
  if (recipients.length === 1) {
    const conversation = recipients[0];
    sendMessage(data, conversation.id, cleanMessage);
    return { kind: 'agent', conversation, externalCount: 0 };
  }

  const conversation = createChannel(data, {
    name: groupName.trim() || makeTitle(cleanMessage),
    purpose: `Quick group · ${recipients.length} agents`,
    networkId: MY_NETWORK_ID,
    memberIds: uniqueIds,
    allowExternalMembers: true,
  });
  sendMessage(data, conversation.id, cleanMessage);
  return { kind: 'channel', conversation, externalCount: conversation.externalMemberIds.length };
}

export function createAgentTask(data, { agentId, title, createChannel: shouldCreateChannel = true, memberIds = [] }) {
  const agent = data.agents.find((item) => item.id === agentId);
  const cleanTitle = title.trim();
  if (!agent) throw new Error('Agent not found');
  if (!cleanTitle) throw new Error('Task title is required');
  const taskId = nextId(data, 'task:custom-');
  let channel = null;
  if (shouldCreateChannel) {
    const defaultMembers = data.agents
      .filter((item) => item.id !== agentId && agentBelongsToNetwork(item, agent.networkId))
      .slice(0, 3)
      .map((item) => item.id);
    channel = createChannel(data, {
      name: cleanTitle,
      purpose: `Task-bound group · ${cleanTitle}`,
      networkId: agent.networkId,
      creatorId: agentId,
      memberIds: memberIds.length ? memberIds : defaultMembers,
      taskBound: true,
      taskId,
    });
  }
  const event = {
    id: nextId(data, 'event:custom-'),
    type: 'task',
    status: 'running',
    title: cleanTitle,
    summary: channel ? `${agent.name} created a task channel and grouped ${channel.memberIds.length - 1} other agents.` : `${agent.name} started the task.`,
    networkId: agent.networkId,
    sourceId: agentId,
    channelId: channel?.id ?? null,
    taskId,
    time: 'Now',
    unread: true,
  };
  data.events.unshift(event);
  return { event, channel };
}

export function completeTask(data, eventId) {
  const event = data.events.find((item) => item.id === eventId);
  if (!event) throw new Error('Task event not found');
  event.status = 'done';
  event.time = 'Now';
  event.unread = true;
  if (event.channelId) {
    const channel = data.channels.find((item) => item.id === event.channelId);
    if (channel?.taskBound) {
      channel.archived = true;
      channel.recent = false;
      getMessages(data, channel.id).push({ from: 'system', text: 'Task completed · channel archived, history retained' });
    }
  }
  return event;
}

export function retryEvent(data, eventId) {
  const event = data.events.find((item) => item.id === eventId);
  if (!event) throw new Error('Event not found');
  event.status = 'running';
  event.time = 'Now';
  return event;
}

export function requestCrossNetworkInvite(data, { channelId, agentId }) {
  const channel = data.channels.find((item) => item.id === channelId);
  const agent = data.agents.find((item) => item.id === agentId);
  if (!channel || !agent) throw new Error('Channel or agent not found');
  if (agentBelongsToNetwork(agent, channel.networkId)) {
    throw new Error('Agent already belongs to this network');
  }
  const duplicate = data.events.find((event) => event.status === 'needs' && event.pendingInvite?.channelId === channelId && event.pendingInvite?.agentId === agentId);
  if (duplicate) return duplicate;
  const event = {
    id: nextId(data, 'event:custom-'),
    type: 'approval',
    status: 'needs',
    title: 'Approve cross-network channel invite',
    summary: `${agent.name} (${networkById(data, agent.networkId).name}) → #${channel.name} (${networkById(data, channel.networkId).name})`,
    networkId: channel.networkId,
    sourceId: channelId,
    channelId,
    pendingInvite: { channelId, agentId },
    time: 'Now',
    unread: true,
  };
  data.events.unshift(event);
  return event;
}

export function approveEvent(data, eventId) {
  const event = data.events.find((item) => item.id === eventId);
  if (!event) throw new Error('Event not found');
  if (event.status === 'done') return event;
  event.status = 'done';
  event.time = 'Now';
  if (event.pendingInvite) {
    const channel = data.channels.find((item) => item.id === event.pendingInvite.channelId);
    if (channel && !channel.memberIds.includes(event.pendingInvite.agentId)) {
      channel.memberIds.push(event.pendingInvite.agentId);
      getMessages(data, channel.id).push({ from: 'system', text: 'Cross-network invite approved explicitly by the owner' });
    }
  }
  return event;
}

export function sendMessage(data, conversationId, text, from = 'user') {
  const clean = text.trim();
  if (!clean) return null;
  const found = findConversation(data, conversationId);
  if (!found) throw new Error('Conversation not found');
  const message = { from, text: clean };
  getMessages(data, conversationId).push(message);
  found.item.last = clean;
  if (found.kind === 'quick') {
    found.item.archived = false;
    found.item.recent = true;
  }
  touch(data, found.item);
  return message;
}

export function searchAll(data, query) {
  const needle = searchText(query);
  if (!needle) return [];
  const matches = (value) => searchText(value).includes(needle);
  const results = [];
  for (const agent of data.agents) {
    if (matches(`${agent.name} ${agent.purpose} ${networkById(data, agent.networkId).name}`)) {
      results.push({ type: 'agent', id: agent.id, title: agent.name, subtitle: networkById(data, agent.networkId).name });
    }
  }
  for (const channel of data.channels) {
    if (matches(`${channel.name} ${channel.purpose} ${networkById(data, channel.networkId).name}`)) {
      results.push({ type: 'channel', id: channel.id, title: `#${channel.name}`, subtitle: `${networkById(data, channel.networkId).name}${channel.archived ? ' · archived' : ''}` });
    }
  }
  for (const quick of data.quickChats) {
    if (matches(`${quick.title} ${quick.last}`)) {
      results.push({ type: 'quick', id: quick.id, title: quick.title, subtitle: `Quick chat${quick.archived ? ' · archived' : ''}` });
    }
  }
  for (const network of data.networks) {
    if (matches(network.name)) results.push({ type: 'network', id: network.id, title: network.name, subtitle: `${network.agentCount} agents · ${network.channelCount} channels` });
  }
  for (const app of data.apps) {
    if (matches(`${app.name} ${app.description}`)) results.push({ type: 'app', id: app.id, title: app.name, subtitle: 'App' });
  }
  const rank = (result) => {
    const title = searchText(result.title.replace(/^#/, ''));
    if (title === needle) return 0;
    if (title.startsWith(needle)) return 1;
    if (title.includes(needle)) return 2;
    return 3;
  };
  return results
    .sort((left, right) => rank(left) - rank(right) || left.title.localeCompare(right.title))
    .slice(0, 40);
}
