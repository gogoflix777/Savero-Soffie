import React from 'react';

/** Low contrast transparent character cutouts that carry the couple theme across pages. */
export const ChibiPageDecorations: React.FC = () => (
  <div className="page-chibi-decorations" aria-hidden="true" style={{ contain: 'strict' }}>
    <img className="page-chibi-decor page-chibi-decor-one" src="/characters/expressions/soffie/terpesona.webp" alt="" loading="lazy" decoding="async" />
    <img className="page-chibi-decor page-chibi-decor-two" src="/characters/expressions/savero/serius.webp" alt="" loading="lazy" decoding="async" />
    <img className="page-chibi-decor page-chibi-decor-three" src="/characters/expressions/soffie/tertawa.webp" alt="" loading="lazy" decoding="async" />
  </div>
);
