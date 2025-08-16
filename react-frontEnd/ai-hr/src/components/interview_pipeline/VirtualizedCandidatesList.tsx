import React, { memo, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

interface VirtualizedCandidatesListProps {
  candidates: any[];
  rowHeight: number;
  overscanCount?: number;
  renderCard: (candidate: any) => React.ReactNode;
  rowGap?: number;
}

export const VirtualizedCandidatesList = memo(
  function VirtualizedCandidatesList({
    candidates,
    rowHeight,
    overscanCount = 8,
    renderCard,
    rowGap = 12,
  }: VirtualizedCandidatesListProps) {
    const itemCount = candidates.length;
    const itemSize = rowHeight + rowGap; // include gap to mimic space-y

    const Row = useMemo(
      () =>
        ({ index, style }: ListChildComponentProps) => {
          const candidate = candidates[index];
          return (
            <div style={style} className="px-0">
              <div style={{ height: rowHeight }} className="flex items-stretch">
                {renderCard(candidate)}
              </div>
            </div>
          );
        },
      [candidates, renderCard, rowHeight]
    );

    if (itemCount === 0) {
      return null;
    }

    return (
      <div className="h-full w-full">
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={itemCount}
              itemSize={itemSize}
              overscanCount={overscanCount}
            >
              {Row}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    );
  }
);
