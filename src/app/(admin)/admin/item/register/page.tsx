'use client';

import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { registerItem } from '@/services/api/admin/admin-item-controller';
import { fetchArtistList } from '@/services/api/artist-controller';
import { fetchParentCategories } from '@/services/api/category-controller';
import { postImages } from '@/services/api/image-controller';
import { getQueryClient } from '@/services/query/client';

export default function AdminItemRegisterPage() {
  const queryClient = getQueryClient();

  const { data: artists } = useSuspenseQuery({
    queryKey: ['admin-artist-list'],
    queryFn: fetchArtistList,
  });

  const { data: categories } = useSuspenseQuery({
    queryKey: ['admin-category-list'],
    queryFn: fetchParentCategories,
  });

  const [form, setForm] = useState({
    itemName: '',
    price: 0,
    stock: 0,
    productCode: '',
    width: 0,
    height: 0,
    depth: 0,
    artistId: 0,
    categoryId: 0,
    imageKeys: [] as { key: string; sortOrder: number }[],
    thumbnailKey: '',
  });
  const [detailImageFiles, setDetailImageFiles] = useState<File[]>([]);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [selectedArtistId, setSelectedArtistId] = useState<number>(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);

  const handleForm = (field: keyof typeof form, value: string | number | null) => {
    if (
      field === 'imageKeys' ||
      (['price', 'stock', 'width', 'height', 'depth', 'artistId', 'categoryId'].includes(field) &&
        typeof value !== 'number')
    )
      return;

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleThumbnailImage = async (file: File) => {
    const { key: thumbnailKey, url } = (
      await postImages({
        imageType: 'ITEM',
        referenceId: null,
        subType: 'MAIN',
        subReferenceId: null,
        fileNames: [file.name],
      })
    )[0];

    await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

    setForm((prev) => ({ ...prev, thumbnailKey, imageKeys: [{ key: thumbnailKey, sortOrder: 1 }, ...prev.imageKeys] }));
  };

  const handleDetailImage = async (file: File) => {
    const { key, url } = (
      await postImages({
        imageType: 'ITEM',
        referenceId: null,
        subType: 'DETAIL',
        subReferenceId: null,
        fileNames: [file.name],
      })
    )[0];

    await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

    setForm((prev) => ({ ...prev, imageKeys: [...prev.imageKeys, { key, sortOrder }] }));
    setSortOrder((prev) => prev + 1);
    setDetailImageFiles((prev) => [...prev, file]);
  };

  const removeDetailImage = (idx: number) => {
    setDetailImageFiles((prev) => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const register = async () => {
    if (
      Object.values(form).some((v) => v === '') ||
      Object.values(form).some((v) => v === 0) ||
      form.imageKeys === ([] as { key: string; sortOrder: number }[])
    )
      return;

    await registerItem(form);

    queryClient.refetchQueries({ queryKey: ['admin-item-list'] });
  };

  const formKeyMap: {
    [K in keyof typeof form]: {
      title: string;
    };
  } = {
    itemName: {
      title: '1️⃣ 작품 이름',
    },
    price: {
      title: '2️⃣ 작품 가격',
    },
    stock: {
      title: '3️⃣ 작품 수량',
    },
    productCode: {
      title: '4️⃣ 작품 코드',
    },
    width: {
      title: '5️⃣ 작품 넓이(width)',
    },
    height: {
      title: '6️⃣ 작품 높이(height)',
    },
    depth: {
      title: '7️⃣ 작품 깊이(depth)',
    },
    artistId: {
      title: '8️⃣ 작품 - 해당 아티스트',
    },
    categoryId: {
      title: '9️⃣ 작품 - 해당 카테고리',
    },
    thumbnailKey: {
      title: '1️⃣0️⃣ 작품 썸네일 이미지',
    },
    imageKeys: {
      title: '1️⃣1️⃣ 작품 세부 이미지 목록',
    },
  } as const;

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="mb-5 flex flex-col pl-5">
        <p className="text-headline-04">작품 등록하기</p>
        <Link href="/admin/item">
          <p className="text-orange text-headline-04">뒤로가기</p>
        </Link>
      </div>
      <div className="mx-5 mt-10 mb-20 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          {/* 작품 텍스트 정보 입력 */}
          {(Object.keys(form) as (keyof typeof form)[])
            .filter((key) => !['artistId', 'categoryId', 'imageKeys', 'thumbnailKey'].includes(key))
            .map((key) => (
              <React.Fragment key={key}>
                <p className="text-body-01 font-semibold">{formKeyMap[key].title}</p>
                {typeof form[key] === 'string' ? (
                  <TextareaAutosize
                    name={formKeyMap[key].title}
                    value={form[key]}
                    onChange={(e) => handleForm(key, e.target.value)}
                    className="border-deep-green text-body-01 resize-none rounded-sm border px-2 py-1 font-semibold outline-none"
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
              </React.Fragment>
            ))}
          {/* 작품 작가/카테고리 정보 입력 */}
          {(['artistId', 'categoryId'] as const).map((key) => {
            const selectedId = key === 'artistId' ? selectedArtistId : selectedCategoryId;
            const setSelectedId = key === 'artistId' ? setSelectedArtistId : setSelectedCategoryId;
            const idNames =
              key === 'artistId'
                ? artists.map((item) => ({ id: item.profile.artistId, name: item.profile.name }))
                : categories;

            return (
              <React.Fragment key={key}>
                <div className="flex justify-between gap-5">
                  <p className="text-body-01 font-semibold">{formKeyMap[key].title}</p>
                </div>
                <select
                  name={formKeyMap[key].title}
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(Number(e.target.value));
                    handleForm(key, Number(e.target.value));
                  }}
                  className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
                >
                  <option value={0} disabled />
                  {idNames.map((item) => (
                    <option key={item.id} value={item.id} className="cursor-pointer">
                      {item.name}
                    </option>
                  ))}
                </select>
              </React.Fragment>
            );
          })}
          {/* 작품 이미지 정보 입력 */}
          <div className="flex flex-col gap-2">
            <p className="text-body-01 font-semibold">1️⃣0️⃣ 작품 메인 이미지</p>
            <p className="text-body-02 font-regular text-orange italic">* width : height = 4 : 5</p>
          </div>
          <input
            name="1️⃣0️⃣ 작품 메인 이미지"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleThumbnailImage(file);
            }}
            className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
          />
          <p className="text-body-01 font-semibold">1️⃣1️⃣ 작품 세부 이미지 목록</p>
          {detailImageFiles.map((file, idx) => (
            <div key={file.name} className="flex justify-between">
              <p className="text-body-02 font-regular">📷 {file.name}</p>
              <button onClick={() => removeDetailImage(idx)} className="cursor-pointer">
                <p className="hover:text-orange text-body-02 font-bold">X</p>
              </button>
            </div>
          ))}
          <input
            key={detailImageFiles.length}
            name="1️⃣1️⃣ 작품 세부 이미지 목록"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDetailImage(file);
            }}
            className="border-deep-green text-body-01 cursor-pointer rounded-sm border px-2 py-1 font-semibold outline-none"
          />
          {/* 작품 등록 */}
          <button onClick={register} className="cursor-pointer">
            <div className="border-deep-green rounded-sm border px-2 py-1 hover:bg-black hover:text-white">
              <p className="text-body-01 font-semibold">등록하기</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
