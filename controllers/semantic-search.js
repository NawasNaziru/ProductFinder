
async function query(data) {
    try {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        const response = await fetch(
            "https://api-inference.huggingface.co/models/SeyedAli/Multilingual-Text-Semantic-Search-Siamese-BERT-V1",
            {
                headers: { Authorization: `Bearer ${apiKey}` },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }
        return result;
    } catch (error) {
        console.error(`There was a problem with the fetch operation: ${error.message}`);
        return Promise.reject(error.message);
    }
}

module.exports = query;



/*async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/SeyedAli/Multilingual-Text-Semantic-Search-Siamese-BERT-V1",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}


module.exports = query;*/