import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from nudenet import NudeDetector

app = FastAPI(title="GymLog Moderation Service")

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
profile_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_profileface.xml"
)

nude_detector = NudeDetector()

NSFW_LABELS = {
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "ANUS_EXPOSED",
}
NSFW_THRESHOLD = 0.5


def detect_face(image: np.ndarray) -> bool:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
    )
    if len(faces) > 0:
        return True

    profiles = profile_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
    )
    if len(profiles) > 0:
        return True

    flipped = cv2.flip(gray, 1)
    profiles = profile_cascade.detectMultiScale(
        flipped, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
    )
    return len(profiles) > 0


def detect_nsfw(image_path: str) -> tuple[bool, list[str]]:
    detections = nude_detector.detect(image_path)
    hits = [
        d["class"]
        for d in detections
        if d["class"] in NSFW_LABELS and d["score"] >= NSFW_THRESHOLD
    ]
    return len(hits) > 0, hits


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/moderate")
async def moderate(file: UploadFile = File(...)):
    data = await file.read()

    buffer = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)

    if image is None:
        return {
            "ok": False,
            "hasFace": False,
            "isNsfw": False,
            "reason": "Could not read image.",
        }

    max_side = max(image.shape[0], image.shape[1])
    if max_side > 1280:
        scale = 1280 / max_side
        image = cv2.resize(image, None, fx=scale, fy=scale)

    has_face = detect_face(image)

    tmp_path = "tmp_moderation.jpg"
    cv2.imwrite(tmp_path, image)
    is_nsfw, nsfw_hits = detect_nsfw(tmp_path)

    ok = has_face and not is_nsfw
    reason = None
    if not has_face:
        reason = "No face detected in the photo."
    elif is_nsfw:
        reason = "Photo contains inappropriate content."

    return {
        "ok": ok,
        "hasFace": has_face,
        "isNsfw": is_nsfw,
        "nsfwLabels": nsfw_hits,
        "reason": reason,
    }
