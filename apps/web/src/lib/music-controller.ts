let iframe: HTMLIFrameElement | null = null;

export function registerPlayer(el: HTMLIFrameElement | null) {
  iframe = el;
}

function command(func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args }),
    "https://www.youtube.com",
  );
}

export function play() {
  command("playVideo");
}

export function pause() {
  command("pauseVideo");
}

export function unmute() {
  command("unMute");
  command("setVolume", [80]);
}
