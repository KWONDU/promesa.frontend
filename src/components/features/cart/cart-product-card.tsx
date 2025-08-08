'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

import ImageWithEffect from '@/components/common/utilities/image-with-effect';
import { useDeleteCartItem, usePatchCartItem } from '@/hooks/use-cart';
import CloseIcon from '@/public/icons/layout/close.svg';
import { CartSchema } from '@/types/cart-controller';

interface CartProductCardProps {
  product: CartSchema;
}

export default function CartProductCard({ product }: CartProductCardProps) {
  const [quantity, setQuantity] = useState(product.quantity);

  const { mutate: patchCarts } = usePatchCartItem();
  const { mutate: deleteCarts } = useDeleteCartItem();

  const router = useRouter();

  // 수량 조절
  const itemCount = product.stock;
  const isSoldOut = product.saleStatus !== 'ON_SALE';

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      patchCarts({ itemId: product.itemId, quantity: newQuantity });
    }
  };

  const handleQuantityIncrease = () => {
    if (quantity < itemCount) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      patchCarts({ itemId: product.itemId, quantity: newQuantity });
    }
  };

  // 페이지 이동
  const handleImageClick = () => {
    if (product.itemId) {
      router.push(`/detail/${product.itemId}`);
    }
  };

  return (
    <div className="flex gap-4">
      <button onClick={handleImageClick} className="relative z-50 h-35 w-28 cursor-pointer">
        <ImageWithEffect alt="장바구니 미리보기 이미지" fill src={product.thumbnailUrl} className="object-cover" />
      </button>
      <div className="flex h-35 w-58.5 flex-col justify-between">
        <div className="flex justify-between">
          <div className="flex w-full flex-col gap-1">
            <div className="flex w-full items-center justify-between">
              <span className="text-grey-9 text-body-01 font-bold overflow-ellipsis">{product.name}</span>
              <button onClick={() => deleteCarts(product.itemId)} className="cursor-pointer">
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            <span className="text-body-02 text-grey-6 font-medium">{product.artistName}</span>
          </div>
        </div>
        <div className="flex justify-between">
          {!isSoldOut ? (
            <div className="flex h-6.5 w-21.5 items-center justify-between gap-2.75 rounded-full border px-2">
              <button
                onClick={handleQuantityDecrease}
                disabled={quantity <= 1}
                className="text-grey-9 flex h-8.5 w-8.5 cursor-pointer items-center justify-center disabled:opacity-30"
              >
                -
              </button>
              <span className="text-body-02 text-grey-9 text-center font-medium">{quantity}</span>
              <button
                onClick={handleQuantityIncrease}
                disabled={quantity >= itemCount}
                className="text-grey-9 flex h-8.5 w-8.5 cursor-pointer items-center justify-center pb-0.5 disabled:opacity-30"
              >
                +
              </button>
            </div>
          ) : (
            <div className="text-body-01 text-grey-9 flex items-center font-medium opacity-40">품절</div>
          )}
          <span className={clsx('text-body-01 font-medium', isSoldOut ? 'text-grey-5' : 'text-grey-9')}>
            {(product.price * product.quantity).toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}
