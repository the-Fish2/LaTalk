import { create1BitBMP, createCanvas, drawLine, drawCircle, drawRect } from './bitmap'; 

export type DrawCommand =
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "circle"; cx: number; cy: number; radius: number; filled?: boolean }
  | { type: "triangle"; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; filled?: boolean }
  | { type: "rect"; x: number; y: number; width: number; height: number; filled?: boolean };

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
    default:
      console.warn("Unknown draw command:", (cmd as any).type);
  }
}

export function renderCommands(
  width: number,
  height: number,
  commands: DrawCommand[],
  color: boolean = true
): boolean[][] {
  const canvas = createCanvas(width, height);
  for (const cmd of commands) {
    applyCommand(canvas, cmd, color);
  }
  return canvas;
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
  stepwise: boolean = true
): Promise<void> {
  if (stepwise) {
    // Render stepwise (animated)
    await renderCommandsStepwise(
      width, height, commands, true, 500, 
      async (canvasSoFar, stepIndex) => {
        await showCanvasInSession(canvasSoFar, session, width, height);
      }
    );
  } else {
    // Render all at once (non-animated)
    const fullCanvas = renderCommands(width, height, commands, true);
    console.log("Finished rendering commands")
    await showCanvasInSession(fullCanvas, session, width, height);
  }
}
