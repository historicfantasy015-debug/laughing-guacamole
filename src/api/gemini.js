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
      const response = result.response.text().trim();

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
  const { question_statement, options, question_type, answer } = question;

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
        if (optionsArray.length === 0) {
          console.warn('No options found for MCQ question, marking as wrong');
          return true;
        }

        prompt = `You are a strict academic question validator. Your job is to verify if this Multiple Choice Question (MCQ) is CORRECTLY formulated with EXACTLY ONE correct answer.

Question: ${question_statement}

Options:
${optionsArray.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

CRITICAL VALIDATION RULES FOR MCQ:
1. An MCQ must have EXACTLY ONE correct answer. If there are ZERO correct answers OR MORE THAN ONE correct answer, it is WRONG.
2. Solve the question completely and rigorously using proper academic methods.
3. Verify each option carefully - check if it's correct or incorrect.
4. Count how many options are correct.
5. The question is WRONG if:
   - No correct answer exists in the options
   - More than one option is correct
   - The question statement is ambiguous, unclear, or contains errors
   - The question is unsolvable with the given information
   - Options contain errors or are poorly worded
   - The correct mathematical/scientific answer is NOT present in the options
6. The question is CORRECT only if:
   - Exactly ONE option is the correct answer
   - The question is clearly stated and solvable
   - All options are properly formatted
   - The correct answer is definitively present

RESPONSE FORMAT:
Line 1: "VERDICT: CORRECT" or "VERDICT: WRONG"
Line 2: "CORRECT_OPTIONS_COUNT: [number]"
Line 3-5: Brief explanation of your reasoning

Your response:`;

        const mcqResponse = await makeGeminiRequest(prompt);
        console.log('MCQ Response:', mcqResponse);

        const lines = mcqResponse.split('\n');
        const verdictLine = lines.find(l => l.includes('VERDICT:'));
        const countLine = lines.find(l => l.includes('CORRECT_OPTIONS_COUNT:'));

        if (countLine) {
          const match = countLine.match(/CORRECT_OPTIONS_COUNT:\s*(\d+)/i);
          if (match) {
            const correctCount = parseInt(match[1]);
            if (correctCount !== 1) {
              console.log(`MCQ marked as WRONG: Found ${correctCount} correct options instead of exactly 1`);
              return true;
            }
          }
        }

        const isWrong = verdictLine && verdictLine.toUpperCase().includes('WRONG');
        return isWrong;

      case "MSQ":
        if (optionsArray.length === 0) {
          console.warn('No options found for MSQ question, marking as wrong');
          return true;
        }

        prompt = `You are a strict academic question validator. Your job is to verify if this Multiple Select Question (MSQ) is CORRECTLY formulated with AT LEAST ONE correct answer.

Question: ${question_statement}

Options:
${optionsArray.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

CRITICAL VALIDATION RULES FOR MSQ:
1. An MSQ can have one or more correct answers (but at least ONE must be correct).
2. Solve the question completely and rigorously using proper academic methods.
3. Verify each option carefully - check if it's correct or incorrect.
4. Count how many options are correct.
5. The question is WRONG if:
   - No correct answer exists in the options
   - The question statement is ambiguous, unclear, or contains errors
   - The question is unsolvable with the given information
   - Options contain errors or are poorly worded
   - The mathematically/scientifically correct answers are NOT present in the options
6. The question is CORRECT only if:
   - At least one option is correct
   - The question is clearly stated and solvable
   - All options are properly formatted
   - All correct answers are definitively present

RESPONSE FORMAT:
Line 1: "VERDICT: CORRECT" or "VERDICT: WRONG"
Line 2: "CORRECT_OPTIONS_COUNT: [number]"
Line 3-5: Brief explanation of your reasoning

Your response:`;

        const msqResponse = await makeGeminiRequest(prompt);
        console.log('MSQ Response:', msqResponse);

        const msqLines = msqResponse.split('\n');
        const msqVerdictLine = msqLines.find(l => l.includes('VERDICT:'));
        const msqCountLine = msqLines.find(l => l.includes('CORRECT_OPTIONS_COUNT:'));

        if (msqCountLine) {
          const match = msqCountLine.match(/CORRECT_OPTIONS_COUNT:\s*(\d+)/i);
          if (match) {
            const correctCount = parseInt(match[1]);
            if (correctCount === 0) {
              console.log(`MSQ marked as WRONG: Found 0 correct options`);
              return true;
            }
          }
        }

        const msqIsWrong = msqVerdictLine && msqVerdictLine.toUpperCase().includes('WRONG');
        return msqIsWrong;

      case "NAT":
        prompt = `You are a strict academic question validator. Your job is to verify if this Numerical Answer Type (NAT) question is CORRECTLY formulated.

Question: ${question_statement}

CRITICAL VALIDATION RULES FOR NAT:
1. Solve the question completely using rigorous mathematical/scientific methods.
2. Verify that a specific numerical answer can be calculated.
3. The question is WRONG if:
   - The question is ambiguous or unclear
   - Missing critical information needed to solve
   - Contains mathematical/scientific errors
   - Cannot be solved to get a specific numerical value
   - The solution requires assumptions not stated in the question
   - Units are inconsistent or missing when required
4. The question is CORRECT only if:
   - Can be solved to get a specific numerical answer
   - All necessary information is provided
   - Question is clearly stated
   - Mathematically/scientifically sound

RESPONSE FORMAT:
Line 1: "VERDICT: CORRECT" or "VERDICT: WRONG"
Line 2: "NUMERICAL_ANSWER: [your calculated answer]" (if solvable)
Line 3-5: Brief explanation of your reasoning

Your response:`;

        const natResponse = await makeGeminiRequest(prompt);
        console.log('NAT Response:', natResponse);

        const natLines = natResponse.split('\n');
        const natVerdictLine = natLines.find(l => l.includes('VERDICT:'));
        const natIsWrong = natVerdictLine && natVerdictLine.toUpperCase().includes('WRONG');
        return natIsWrong;

      case "SUB":
      case "Subjective":
        prompt = `You are a strict academic question validator. Your job is to verify if this Subjective question is CORRECTLY formulated.

Question: ${question_statement}

CRITICAL VALIDATION RULES FOR SUBJECTIVE:
1. Analyze if the question is clearly stated and answerable.
2. Check if sufficient information is provided for a complete answer.
3. The question is WRONG if:
   - The question is ambiguous, vague, or unclear
   - Missing critical context or information
   - Contains errors or contradictions
   - Too broad or impossible to answer definitively
   - Poorly worded or grammatically incorrect
4. The question is CORRECT only if:
   - Clearly stated and unambiguous
   - Can be answered with a coherent explanation/proof
   - All necessary context is provided
   - Academically sound and meaningful

RESPONSE FORMAT:
Line 1: "VERDICT: CORRECT" or "VERDICT: WRONG"
Line 2-4: Brief explanation of your reasoning

Your response:`;

        const subResponse = await makeGeminiRequest(prompt);
        console.log('SUB Response:', subResponse);

        const subLines = subResponse.split('\n');
        const subVerdictLine = subLines.find(l => l.includes('VERDICT:'));
        const subIsWrong = subVerdictLine && subVerdictLine.toUpperCase().includes('WRONG');
        return subIsWrong;

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
