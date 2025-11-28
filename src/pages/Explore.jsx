import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Footer from "../components/Footer";
import Photo from "../assets/photo.svg";
import Camera from "../assets/camera.svg";
import { basePost } from "../services/_base";

const FOOD_RECOGNITION_ENDPOINT = "https://innohack.kimjinwoo.me/api/v1/vision/foods/recognize/";
const MIN_IMAGE_LENGTH = 100;

export default function Explore() {
  const navigate = useNavigate();
  const webcamRef = useRef();
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const userWeek = 20;
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(false);
  const [shouldUseNativeCapture, setShouldUseNativeCapture] = useState(false);
  const requestRecognition = async (rawBase64, displayImage) => {
    if (typeof rawBase64 !== "string" || rawBase64.length < MIN_IMAGE_LENGTH) {
      const validationError = new Error("유효한 Base64 이미지 문자열을 입력해 주세요.");
      validationError.code = "client_invalid_image";
      console.error(validationError.message);
      throw validationError;
    }

    try {
      setLoading(true);
      const response = await basePost(
        FOOD_RECOGNITION_ENDPOINT,
        { image_base64: rawBase64 },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      navigate("/explore/result", {
        state: {
          result: response.data,
          userWeek,
          imageSrc: displayImage ?? rawBase64,
        },
      });
      return response.data;
    } catch (error) {
      const apiError = error?.response?.data?.error;
      if (apiError) {
        console.error(`[FoodRecognition] ${apiError.code}: ${apiError.message}`);
      } else {
        console.error(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasNavigator = typeof navigator !== "undefined";
    const available = hasNavigator &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";
    const isTauriEnv = typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
    const userAgent = hasNavigator ? navigator.userAgent ?? "" : "";
    const isMobileUA = /android|iphone|ipad|ipod/i.test(userAgent);
    const preferNativeCapture = Boolean(isTauriEnv && isMobileUA);
    setShouldUseNativeCapture(preferNativeCapture);
    setIsWebcamAvailable(Boolean(available && !preferNativeCapture));
  }, []);

  const handelGalleryOpen = () => {
    fileInputRef.current.click();

    fileInputRef.current.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const imageData = reader.result;
          await requestRecognition(imageData, imageData);
        } catch (_) {}
      };
    };

    fileInputRef.current.value = "";
  };

  const handelCapture = async () => {
    if (!webcamRef.current || typeof webcamRef.current.getScreenshot !== 'function') {
      return handelGalleryOpen();
    }
    const imageSrc = webcamRef.current.getScreenshot();
    try {
      await requestRecognition(String(imageSrc), imageSrc);
    } catch (_) {}
  };

  const guideFrameStyle = {
    width: "min(320px, 78vw)",
    height: "min(360px, 62vh)",
  };

  return (
    <main className="w-full h-full">
      {loading ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
          <p className="mt-4 text-lg font-semibold text-gray-700">식품을 분석하고 있어요...</p>
        </div>
      ) : null}
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
      />
      <div className="top-0 left-0 w-full h-full overflow-hidden">
        {isWebcamAvailable ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
            }}
            disablePictureInPicture={true}
            className={`absolute top-0 left-0 w-full h-full object-cover ${loading ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black ${loading ? 'opacity-60' : ''}`}>
            <p className="text-white text-center px-6">
              {shouldUseNativeCapture
                ? "타우리 앱에서는 시스템 카메라로 바로 촬영해요. 아래 촬영 버튼을 눌러 사진을 찍어주세요."
                : "이 기기에서는 카메라 미리보기를 지원하지 않아요. 아래 촬영 버튼을 눌러 사진을 찍어주세요."}
            </p>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="relative z-10 -translate-y-6 text-[24px] font-semibold tracking-tight text-[#FE7495]">
          잘 보이도록 화면에 맞춰주세요
        </p>
        <div className="relative z-0 -translate-y-2" style={guideFrameStyle}>
          <div
            className="absolute inset-0 rounded-[32px] border-[3px] border-[#FF93AE]"
            style={{
              boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(1px)",
            }}
          ></div>
          <div className="absolute inset-5 rounded-[28px] border border-white/30 opacity-70" />
        </div>
      </div>
      <div className="absolute bottom-0 mb-[15dvh] w-full">
        <div className="mx-11 flex justify-between items-center">
          <div
            className="bg-white flex items-center justify-center p-3 rounded-xl h-fit shadow-2xl cursor-pointer transform active:scale-110 transition-transform"
            onClick={handelGalleryOpen}>
            <img src={Photo} alt="사진" />
          </div>
          <div className="bg-[#FE7495] flex items-center justify-center p-5 rounded-full shadow-2xl cursor-pointer transform active:scale-110 transition-transform" onClick={handelCapture}>
            <img src={Camera} alt="카메라" />
          </div>
          <div className="opacity-0 p-3">
            <img src={Photo} alt="사진" />
          </div>
        </div>
      </div>
      <Footer className="z-50" />
    </main>
  );
}
