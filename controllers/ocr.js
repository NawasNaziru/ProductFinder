async function ocr(filename) {
    const data = fs.readFileSync(filename);
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const response = await fetch(
        "https://api-inference.huggingface.co/models/jinhybr/OCR-Donut-CORD",
        {
            headers: { Authorization: `Bearer ${apiKey}` },
            method: "POST",
            body: data,
        }
    );
    const result = await response.json();
    return result;
}

function extractTextFromOcrResponse(ocrResponse) {
    const regex = /<[^>]*>/g;
    let extractedText = ocrResponse[0]["generated_text"].replace(regex, '');
    return extractedText;
}

