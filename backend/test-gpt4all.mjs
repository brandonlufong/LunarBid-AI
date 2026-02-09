import gpt4all from "gpt4all";

const model = await gpt4all.create({
  model: "mistral-7b-instruct",
  verbose: true
});

const response = await model.generate(
  "Write a short professional freelance proposal for a web developer job."
);

console.log(response);

await model.dispose();
