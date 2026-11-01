import {describe,expect,it} from 'vitest';
import regions from './baseballRegions.json';

describe('numbered baseball hit areas',()=>{
 it('provides every numbered Jamsil block independently',()=>{
  const blocks=regions.jamsil.blocks;
  const expected=[...Array.from({length:22},(_,i)=>String(101+i)),...Array.from({length:26},(_,i)=>String(201+i)),...Array.from({length:34},(_,i)=>String(301+i)),...Array.from({length:22},(_,i)=>String(401+i)),'프리미엄석'];
  expect(blocks.map(b=>b.label).sort()).toEqual(expected.sort());
  expect(new Set(blocks.map(b=>b.id)).size).toBe(blocks.length);
  for(const block of blocks){expect(block.d.match(/M/g)).toHaveLength(1);expect(regions.jamsil.paths).toHaveProperty(block.section);}
 });
 it('keeps formerly joined 217/218 and split 408 as distinct complete hit areas',()=>{
  const get=(label:string)=>regions.jamsil.blocks.find(b=>b.label===label)!;
  expect(get('217').d).not.toEqual(get('218').d);
  expect(get('408').d.match(/M/g)).toHaveLength(1);
  expect(get('401').d).not.toEqual(get('402').d);
 });
 it('retains independent Gocheok blocks',()=>{
  expect(regions.gocheok.blocks).toHaveLength(159);
  expect(new Set(regions.gocheok.blocks.map(b=>b.id)).size).toBe(159);
 });
});
