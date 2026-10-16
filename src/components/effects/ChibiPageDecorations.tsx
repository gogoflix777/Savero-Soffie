import React from 'react';

/** Low contrast transparent character cutouts that carry the couple theme across pages. */
export const ChibiPageDecorations: React.FC = () => (
  <div className="page-chibi-decorations" aria-hidden="true">
    <img className="page-chibi-decor page-chibi-decor-one" src="/characters/expressions/soffie/terpesona.png" alt="" />
    <img className="page-chibi-decor page-chibi-decor-two" src="/characters/expressions/savero/serius.png" alt="" />
    <img className="page-chibi-decor page-chibi-decor-three" src="/characters/expressions/soffie/tertawa.png" alt="" />
  </div>
);
