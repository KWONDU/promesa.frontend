'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';

import Expandable from '@/components/common/utilities/expandable';
import chunkList from '@/lib/utils/chunk-list';
import { fetchArtistItems } from '@/services/api/artist-controller';
import { fetchShopItems } from '@/services/api/item-controller';
import type { ItemControllerParams, ItemControllerServerParams } from '@/types/item-controller';

import ItemListFilteringHeader from './item-list-filtering-header';
import ItemListPaginationFooter from './item-list-pagination-footer';
import ItemPreview from './item-preview';

interface ItemListGridProps {
  initialParams: ItemControllerParams;
  page: 'SHOP' | 'ARTIST';
}

export default function ItemList({ initialParams, page }: ItemListGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  const params = useMemo(
    () =>
      ({
        categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : initialParams.categoryId,
        page: searchParams.get('page') ? Number(searchParams.get('page')) : initialParams.page,
        sort: searchParams.get('sort') ?? initialParams.sort,
        artistId: initialParams.artistId,
        frame: searchParams.get('frame') ?? initialParams.frame,
      }) as ItemControllerParams,
    [initialParams, searchParams],
  );

  const initialParamsRef = useRef(params);

  const { rowLength, heightClass, maxWidthClass, gapClass, collapsedMaxHeight } = useMemo(() => {
    switch (params.frame) {
      case 'grid':
        return {
          rowLength: 2,
          heightClass: 'h-81',
          maxWidthClass: 'max-w-44',
          gapClass: 'gap-2.5',
          collapsedMaxHeight: 421,
        };
      case 'masonry':
        return {
          rowLength: 3,
          heightClass: 'h-62',
          maxWidthClass: 'max-w-29',
          gapClass: 'gap-1.75',
          collapsedMaxHeight: 260,
        };
      default:
        return {
          rowLength: 0,
          heightClass: '',
          maxWidthClass: '',
          gapClass: '',
          collapsedMaxHeight: 0,
        };
    }
  }, [params.frame]);

  const serverParams: ItemControllerServerParams = {
    ...(initialParams as Omit<ItemControllerParams, 'frame'>),
    size: params.frame === 'grid' ? 20 : params.frame === 'masonry' ? 21 : 0,
  };

  const { data } = useSuspenseQuery({
    queryKey: ['items', serverParams],
    queryFn: page === 'SHOP' ? () => fetchShopItems(serverParams) : () => fetchArtistItems(serverParams),
    refetchOnMount: true,
  });

  const push = (next: Partial<ItemControllerParams>) => {
    const merged = { ...params, ...next };
    delete merged.artistId; // artistId is not search params

    const mergedParams = Object.fromEntries(Object.entries(merged).map(([key, value]) => [key, String(value)]));
    router.push(`?${new URLSearchParams(mergedParams).toString()}`, { scroll: false });
  };

  useEffect(() => {
    const isFirstVisit = JSON.stringify(initialParamsRef.current) === JSON.stringify(params);
    if (!hasMountedRef.current && isFirstVisit) {
      return;
    }

    hasMountedRef.current = true;

    const target = listTopRef.current;
    if (!target) return;

    target.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  }, [params]);

  const { content, totalPages } = data;

  return (
    <div key={params.page} ref={listTopRef} className="bg-pale-green mx-5 flex scroll-mt-11.5 flex-col">
      {/* 필터링 헤더 */}
      <ItemListFilteringHeader categoryId={params.categoryId} sort={params.sort} frame={params.frame} push={push} />
      <div className="flex flex-col gap-4">
        {/* 아이템 리스트 */}
        <Expandable
          flag={!params.artistId || open}
          collapsedMaxHeight={collapsedMaxHeight}
          durationTime={1000}
          className="relative flex flex-col gap-4"
        >
          {chunkList(content, rowLength).map((group, idx) => {
            const placeholders = Array(rowLength - group.length).fill(null);

            return (
              <div key={idx} className={clsx('flex w-full', gapClass)}>
                {group.map((item) => (
                  <ItemPreview key={item.itemId} item={item} maxWidthClass={maxWidthClass} heightClass={heightClass} />
                ))}
                {placeholders.map((_, idx) => (
                  <div key={idx} className={clsx('flex-1', maxWidthClass, heightClass)} />
                ))}
              </div>
            );
          })}
          {/* 목록 열기 */}
          {params.artistId && !open && content.length >= 10 && (
            <>
              <div className="from-pale-green/0 to-pale-green/80 absolute bottom-0 z-5 h-70 w-full bg-gradient-to-b from-10% to-100%" />
              <div className="absolute bottom-2 z-10 flex w-full justify-center">
                <button
                  onClick={() => setOpen(true)}
                  className="bg-pale-green border-grey-7 cursor-pointer rounded-full border px-5 py-2"
                >
                  <span className="text-body-01 text-grey-7 font-medium">목록 열기</span>
                </button>
              </div>
            </>
          )}
        </Expandable>
      </div>

      {/* 페이지네이션 */}
      {!params.artistId && (
        <ItemListPaginationFooter currentPage={params.page ?? 0} totalPages={totalPages} push={push} />
      )}
    </div>
  );
}
