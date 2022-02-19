import { Engine, EngineOptions, Scene, SceneOptions } from "@babylonjs/core";
import React, { useEffect, useRef } from "react";

export type BabylonjsProps = {
  canvasId?: string;
  antialias?: boolean
  engineOptions?: EngineOptions
  adaptToDeviceRatio?: boolean
  renderChildrenWhenReady?: boolean
  sceneOptions?: SceneOptions
  onSceneReady: (scene: Scene) => void
  /**
   * Automatically trigger engine resize when the canvas resizes (default: true)
   */
  observeCanvasResize?: boolean
  onRender?: (scene: Scene) => void
  children?: React.ReactNode
};

const SceneComponent = (props: BabylonjsProps) => {
  const reactCanvas = useRef(null);
  const { canvasId, antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady, observeCanvasResize, ...rest } = props;

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, antialias, engineOptions, adaptToDeviceRatio);
      const scene = new Scene(engine, sceneOptions);
      if (scene.isReady()) {
        props.onSceneReady(scene);
      } else {
        scene.onReadyObservable.addOnce((scene) => props.onSceneReady(scene));
      }

      engine.runRenderLoop(() => {
        if (typeof onRender === "function") {
          onRender(scene);
        }
        scene.render();
      });

      const resize = () => {
        scene.getEngine().resize();
      };

      if (window && observeCanvasResize) {
        window.addEventListener("resize", resize);
      }

      return () => {
        scene.getEngine().dispose();

        if (window && observeCanvasResize) {
          window.removeEventListener("resize", resize);
        }
      };
    }
  }, [adaptToDeviceRatio, antialias, engineOptions, onRender,  observeCanvasResize, props, reactCanvas, sceneOptions]);

  return <canvas id={canvasId} ref={reactCanvas} {...rest} />;
};

export default SceneComponent;