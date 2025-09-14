import { createCanvas, create1BitBMP, drawLine, drawCircle, drawRect } from './bitmap'; 
import { drawText } from './font';

export type DrawCommand =
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "circle"; cx: number; cy: number; radius: number; filled?: boolean }
  | { type: "triangle"; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; filled?: boolean }
  | { type: "rect"; x: number; y: number; width: number; height: number; filled?: boolean }
  | { type: "text"; text_str: string, x: number, y: number, scale: number, spacing: number};

function applyCommand(
  canvas: boolean[][],
  cmd: DrawCommand,
  color: boolean = true
): void {
  switch (cmd.type) {
    case "line":
      drawLine(canvas, cmd.x1, cmd.y1, cmd.x2, cmd.y2, color);
      break;
    case "circle":
      drawCircle(canvas, cmd.cx, cmd.cy, cmd.radius, color, !!cmd.filled);
      break;
    case "triangle":
      drawLine(canvas, cmd.x1, cmd.y1, cmd.x2, cmd.y2, color);
      drawLine(canvas, cmd.x2, cmd.y2, cmd.x3, cmd.y3, color);
      drawLine(canvas, cmd.x3, cmd.y3, cmd.x1, cmd.y1, color);
      break;
    case "rect":
      drawRect(canvas, cmd.x, cmd.y, cmd.width, cmd.height, color, !!cmd.filled);
      break;
    case "text":
      drawText(canvas, cmd.text_str, cmd.x, cmd.y, cmd.scale, cmd.spacing);
      break;
    default:
      console.warn("Unknown draw command:", (cmd as any).type);
  }
}

export function renderCommands(
  width: number,
  height: number,
  commands: DrawCommand[],
  color: boolean = true,
  existingCanvas?: boolean[][]
): boolean[][] {
  console.log("bitmapCreateCanvas", createCanvas)
  const canvas = existingCanvas ?? createCanvas(width, height); // reuse if provided
  for (const cmd of commands) {
    applyCommand(canvas, cmd, color);
  }
  return canvas;
}

export function getOrCreateCanvas(width: number, height: number): boolean[][] {
  return createCanvas(width, height);
}


export async function renderCommandsStepwise(
  width: number,
  height: number,
  commands: DrawCommand[],
  color: boolean = true,
  delayMs: number = 500,   // delay between commands
  onStep?: (canvasSoFar: boolean[][], stepIndex: number) => Promise<void>
): Promise<boolean[][]> {
  const canvas = createCanvas(width, height);
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    if (cmd !== undefined) {
        applyCommand(canvas, cmd, color);
    }
    if (onStep) {
      await onStep(canvas, i); 
    }
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));  // Delay
    }
  }
  return canvas;
}

async function showCanvasInSession(
  canvas: boolean[][],
  session: any,
  width: number,
  height: number
): Promise<void> {
  const bmp = create1BitBMP(width, height, canvas);
  await session.layouts.showBitmapView(bmp, { view: "MAIN" });
}

export async function executeDrawingCommands(
  session: any,  
  commands: DrawCommand[],
  width: number = 200,
  height: number = 200,
  existingCanvas?: boolean[][]
  ): Promise<void> {
    const fullCanvas = renderCommands(width, height, commands, true, existingCanvas);
    console.log("Finished rendering commands")
    await showCanvasInSession(fullCanvas, session, width, height);
}
