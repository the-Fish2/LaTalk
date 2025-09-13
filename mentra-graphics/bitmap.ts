export function create1BitBMP(width: number, height: number, pixelData: boolean[][]): Buffer {
  const rowSize = Math.ceil(width / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 62 + pixelArraySize;

  const buffer = Buffer.alloc(fileSize);

  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6);
  buffer.writeUInt32LE(62, 10);

  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(-height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(1, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(pixelArraySize, 34);
  buffer.writeInt32LE(0, 38);
  buffer.writeInt32LE(0, 42);
  buffer.writeUInt32LE(2, 46);
  buffer.writeUInt32LE(2, 50);

  buffer.writeUInt32LE(0x00000000, 54);
  buffer.writeUInt32LE(0x00FFFFFF, 58);

  let offset = 62;
  for (let y = 0; y < height; y++) {
    let rowOffset = offset + y * rowSize;
    let byteIndex = 0;
    let currentByte = 0;
    let bitIndex = 7;

    for (let x = 0; x < width; x++) {
      const pixel = pixelData?.[y]?.[x];
      if (pixel) {
        currentByte |= (1 << bitIndex);
      }

      bitIndex--;
      if (bitIndex < 0) {
        buffer[rowOffset + byteIndex] = currentByte;
        byteIndex++;
        currentByte = 0;
        bitIndex = 7;
      }
    }

    if (bitIndex < 7) {
      buffer[rowOffset + byteIndex] = currentByte;
    }
  }

  return buffer;
}

export function createCanvas(width: number, height: number): boolean[][] {
  return Array(height).fill(null).map(() => Array(width).fill(false));
}

export function drawPixel(canvas: boolean[][], x: number, y: number, color: boolean): void {
  if (canvas[y] && canvas[0]) {
    if (x >= 0 && x < canvas[0].length && y >= 0 && y < canvas.length) {
      canvas[y][x] = color;
    }
  }
}

export function drawLine(canvas: boolean[][], x0: number, y0: number, x1: number, y1: number, color: boolean): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    drawPixel(canvas, x0, y0, color);

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

export function drawRect(canvas: boolean[][], x: number, y: number, width: number, height: number, color: boolean, filled: boolean = false): void {
  if (filled) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        drawPixel(canvas, x + dx, y + dy, color);
      }
    }
  } else {
    drawLine(canvas, x, y, x + width - 1, y, color);
    drawLine(canvas, x + width - 1, y, x + width - 1, y + height - 1, color);
    drawLine(canvas, x + width - 1, y + height - 1, x, y + height - 1, color);
    drawLine(canvas, x, y + height - 1, x, y, color);
  }
}

export function drawCircle(canvas: boolean[][], cx: number, cy: number, radius: number, color: boolean, filled: boolean = false): void {
  console.log("Called the right function")
  const drawCirclePoints = (x: number, y: number) => {
    if (filled) {
      drawLine(canvas, cx - x, cy + y, cx + x, cy + y, color);
      drawLine(canvas, cx - x, cy - y, cx + x, cy - y, color);
      drawLine(canvas, cx - y, cy + x, cx + y, cy + x, color);
      drawLine(canvas, cx - y, cy - x, cx + y, cy - x, color);
    } else {
      drawPixel(canvas, cx + x, cy + y, color);
      drawPixel(canvas, cx - x, cy + y, color);
      drawPixel(canvas, cx + x, cy - y, color);
      drawPixel(canvas, cx - x, cy - y, color);
      drawPixel(canvas, cx + y, cy + x, color);
      drawPixel(canvas, cx - y, cy + x, color);
      drawPixel(canvas, cx + y, cy - x, color);
      drawPixel(canvas, cx - y, cy - x, color);
    }
  };

  let x = 0;
  let y = radius;
  let d = 3 - 2 * radius;

  drawCirclePoints(x, y);

  while (y >= x) {
    x++;
    if (d > 0) {
      y--;
      d = d + 4 * (x - y) + 10;
    } else {
      d = d + 4 * x + 6;
    }
    drawCirclePoints(x, y);
  }
}