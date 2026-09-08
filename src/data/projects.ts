export type ProjectVisual = 'scene' | 'systems' | 'mobile' | 'data' | 'hardware' | 'maker';

export type Project = {
  slug: string;
  index: string;
  title: string;
  eyebrow: string;
  lede: string;
  summary: string;
  role: string;
  status: string;
  year: string;
  stack: string[];
  featured: boolean;
  visual: ProjectVisual;
  tone: string;
  challenge: string;
  approach: string;
  outcome: string;
};

export const projects: Project[] = [
  {
    slug: 'homemah',
    index: '01',
    title: 'HomeMah',
    eyebrow: '3D software / AI',
    lede: 'Building an AI-assisted interior design application from the renderer upward.',
    summary: 'A custom desktop 3D interior design application developed with C++, Qt and OpenGL, combining scene editing, asset workflows, persistence and local AI/RAG experiments.',
    role: 'Software engineering · graphics · product',
    status: 'Prototype / active development',
    year: '2026',
    stack: ['C++', 'Qt', 'OpenGL', 'ImGui', 'JSON', 'Ollama'],
    featured: true,
    visual: 'scene',
    tone: '#c7d0ff',
    challenge: 'Interior design tools are a useful way to explore several difficult systems at once: rendering, interaction, scene state, asset loading and user-facing editing. I wanted to understand those layers directly rather than hiding them behind a game engine.',
    approach: 'HomeMah was built around a custom desktop editor. I worked on the rendering and scene pipeline, furniture and material handling, editor controls, JSON-based persistence, packaging, and experiments with locally hosted AI through Ollama and RAG infrastructure.',
    outcome: 'The project became a working Windows application and a continuing testbed for graphics, tooling and AI integration. The portfolio case study focuses on what is implemented today and keeps future AI ideas clearly separated from shipped functionality.',
  },
  {
    slug: 'koh-seng-b2b',
    index: '02',
    title: 'Koh Seng B2B',
    eyebrow: 'Client platform / commerce',
    lede: 'Turning a traditional supplier workflow into a digital ordering system.',
    summary: 'A custom B2B commerce and customer portal designed around account-specific pricing, product variants, packing units, order history and administrative workflows.',
    role: 'Product · full-stack · deployment',
    status: 'Client project / active development',
    year: '2026',
    stack: ['B2B', 'Web', 'Database design', 'Nginx', 'VPS'],
    featured: true,
    visual: 'systems',
    tone: '#ffd7c8',
    challenge: 'Koh Seng does not operate like a typical consumer shop. Customers can have different prices, payment terms, delivery information and packing requirements, so a normal one-price-one-variant storefront model is not enough.',
    approach: 'I structured the product around B2B workflows: searchable catalogue data, account-aware customer information, multi-level product variations, ordering, history and administration. Infrastructure and deployment were treated as part of the product rather than an afterthought.',
    outcome: 'The project translates a largely manual business process into a maintainable digital platform and creates a cleaner data foundation for future automation and AI-assisted product discovery.',
  },
  {
    slug: 'healthmate',
    index: '03',
    title: 'HealthMate',
    eyebrow: 'HealthTech / product design',
    lede: 'What if health tracking required less tracking?',
    summary: 'A health and nutrition product concept combining food logging, history, progress, discovery and an AI assistant within one coherent mobile experience.',
    role: 'Product strategy · UI/UX · system design',
    status: 'Design direction approved / pre-engineering',
    year: '2026',
    stack: ['Figma', 'Product design', 'HealthTech', 'AI planning'],
    featured: true,
    visual: 'mobile',
    tone: '#c7ead9',
    challenge: 'Many tracking products make users spend a lot of effort entering data before they receive anything useful back. The product challenge is to reduce friction without pretending that uncertain health data is more precise than it really is.',
    approach: 'I developed the product structure across Home, logging, manual food entry, History / Log Again, Discover, Progress, AI and bottom navigation, then unified those screens with a consistent design system. Future capabilities such as image-assisted logging and health integrations remain explicitly roadmap items.',
    outcome: 'HealthMate now has a coherent approved design direction and engineering handoff scope. It demonstrates product thinking, information architecture and AI feature planning rather than presenting unfinished features as already live.',
  },
  {
    slug: 'optcg-tracker',
    index: '04',
    title: 'OPTCG Tracker',
    eyebrow: 'Data product / automation',
    lede: 'A hobby project that kept turning into infrastructure.',
    summary: 'A One Piece Card Game pricing and collection platform that grew from personal tooling into a public-facing product with automated data workflows and monetisation planning.',
    role: 'Full-stack · data automation · product',
    status: 'Live product / evolving',
    year: '2026',
    stack: ['Web', 'Automation', 'Data pipelines', 'VPS', 'Subscriptions'],
    featured: true,
    visual: 'data',
    tone: '#d8ccff',
    challenge: 'Card pricing data changes constantly and is spread across sources. What started as personal tracking needed a more reliable way to collect, cache, present and eventually productise that information.',
    approach: 'I built data ingestion and pricing workflows, structured card and deck information for the web, deployed the application on a VPS and iterated on account tiers, storage limits, admin controls and safer API boundaries.',
    outcome: 'OPTCG Tracker became a real production system that I actively use as a place to learn deployment, automation, data reliability and productisation through repeated releases.',
  },
  {
    slug: 'smartdeskos',
    index: '05',
    title: 'SmartDeskOS',
    eyebrow: 'Hardware + software experiment',
    lede: 'Exploring what a desk feels like when the software is part of the object.',
    summary: 'An ongoing smart-desk project exploring a tighter relationship between physical controls, embedded hardware and a software interface.',
    role: 'Prototype · systems thinking',
    status: 'Project details being curated',
    year: '2026',
    stack: ['Hardware', 'Embedded', 'UI', 'Prototyping'],
    featured: false,
    visual: 'hardware',
    tone: '#d8e0e6',
    challenge: 'The interesting problem is not adding more gadgets to a desk; it is deciding which physical and digital interactions actually deserve to exist together.',
    approach: 'This case study is being curated around the real hardware, interface and integration work so the final page can show evidence rather than filling gaps with generic claims.',
    outcome: 'The project remains in the portfolio as an example of work that crosses the boundary between physical products and software. More implementation detail will be added as the source material is consolidated.',
  },
  {
    slug: 'koi-studio',
    index: '06',
    title: 'KOI Studio',
    eyebrow: 'Maker business / e-commerce',
    lede: 'Designing products is only half the job when you also have to sell and operate them.',
    summary: 'My maker and e-commerce work across product design, 3D-printed items, storefront content, automation and the operational systems behind a small product business.',
    role: 'Founder · maker · e-commerce',
    status: 'Active business',
    year: '2026',
    stack: ['3D printing', 'E-commerce', 'Automation', 'Product design'],
    featured: false,
    visual: 'maker',
    tone: '#ffe8a8',
    challenge: 'A small product business compresses product design, photography, listings, customer communication, fulfilment and automation into the same workflow.',
    approach: 'I use KOI Studio as a practical environment for building physical products and improving the systems around them, including listing workflows, product imagery, storefront operations and internal tooling.',
    outcome: 'The result is a portfolio project that shows the business side of making: not only creating an object, but building the repeatable process required to sell and support it.',
  },
];

export const featuredProjects = projects.filter((project) => project.featured);
export const additionalProjects = projects.filter((project) => !project.featured);

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
