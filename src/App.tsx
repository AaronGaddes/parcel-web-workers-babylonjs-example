import "@babylonjs/materials";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  HemisphericLight,
  Material,
  Mesh,
  Nullable,
  Quaternion,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3,
  ShaderStore
} from "@babylonjs/core";
import SceneComponent from "./components/SceneComponent";
import { useCallback, useRef } from "react";
import { MarchingCubes } from "./algorithms/marchingCubes";

const SceneWrapper = () => {

  const sceneRef = useRef<Scene>();

  const onSceneReady = (scene: Scene) => {
    // This creates and positions a free camera (non-mesh)
    sceneRef.current = scene;
    const radius = 20;
    var camera = new ArcRotateCamera(
      "arc",
      -Math.PI,
      Math.PI / 6,
      radius * 3,
      Vector3.Zero(),
      scene
    )
    camera.minZ = 0.1
    camera.maxZ = radius * 10
    camera.wheelPrecision = 50
    camera.lowerRadiusLimit = radius * 1.5
    camera.upperRadiusLimit = radius * 3
    camera.allowUpsideDown = true
    camera.updateUpVectorFromRotation = true

    const canvas = scene.getEngine().getRenderingCanvas();
    // if (process.env.NODE_ENV === "development") {
    //   scene.debugLayer.show({embedMode: true, globalRoot: document.getElementById("root") || undefined})
    // }

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    // var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // // Default intensity is 1. Let's dim the light a small amount
    // light.intensity = 0.7;


    const mainLight = new DirectionalLight(
      "main-light",
      Vector3.Down(),
      scene,
    );
      mainLight.setDirectionToTarget(Vector3.Zero());
      mainLight.position = Vector3.Up().scaleInPlace(radius * 3);
      mainLight.intensity = 0.85;
      mainLight.shadowMinZ = radius;
      mainLight.shadowMaxZ = radius * 3;

    const ambiantLight = new HemisphericLight(
      'ambiant-light',
      Vector3.Up(),
      scene,
    )
    ambiantLight.groundColor = Color3.White()
    ambiantLight.intensity = 0.2

    const cubes = new MarchingCubes(100, 20, scene);
    const water = Mesh.CreateSphere("water", 32, 20 * 2, scene);
    const waterMat = new StandardMaterial("waterMat", scene);
    waterMat.diffuseColor = Color3.Blue();
    water.material = waterMat;

  };

  /**
   * Will run on every frame render.  We are spinning the box on y-axis.
   */

  const onRender = (scene: Scene) => {
    // console.log(scene.getAnimationRatio());
  };

  const handleShowInspector = useCallback(() => {
    const debugLayer = sceneRef.current?.debugLayer;
    // bjInspector.Inspector.Show(sceneRef.current, {});
    // if (sceneRef.current) {
    //   const db = new DebugLayer(sceneRef.current)
    //   db.show({embedMode: true, globalRoot: document.getElementById("root") || undefined});
    // }
    !debugLayer?.isVisible() ? debugLayer?.show({embedMode: true, globalRoot: document.getElementById("root") || undefined, inspectorURL: "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@5.0.0-beta.6/dist/inspector/babylon.inspector.bundle.js"}) : debugLayer?.hide();
  }, []);
  
  return (
    <>
      <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} observeCanvasResize={true} canvasId="sample-canvas" />
      <div className="topButtons">
        <button
          onClick={handleShowInspector}
        >
          Toggle Inspector
        </button>
      </div>
    </>
)}

export function App() {
  return (
    <SceneWrapper />
  );
}