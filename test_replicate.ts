import Replicate from "replicate";
const token = process.env.VITE_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN || "r8_LYEuUd7ipxNxocBQwlmWuIg4OpXo6Ym4BGh16";

const replicate = new Replicate({ auth: token });
async function run() {
  try {
    const output: any = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: "A beautiful garden, photorealistic, architectural design",
        aspect_ratio: "16:9"
      }
    });
    console.log("Output constructor name:", output?.constructor?.name);
    
    // Convert stream/output to Buffer
    if (output && typeof output.getReader === 'function') {
      const reader = output.getReader();
      const chunks = [];
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          chunks.push(value);
        }
      }
      const buffer = Buffer.concat(chunks);
      console.log("Total bytes buffer size:", buffer.length);
      const base64 = buffer.toString("base64");
      console.log("Data URL start:", `data:image/jpeg;base64,${base64.substring(0, 100)}`);
    } else if (output instanceof Buffer) {
      console.log("Output is already a Buffer. Size:", output.length);
    } else {
      console.log("Unexpected output type:", typeof output);
    }
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
run();




