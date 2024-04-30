var fs = require('fs');

async function getCaption(filename) {
	const data = fs.readFileSync(filename);
	const response = await fetch(
		"https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: data,
		}
	);
	const result = await response.json();
	return result;
}

module.exports = getCaption;
