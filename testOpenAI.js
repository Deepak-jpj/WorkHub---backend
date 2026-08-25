require("dotenv").config();

const OpenAI = require("openai");

console.log(
  "API KEY LOADED:",
  process.env.OPENAI_API_KEY
    ? "YES"
    : "NO"
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function test() {

  try {

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: "Say hello in one short sentence."
    });

    console.log("================================");
    console.log("OPENAI SUCCESS");
    console.log("================================");
    console.log(response.output_text);

  } catch (error) {

    console.log("================================");
    console.log("OPENAI FAILED");
    console.log("================================");

    console.log("Message:", error.message);
    console.log("Status:", error.status);
    console.log("Code:", error.code);
    console.log("Type:", error.type);

  }

}

test();