import React, { useState } from "react";
import axios from 'axios';

const AudioRecord = () => {
  const [stream, setStream] = useState();
  const [media, setMedia] = useState();
  const [onRec, setOnRec] = useState(true);
  const [source, setSource] = useState();
  const [analyser, setAnalyser] = useState();
  const [audioUrl, setAudioUrl] = useState();
  const [disabled, setDisabled] =  useState(true);
  const [title, setTitle] = useState("");

  // 주제 입력
  const handleTitle = (e) => {
    setTitle(e.target.value);
  }

  // 녹음 실행
  const onRecAudio = () => {
    // 음원정보를 담은 노드를 생성, 음원 실행, 디코딩
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createScriptProcessor(0, 1, 1);
    setAnalyser(analyser);

    function makeSound(stream) {
      const source = audioCtx.createMediaStreamSource(stream);
      setSource(source);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    // 마이크 사용 권한
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      setStream(stream);
      setMedia(mediaRecorder);
      makeSound(stream);

      analyser.onaudioprocess = function (e) {
        // 제한시간 설정. 10분 지나면 녹음 중지
        if (e.playbackTime > 6000) {
          stream.getAudioTracks().forEach(function (track) {
            track.stop();
          });
          mediaRecorder.stop();
          // 메서드를 호출하는 노드 연결 해제
          analyser.disconnect();
          audioCtx.createMediaStreamSource(stream).disconnect();

          mediaRecorder.ondataavailable = function (e) {
            setAudioUrl(e.data);
            setOnRec(true);
          };
        } else {
          setOnRec(false);
        }
      };
    });
  };

  // 녹음 중지
  const offRecAudio = () => {
    // Blob 데이터에 대한 응답을 받을 수 있음
    media.ondataavailable = function (e) {
      setAudioUrl(e.data);
      setOnRec(true);
    };

    stream.getAudioTracks().forEach(function (track) { // 모든 트랙에서 반복
      track.stop(); // stop()을 통해 오디오 스트림 정지
    });

    media.stop(); // 미디어 캡처 중지
    analyser.disconnect(); // 메서드가 호출 된 노드 연결 해제
    source.disconnect();
    
    if (audioUrl) {
      URL.createObjectURL(audioUrl); // 오디오를 확인할 수 있는 링크
    }
    
    // 콘솔 출력용 코드. 나중에 삭제
    const sound = new File([audioUrl], "soundBlob", {
      lastModified: new Date().getTime(),
      type: "audio",
    });

    setDisabled(false);
    console.log(sound); // File 정보 출력
  };

  // 녹음된 파일 재생
  const play = ()=>{
      const audio = new Audio(URL.createObjectURL(audioUrl)); 
      audio.loop = false;
      audio.volume = 1;
      audio.play();
  };


  // 녹음 파일을 서버로 전송
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    // File 생성자를 사용해 파일로 변환
    const file = new File([audioUrl], "soundBlob", { lastModified: new Date().getTime(), type: "audio" });
    formData.append("file", file);

    // 서버에 post 요청
    axios
      .post("/api/files-test", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params:{
          title: title,
        },
      })
      .then((response) => {
        // 응답 처리
        console.log("요청 성공");
        console.log(response);
      })
      .catch((error) => {
        // 예외 처리
        console.log("요청 실패");
        console.log(error);
      }
      );
    }
  return (
    <>
      <input type="text" name="title" placeholder="주제를 입력해주세요." value={title} onChange={handleTitle} /> <br></br>
      <button onClick={onRec ? onRecAudio : offRecAudio}>녹음</button>
      <button onClick={play} disabled={disabled}>재생</button>
      <form onSubmit={handleSubmit}>
        <button type="submit" onChange={handleSubmit}>업로드</button>
      </form>
    </>
  );
};

export default AudioRecord;