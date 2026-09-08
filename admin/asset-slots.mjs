export const assetSlots = [
  {
    id: 'homepage-hero',
    project: 'Homepage',
    title: 'Hero artwork',
    description: 'Replaces the temporary workshop image behind “Building useful worlds.”',
    recommendation: 'A wide workspace, studio, or personal image. 2400 × 1600 px or larger works best.',
  },
  {
    id: 'homemah',
    project: 'HomeMah',
    title: 'Primary project image',
    description: 'Appears in Selected work and on the HomeMah case-study page.',
    recommendation: 'Use a clean app screenshot, render, or workspace photo. Landscape 16:10 is ideal.',
  },
  {
    id: 'koh-seng-b2b',
    project: 'Koh Seng B2B',
    title: 'Primary project image',
    description: 'Appears in Selected work and on the Koh Seng B2B case-study page.',
    recommendation: 'Use a catalogue, ordering flow, product, or team-workflow image. Landscape 16:10 is ideal.',
  },
  {
    id: 'healthmate',
    project: 'HealthMate',
    title: 'Primary project image',
    description: 'Appears in Selected work and on the HealthMate case-study page.',
    recommendation: 'Use a composed mobile-screen image or a polished product mockup. Landscape 16:10 is ideal.',
  },
  {
    id: 'optcg-tracker',
    project: 'OPTCG Tracker',
    title: 'Primary project image',
    description: 'Appears in Selected work and on the OPTCG Tracker case-study page.',
    recommendation: 'Use the dashboard, collection, cards, or product UI. Landscape 16:10 is ideal.',
  },
  {
    id: 'smartdeskos',
    project: 'SmartDeskOS',
    title: 'Primary project image',
    description: 'Appears on the SmartDeskOS case-study page.',
    recommendation: 'Use the physical desk, a prototype, or the software-in-context. Landscape 16:10 is ideal.',
  },
  {
    id: 'koi-studio',
    project: 'KOI Studio',
    title: 'Primary project image',
    description: 'Appears on the KOI Studio case-study page.',
    recommendation: 'Use a product, making process, or storefront-quality photo. Landscape 16:10 is ideal.',
  },
];

export const assetSlotIds = new Set(assetSlots.map(({ id }) => id));
