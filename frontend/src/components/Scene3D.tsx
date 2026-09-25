import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { MAX_DISTANCE } from '../lib/rides'

const STEP = 1.1 // one city cell
const HALF = 21 // cells from centre to edge
const BG = '#141614'
const CALM = new THREE.Color('#2ee07a') // low surge
const HOT = new THREE.Color('#ff2b2b') // peak surge

// Street corners (xz). Streets run every 4 cells, so every point sits on a street.
// A wide, shallow route (A on the left, B on the right) fits the landscape band
// the page leaves free above the headline and the control dock.
const WAYPOINTS: [number, number][] = [
  [-12.1, 0],
  [-8.8, 0],
  [-8.8, -4.4],
  [4.4, -4.4],
  [4.4, 0],
  [12.1, 0],
]

const ROUTE_BOX = (() => {
  const xs = WAYPOINTS.map((p) => p[0])
  const zs = WAYPOINTS.map((p) => p[1])
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, w: maxX - minX, d: maxZ - minZ }
})()

function distanceToRoute(x: number, z: number) {
  let best = Infinity
  for (let k = 0; k < WAYPOINTS.length - 1; k++) {
    const [ax, az] = WAYPOINTS[k]
    const [bx, bz] = WAYPOINTS[k + 1]
    const dx = bx - ax
    const dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)))
  }
  return best
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Manhattan route with rounded corners so the tube reads like a real street path. */
function buildRoute(radius = 0.9, y = 0.08) {
  const v = WAYPOINTS.map(([x, z]) => new THREE.Vector3(x, y, z))
  const path = new THREE.CurvePath<THREE.Vector3>()
  let cursor = v[0]
  for (let i = 1; i < v.length - 1; i++) {
    const inDir = v[i].clone().sub(v[i - 1]).normalize()
    const outDir = v[i + 1].clone().sub(v[i]).normalize()
    const a = v[i].clone().addScaledVector(inDir, -radius)
    const b = v[i].clone().addScaledVector(outDir, radius)
    path.add(new THREE.LineCurve3(cursor, a))
    path.add(new THREE.QuadraticBezierCurve3(a, v[i], b))
    cursor = b
  }
  path.add(new THREE.LineCurve3(cursor, v[v.length - 1]))
  return path
}

