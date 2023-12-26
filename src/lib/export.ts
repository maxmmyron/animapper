
import { frames, ffmpeg } from "$lib/stores"
import { get } from "svelte/store";
import { fetchFile } from "@ffmpeg/ffmpeg";

export const exportRender = async (options: App.ExportOptions): Promise<boolean> => {
  // get all render sources from frame store
  const renders: string[] = get(frames).map((frame => frame.renderSrc));
  const ffmpegInstance = get(ffmpeg);

  if(!ffmpegInstance.isLoaded) {
    throw new Error("Error exporting: ffmpeg is not loaded");
  }

  for (const render of renders) {
    ffmpegInstance.FS("writeFile", `render-${renders.indexOf(render)}.png`, await fetchFile(render));
  }

  // run ffmpeg command to concat all renders with name `render-<index>.png` into a video with specified framerate.
  await ffmpegInstance.run("-framerate", `${options.framerate}`, "-i", "render-%d.png", "-pix_fmt", "yuv420p", "out.mp4");
  const data = ffmpegInstance.FS("readFile", "out.mp4");

  // Download the file by creating a new link, and dispatching a click event
  const link = document.createElement("a");
  link.download = `out.mp4`;
  link.href = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
  document.body.appendChild(link);
  link.dispatchEvent(new MouseEvent("click"));

  // Clean up
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 7000);
  return true;
}
