import { FliptEvaluationClient } from '@flipt-io/flipt-client-browser';

interface FeatureFlags {
  storeClosed: boolean
}

let fliptEvaluationClient: FliptEvaluationClient;

export async function get(key: keyof FeatureFlags) {
  if (!fliptEvaluationClient) {
    fliptEvaluationClient = await FliptEvaluationClient.init('default', {
      url: process.env.FLIPT_CLOUD_URL,
      authentication: {
        clientToken: process.env.FLIPT_CLOUD_API_KEY,
      },
    })
  }

  fliptEvaluationClient.refresh();
  const uuid = crypto.randomUUID();
  const response = fliptEvaluationClient.evaluateBoolean(key, uuid, {});

  return response.enabled
}
