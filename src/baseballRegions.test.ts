import { describe, expect, it } from 'vitest';
import regions from './baseballRegions.json';
import daejeonPaths from './daejeonRegions.json';
import { getVenue } from './venues';

describe('numbered baseball hit areas', () => {
  it('provides every numbered Jamsil block independently', () => {
    const blocks = regions.jamsil.blocks;
    const expected = [
      ...Array.from({ length: 22 }, (_, i) => String(101 + i)),
      ...Array.from({ length: 26 }, (_, i) => String(201 + i)),
      ...Array.from({ length: 34 }, (_, i) => String(301 + i)),
      ...Array.from({ length: 22 }, (_, i) => String(401 + i)),
      '프리미엄석',
    ];
    expect(blocks.map((b) => b.label).sort()).toEqual(expected.sort());
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
    for (const block of blocks) {
      expect(block.d.match(/M/g)).toHaveLength(1);
      expect(regions.jamsil.paths).toHaveProperty(block.section);
    }
  });
  it('keeps formerly joined 217/218 and split 408 as distinct complete hit areas', () => {
    const get = (label: string) => regions.jamsil.blocks.find((b) => b.label === label)!;
    expect(get('217').d).not.toEqual(get('218').d);
    expect(get('408').d.match(/M/g)).toHaveLength(1);
    expect(get('401').d).not.toEqual(get('402').d);
  });
  it('retains independent Gocheok blocks', () => {
    expect(regions.gocheok.blocks).toHaveLength(159);
    expect(new Set(regions.gocheok.blocks.map((b) => b.id)).size).toBe(159);
  });
  it('connects every Daejeon block to a distinct practice section', () => {
    const numbers = (first: number, last: number) =>
      Array.from({ length: last - first + 1 }, (_, i) => String(first + i));
    const expected = [
      ...numbers(101, 124), ...numbers(200, 225), '301', '302', ...numbers(326, 330),
      ...numbers(400, 426), ...numbers(500, 509),
      ...numbers(1, 31).map((n) => 'S' + n.padStart(2, '0')),
      ...['A', 'B', 'C'].flatMap((letter) =>
        ['front', 'middle', 'rear'].map((band) => '100' + letter + '-' + band)),
    ].sort();
    expect(Object.keys(daejeonPaths).sort()).toEqual(expected);
    expect(getVenue('daejeon').sections.map((s) => s.id).sort()).toEqual(expected);
    expect(new Set(Object.values(daejeonPaths)).size).toBe(expected.length);
  });
});
