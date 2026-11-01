"""The roof sign on the car photo (revaudio-59, 2026-10-28): a masked gpt-image-2 edit, pasted back onto the approved car.
  python -I drone/tools/sign-guide.py guide <car.png> <out dir>          -> sign-guide.png + sign-mask.png
  python -I drone/tools/sign-guide.py compose <car.png> <edit.png> <out.png>
guide = the car with a flat placeholder board where the old drawn sign sat (3.2 x 1.32 m, 0.25 m behind the car's
centre); mask = see-through over the board plus a margin for its shadow. compose pastes only that area (feathered) back
onto the original car, so the car Dan approved stays pixel for pixel."""
import sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

BOARD = (3.2, 1.32, .25)            # w, h, x offset in metres (as the drawn sign was); the car plane is 5 m long
MARGIN = .12                        # metres round the board the edit may change (its shadow on the roof)


def board_box(car):
    a = car.astype(np.float32)
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]                 # as post-art.py key_car: the crop the plane shows
    alpha = cv2.erode(1 - np.clip((m - 30) / 90, 0, 1), np.ones((3, 3), np.uint8))
    ys, xs = np.nonzero(alpha > .5)
    x0, x1, y0, y1 = xs.min() - 4, xs.max() + 5, ys.min() - 4, ys.max() + 5
    ppm = (x1 - x0) / 5
    cx, cy = (x0 + x1) / 2 + BOARD[2] * ppm, (y0 + y1) / 2
    w, h = BOARD[0] * ppm, BOARD[1] * ppm
    return ppm, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)


def guide(car_path, out):
    img = Image.open(car_path).convert('RGB')
    ppm, (x0, y0, x1, y1) = board_box(np.asarray(img))
    d = ImageDraw.Draw(img)
    d.rectangle((x0, y0, x1, y1), fill=(239, 230, 210), outline=(184, 52, 30), width=round(.05 * ppm))
    f1 = ImageFont.truetype('C:/Windows/Fonts/impact.ttf', round(.48 * ppm)); f2 = ImageFont.truetype('C:/Windows/Fonts/impact.ttf', round(.56 * ppm))
    cx = (x0 + x1) / 2
    d.text((cx, y0 + .31 * (y1 - y0)), 'CATCH YOUR', font=f1, fill=(184, 52, 30), anchor='mm')
    d.text((cx, y0 + .7 * (y1 - y0)), 'COUPON', font=f2, fill=(184, 52, 30), anchor='mm')
    img.save(f'{out}/sign-guide.png')
    mask = Image.new('RGBA', img.size, (0, 0, 0, 255))
    g = MARGIN * ppm
    ImageDraw.Draw(mask).rectangle((x0 - g, y0 - g, x1 + g, y1 + g), fill=(0, 0, 0, 0))  # see-through = may change
    mask.save(f'{out}/sign-mask.png')
    print('board px', [round(v) for v in (x0, y0, x1, y1)], 'ppm', round(ppm, 1))


def compose(car_path, edit_path, out):
    car = np.asarray(Image.open(car_path).convert('RGB')).astype(np.float32)
    edit = np.asarray(Image.open(edit_path).convert('RGB').resize(car.shape[1::-1], Image.LANCZOS)).astype(np.float32)
    ppm, (x0, y0, x1, y1) = board_box(car.astype(np.uint8))
    g = (MARGIN + .1) * ppm           # a little past the mask: the model draws the rack's rails right at its edge
    w = np.zeros(car.shape[:2], np.float32)
    w[round(y0 - g):round(y1 + g), round(x0 - g):round(x1 + g)] = 1
    w = cv2.GaussianBlur(cv2.erode(w, np.ones((9, 9), np.uint8)), (0, 0), 3)[..., None]   # feathered
    Image.fromarray(np.clip(car * (1 - w) + edit * w, 0, 255).astype(np.uint8)).save(out)
    print('composed', out)


if sys.argv[1] == 'guide': guide(*sys.argv[2:4])
else: compose(*sys.argv[2:5])
