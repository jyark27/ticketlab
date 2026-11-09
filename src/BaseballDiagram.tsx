import { useMemo, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { Venue } from './venues';
import regions from './baseballRegions.json';
import daejeonPaths from './daejeonRegions.json';

const daejeon = {
  width: 1040,
  height: 1178,
  blocks: Object.entries(daejeonPaths).map(([id, d]) => ({ id, d, label: id, section: id })),
};

export default function BaseballDiagram({
  venue,
  selected,
  available,
  onSection,
}: {
  venue: Venue;
  selected: string;
  available: (id: string) => number;
  onSection: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState<string>();
  const isDaejeon = venue.id === 'daejeon';
  const map = isDaejeon ? daejeon : regions[venue.id === 'gocheok' ? 'gocheok' : 'jamsil'];
  const blocks = map.blocks;
  const sections = useMemo(() => new Map(venue.sections.map((s) => [s.id, s])), [venue]);
  const [hoveredSection, setHoveredSection] = useState<string>();
  const hovered = isDaejeon && hoveredSection ? sections.get(hoveredSection) : undefined;
  const activeBlock = blocks.find(
    (b) => venue.id + ':' + b.id === selectedBlock && b.section === selected,
  );
  const current = venue.sections.find((s) => s.id === selected) ?? venue.sections[0];
  return (
    <div className="baseball-diagram">
      <div className="map-tools">
        <span>구역도의 번호 구역을 선택하세요</span>
        <button
          aria-label="배치도 축소"
          disabled={zoom === 1}
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
        >
          <Minus size={14} />
        </button>
        <button
          aria-label="배치도 확대"
          disabled={zoom === 3}
          onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
        >
          <Plus size={14} />
        </button>
        <button aria-label="배치도 크기 초기화" onClick={() => setZoom(1)}>
          <Maximize2 size={14} />
        </button>
      </div>
      <div
        className="baseball-map-scroll"
        tabIndex={0}
        aria-label="좌석 배치도. 확대 시 좌우로 스크롤할 수 있습니다."
      >
        <div
          className={'baseball-map-image ' + venue.id}
          style={{
            width:
              venue.id === 'gocheok'
                ? `calc(min(100%, var(--map-base, 320px)) * ${zoom})`
                : zoom * 100 + '%',
          }}
        >
          <img
            src={isDaejeon ? venue.source : '/baseball/' + venue.id + '-map.png'}
            alt={venue.name + ' 전체 좌석 배치도'}
            draggable={false}
          />
          <svg
            className="baseball-click-regions"
            viewBox={`0 0 ${map.width} ${map.height}`}
            aria-label={venue.name + ' 구역 선택'}
          >
            {blocks.map((block) => {
              const s = sections.get(block.section)!;
              const active = isDaejeon ? block.section === selected : block.id === activeBlock?.id;
              const label = isDaejeon
                ? s.label
                : block.label === '프리미엄석' ? block.label : block.label + '구역 · ' + s.label;
              const choose = () => {
                setSelectedBlock(venue.id + ':' + block.id);
                onSection(s.id);
              };
              return (
                <path
                  key={block.id}
                  d={block.d}
                  className={'baseball-region ' + (active ? 'active' : '')}
                  role="button"
                  tabIndex={0}
                  aria-label={label + ', 잔여 ' + available(s.id) + '석'}
                  aria-pressed={active}
                  onPointerEnter={isDaejeon ? () => setHoveredSection(s.id) : undefined}
                  onPointerLeave={isDaejeon ? () => setHoveredSection(undefined) : undefined}
                  onClick={choose}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      choose();
                    }
                  }}
                >
                  <title>{label}</title>
                </path>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="baseball-map-key">
        <b>
          {isDaejeon ? (hovered ?? current).label : activeBlock?.label === '프리미엄석'
            ? '프리미엄석'
            : (activeBlock ? activeBlock.label + '구역 · ' : '') + current.label}
        </b>
        <span>잔여 {available((hovered ?? current).id).toLocaleString()}석</span>
      </div>
      <div className="map-attribution">
        <a href={venue.source} target="_blank" rel="noreferrer">
          이미지: {isDaejeon ? '제공된 좌석도' : venue.id === 'gocheok' ? '키움히어로즈' : 'LG트윈스'} ↗
        </a>
        {!isDaejeon && <span>같은 등급·방향의 좌석은 연습 구역으로 묶입니다</span>}
      </div>
    </div>
  );
}
