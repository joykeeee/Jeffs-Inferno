import { Relic } from '../types';

export const ALL_RELICS: Relic[] = [
  {
    id: 'virgils_mantle',
    name: "Virgil's Mantle",
    icon: '🛡️',
    description: '+1 Max Ectoplasm container and restores all essence.',
    tier: 'rare',
  },
  {
    id: 'stygian_feather',
    name: 'Stygian Feather',
    icon: '🪶',
    description: 'Grants Jeff the power to double-jump mid-air.',
    tier: 'legendary',
  },
  {
    id: 'phantom_surge',
    name: 'Phantom Surge',
    icon: '💨',
    description: 'Supercharges Spectral Dash cooldown by ~50% for rapid chasm crossing.',
    tier: 'rare',
  },
  {
    id: 'spectral_drift',
    name: 'Spectral Drift',
    icon: '✨',
    description: 'Increases float and hover glide time by 75%.',
    tier: 'common',
  },
  {
    id: 'ethereal_magnet',
    name: 'Ethereal Magnet',
    icon: '🧲',
    description: 'Pulls nearby Soul Wisps directly to Jeff.',
    tier: 'common',
  },
  {
    id: 'zephyr_touch',
    name: 'Zephyr Touch',
    icon: '⚡',
    description: '+25% movement speed and quicker directional snap.',
    tier: 'common',
  },
  {
    id: 'cocytus_cleats',
    name: 'Cocytus Cleats',
    icon: '🧊',
    description: 'Grants complete traction on slippery ice surfaces.',
    tier: 'common',
  },
  {
    id: 'aura_of_dis',
    name: 'Aura of Dis',
    icon: '🔮',
    description: 'Absorbs 1 hazard hit per room without losing essence.',
    tier: 'rare',
  },
  {
    id: 'second_breath',
    name: 'Second Breath',
    icon: '🕯️',
    description: 'Survive fatal essence loss once per run and revive at 1 essence.',
    tier: 'legendary',
  },
  {
    id: 'philosophers_wisdom',
    name: "Philosopher's Wisdom",
    icon: '📜',
    description: 'Receive +2 bonus Soul Wisps upon clearing each circle.',
    tier: 'common',
  },
  {
    id: 'tailwind_charm',
    name: 'Tailwind Charm',
    icon: '🌪️',
    description: 'Wind drafts and bouncers launch Jeff with 40% more lift.',
    tier: 'common',
  },
];

export function getRandomBoons(count: number = 3, existingRelicIds: string[] = []): Relic[] {
  const available = ALL_RELICS.filter((r) => !existingRelicIds.includes(r.id));
  if (available.length <= count) {
    return available;
  }
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
