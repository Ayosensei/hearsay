import fs from 'node:fs';

// Keep the classic golden-test world intact; publish this larger game as a new edition.
const world = JSON.parse(fs.readFileSync('seed/hollowbrook.json', 'utf8'));
world.factions.push({ id: 'merchants', name: 'Merchants' });
world.places.push(
  { id: 'market', name: 'Market Row' }, { id: 'chapel', name: 'Chapel of Ash' },
  { id: 'square', name: 'Town Square' }, { id: 'vale_home', name: 'The Vale Family Home' },
  { id: 'bakery', name: 'Vale Bakery' }, { id: 'timberyard', name: 'Vale Timber Yard' },
  { id: 'docks', name: 'River Docks' }, { id: 'butchery', name: "Marta's Butchery" },
  { id: 'boardinghouse', name: 'The Willow Boarding House' },
);
const cast = [
  ['rowan', 'Rowan Vale', 'carpenter · Vale father', 'townsfolk', .3, .7, .9,
    'Rowan and Elin are married. Their adult daughter Lysa is a courier; their adult son Oren is an apprentice. Protective, measured, trusts family more than strangers.',
    'A good home starts with sound timber and sound judgment.', 'My family comes first. I measure people carefully.'],
  ['elin', 'Elin Vale', 'baker · Vale mother', 'townsfolk', .25, .6, .85,
    'Elin is married to Rowan, mother of adult children Lysa and Oren. Runs the family bakery. Warm but practical, close to Marta and the market traders.',
    'There is always room at our table for a considerate traveller.', 'People earn a place at our table by how they conduct themselves.'],
  ['lysa', 'Lysa Vale', 'courier · Vale daughter', 'townsfolk', .2, .8, .65,
    'Adult daughter of Rowan and Elin, sister of Oren. A quick-witted courier whose work connects the family lane and the inn. Values reliable sources.',
    'Every road leads somewhere. I like to know who is at the other end.', 'I pay attention to the company people keep.'],
  ['oren', 'Oren Vale', 'apprentice · Vale son', 'townsfolk', .45, .5, .75,
    'Adult son of Rowan and Elin, brother of Lysa. A quiet apprentice who admires Brom and trusts his father. Careful rather than talkative.',
    'I am still learning the craft. Father says patience matters.', 'I take my father’s judgment seriously.'],
  ['ayla', 'Sister Ayla', 'priest and healer', 'townsfolk', .1, .5, .8,
    'A compassionate priest at the Chapel of Ash. Knows the Vale family and Old Fenn. Speaks gently, believes kindness requires responsibility.',
    'Peace to you, traveller. Everyone carries a burden.', 'Compassion does not mean ignoring how people behave.'],
  ['fenn', 'Old Fenn', 'beggar and town observer', 'townsfolk', .3, .2, .2,
    'An elderly beggar who rests in the square. Overlooked but observant, connected to Mira and Tilda. Dry humor, careful about which voices he believes.',
    'A bench gives a person time to observe the world.', 'People seldom notice who is listening. I make up my own mind.'],
  ['julian', 'Julian Reed', 'bachelor and musician', 'townsfolk', .35, .55, .35,
    'An unmarried adult musician renting a room at the Willow Boarding House. Sociable but skeptical of market talk. His old friend Silas is his most trusted source.',
    'A room of my own and a tune for the evening. That suits me.', 'I prefer a reliable voice to a crowded room.'],
  ['marta', 'Marta Flint', 'butcher', 'merchants', .65, .8, .7,
    'A blunt butcher whose shop supplies Elin’s bakery and Silas’s river crew. Loyal to regular customers and exacting about fair dealing.',
    'Plain words and fair dealing. We will get along if you manage those.', 'I judge people by their dealings, not their fine speeches.'],
  ['silas', 'Silas Brook', 'fisherman', 'townsfolk', .4, .75, .55,
    'A patient fisherman at the river docks and Julian’s longtime friend. Trusts Marta’s practical judgment. Finds the square’s chatter less convincing.',
    'The river rewards patience. People could learn from it.', 'I wait for a dependable account before making a judgment.'],
  ['tilda', 'Tilda Moss', 'merchant', 'merchants', .8, .3, .3,
    'A sharp merchant with a stall on Market Row. Talks to Old Fenn, the guard and the Vale bakery. Careful with favors and attentive to her business.',
    'Take your time looking. Good business starts with knowing your customer.', 'A reputation is worth weighing as carefully as silver.'],
];
world.templates.byNpc = {};
for (const [id, name, role, faction, greed, courage, loyalty, persona, greeting, aware] of cast) {
  world.npcs.push({ id, name, role, faction, greed, courage, loyalty, persona });
  world.templates.byNpc[id] = {
    greeting: { hostile: ['Keep your distance, traveller.'], wary: ['We should proceed carefully.'], neutral: [greeting], friendly: ['It is good to see a welcome face.'], devoted: ['You have a place among friends here.'] },
    aware: { hostile: ['You have given me little reason to welcome you.'], wary: [aware], neutral: ['There is more than one side to a person.'], friendly: ['You have earned my goodwill.'], devoted: ['I would gladly vouch for your character.'] },
    unknownTopic: ['I cannot speak to something I have not learned about.', 'That is outside what I know.'],
  };
}
const trusts = [
  ['fenn', 'mira', .8], ['mira', 'fenn', .6], ['tilda', 'fenn', .5], ['fenn', 'tilda', .3],
  ['ayla', 'mira', .6], ['mira', 'ayla', .7], ['tilda', 'garrick', .5], ['garrick', 'tilda', .4], ['ayla', 'brom', .5],
  ['rowan', 'brom', .85], ['brom', 'rowan', .7],
  ['elin', 'rowan', .95], ['rowan', 'elin', .95],
  ['lysa', 'rowan', .8], ['rowan', 'lysa', .85], ['oren', 'rowan', .75], ['rowan', 'oren', .8],
  ['lysa', 'elin', .9], ['elin', 'lysa', .85], ['oren', 'elin', .9], ['elin', 'oren', .8],
  ['lysa', 'oren', .7], ['oren', 'lysa', .8], ['mira', 'lysa', .75],
  ['elin', 'ayla', .8], ['ayla', 'elin', .8], ['tilda', 'elin', .65],
  ['marta', 'elin', .8], ['elin', 'marta', .85], ['marta', 'tilda', .7],
  ['silas', 'marta', .85], ['marta', 'silas', .7], ['silas', 'fenn', .3],
  ['julian', 'silas', .8], ['silas', 'julian', .75], ['julian', 'tilda', .4], ['ayla', 'julian', .7],
];
world.trusts.push(...trusts.map(([truster, trusted, weight]) => ({ truster, trusted, weight })));
world.factionRelations.push({ from: 'merchants', to: 'townsfolk', type: 'ALLIED_WITH' });
const facts = [
  ['family_vale', 'Rowan and Elin Vale are married. Lysa and Oren are their adult children.', 'family', ['rowan', 'elin', 'lysa', 'oren', 'ayla']],
  ['family_work', 'Rowan works timber, Elin bakes, Lysa carries letters, and Oren is an apprentice.', 'family', ['rowan', 'elin', 'lysa', 'oren']],
  ['parish', 'Sister Ayla tends the Chapel of Ash and offers care to the town.', 'chapel', ['ayla', 'elin', 'fenn']],
  ['market_supply', 'Marta supplies the bakery and river crew. Tilda trades on Market Row.', 'trade', ['marta', 'elin', 'silas', 'tilda']],
  ['river_friends', 'Silas and Julian are longtime friends. Julian rents a room at the Willow Boarding House.', 'friendship', ['silas', 'julian']],
  ['square_life', 'Old Fenn rests in the square, where people from several districts pass.', 'town', ['fenn', 'mira', 'tilda']],
];
for (const [id, text, topic, npcs] of facts) {
  world.facts.push({ id, text, topic });
  world.believes.push(...npcs.map((npc) => ({ npc, fact: id, confidence: 1 })));
}
world.policies.push({ id: 'haggle_tilda', kind: 'haggle', markup: .1, minMarkup: .05, maxMarkup: .3, step: .05 });
world.follows.push({ npc: 'tilda', policy: 'haggle_tilda' });
fs.writeFileSync('seed/hollowbrook-expanded.json', JSON.stringify(world, null, 2) + '\n');
console.log(`Expanded world: ${world.npcs.length} NPCs, ${world.trusts.length} directional trust edges, ${world.places.length} places.`);
