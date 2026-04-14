#!/usr/bin/env python3
"""
Generates placeholder PNG icons for the Geburtstagsapp PWA.
Uses only Python standard library – no pip install required.

Run:  python3 generate_icons.py
Output: icons/icon-180.png, icons/icon-192.png, icons/icon-512.png

These are placeholder icons and will be replaced with the final artwork later.
"""

import struct
import zlib
import os
import math


# ---------------------------------------------------------------------------
# Minimal PNG encoder (pure stdlib)
# ---------------------------------------------------------------------------

def _pack_chunk(chunk_type: bytes, data: bytes) -> bytes:
    """Build a PNG chunk: length + type + data + CRC."""
    payload = chunk_type + data
    crc = zlib.crc32(payload) & 0xFFFFFFFF
    return struct.pack('>I', len(data)) + payload + struct.pack('>I', crc)


def encode_png(width: int, height: int, pixels: list) -> bytes:
    """
    Encode a list of (R, G, B) tuples (row-major) into a PNG byte string.
    """
    signature = b'\x89PNG\r\n\x1a\n'

    # IHDR: width, height, bit-depth=8, colour-type=2 (RGB), no interlace
    ihdr = _pack_chunk(
        b'IHDR',
        struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    )

    # Raw image data: one filter byte (0 = None) per row + RGB triples
    raw = bytearray()
    for row in range(height):
        raw += b'\x00'
        for col in range(width):
            r, g, b = pixels[row * width + col]
            raw += bytes([r, g, b])

    idat = _pack_chunk(b'IDAT', zlib.compress(bytes(raw), level=9))
    iend = _pack_chunk(b'IEND', b'')

    return signature + ihdr + idat + iend


# ---------------------------------------------------------------------------
# Icon drawing
# ---------------------------------------------------------------------------

def _lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def _dist(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def draw_icon(size: int) -> list:
    """
    Draw a birthday-cake icon at `size` × `size` pixels.
    Returns a flat list of (R, G, B) tuples.

    Layout (all values are fractions of `size`, i.e. 0..1):
      Background  : vertical gradient, dark purple → medium purple
      Plate       : light-purple strip at the bottom
      Cake body   : three alternating layers (pink / cream / pink)
      Frosting    : thin white lines between layers
      Candles     : three yellow rectangles above the cake
      Flames      : orange-yellow ellipses above each candle
    """

    # ---- Colours (R, G, B) ------------------------------------------------
    BG_TOP       = ( 72,  22, 160)   # deep purple
    BG_BOTTOM    = (100,  50, 190)   # medium purple

    PLATE        = (195, 160, 255)   # lavender plate
    CAKE_PINK    = (255, 130, 170)   # pink sponge / frosting
    CAKE_CREAM   = (255, 240, 200)   # cream layer
    FROSTING     = (255, 255, 255)   # white frosting line
    CANDLE       = (255, 230, 120)   # yellow candle body
    FLAME_INNER  = (255, 210,  40)   # bright flame centre
    FLAME_OUTER  = (255, 110,  20)   # deep orange flame edge

    # ---- Layout (normalised 0..1) ------------------------------------------
    PAD = 0.12                          # horizontal padding

    PLATE_TOP    = 0.80
    PLATE_BOTTOM = 0.88

    BODY_TOP     = 0.38
    BODY_BOTTOM  = PLATE_TOP
    BODY_H       = BODY_BOTTOM - BODY_TOP

    LAYER_1_BOT  = BODY_TOP + BODY_H * 0.34   # top-pink / cream boundary
    LAYER_2_BOT  = BODY_TOP + BODY_H * 0.66   # cream / bottom-pink boundary
    FROST_W      = 0.022                       # half-width of frosting lines

    CANDLE_W     = 0.048
    CANDLE_TOP   = 0.15
    CANDLE_BOT   = BODY_TOP + 0.008
    CANDLE_CXS   = [0.30, 0.50, 0.70]         # x-centres of the three candles

    FLAME_RX     = 0.044   # horizontal radius
    FLAME_RY     = 0.060   # vertical radius (taller than wide)
    FLAME_CY     = CANDLE_TOP - 0.045          # flame centre y (above candle)

    # ---- Pixel loop --------------------------------------------------------
    pixels = []
    for row in range(size):
        for col in range(size):
            nx = col / size    # 0..1
            ny = row / size    # 0..1

            # Background gradient
            t_bg = ny
            color = (
                _lerp(BG_TOP[0], BG_BOTTOM[0], t_bg),
                _lerp(BG_TOP[1], BG_BOTTOM[1], t_bg),
                _lerp(BG_TOP[2], BG_BOTTOM[2], t_bg),
            )

            in_x = (PAD <= nx <= 1 - PAD)

            # Plate
            if in_x and PLATE_TOP <= ny <= PLATE_BOTTOM:
                color = PLATE

            # Cake body
            if in_x and BODY_TOP <= ny <= BODY_BOTTOM:
                if abs(ny - LAYER_1_BOT) <= FROST_W:
                    color = FROSTING
                elif abs(ny - LAYER_2_BOT) <= FROST_W:
                    color = FROSTING
                elif ny < LAYER_1_BOT:
                    color = CAKE_PINK
                elif ny < LAYER_2_BOT:
                    color = CAKE_CREAM
                else:
                    color = CAKE_PINK

            # Candles + flames
            for cx in CANDLE_CXS:
                # Candle body
                if abs(nx - cx) <= CANDLE_W / 2 and CANDLE_TOP <= ny <= CANDLE_BOT:
                    color = CANDLE

                # Flame (ellipse test: (dx/rx)^2 + (dy/ry)^2 <= 1)
                dx = (nx - cx) / FLAME_RX
                dy = (ny - FLAME_CY) / FLAME_RY
                d2 = dx * dx + dy * dy
                if d2 <= 1.0:
                    t_fl = math.sqrt(d2)          # 0 = centre, 1 = edge
                    color = (
                        _lerp(FLAME_INNER[0], FLAME_OUTER[0], t_fl),
                        _lerp(FLAME_INNER[1], FLAME_OUTER[1], t_fl),
                        _lerp(FLAME_INNER[2], FLAME_OUTER[2], t_fl),
                    )

            pixels.append(color)

    return pixels


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    os.makedirs('icons', exist_ok=True)

    sizes = [180, 192, 512]
    for size in sizes:
        path = f'icons/icon-{size}.png'
        pixels = draw_icon(size)
        png_bytes = encode_png(size, size, pixels)
        with open(path, 'wb') as fh:
            fh.write(png_bytes)
        print(f'  ✓  {path}  ({size}×{size} px,  {len(png_bytes) // 1024} KB)')

    print('\nPlatzhalter-Icons erfolgreich generiert.')
    print('Sie können später durch eigene PNGs (180×180, 192×192, 512×512) ersetzt werden.')


if __name__ == '__main__':
    main()
