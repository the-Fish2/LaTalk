import { AppServer, AppSession, ViewType } from "@mentra/sdk";
import { DrawCommand, executeDrawingCommands, getOrCreateCanvas } from './drawCommands';
import fetch from 'node-fetch';

// Load configuration from environment variables
const PACKAGE_NAME = process.env.PACKAGE_NAME || "com.example.myfirstmentraosapp"
const PORT = parseInt(process.env.PORT || "8080")
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY

if (!MENTRAOS_API_KEY) {
  console.error("MENTRAOS_API_KEY environment variable is required")
  process.exit(1)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface BackendResponse {
  commands: DrawCommand[];
  clear_display: boolean;
}

/**
 * MyMentraOSApp - A simple MentraOS application that displays "Hello, World!"
 * Extends AppServer to handle sessions and user interactions
 */
class MyMentraOSApp extends AppServer {
  /**
   * Handle new session connections
   * @param session - The app session instance
   * @param sessionId - Unique identifier for this session
   * @param userId - The user ID for this session
   */
    protected override async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {

      let globalCanvas = getOrCreateCanvas(200, 200);

      //TEST CASE 1
      // Circle centered at (100,100) with radius 50
      let cmd1: DrawCommand = { type: "circle", cx: 50, cy: 50, radius: 20};
      await executeDrawingCommands(session, [cmd1], 200, 200, globalCanvas);
      await sleep(2000);

    // Listen for voice commands
    const unsubscribe = session.events.onTranscription(async (data) => {
      if (data.text.toLowerCase().includes("lizards")) {
        await session.audio.stopAudio();
        return;
      }
      if (!data.isFinal) return;

      const command = data.text.toLowerCase().trim();
      session.logger.info(`Heard: "${command}"`);

      try {
        const response = await fetch("http://127.0.0.1:3000/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: data.text }),
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const json = (await response.json()) as BackendResponse;
          const { commands, clear_display } = json;
          console.log(commands)
          console.log(clear_display)
          let r1: DrawCommand = { type: "line", x1: 50, y1: 50, x2: 70, y2: 50 };

          if (clear_display) {
            await executeDrawingCommands(session, commands, 200, 200, globalCanvas);
          }
          else {
            globalCanvas = getOrCreateCanvas(200, 200);
            await executeDrawingCommands(session, commands, 200, 200, globalCanvas);
          }

        } else {
          // Log the response as text for debugging
          const text = await response.text();
          console.error("Backend did not return JSON:", text);
        }
      } catch (err) {
        console.error("Error streaming to backend:", err);
    }

    });

    // Clean up listener when session ends
    this.addCleanupHandler(unsubscribe);
  

    //   // Real-time transcription
    //   session.events.onTranscription(async (data) => {
    //   if (!data.text) return;

    //   try {
    //     const response = await fetch("http://127.0.0.1:8000/stream", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ input: data.text }),
    //     });

    //     if (!response.body) return;

    //     // Node.js readable stream
    //     response.body.on("data", (chunk: Buffer) => {
    //       try {
    //         const str = chunk.toString();
    //         const { nl, latex } = JSON.parse(str);

    //         // Show response on glasses if needed
    //         if (nl.includes("Received")) {
    //           session.layouts.showTextWall("Received", {
    //             view: ViewType.MAIN,
    //             durationMs: 3000,
    //           });
    //         }
    //       } catch {
    //         // skip incomplete chunks
    //       }
    //     });

    //   } catch (err) {
    //     console.error("Error streaming to backend:", err);
    //   }
    // });

    // session.logger.info(`New session: ${sessionId} for user ${userId}`)

    // // Display "Hello, World!" on the glasses

    // let globalCanvas = getOrCreateCanvas(200, 200);

    // //TEST CASE 1
    // // Circle centered at (100,100) with radius 50
    // let cmd1: DrawCommand = { type: "circle", cx: 50, cy: 50, radius: 20};
    // await executeDrawingCommands(session, [cmd1], 200, 200, globalCanvas);
    // await sleep(2000);

    // // Three radii
    // let r1: DrawCommand = { type: "line", x1: 50, y1: 50, x2: 70, y2: 50 }; // point A
    // await executeDrawingCommands(session, [r1], 200, 200, globalCanvas);
    // await sleep(2000);

    // let r2: DrawCommand = { type: "line", x1: 50, y1: 50, x2: 38, y2: 34 }; // point B
    // await executeDrawingCommands(session, [r2], 200, 200, globalCanvas);
    // await sleep(2000);

    // let r3: DrawCommand = { type: "line", x1: 38, y1: 34, x2: 70, y2: 50 }; // point C
    // await executeDrawingCommands(session, [r3], 200, 200, globalCanvas);
    // await sleep(2000);

    // // Labels
    // let labelA: DrawCommand = { type: "text", text_str: "A", x: 38, y: 34, scale: 2, spacing: 1 };
    // await executeDrawingCommands(session, [labelA], 200, 200, globalCanvas);
    // await sleep(2000);

    // let labelB: DrawCommand = { type: "text", text_str: "B", x: 70, y: 50, scale: 2, spacing: 1 };
    // await executeDrawingCommands(session, [labelB], 200, 200, globalCanvas);
    // await sleep(2000);

    // let labelC: DrawCommand = { type: "text", text_str: "C", x: 50, y: 50, scale: 2, spacing: 1 };
    // await executeDrawingCommands(session, [labelC], 200, 200, globalCanvas);
    // await sleep(2000);

    // //TEST CASE 1 END

    // session.events.onDisconnected(() => {
    //   session.logger.info(`Session ${sessionId} disconnected.`)
    // })
  }
}

const server = new MyMentraOSApp({
  packageName: PACKAGE_NAME,
  apiKey: MENTRAOS_API_KEY,
  port: PORT,
})

server.start().catch(err => {
  console.error("Failed to start server:", err)
})

