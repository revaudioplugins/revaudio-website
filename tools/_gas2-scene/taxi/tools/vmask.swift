// Apple Vision subject lift: writes one grayscale PNG mask per foreground instance (out-<n>.png) at the image's size.
import Foundation
import Vision
import CoreImage

let a = CommandLine.arguments
guard a.count == 3 else { print("usage: vmask <image> <out-prefix>"); exit(2) }
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: a[1]))
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch { print("vision failed: \(error)"); exit(1) }
guard let obs = req.results?.first else { print("no subject found"); exit(1) }
let ctx = CIContext()
let gray = CGColorSpace(name: CGColorSpace.linearGray)!
print("instances: \(obs.allInstances.count)")
for i in obs.allInstances {
  do {
    let buf = try obs.generateScaledMaskForImage(forInstances: IndexSet(integer: i), from: handler)
    let ci = CIImage(cvPixelBuffer: buf)
    let url = URL(fileURLWithPath: "\(a[2])-\(i).png")
    try ctx.writePNGRepresentation(of: ci, to: url, format: .L8, colorSpace: gray)
    print("wrote \(url.path)")
  } catch { print("instance \(i) failed: \(error)") }
}
