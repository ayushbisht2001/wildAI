import {
  districtContactSource,
  districtControlRooms,
  emergencyContacts,
  regions,
  type RegionId,
} from './regionPack';
import { corbettVisitorRules, fieldGuides, plants, type Source } from './knowledgePack';

export type Answer =
  | {
      kind: 'supported';
      title: string;
      message: string;
      sources: Source[];
    }
  | { kind: 'abstain'; title: string; message: string };

const contactQuestions = new Set([
  'what is the emergency number',
  'how do i call for help',
  'how do i get help',
  'what is the disaster helpline',
  'what number do i call in an emergency',
]);

const areaNames = {
  corbett: 'Corbett Tiger Reserve',
  almora: 'Almora',
  pauri: 'Pauri Garhwal',
  dehradun: 'Kalsi, Dehradun district',
};

function uniqueSources(sources: Source[]): Source[] {
  return sources.filter((source, index) =>
    sources.findIndex(item => item.url === source.url) === index,
  );
}

export function answerQuestion(regionId: RegionId, question: string): Answer {
  if (!regions.some(region => region.id === regionId)) {
    return {
      kind: 'abstain',
      title: 'Region unavailable',
      message: 'Select a listed region to see applicable information.',
    };
  }

  const normalized = question
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
  if (!normalized) {
    return {
      kind: 'abstain',
      title: 'Enter a question',
      message: 'Type a question to search the offline information.',
    };
  }
  if (contactQuestions.has(normalized)) {
    const contact = emergencyContacts.statewide;
    const local =
      regionId === 'uttarakhand' ? null : districtControlRooms[regionId];
    return {
      kind: 'supported',
      title: 'Emergency contacts',
      message:
        'Emergency services: ' +
        contact.emergency +
        '. State emergency control room: ' +
        contact.stateControlRoom +
        '. District emergency control room: ' +
        contact.districtControlRoom +
        (local ? '. Local district control room: ' + local : '') +
        '. Calling requires cellular service.',
      sources: [{
        name: contact.sourceName,
        url: local ? districtContactSource : contact.sourceUrl,
      }],
    };
  }

  // A species occurrence or food-use record never verifies a specimen in hand.
  if (/\b(this|these|found|picked|unknown|identify|photo|picture)\b/.test(normalized) &&
      /\b(eat|edible|safe|fruit|berry|berries|plant|poison|toxic)\b/.test(normalized)) {
    return {
      kind: 'abstain',
      title: 'Cannot identify a found plant',
      message: 'Do not eat a found fruit or plant based on this app. It cannot verify its identity or safety. Ask a qualified local expert in person.',
    };
  }
  if (/\b(poison|poisonous|toxic|treat|treatment|medicine|snakebite)\b/.test(normalized)) {
    return {
      kind: 'abstain',
      title: 'No reviewed safety answer available',
      message: 'This pack has no approved answer for that medical or toxicity question. Seek professional help; call 112 if you have cellular service and need emergency assistance.',
    };
  }

  const guide = fieldGuides
    .map(item => ({ item, score: item.terms.filter(term => normalized.includes(term)).length }))
    .sort((a, b) => b.score - a.score)[0];
  if (guide?.score) {
    return {
      kind: 'supported',
      title: guide.item.title,
      message: guide.item.message,
      sources: [guide.item.source],
    };
  }

  const namedPlant = plants.find(plant =>
    [...plant.common.toLowerCase().split(' / '), plant.scientific.toLowerCase()]
      .some(name => ` ${normalized} `.includes(` ${name} `)),
  );
  const foodQuestion = /\b(edible|eat|food|forage)\b/.test(normalized);
  const fruitQuestion = /\b(fruit|fruits|berry|berries)\b/.test(normalized);
  if (namedPlant) {
    if (foodQuestion && !namedPlant.foodUse) {
      return {
        kind: 'abstain',
        title: 'Food use not verified',
        message: `This pack documents ${namedPlant.common} in ${areaNames[namedPlant.area]}, but has no reviewed food-use record for it. Do not eat a wild specimen based on this app.`,
      };
    }
    return {
      kind: 'supported',
      title: `${namedPlant.common} (${namedPlant.scientific})`,
      message: `Documented in ${areaNames[namedPlant.area]}. ${namedPlant.foodUse ? 'Its fruit has documented food use.' : 'Food use is not documented in this pack.'} This record does not identify or certify a plant you find.`,
      sources: uniqueSources([namedPlant.occurrence, ...(namedPlant.foodUse ? [namedPlant.foodUse] : [])]),
    };
  }

  if (/\b(plant|plants|flora|tree|trees|species|fruit|fruits|berry|berries|edible|forage)\b/.test(normalized)) {
    const area = /\bcorbett\b/.test(normalized) ? 'corbett' : regionId;
    const matches = plants.filter(plant =>
      (area === 'uttarakhand' || plant.area === area) &&
      (!foodQuestion && !fruitQuestion || Boolean(plant.foodUse)),
    );
    if (matches.length) {
      const shown = /\b(all|list)\b/.test(normalized) ? matches : matches.slice(0, 8);
      return {
        kind: 'supported',
        title: `${foodQuestion || fruitQuestion ? 'Documented food-use species' : 'Documented plants'} · ${area === 'uttarakhand' ? 'Uttarakhand examples' : areaNames[area as keyof typeof areaNames]}`,
        message:
          shown.map(plant => `• ${plant.common} (${plant.scientific})${area === 'uttarakhand' ? ` — ${areaNames[plant.area]}` : ''}`).join('\n') +
          `\n\n${shown.length < matches.length ? `Showing ${shown.length} of ${matches.length} records. Ask to “list all” for the full curated set. ` : ''}` +
          'This is a curated, incomplete list. A species record never verifies a found specimen or makes foraging safe.' +
          (area === 'corbett' ? ' In Corbett, remain on designated routes with a registered guide.' : ''),
        sources: uniqueSources([
          ...shown.flatMap(plant =>
            [plant.occurrence, ...(foodQuestion || fruitQuestion ? [plant.foodUse!] : [])],
          ),
          ...(area === 'corbett' ? [corbettVisitorRules] : []),
        ]),
      };
    }
  }

  return {
    kind: 'abstain',
    title: 'No reviewed answer available',
    message:
      'No matching reviewed entry is in this offline pack. Try asking about documented plants, Corbett visitor rules, lightning, landslides, floods, or emergency contacts.',
  };
}
