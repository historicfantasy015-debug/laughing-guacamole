import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
  "AIzaSyB9QDIoLmfWnQI9Qy9PXGeeNvNyESLWMr0",
  "AIzaSyAAk-o1ZQIxHos0ixXdm59qt8jOOEsc_0M",
  "AIzaSyBZcxKcFkMLUBXtYRp5UHoXwGB5mQ1MJVI",
  "AIzaSyDc60zrn69_ofEXMdU4gCOT5QUphrPgiBM",
  "AIzaSyAmh6oy770fHumwmpE7_tyT1cjwiV4jtcA",
  "AIzaSyAIb8_yMe4eBJi0zM-ltIr36VpbIYBrduE",
  "AIzaSyDtYCBEUhsJQoOYtT8AUOHGlicNYyyvdZw",
  "AIzaSyD4C7drU0i3yg9vCx_UyN1kgYaNWnV3K4E",
  "AIzaSyCLaG3KK6BpziM1Uj57Ja9GfnOnqi1o4s8",
  "AIzaSyBHBIe0n4-7tCjfPsRVgNYgUQOznFHfMHw"
];

let currentKeyIndex = 0;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6500;

function getNextAPIKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${Math.ceil(waitTime / 1000)}s before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

async function makeGeminiRequest(prompt, maxRetries = API_KEYS.length) {
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await waitForRateLimit();

      const apiKey = getNextAPIKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      console.log(`Attempt ${attempt + 1}/${maxRetries} with API key #${currentKeyIndex}`);

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim().toUpperCase();

      return response;

    } catch (error) {
      lastError = error;
      console.warn(`API key #${currentKeyIndex} failed:`, error.message);

      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.log(`API key #${currentKeyIndex} hit rate limit, switching to next key...`);
        continue;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`All API keys exhausted. Last error: ${lastError?.message || 'Unknown error'}`);
}

async function checkQuestionWithGemini(question) {
  const { question_statement, options, question_type } = question;

  let optionsArray = [];
  try {
    if (Array.isArray(options)) {
      optionsArray = options;
    } else if (typeof options === 'string') {
      if (options.trim().startsWith('[')) {
        optionsArray = JSON.parse(options);
      } else {
        optionsArray = [options];
      }
    } else if (options) {
      optionsArray = [String(options)];
    }
  } catch (parseError) {
    console.warn('Error parsing options, using as single option:', parseError);
    optionsArray = [String(options || '')];
  }

  try {
    let prompt = "";

    switch (question_type) {
      case "MCQ":
      case "MSQ":
        if (optionsArray.length === 0) {
          console.warn('No options found for MCQ/MSQ question, marking as wrong');
          return true;
        }

        prompt = `You are an expert question validator. Analyze this multiple-choice question and determine if it's correctly formulated.

Question: ${question_statement}

Options:
${optionsArray.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

Instructions:
1. Solve the question step by step
2. Determine the correct answer(s)
3. Check if the correct answer(s) exist among the given options
4. Respond with only "CORRECT" if the question is properly formulated and has the right answer(s) in the options
5. Respond with only "WRONG" if the question is incorrectly formulated, unsolvable, or the correct answer is not among the options strictly don't give approximations if you think it's genuine answer belongs in these options then only validate that question 

Your response:`;

        const mcqResponse = await makeGeminiRequest(prompt);
        return mcqResponse.includes("WRONG");

      case "NAT":
        prompt = `You are an expert question validator. Analyze this numerical answer type question.

Question: ${question_statement}

Instructions:
1. Solve the question step by step
2. Determine if the question has a valid numerical answer
3. Check if the question is properly formulated for numerical response
4. Respond with only "CORRECT" if the question is properly formulated and has a valid numerical answer
5. Respond with only "WRONG" if the question is incorrectly formulated, unsolvable, or doesn't have a numerical answer

Your response:`;

        const natResponse = await makeGeminiRequest(prompt);
        return natResponse.includes("WRONG");

      case "SUB":
      case "Subjective":
        prompt = `You are an expert question validator. Analyze this subjective question.

Question: ${question_statement}

Instructions:
1. Analyze if the question is clearly stated and answerable
2. Check if a coherent proof or detailed answer can be constructed
3. Determine if the question has sufficient information for a complete response
4. Respond with only "CORRECT" if the question is properly formulated and answerable
5. Respond with only "WRONG" if the question is ambiguous, ill-posed, or cannot be answered properly

Your response:`;

        const subResponse = await makeGeminiRequest(prompt);
        return subResponse.includes("WRONG");

      default:
        console.warn(`Unknown question type: ${question_type}. Marking as wrong by default.`);
        return true;
    }
  } catch (error) {
    console.error("Error checking question with Gemini:", error);
    throw error;
  }
}

export { checkQuestionWithGemini };
