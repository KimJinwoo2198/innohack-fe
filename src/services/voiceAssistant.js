import { basePost } from "./_base";

function buildError(message, payload) {
  const error = new Error(message);
  if (payload) {
    error.details = payload;
  }
  return error;
}

const VOICE_SESSION_ENDPOINT = "/api/voice/sessions/";

export async function createVoiceSession({
  accessToken,
  metadata,
  instructions,
  signal,
}) {
  const headers = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined;

  let payload;
  try {
    const response = await basePost(
      VOICE_SESSION_ENDPOINT,
      {
        metadata,
        instructions,
      },
      {
        signal,
        headers,
      }
    );
    payload = response.data;
  } catch (error) {
    if (error?.code === "ERR_CANCELED") {
      throw error;
    }
    const status = error?.response?.status ?? "unknown";
    const details = error?.response?.data ?? error?.message;
    throw buildError(
      `실시간 세션 생성에 실패했습니다. (status: ${status})`,
      details
    );
  }

  if (!payload?.client_secret?.value || !payload?.webrtc_url) {
    throw buildError("세션 응답이 올바르지 않습니다.", payload);
  }

  return payload;
}

export const VOICE_SESSION_METADATA_DEFAULT = {
  client: "web",
  clientVersion: "1.0.0",
  locale: "ko-KR",
};

