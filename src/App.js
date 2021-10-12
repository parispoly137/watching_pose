import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import * as tf from "@tensorflow/tfjs"; // eslint-disable-line no-unused-vars
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import { drawMesh } from './utilities';

localStorage.setItem("watching", false);

function App() {

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  let [position, setPosition] = useState();
  let [status, setStatus] = useState("right");
  let [ctx, setCtx] = useState();
  let [advise, setAdvise] = useState(false);
  let [message, setMessage] = useState("");

  useEffect(() => {
    setCtx(canvasRef.current.getContext('2d'));
  }, []);

  useEffect(() => {
    if (advise && status === "neutral")
      return setMessage("화면 중앙에 기준점을 맞춰주세요.");

    if (advise)
      return setMessage("교정하고 싶은 자세를 취하고 좌표를 저장해주세요.");

    if (!advise)
      return setMessage("감시 시작 버튼을 눌러주세요.");

  }, [advise, status]);

  useEffect(() => {
    if (ctx) {
      runFacemesh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  const runFacemesh = async () => {

    const net = await facemesh.load({
      inputResolution: { width: 640, height: 480 }, scale: 0.8
    });

    setInterval(() => {
      detect(net);
    }, 100);
  };

  const detect = async (net) => {
    let watching = localStorage.getItem("watching");

    if (watching === "true" && typeof webcamRef.current !== "undefined" && webcamRef.current !== null && webcamRef.current.video.readyState === 4) {

      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const face = await net.estimateFaces(video);

      if (ctx) {
        let result = drawMesh(face, ctx);

        setPosition(result ? result.position : null);
        setStatus(result ? result.status : null);
      }
    }
  };

  const saveRightPosition = () => {
    if (status === "right") {
      localStorage.setItem("rightPosition", JSON.stringify(position));
    }
  };

  const watch = () => {
    setAdvise(true);
    localStorage.setItem("watching", "true");
  };

  const unWatch = () => {
    setAdvise(false);
    localStorage.setItem("watching", "false");
    ctx.clearRect(0, 0, 30000, 30000);
    ctx.beginPath();
  };

  const clear = () => {
    localStorage.removeItem("rightPosition");
  };

  return (
    <div className="App"
      style={{
        backgroundColor: "#ffffd2"
      }}>
      <header
        className="App-header"
      >
        <Webcam
          ref={webcamRef}
          mirrored
        />
        <canvas className={advise ? 'canvas ' + status : 'canvas unadvise'}
          ref={canvasRef}
        />
        {message ?
          <div className="box-comment">
            {message}
          </div> : null
        }

      </header>

      <div className={'btns'}>
        {advise ?
          <button onClick={saveRightPosition}>좌표 설정</button>
          : <div disabled>좌표 설정</div>
        }
        {
          advise ? <button className={"on"} onClick={unWatch}>감시중</button>
            : <button onClick={watch}>감시 시작</button>
        }
        <button onClick={clear}>좌표 초기화</button>
      </div>
    </div>
  );
}

export default App;