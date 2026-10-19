import {OpenAICompatibleLanguageModel} from "../models/language.js";
export function modelConfiguration() {
  const baseURL =
    process.env.OMNIPRESENT_LLM_BASE_URL ?? "http://127.0.0.1:11434/v1";
  const model = process.env.OMNIPRESENT_LLM_MODEL ?? "qwen3.5:4b";
  const url = new URL(baseURL);
  if (!["http:", "https:"].includes(url.protocol))
    throw Error("Invalid model endpoint");
  return {
    baseURL,
    model,
    local: ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname),
  };
}
export function localModel() {
  const c = modelConfiguration();
  return new OpenAICompatibleLanguageModel("preparation",{...c,apiKey:process.env.OMNIPRESENT_LLM_API_KEY}).create();
}
