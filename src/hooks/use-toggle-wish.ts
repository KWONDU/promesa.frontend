'use client';

import { useMutation } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useToast } from '@/components/common/alert/toast-provider';
import { toggleWish } from '@/services/api/wish-controller';
import { getQueryClient } from '@/services/query/client';
import { HttpError } from '@/types/axios.dto';
import type { ItemPreviewResponseSchema } from '@/types/item-controller';
import type { WishToggleSchema } from '@/types/wish-controller';

interface ToggleWishParams {
  targetType: WishToggleSchema['target']['targetType'];
  targetId: number;
  currentWished: boolean;
}

const QUERY_KEYS_BY_TARGET_TYPE: Record<WishToggleSchema['target']['targetType'], string[]> = {
  ARTIST: [
    'itemDetail', // /detail/[item-id]
    'artist', // /artist/[artist-id]
    'artistList', // /home/artists
    'artistWishList', // /my
  ],
  ITEM: [
    'nowPopularItems', // /home
    // 'items', // /shop, /artist/[artist-id]
    'itemDetail', // /detail/[item-id]
    'artist', // /artist/[artist-id]
    'itemWishList', // /my, /my.wish-list
    'exhibition', // /exhibition/[exhibition-id]
    'search', // /search
  ],
};

type ItemsListData = { content: ItemPreviewResponseSchema[] };
function isItemsListData(x: unknown): x is ItemsListData {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as { content?: unknown };
  return Array.isArray(o.content);
}

function toggleWishedOnlyInItemsCache(targetId: number, next: boolean) {
  const queryClient = getQueryClient();

  queryClient.getQueriesData<unknown>({ queryKey: ['items'] }).forEach(([key, old]) => {
    if (!isItemsListData(old)) return;
    queryClient.setQueryData<ItemsListData>(key, {
      ...old,
      content: old.content.map((it) => (it.itemId === targetId ? { ...it, wished: next } : it)),
    });
  });
}

export const useToggleWish = () => {
  const queryClient = getQueryClient();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMutation<WishToggleSchema, Error, ToggleWishParams>({
    mutationFn: async ({ targetType, targetId, currentWished }) => {
      return await toggleWish(targetType, targetId, currentWished);
    },
    onMutate: async ({ targetType, targetId, currentWished }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      const itemsSnapshots = queryClient.getQueriesData<unknown>({ queryKey: ['items'] });
      if (targetType === 'ITEM') {
        toggleWishedOnlyInItemsCache(targetId, !currentWished);
      }
      return { itemsSnapshots };
    },
    onSuccess: (_data, { targetType, currentWished }) => {
      const targetQueryKeys = QUERY_KEYS_BY_TARGET_TYPE[targetType] ?? [];

      queryClient
        .getQueryCache()
        .findAll()
        .forEach((query) => {
          const key = query.queryKey[0];
          if (typeof key === 'string' && targetQueryKeys.includes(key)) {
            queryClient.invalidateQueries({ queryKey: query.queryKey });
          }

          // stale
          queryClient.invalidateQueries({
            queryKey: ['items'],
            refetchType: 'none',
          });

          // show toast pop-up
          const toastTarget = targetType === 'ITEM' ? '위시리스트' : '아티스트 북마크';
          const toastAction = currentWished ? '에서 삭제했습니다' : '에 추가했습니다';
          showToast(`${toastTarget}${toastAction}.`);
        });
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status === 401) {
        router.push(
          `/login?afterLogin=${encodeURIComponent(`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}`,
        );
      }
    },
  });
};
