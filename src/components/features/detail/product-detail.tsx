import { useQuery } from '@tanstack/react-query';

import ImageWithEffect from '@/components/common/utilities/image-with-effect';
import { fetchItemDetail } from '@/services/api/item-controller';

interface ProductDetailProps {
  itemId: number;
}

export default function ProductDetail({ itemId }: ProductDetailProps) {
  const { data: item } = useQuery({
    queryKey: ['itemDetail', itemId],
    queryFn: () => fetchItemDetail(itemId),
    select: (res) => res,
  });

  if (!item) return null;

  return (
    <div className="flex w-full flex-col items-start">
      {/* 상세 정보 */}
      <div className="text-grey-8 text-caption-01 flex flex-col items-start gap-2 self-stretch px-5 py-8 font-medium">
        <div className="flex items-center gap-4">
          <span className="w-8">품번</span>
          <span>{item.productCode}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-8">종류</span>
          <span>{item.type}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-8">사이즈</span>
          <span>{`${item.width}x${item.height}x${item.depth}`}</span>
        </div>
      </div>
      {/* 상세 이미지 */}
      <div className="w-full pt-6">
        <div className="flex w-full flex-col">
          {item.detailImageUrls.map((url, index) => (
            <div key={index} className="relative w-full">
              <ImageWithEffect
                src={url}
                alt={`product detail image ${index + 1}`}
                width={800}
                height={0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
