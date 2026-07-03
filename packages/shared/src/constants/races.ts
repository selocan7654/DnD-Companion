export interface DndRace {
  name: string;
  speed: number;
  size: string;
  source: string;
}

/** Core PHB species/races for character builder dropdowns. */
export const DND_RACES: DndRace[] = [
  { name: 'Dragonborn', speed: 30, size: 'Medium', source: 'PHB' },
  { name: 'Dwarf', speed: 25, size: 'Medium', source: 'PHB' },
  { name: 'Elf', speed: 30, size: 'Medium', source: 'PHB' },
  { name: 'Gnome', speed: 25, size: 'Small', source: 'PHB' },
  { name: 'Half-Elf', speed: 30, size: 'Medium', source: 'PHB' },
  { name: 'Half-Orc', speed: 30, size: 'Medium', source: 'PHB' },
  { name: 'Halfling', speed: 25, size: 'Small', source: 'PHB' },
  { name: 'Human', speed: 30, size: 'Medium', source: 'PHB' },
  { name: 'Tiefling', speed: 30, size: 'Medium', source: 'PHB' },
];
