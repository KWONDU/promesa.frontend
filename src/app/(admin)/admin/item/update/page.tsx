'use client';

import type { SyntheticEvent } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';

import ImageWithEffect from '@/components/common/utilities/image-with-effect';
import ImageWithLoading from '@/components/common/utilities/image-with-loading';
import { updateItem } from '@/services/api/admin/admin-item-controller';
import { fetchArtistList } from '@/services/api/artist-controller';
import { fetchParentCategories } from '@/services/api/category-controller';
import { deleteImages, postImages } from '@/services/api/image-controller';
import { fetchShopItems } from '@/services/api/item-controller';
import { fetchItemDetail } from '@/services/api/item-controller';
import { getQueryClient } from '@/services/query/client';
import type { ParsedItemData } from '@/types/item-controller';

export default function AdminExhibitionUpdatePage() {
  const queryClient = getQueryClient();

  const { data: rawItems } = useSuspenseQuery({
    queryKey: ['admin-item-list'],
    queryFn: () => fetchShopItems({ categoryId: 0, page: 0, sort: 'wishCount,desc', size: 1000 }),
  });

  const { data: artists } = useSuspenseQuery({
    queryKey: ['admin-artist-list'],
    queryFn: fetchArtistList,
  });

  const { data: categories } = useSuspenseQuery({
    queryKey: ['admin-category-list'],
    queryFn: fetchParentCategories,
  });

  const items = useMemo(
    () => [...rawItems.content].sort((a, b) => a.itemName.localeCompare(b.itemName, 'ko-KR')),
    [rawItems],
  );

  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<ParsedItemData | null>(null);
  const [form, setForm] = useState({
    itemName: '',
    price: 0,
    stock: 0,
    productCode: '',
    saleStatus: 'ON_SALE' as 'ON_SALE' | 'SOLD_OUT' | 'STOPPED',
    width: 0,
    height: 0,
    depth: 0,
    artistId: 0,
    categoryId: 0,
  });
  const [ratios, setRatios] = useState<number[]>([]);
  const [thumbnailKey, setThumbnailKey] = useState<string>('');
  const [imageKeys, setImageKeys] = useState<{ key: string; sortOrder: number }[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(1);

  const fileInputRefMain = useRef<HTMLInputElement>(null);
  const fileInputRefSub = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedItemId) return;

    const fetchAndSet = async () => {
      const data = await fetchItemDetail(selectedItemId);
      setSelectedItem(data);
    };

    fetchAndSet();
  }, [selectedItemId, items]);

  useEffect(() => {
    console.log(selectedItem);
    if (selectedItem) {
      setForm({
        itemName: selectedItem.title,
        price: selectedItem.price,
        stock: selectedItem.stock,
        productCode: selectedItem.productCode,
        saleStatus: selectedItem.saleStatus,
        width: selectedItem.width,
        height: selectedItem.height,
        depth: selectedItem.depth,
        artistId: selectedItem.artist.id,
        categoryId: selectedItem.category.id,
      });

      setThumbnailKey(selectedItem.mainImageUrls[0].imageKey);
      setImageKeys(selectedItem.detailImageUrls.map((item) => ({ key: item.imageKey, sortOrder: item.sortOrder })));

      const maxSortOrder = Math.max(...selectedItem.detailImageUrls.map((item) => item.sortOrder));
      setSortOrder(maxSortOrder + 1);
    }
  }, [selectedItem]);

  const handleForm = (field: keyof typeof form, value: string | number | null) => {
    if (
      ['price', 'stock', 'width', 'height', 'depth', 'artistId', 'categoryId'].includes(field) &&
      typeof value !== 'number'
    )
      return;

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageLoad = (index: number, e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalHeight / img.naturalWidth;
    setRatios((prev) => {
      const copy = [...prev];
      copy[index] = ratio;
      return copy;
    });
  };

  const handleThumbnailImage = async (file: File) => {
    const { key, url } = (
      await postImages({
        imageType: 'ITEM',
        referenceId: selectedItemId,
        subType: 'MAIN',
        subReferenceId: null,
        fileNames: [file.name],
      })
    )[0];

    if (thumbnailKey !== '') {
      await deleteImages(thumbnailKey);
      setThumbnailKey('');
    }

    await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

    setThumbnailKey(key);
  };

  const handleDetailImage = async (file: File) => {
    const { key, url } = (
      await postImages({
        imageType: 'ITEM',
        referenceId: selectedItemId,
        subType: 'DETAIL',
        subReferenceId: null,
        fileNames: [file.name],
      })
    )[0];

    await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

    setImageKeys((prev) => [...prev, { key, sortOrder }]);
    setSortOrder((prev) => prev + 1);
  };

  const removeDetailImage = async (idx: number) => {
    await deleteImages(imageKeys[idx].key);

    const nextKeys = imageKeys.filter((_, i) => i !== idx);
    setImageKeys(nextKeys);

    await updateItem(selectedItemId, {
      ...form,
      thumbnailKey,
      imageKeys: [{ key: thumbnailKey, sortOrder: 1 }, ...nextKeys],
    });

    queryClient.refetchQueries({ queryKey: ['admin-item-list'] });
  };

  const update = async (field: keyof typeof form | 'thumbnailKey' | 'imageKeys') => {
    if (field === 'thumbnailKey' || field === 'imageKeys') {
      await updateItem(selectedItemId, {
        ...form,
        thumbnailKey,
        imageKeys: [{ key: thumbnailKey, sortOrder: 1 }, ...imageKeys],
      });

      if (field === 'thumbnailKey') {
        if (fileInputRefMain.current) {
          fileInputRefMain.current.value = '';
        }
      } else if (field === 'imageKeys') {
        if (fileInputRefSub.current) {
          fileInputRefSub.current.value = '';
        }
      }
    } else {
      await updateItem(selectedItemId, {
        ...form,
        thumbnailKey,
        imageKeys: [{ key: thumbnailKey, sortOrder: 1 }, ...imageKeys],
        [field]: form[field],
      });
    }

    queryClient.refetchQueries({ queryKey: ['admin-item-list'] });
  };

  const formKeyMap: {
    [K in keyof typeof form]: {
      title: string;
      valueKey: keyof ParsedItemData;
    };
  } = {
    itemName: {
      title: '🔎 작품 이름',
      valueKey: 'title',
    },
    price: {
      title: '🔎 작품 가격',
      valueKey: 'price',
    },
    stock: {
      title: '🔎 작품 수량',
      valueKey: 'stock',
    },
    productCode: {
      title: '🔎 작품 코드',
      valueKey: 'productCode',
    },
    saleStatus: {
      title: '🔎 작품 판매 상태',
      valueKey: 'saleStatus',
    },
    width: {
      title: '🔎 작품 넓이(width)',
      valueKey: 'width',
    },
    height: {
      title: '🔎 작품 높이(height)',
      valueKey: 'height',
    },
    depth: {
      title: '🔎 작품 깊이(depth)',
      valueKey: 'depth',
    },
    artistId: {
      title: '🔎 작품 - 해당 아티스트',
      valueKey: 'artist',
    },
    categoryId: {
      title: '🔎 작품 - 해당 카테고리',
      valueKey: 'category',
    },
  } as const;

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="mb-5 flex flex-col pl-5">
        <p className="text-headline-04">작품 수정하기</p>
        <Link href="/admin/item">
          <p className="text-orange text-headline-04">뒤로가기</p>
        </Link>
      </div>
      {/* 작품 선택 */}
      <div className="flex flex-col items-center justify-center">
        <p className="text-body-01 font-bold">작품을 선택하세요</p>
        <select
          name="작품 선택"
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(Number(e.target.value))}
          className="text-body-01 cursor-pointer rounded-sm border font-semibold outline-none"
        >
          <option value={0} disabled />
          {items.map((item) => (
            <option key={item.itemId} value={item.itemId} className="cursor-pointer">
              {item.itemName}
            </option>
          ))}
        </select>
      </div>
      {selectedItem && (
        <div className="mx-5 mt-10 mb-20 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {/* 작품 텍스트 정보 수정 */}
            {(Object.keys(form) as (keyof typeof form)[])
              .filter((key) => !['saleStatus', 'artistId', 'categoryId'].includes(key))
              .map((key) => (
                <React.Fragment key={`${selectedItemId}-${key}`}>
                  <p className="text-body-01 font-regular">
                    <strong className="font-semibold">{formKeyMap[key].title}: </strong>
                    {selectedItem[formKeyMap[key].valueKey] as string | number}
                  </p>
                  {typeof form[key] === 'string' ? (
                    <TextareaAutosize
                      value={form[key]}
                      onChange={(e) => handleForm(key, e.target.value)}
                      className="text-body-01 font-regular border-deep-green resize-none rounded-sm border px-2 py-1 outline-none"
                    />
                  ) : (
                    <input
                      name={formKeyMap[key].title}
                      type="number"
                      value={form[key] as number}
                      min={0}
                      onChange={(e) => handleForm(key, Number(e.target.value))}
                      className="border-deep-green text-body-01 rounded-sm border px-2 py-1 font-semibold outline-none"
                    />
                  )}
                  <button onClick={() => update(key)} className="cursor-pointer">
                    <div className="border-deep-green rounded-sm border px-2 py-1 hover:bg-black hover:text-white">
                      <p className="text-body-01 font-semibold">수정하기</p>
                    </div>
                  </button>
                </React.Fragment>
              ))}
            {/* 작품 판매 상태 정보 수정 */}
            <div className="flex flex-col gap-2">
              <p className="text-body-01 font-regular">
                <strong className="font-semibold">🔎 작품 판매 상태: </strong>
                {selectedItem.saleStatus}
              </p>
              <p className="text-body-02 font-regular text-orange italic">* 판매 상태 수동 변경은 불가능</p>
            </div>
            <select
              name="🔎 작품 판매 상태"
              value={form.saleStatus}
              onChange={(e) => handleForm('saleStatus', e.target.value)}
              className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
            >
              <option value="" disabled />
              {['ON_SALE', 'SOLD_OUT', 'STOPPED'].map((item) => (
                <option key={item} value={item} className="cursor-pointer" disabled>
                  {item}
                </option>
              ))}
            </select>
            <button onClick={() => update('saleStatus')} disabled>
              <div className="border-deep-green rounded-sm border px-2 py-1">
                <p className="text-body-01 font-semibold">수정하기</p>
              </div>
            </button>
            {/* 작품 아티스트/카테고리 정보 수정 */}
            {(['artistId', 'categoryId'] as const).map((key) => {
              const selectedId = key === 'artistId' ? form.artistId : form.categoryId;
              const idNames =
                key === 'artistId'
                  ? artists.map((item) => ({ id: item.profile.artistId, name: item.profile.name }))
                  : categories;

              return (
                <React.Fragment key={key}>
                  <p className="text-body-01 font-regular">
                    <strong className="font-semibold">{formKeyMap[key].title}: </strong>
                    {key === 'artistId'
                      ? (artists.find((art) => art.profile.artistId === selectedItem.artist.id)?.profile.name ?? '')
                      : (categories.find((cat) => cat.id === selectedItem.category.id)?.name ?? '')}
                  </p>
                  <select
                    name={formKeyMap[key].title}
                    value={selectedId}
                    onChange={(e) => handleForm(key, Number(e.target.value))}
                    className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
                  >
                    <option value={0} disabled />
                    {idNames.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        className="cursor-pointer"
                        disabled={key === 'categoryId' && item.name === 'ALL'}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => update(key)} className="cursor-pointer">
                    <div className="border-deep-green rounded-sm border px-2 py-1 hover:bg-black hover:text-white">
                      <p className="text-body-01 font-semibold">수정하기</p>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
            {/* 작품 이미지 정보 수정 */}
            <div className="flex flex-col">
              <div className="flex flex-col gap-2">
                <p className="text-body-01 font-semibold">🔎 작품 썸네일 이미지:</p>
                <p className="text-body-02 font-regular text-orange italic">* width : height = 4 : 5</p>
              </div>
              <div className="bg-green aspect-[4/5] w-full">
                <ImageWithEffect
                  src={selectedItem.mainImageUrls[0].url}
                  alt={`${selectedItem.title} 작품의 썸네일 이미지.`}
                  fill
                />
              </div>
            </div>
            <input
              name="작품 썸네일 이미지 선택"
              ref={fileInputRefMain}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailImage(file);
              }}
              className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
            />
            <button onClick={() => update('thumbnailKey')} className="cursor-pointer">
              <div className="border-deep-green rounded-sm border px-2 py-1 hover:bg-black hover:text-white">
                <p className="text-body-01 font-semibold">수정하기</p>
              </div>
            </button>
            <div className="flex flex-col">
              <div className="flex flex-col gap-2">
                <p className="text-body-01 font-semibold">🔎 작품 상세 이미지 목록:</p>
                <p className="text-body-02 font-regular text-orange italic">
                  * 상하단 검은 선은 시각적 구분용, 이미지 비포함
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {selectedItem.detailImageUrls.map((item, idx) => (
                  <React.Fragment key={`${item.imageKey}-${idx}`}>
                    <div
                      className="relative w-full border-y"
                      style={{
                        paddingTop: `${ratios[idx] * 100}%`,
                      }}
                    >
                      <ImageWithLoading
                        src={item.url}
                        alt={`작품 ${selectedItem.title}의 세부 이미지.`}
                        fill
                        onLoad={(e) => handleImageLoad(idx, e)}
                      />
                    </div>
                    <button onClick={() => removeDetailImage(idx)} className="cursor-pointer">
                      <div className="border-orange hover:bg-orange text-orange rounded-sm border px-2 py-1 hover:text-white">
                        <p className="text-body-01 font-semibold">{`${idx + 1}번째 이미지 삭제하기`}</p>
                      </div>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <input
              name="작품 상세 이미지 선택"
              ref={fileInputRefSub}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDetailImage(file);
              }}
              className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
            />
            <button onClick={() => update('imageKeys')} className="cursor-pointer">
              <div className="border-deep-green rounded-sm border px-2 py-1 hover:bg-black hover:text-white">
                <p className="text-body-01 font-semibold">수정하기</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
