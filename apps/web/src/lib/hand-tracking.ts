import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let instance: HandLandmarker | null = null;
let pending: Promise<HandLandmarker> | null = null;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (instance) return instance;
  if (pending) return pending;

  pending = (async () => {
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    const lm = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: "/models/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    instance = lm;
    pending = null;
    return lm;
  })();

  return pending;
}
