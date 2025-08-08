'use client';

import Link from 'next/link';

import ErrorImage from '@/public/images/error-image.svg';

interface ClientErrorTemplateProps {
  status: number;
  message: string;
}

export default function ClientErrorTemplate({ status, message }: ClientErrorTemplateProps) {
  return (
    <div className="bg-pale-green flex h-screen w-full flex-col items-center">
      <div className="mr-12 ml-12.5 flex h-full flex-col items-center justify-center gap-10">
        <ErrorImage />
        <div className="flex flex-col items-center justify-center gap-1.5">
          <p className="text-6xl font-semibold text-black">{status}</p>
          <p className="text-subhead text-grey-5 font-bold">{message}</p>
        </div>
      </div>
      <div className="mb-13.5 flex w-full flex-col gap-2.5">
        <div className="bg-pale-green mr-4.5 ml-5.5 font-bold">
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/'))}
            className="border-grey-9 flex h-12 w-full cursor-pointer items-center justify-center rounded-xs border-[1.4px]"
          >
            <p className="text-grey-9 text-body-01">이전으로</p>
          </button>
        </div>
        <div className="bg-grey-9 mr-4.5 ml-5.5 font-bold">
          <Link href="/home" className="flex h-12 w-full items-center justify-center rounded-xs">
            <p className="text-body-01 text-grey-1">메인으로</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
