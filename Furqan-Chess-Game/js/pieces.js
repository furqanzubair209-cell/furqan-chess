// SVG definitions for all chess pieces
const ChessPieces = (function () {
  'use strict';

  const SVG_PIECES = {
    w: {
      p: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-5.41 3.49-6.41 6.47H33c-1-2.98-3.41-5.41-6.41-6.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 36.5h21M11.5 39.5h22" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      r: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="#ffffff" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14h23l-2 18H13L11 14zM9 9h4v4H9zM16 9h4v4h-4zM23 9h4v4h-4zM30 9h4v4h-4z"/>
          <path d="M11 14h23"/>
        </g>
      </svg>`,
      n: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fill-rule="evenodd" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-11.5 8-18.5" fill="#ffffff"/>
          <path d="M24 18c.38 2.91-5.55 4.37-8 6-3 2-3.18 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#ffffff"/>
          <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#2b2b2b" stroke="#2b2b2b"/>
          <path d="M15 15.5a.5 1.5 60 1 1-1 0 .5 1.5 60 1 1 1 0z" fill="#2b2b2b" stroke="#2b2b2b"/>
        </g>
      </svg>`,
      b: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <g fill="#ffffff" stroke="#2b2b2b">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
          </g>
          <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#2b2b2b" stroke-linejoin="miter"/>
        </g>
      </svg>`,
      q: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="#ffffff" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="12" r="2"/>
          <circle cx="14" cy="9" r="2"/>
          <circle cx="22.5" cy="8" r="2"/>
          <circle cx="31" cy="9" r="2"/>
          <circle cx="39" cy="12" r="2"/>
          <path d="M6 14l5 13h23l5-13-8.5 7-8-12-8 12z"/>
          <path d="M11 27c2.5 2 6 3 11.5 3s9-1 11.5-3"/>
          <path d="M12 36.5h21M11.5 39.5h22"/>
        </g>
      </svg>`,
      k: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="#ffffff" stroke="#2b2b2b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22.5 3.5v3M20.5 5h4" stroke-width="2"/>
          <path d="M22.5 6.5a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/>
          <path d="M12.5 14.5c0 0 2-3.5 4-4 1.5-.5 3.5.5 6 3 2.5-2.5 4.5-3.5 6-3 2 .5 4 4 4 4l-2 3c0 0-1.5-2-2.5-2.5-.8-.4-2 .5-2 .5l-3.5 3-3.5-3s-1.2-.9-2-.5c-1 .5-2.5 2.5-2.5 2.5l-2-3z"/>
          <path d="M13 17.5l-1.5 4c0 0 3-1 5.5-1.5 2.5-.5 5.5-.5 5.5-.5s3 0 5.5.5c2.5.5 5.5 1.5 5.5 1.5l-1.5-4"/>
          <path d="M11.5 21.5c0 0 .5 4 1 5.5.5 1.5 1 2.5 1 2.5h18s.5-1 1-2.5c.5-1.5 1-5.5 1-5.5"/>
          <path d="M13.5 29.5h18c0 0 1 1.5 1 3s-.5 3.5-1 4c-2 2-6.5 3-9 3s-7-1-9-3c-.5-.5-1-2.5-1-4s1-3 1-3z"/>
          <path d="M13.5 29.5c3-1 6.5-1.5 9-1.5s6 .5 9 1.5"/>
          <path d="M11.5 39.5h22"/>
        </g>
      </svg>`
    },
    b: {
      p: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-5.41 3.49-6.41 6.47H33c-1-2.98-3.41-5.41-6.41-6.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#2d3139" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 36.5h21M11.5 39.5h22" stroke="#e0e0e0" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      r: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="#2d3139" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14h23l-2 18H13L11 14zM9 9h4v4H9zM16 9h4v4h-4zM23 9h4v4h-4zM30 9h4v4h-4z"/>
          <path d="M11 14h23" stroke="#e0e0e0"/>
          <path d="M12 36.5h21M11.5 39.5h22" stroke="#e0e0e0"/>
        </g>
      </svg>`,
      n: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fill-rule="evenodd" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-11.5 8-18.5" fill="#2d3139"/>
          <path d="M24 18c.38 2.91-5.55 4.37-8 6-3 2-3.18 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#2d3139"/>
          <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#e0e0e0" stroke="#e0e0e0"/>
          <path d="M15 15.5a.5 1.5 60 1 1-1 0 .5 1.5 60 1 1 1 0z" fill="#e0e0e0" stroke="#e0e0e0"/>
          <path d="M12 36.5h21M11.5 39.5h22" stroke="#e0e0e0"/>
        </g>
      </svg>`,
      b: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <g fill="#2d3139" stroke="#121316">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
          </g>
          <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#e0e0e0" stroke-linejoin="miter"/>
        </g>
      </svg>`,
      q: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="#2d3139" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="12" r="2"/>
          <circle cx="14" cy="9" r="2"/>
          <circle cx="22.5" cy="8" r="2"/>
          <circle cx="31" cy="9" r="2"/>
          <circle cx="39" cy="12" r="2"/>
          <path d="M6 14l5 13h23l5-13-8.5 7-8-12-8 12z"/>
          <path d="M11 27c2.5 2 6 3 11.5 3s9-1 11.5-3" stroke="#e0e0e0"/>
          <path d="M12 36.5h21M11.5 39.5h22" stroke="#e0e0e0"/>
        </g>
      </svg>`,
      k: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
        <g fill="#2d3139" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22.5 3.5v3M20.5 5h4" stroke-width="2" stroke="#e0e0e0"/>
          <path d="M22.5 6.5a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/>
          <path d="M12.5 14.5c0 0 2-3.5 4-4 1.5-.5 3.5.5 6 3 2.5-2.5 4.5-3.5 6-3 2 .5 4 4 4 4l-2 3c0 0-1.5-2-2.5-2.5-.8-.4-2 .5-2 .5l-3.5 3-3.5-3s-1.2-.9-2-.5c-1 .5-2.5 2.5-2.5 2.5l-2-3z"/>
          <path d="M13 17.5l-1.5 4c0 0 3-1 5.5-1.5 2.5-.5 5.5-.5 5.5-.5s3 0 5.5.5c2.5.5 5.5 1.5 5.5 1.5l-1.5-4"/>
          <path d="M11.5 21.5c0 0 .5 4 1 5.5.5 1.5 1 2.5 1 2.5h18s.5-1 1-2.5c.5-1.5 1-5.5 1-5.5" stroke="#e0e0e0"/>
          <path d="M13.5 29.5h18c0 0 1 1.5 1 3s-.5 3.5-1 4c-2 2-6.5 3-9 3s-7-1-9-3c-.5-.5-1-2.5-1-4s1-3 1-3z"/>
          <path d="M13.5 29.5c3-1 6.5-1.5 9-1.5s6 .5 9 1.5" stroke="#e0e0e0"/>
          <path d="M11.5 39.5h22" stroke="#e0e0e0"/>
        </g>
      </svg>`
    }
  };

  // Return the SVG markup for a given piece
  function getSVG(color, type) {
    if (SVG_PIECES[color] && SVG_PIECES[color][type]) {
      return SVG_PIECES[color][type];
    }
    return '';
  }

  // Point values used for material advantage display
  const VALUES = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0
  };

  return {
    getSVG: getSVG,
    VALUES: VALUES
  };
})();
