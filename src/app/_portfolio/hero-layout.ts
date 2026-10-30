/** Hero art frame: every layer is positioned in % of this 1344×768 composition. */
export const FRAME = { w: 1344, h: 768 } as const;

/**
 * Character layers (x/y from sd-local/out/v5/layers_e/positions.json; w/h are the
 * exported WebP sizes — the ×3 pixelation trims tux/tabby by a pixel or two).
 */
export const LAYERS = {
  lucas: { x: 882, y: 128, w: 312, h: 600 },
  tux: { x: 710, y: 562, w: 202, h: 118 }, // paws aligned to Lucas' soles; 0.4 of the SD source // Mia, watching a firefly on the floor (drawn on shadows layer)
  tabby: { x: 1074, y: 584, w: 258, h: 150 }, // Callie, curled up asleep
} as const;

export const pct = (v: number, of: number) => `${(v / of) * 100}%`;
