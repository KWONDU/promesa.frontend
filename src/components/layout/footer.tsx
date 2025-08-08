import { BUSINESS_INFORMATION } from '@/lib/constants/business-information';
import stringToMultilineTSX from '@/lib/utils/string-to-multiline-tsx';
import PromesaTextExtraSmallIcon from '@/public/icons/logo/text-xs.svg';

export default function Footer() {
  const upperKeys = ['전화', '이메일', '은행', '예금주', '운영시간'] as const;

  return (
    <footer className="bg-green relative z-500 flex flex-col gap-5 px-5 pt-5 pb-9">
      <div className="my-2.5 flex items-center">
        <PromesaTextExtraSmallIcon className="text-black" />
      </div>
      <div className="flex flex-col gap-1">
        {upperKeys.map((key) => (
          <div key={key} className="flex gap-4">
            <p className="text-caption-01 text-grey-6 font-medium">{key}</p>
            <p className="text-caption-01 text-grey-9 font-medium">{stringToMultilineTSX(BUSINESS_INFORMATION[key])}</p>
          </div>
        ))}
      </div>
      <hr className="border-t-grey-5 border-t" />
      <div className="flex flex-col gap-2.5">
        <p className="text-caption-01 text-grey-6 font-medium">{BUSINESS_INFORMATION['문구'][0]}</p>
        <p className="text-caption-01 text-grey-6 font-medium">{BUSINESS_INFORMATION['문구'][1]}</p>
      </div>
    </footer>
  );
}