function City() {
  const blocks = useRef<THREE.InstancedMesh>(null!)
  const beacons = useRef<THREE.InstancedMesh>(null!)
  const beaconMat = useRef<THREE.MeshBasicMaterial>(null!)

  const { cells, tall } = useMemo(() => {
    const rnd = mulberry32(7)
    const cells: { x: number; z: number; h: number; lit: boolean }[] = []
    for (let i = -HALF; i <= HALF; i++) {
      for (let j = -HALF; j <= HALF; j++) {
        if (i % 4 === 0 || j % 4 === 0) continue
        const x = i * STEP
        const z = j * STEP
        const nearCore = Math.hypot(i, j) < 6
        let h = 0.25 + rnd() * rnd() * (nearCore ? 4.8 : 2.4) + (rnd() > 0.95 ? 2.2 : 0)
        // Keep a low-rise corridor along the route so no tower hides the road.
        if (distanceToRoute(x, z) < 2.6) h = Math.min(h, 0.3 + rnd() * 0.6)
        cells.push({ x, z, h, lit: rnd() > 0.88 })
      }
    }
    return { cells, tall: cells.filter((c) => c.h > 3) }
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const c = new THREE.Color()
    cells.forEach((b, k) => {
      m.compose(new THREE.Vector3(b.x, b.h / 2, b.z), q, new THREE.Vector3(0.84, b.h, 0.84))
      blocks.current.setMatrixAt(k, m)
      blocks.current.setColorAt(k, c.set(b.lit ? '#2f322f' : '#1b1d1b'))
    })
    blocks.current.instanceMatrix.needsUpdate = true
    if (blocks.current.instanceColor) blocks.current.instanceColor.needsUpdate = true

    tall.forEach((b, k) => {
      m.compose(new THREE.Vector3(b.x, b.h + 0.06, b.z), q, new THREE.Vector3(1, 1, 1))
      beacons.current.setMatrixAt(k, m)
    })
    beacons.current.instanceMatrix.needsUpdate = true
  }, [cells, tall])

  useFrame(({ clock }) => {
    // aviation lights: slow blink
    beaconMat.current.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(clock.elapsedTime * 1.6))
  })

  return (
    <group>
      <instancedMesh ref={blocks} args={[undefined, undefined, cells.length]}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={beacons} args={[undefined, undefined, tall.length]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial ref={beaconMat} color="#ff4d4d" transparent toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

interface RouteProps {
  distance: number
  surge: number
  reduced: boolean
}

interface PinLabels {
  a: RefObject<HTMLDivElement | null>
  b: RefObject<HTMLDivElement | null>
}

const LABEL_LIFT = new THREE.Vector3(0, 1.9, 0)

function Route({ distance, surge, reduced, labels }: RouteProps & { labels: PinLabels }) {
  const path = useMemo(() => buildRoute(), [])
  const start = useMemo(() => path.getPointAt(0), [path])
  const tube = useMemo(() => new THREE.TubeGeometry(path, 480, 0.075, 12, false), [path])
  const ghost = useMemo(() => new THREE.TubeGeometry(path, 240, 0.025, 6, false), [path])

  const tubeMat = useRef<THREE.MeshBasicMaterial>(null!)
  const car = useRef<THREE.Group>(null!)
  const carLight = useRef<THREE.PointLight>(null!)
  const endPin = useRef<THREE.Group>(null!)
  const endRing = useRef<THREE.Mesh>(null!)
  const state = useRef({ frac: 0.05, t: 0, heat: 0 })

  const targetFrac = 0.12 + 0.88 * Math.min(distance / MAX_DISTANCE, 1)
  const targetHeat = (surge - 1) / 2
  const tangent = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const heatColor = useMemo(() => new THREE.Color(), [])
  const projected = useMemo(() => new THREE.Vector3(), [])

  // Pin the DOM labels to the 3D pins: project to screen space every frame.
  const place = (el: HTMLDivElement | null, world: THREE.Vector3, camera: THREE.Camera, w: number, h: number) => {
    if (!el) return
    projected.copy(world).add(LABEL_LIFT).project(camera)
    const x = (projected.x * 0.5 + 0.5) * w
    const y = (-projected.y * 0.5 + 0.5) * h
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
    el.style.opacity = projected.z < 1 ? '1' : '0'
  }

  useFrame(({ clock, camera, size }, dt) => {
    const s = state.current
    s.frac = THREE.MathUtils.damp(s.frac, targetFrac, 3.5, dt)
    s.heat = THREE.MathUtils.damp(s.heat, targetHeat, 3, dt)

    const total = tube.index!.count
    tube.setDrawRange(0, Math.floor((total * s.frac) / 6) * 6)
    // HSL lerp passes through yellow on the way from green to red
    heatColor.copy(CALM).lerpHSL(HOT, s.heat)
    tubeMat.current.color.copy(heatColor).multiplyScalar(1.8)
    endPin.current.traverse((o) => {
      if (o instanceof THREE.Mesh) (o.material as THREE.MeshBasicMaterial).color.copy(heatColor)
    })

    // Constant world-space speed: busier city → faster car.
    if (reduced) s.t = 1
    else s.t = (s.t + (dt * (0.1 + 0.22 * s.heat)) / Math.max(s.frac, 0.15)) % 1
    const u = Math.min(s.t * s.frac, 0.999)
    const p = path.getPointAt(u)
    path.getTangentAt(u, tangent)
    car.current.position.copy(p)
    car.current.lookAt(lookTarget.copy(p).add(tangent))
    carLight.current.color.copy(tubeMat.current.color)

    endPin.current.position.copy(path.getPointAt(Math.min(s.frac, 1)))
    const pulse = reduced ? 0.5 : (clock.elapsedTime * 0.8) % 1
    endRing.current.scale.setScalar(1 + pulse * 1.8)
    ;(endRing.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - pulse)

    place(labels.a.current, start, camera, size.width, size.height)
    place(labels.b.current, endPin.current.position, camera, size.width, size.height)
  })

  return (
    <group>
      <mesh geometry={ghost}>
        <meshBasicMaterial color="#6d716c" transparent opacity={0.6} />
      </mesh>
      <mesh geometry={tube}>
        <meshBasicMaterial ref={tubeMat} toneMapped={false} />
      </mesh>

      {/* origin */}
      <group position={start}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.18, 0.26, 40]} />
          <meshBasicMaterial color="#f4f1ea" toneMapped={false} />
        </mesh>
        <mesh position-y={0.7}>
          <cylinderGeometry args={[0.012, 0.012, 1.4, 6]} />
          <meshBasicMaterial color="#f4f1ea" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* destination, follows the drawn length */}
      <group ref={endPin}>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.16, 32]} />
          <meshBasicMaterial toneMapped={false} />
        </mesh>
        <mesh ref={endRing} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.2, 0.26, 40]} />
          <meshBasicMaterial transparent toneMapped={false} />
        </mesh>
        <mesh position-y={1}>
          <cylinderGeometry args={[0.015, 0.015, 2, 6]} />
          <meshBasicMaterial transparent opacity={0.45} toneMapped={false} />
        </mesh>
      </group>

      <group ref={car}>
        <mesh position-y={0.08}>
          <boxGeometry args={[0.16, 0.12, 0.32]} />
          <meshBasicMaterial color="#fffaf0" toneMapped={false} />
        </mesh>
        <pointLight ref={carLight} position-y={0.5} intensity={6} distance={3.5} decay={1.6} />
      </group>
    </group>
  )
}

