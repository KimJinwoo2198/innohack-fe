import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createVoiceSession,
  VOICE_SESSION_METADATA_DEFAULT,
} from "../services/voiceAssistant";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const STATUS = {
  IDLE: "idle",
  ACQUIRING_MEDIA: "acquiring_media",
  REQUESTING_SESSION: "requesting_session",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTING: "disconnecting",
  ERROR: "error",
};

function useStableCallback(fn) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  return useCallback((...args) => fnRef.current?.(...args), []);
}

export function useVoiceAssistant({
  accessToken = null,
  defaultInstructions,
  metadata: metadataOverride,
} = {}) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [iceState, setIceState] = useState("new");
  const [mediaPermission, setMediaPermission] = useState("unknown");
  const [transcripts, setTranscripts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);

  const abortControllerRef = useRef();
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioElementRef = useRef(null);
  const dataChannelRef = useRef(null);
  const secretRef = useRef(null);
  const transcriptsMapRef = useRef(new Map());

  const metadata = useMemo(() => {
    return {
      ...VOICE_SESSION_METADATA_DEFAULT,
      ...(metadataOverride || {}),
    };
  }, [metadataOverride]);

  const updateTranscript = useStableCallback((id, updater) => {
    setTranscripts((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.id === id);
      const current =
        index >= 0 ? next[index] : { id, role: "assistant", text: "" };
      const updated = updater(current);
      if (index >= 0) {
        next[index] = updated;
      } else {
        next.push(updated);
      }
      transcriptsMapRef.current.set(id, updated);
      return next;
    });
  });

  const resetTranscripts = useCallback(() => {
    transcriptsMapRef.current.clear();
    setTranscripts([]);
  }, []);

  const attachRemoteAudio = useCallback((audioElement) => {
    remoteAudioElementRef.current = audioElement;
    if (audioElement && remoteStreamRef.current) {
      audioElement.srcObject = remoteStreamRef.current;
      const playPromise = audioElement.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch (_) {
        /* noop */
      }
    }
    dataChannelRef.current = null;

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.ondatachannel = null;
        peerConnectionRef.current.close();
      } catch (_) {
        /* noop */
      }
    }
    peerConnectionRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {
          /* noop */
        }
      });
    }
    localStreamRef.current = null;

    remoteStreamRef.current = null;
    if (remoteAudioElementRef.current) {
      remoteAudioElementRef.current.srcObject = null;
    }
    setIceState("new");
  }, []);

  const handleDataChannelMessage = useStableCallback((event) => {
    let payload;
    setLastEvent(() => {
      try {
        payload = JSON.parse(event.data);
      } catch (err) {
        payload = { raw: event.data };
      }
      return payload;
    });

    if (!payload) {
      return;
    }

    const extractResponseId = () => {
      return (
        payload?.response?.id ||
        payload?.id ||
        payload?.response_id ||
        payload?.item?.id ||
        payload?.message?.id ||
        crypto.randomUUID()
      );
    };

    const responseId = extractResponseId();

    if (payload.type === "response.created") {
      updateTranscript(responseId, (current) => ({
        ...current,
        id: responseId,
        role: payload?.response?.role || "assistant",
        text: current.text || "",
        finalized: false,
      }));
      return;
    }

    if (payload.type === "response.completed") {
      updateTranscript(responseId, (current) => ({
        ...current,
        finalized: true,
      }));
      return;
    }

    const candidates = [
      payload?.delta?.content,
      payload?.message?.delta?.content,
      payload?.content,
    ].filter(Boolean);

    candidates.flat().forEach((item) => {
      if (!item) return;
      if (item.type === "output_text_delta" && item.text) {
        updateTranscript(responseId, (current) => ({
          ...current,
          text: `${current.text || ""}${item.text}`,
        }));
      }
      if (item.type === "output_text" && item.text) {
        updateTranscript(responseId, (current) => ({
          ...current,
          text: item.text,
          finalized: true,
        }));
      }
    });
  });

  const disconnect = useCallback(() => {
    if (
      status !== STATUS.CONNECTED &&
      status !== STATUS.CONNECTING &&
      status !== STATUS.ERROR
    ) {
      cleanupMedia();
      setSession(null);
      resetTranscripts();
      setStatus(STATUS.IDLE);
      return;
    }

    setStatus(STATUS.DISCONNECTING);
    cleanupMedia();
    setSession(null);
    resetTranscripts();
    setStatus(STATUS.IDLE);
  }, [cleanupMedia, resetTranscripts, status]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      cleanupMedia();
    };
  }, [cleanupMedia]);

  const connect = useCallback(
    async ({
      instructions = defaultInstructions,
      metadata: metadataOverrideArg,
    } = {}) => {
      if (status === STATUS.CONNECTED || status === STATUS.CONNECTING) {
        return;
      }

      setError(null);
      resetTranscripts();

      setStatus(STATUS.ACQUIRING_MEDIA);
      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        setMediaPermission("granted");
      } catch (err) {
        setMediaPermission("denied");
        setStatus(STATUS.ERROR);
        setError(err);
        throw err;
      }
      localStreamRef.current = localStream;

      setStatus(STATUS.REQUESTING_SESSION);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let rawSession;
      try {
        rawSession = await createVoiceSession({
          accessToken,
          metadata: {
            ...metadata,
            ...(metadataOverrideArg || {}),
          },
          instructions,
          signal: controller.signal,
        });
      } catch (err) {
        setError(err);
        setStatus(STATUS.ERROR);
        cleanupMedia();
        throw err;
      } finally {
        abortControllerRef.current = null;
      }

      secretRef.current = rawSession?.client_secret?.value ?? null;
      const sanitizedSession = {
        ...rawSession,
        client_secret: rawSession?.client_secret
          ? { ...rawSession.client_secret, value: undefined }
          : undefined,
      };
      setSession(sanitizedSession);

      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      peerConnectionRef.current = pc;

      setStatus(STATUS.CONNECTING);

      pc.oniceconnectionstatechange = () => {
        setIceState(pc.iceConnectionState);
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          setStatus(STATUS.ERROR);
          setError(
            buildError("WebRTC 연결이 종료되었습니다.", {
              iceConnectionState: pc.iceConnectionState,
            })
          );
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;
        remoteStreamRef.current = remoteStream;
        if (remoteAudioElementRef.current) {
          remoteAudioElementRef.current.srcObject = remoteStream;
          const playPromise = remoteAudioElementRef.current.play();
          if (playPromise) {
            playPromise.catch(() => {});
          }
        }
      };

      pc.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannelRef.current = channel;
        channel.onmessage = handleDataChannelMessage;
      };

      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);

        const answerResponse = await fetch(rawSession.webrtc_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
            Authorization: `Bearer ${secretRef.current}`,
          },
          body: offer.sdp ?? "",
        });

        if (!answerResponse.ok) {
          const text = await answerResponse.text();
          throw buildError("OpenAI Realtime SDP 교환에 실패했습니다.", text);
        }

        const answerSdp = await answerResponse.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        secretRef.current = null;
        setStatus(STATUS.CONNECTED);
      } catch (err) {
        secretRef.current = null;
        cleanupMedia();
        setError(err);
        setStatus(STATUS.ERROR);
        throw err;
      }
    },
    [
      accessToken,
      cleanupMedia,
      defaultInstructions,
      handleDataChannelMessage,
      metadata,
      resetTranscripts,
      status,
    ]
  );

  const isConnecting =
    status === STATUS.ACQUIRING_MEDIA ||
    status === STATUS.REQUESTING_SESSION ||
    status === STATUS.CONNECTING;

  const localStreamActive = Boolean(
    localStreamRef.current &&
      localStreamRef.current.getTracks().some((track) => track.readyState === "live")
  );
  const remoteStreamActive = Boolean(
    remoteStreamRef.current &&
      remoteStreamRef.current.getTracks().some((track) => track.readyState === "live")
  );

  return {
    status,
    error,
    session,
    iceState,
    mediaPermission,
    transcripts,
    lastEvent,
    connect,
    disconnect,
    resetTranscripts,
    attachRemoteAudio,
    isConnecting,
    localStreamActive,
    remoteStreamActive,
  };
}

function buildError(message, details) {
  const error = new Error(message);
  if (details !== undefined) {
    error.details = details;
  }
  return error;
}

