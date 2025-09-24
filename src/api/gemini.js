import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCqs7TyrNn9RJPVXIXRl4GUgT957XOOxok";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

async function checkQuestionWithGemini(question) {
  const { question_statement, options, question_type } = question;
  
  // Enhanced options parsing with error handling
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
    let result;

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
5. Respond with only "WRONG" if the question is incorrectly formulated, unsolvable, or the correct answer is not among the options

Your response:`;
        
        result = await model.generateContent(prompt);
        const mcqResponse = result.response.text().trim().toUpperCase();
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
        
        result = await model.generateContent(prompt);
        const natResponse = result.response.text().trim().toUpperCase();
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
        
        result = await model.generateContent(prompt);
        const subResponse = result.response.text().trim().toUpperCase();
        return subResponse.includes("WRONG");

      default:
        console.warn(`Unknown question type: ${question_type}. Marking as wrong by default.`);
        return true;
    }
  } catch (error) {
    console.error("Error checking question with Gemini:", error);
    
    // Enhanced error handling for different types of errors
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('API quota exceeded or rate limited. Please wait before retrying.');
    } else if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error; // Re-throw to handle in the calling function
  }
}

export { checkQuestionWithGemini };