// Part of the canvas (fractions, top-left origin) the whole route must stay inside;
// the rest is covered by the headline and the control dock.
const SAFE_DESKTOP = { x0: 0.05, x1: 0.95, y0: 0.09, y1: 0.47 }
const SAFE_COMPACT = { x0: 0.06, x1: 0.94, y0: 0.1, y1: 0.72 }

/** Frames the full route (and its A/B labels) inside the safe area on any screen size. */
function CameraRig({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  const goal = useMemo(() => new THREE.Vector3(), [])
  // Look slightly above the ground so the labels standing on the pins are centred too.
  const target = useMemo(() => new THREE.Vector3(ROUTE_BOX.cx, 0.9, ROUTE_BOX.cz), [])
  useFrame(({ camera, pointer, size, scene }, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const safe = compact ? SAFE_COMPACT : SAFE_DESKTOP
    const elev = THREE.MathUtils.degToRad(compact ? 62 : 56)
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
    const aspect = size.width / size.height

    // World extent the view has to cover, padded for the pins and their labels.
    const needW = (ROUTE_BOX.w + 3) / (safe.x1 - safe.x0)
    const needH = ((ROUTE_BOX.d + 2) * Math.sin(elev) + 2.6 * Math.cos(elev)) / (safe.y1 - safe.y0)
    const dist = Math.max(needW / (2 * tanHalf * aspect), needH / (2 * tanHalf))

    const px = reduced ? 0 : pointer.x
    const py = reduced ? 0 : pointer.y
    goal.set(
      target.x + px * dist * 0.035,
      target.y + Math.sin(elev) * dist + py * dist * 0.02,
      target.z + Math.cos(elev) * dist,
    )
    cam.position.x = THREE.MathUtils.damp(cam.position.x, goal.x, 2.2, dt)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, goal.y, 2.2, dt)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, goal.z, 2.2, dt)
    cam.lookAt(target)

    // Shift the projection so the route's centre lands in the middle of the safe area.
    const cx = (safe.x0 + safe.x1) / 2
    const cy = (safe.y0 + safe.y1) / 2
    cam.setViewOffset(size.width, size.height, size.width * (0.5 - cx), size.height * (0.5 - cy), size.width, size.height)

    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      fog.near = dist * 0.9
      fog.far = dist * 2.1
    }
  })
  return null
}

interface SceneProps extends RouteProps {
  compact: boolean
}

export default function Scene3D({ distance, surge, reduced, compact }: SceneProps) {
  const labelA = useRef<HTMLDivElement>(null)
  const labelB = useRef<HTMLDivElement>(null)
  const labels = useMemo(() => ({ a: labelA, b: labelB }), [])
  return (
    <div className="relative size-full">
      <Canvas
        dpr={[1, compact ? 1.25 : 1.75]}
        camera={{ position: [0, 40, 30], fov: 40, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
        aria-hidden
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 30, 70]} />
        <hemisphereLight args={['#c9cdc4', '#0e0f0e', 0.45]} />
        <directionalLight position={[-6, 10, 4]} intensity={0.8} color="#f1efe6" />
  
        <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#121412" roughness={1} />
        </mesh>
        <Grid
          position-y={0.002}
          infiniteGrid
          cellSize={STEP}
          sectionSize={STEP * 4}
          cellColor="#1c1f1c"
          sectionColor="#2c302c"
          cellThickness={0.6}
          sectionThickness={1}
          fadeDistance={90}
          fadeStrength={1.4}
        />
  
        <City />
        <Route distance={distance} surge={surge} reduced={reduced} labels={labels} />
        <CameraRig reduced={reduced} compact={compact} />
  
        {!compact && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
            <Vignette offset={0.25} darkness={0.75} />
          </EffectComposer>
        )}
      </Canvas>
      <div ref={labelA} aria-hidden className="pointer-events-none absolute top-0 left-0 z-[1] opacity-0">
        <span className="flex size-6 items-center justify-center rounded-full bg-paper text-[11px] font-medium text-ink">
          A
        </span>
      </div>
      <div ref={labelB} aria-hidden className="pointer-events-none absolute top-0 left-0 z-[1] opacity-0">
        <span className="flex h-6 items-center gap-1.5 rounded-full bg-paper pr-2.5 pl-1 text-[11px] whitespace-nowrap text-ink">
          <span className="flex size-4 items-center justify-center rounded-full bg-ink text-[10px] font-medium text-paper">
            B
          </span>
          <span className="font-mono tabular-nums">{distance.toFixed(2)} mi</span>
        </span>
      </div>
    </div>
  )
}
