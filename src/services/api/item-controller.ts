import type { ItemControllerServerParams, ItemPreviewSchema } from '@/types/item-controller';

import { axiosInstance, withErrorBoundary } from './axios/instance';

export const fetchNowPopularItems = () =>
  withErrorBoundary<[], ItemPreviewSchema[]>(async () => {
    const res = await axiosInstance.get('/categories/1/items?memberId=1&page=0&size=5'); // need to refactor
    return res.data.data.content;
  });

export const fetchShopItems = (params: ItemControllerServerParams) =>
  withErrorBoundary<[ItemControllerServerParams], { content: ItemPreviewSchema[]; totalPages: number }>(
    async (params) => {
      const { categoryId, page, sort, size } = params;
      const res =
        categoryId > 0
          ? await axiosInstance.get(
              `/categories/${categoryId}/items?memberId=1&page=${page}&size=${size}&sort=${sort}`, // need to refactor
            )
          : await axiosInstance.get(`/categories/1/items?memberId=1&page=${page}&size=${size}&sort=${sort}`); // need to refactor
      return {
        content: res.data.data.content,
        totalPages: res.data.data.totalPages,
      };
    },
    params,
  );

export const fetchArtistItems = (params: ItemControllerServerParams) =>
  withErrorBoundary<[ItemControllerServerParams], ItemPreviewSchema[]>(async (params) => {
    const { categoryId, sort } = params;
    const res =
      categoryId > 0
        ? await axiosInstance.get(`/categories/${categoryId}/items?memberId=1&page=0&size=1000&sort=${sort}`)
        : await axiosInstance.get(`/categories/1/items?memberId=1&page=0&size=1000&sort=${sort}`); // need to refactor
    return res.data.data.content;
  }, params);
