export const campusStops = [
  { id: "archive", label: "校园档案", href: "/wiki", description: "阅读人物、学院与地点的共创记录。" },
  { id: "forum", label: "校园论坛", href: "/forum", description: "进入正在形成的校园讨论。" },
  { id: "press", label: "校刊·部刊", href: "/press", description: "浏览这所大学的出版物入口。" },
] as const;

export type CampusStop = (typeof campusStops)[number];

export function CampusScene({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 900 590" role="img" aria-label="校园概念沙盘示意，未对应实际建筑或校园坐标">
      <defs>
        <pattern id="campus-ground" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M36 0H0V36" fill="none" stroke="#d8e2df" strokeWidth="1" />
        </pattern>
      </defs>
      <path d="M0 0h900v590H0z" fill="#eaf0ed" />
      <path d="M0 0h900v590H0z" fill="url(#campus-ground)" />
      <path d="M-50 422 318 277 938 503M134 615 424 312 914 144" fill="none" stroke="#ffffff" strokeWidth="48" />
      <path d="M-50 422 318 277 938 503M134 615 424 312 914 144" fill="none" stroke="#a8c5c7" strokeWidth="2" strokeDasharray="6 8" />
      <path d="m76 285 266-110 152 68-258 115z" fill="#a6c4ad" />
      <path d="m76 285 266-110 152 68-258 115z" fill="none" stroke="#6f9979" strokeWidth="2" />
      <path d="m570 366 165-74 111 43-156 89z" fill="#b5cfb3" />
      <path d="m570 366 165-74 111 43-156 89z" fill="none" stroke="#7e9f80" strokeWidth="2" />
      <path d="m178 166 154-64 136 49-151 69z" fill="#c6d7d7" stroke="#6c91a0" strokeWidth="2" />
      <path d="m178 166 139 54v83l-139-57z" fill="#a0b9bd" stroke="#6c91a0" strokeWidth="2" />
      <path d="m317 220 151-69v82l-151 70z" fill="#d5e3dc" stroke="#6c91a0" strokeWidth="2" />
      <path d="m204 169 42-18 49 18-43 20zm76 30 42-18 49 18-43 20zm76-30 42-18 49 18-43 20z" fill="#eff7f2" opacity=".8" />
      <path d="m486 85 125-54 101 42-123 59z" fill="#d7e5e1" stroke="#799da5" strokeWidth="2" />
      <path d="m486 85 103 47v122l-103-47z" fill="#90b1b5" stroke="#799da5" strokeWidth="2" />
      <path d="m589 132 123-59v119l-123 62z" fill="#c4d8d3" stroke="#799da5" strokeWidth="2" />
      <path d="m519 99 36 16v82l-36-16zm56 26 36-16v88l-36 18z" fill="#e5f1e9" opacity=".75" />
      <path d="m354 405 183-77 121 49-177 87z" fill="#c5d9d4" stroke="#7799a1" strokeWidth="2" />
      <path d="m354 405 127 59v92l-127-59z" fill="#97b6b9" stroke="#7799a1" strokeWidth="2" />
      <path d="m481 464 177-87v87l-177 92z" fill="#d4e2dc" stroke="#7799a1" strokeWidth="2" />
      <path d="m382 417 78 35m64-8 104-52" fill="none" stroke="#f2f8f2" strokeWidth="12" />
      <path d="m143 477 90-39 56 23-91 43z" fill="#83abb0" stroke="#5b898d" strokeWidth="2" />
      <path d="m143 477 55 27v53l-55-28z" fill="#679398" stroke="#5b898d" strokeWidth="2" />
      <path d="m198 504 91-43v54l-91 42z" fill="#a9c5bf" stroke="#5b898d" strokeWidth="2" />
      <path d="M65 554h83m-83-11h36" stroke="#5b7880" strokeWidth="2" />
      <text x="65" y="534" fill="#425c67" fontSize="12" fontFamily="sans-serif">CAMPUS STUDY / 001</text>
    </svg>
  );
}
