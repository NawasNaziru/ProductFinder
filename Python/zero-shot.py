from flask import Flask, request, jsonify
from PIL import Image
from io import BytesIO
from transformers import pipeline
import base64

app = Flask(__name__)

def base64_to_image(base64_str):
    # Decode the base64 string to bytes
    image_bytes = base64.b64decode(base64_str)

    # Convert the bytes to a PIL Image object
    image = Image.open(BytesIO(image_bytes))

    return image

@app.route('/detect_objects', methods=['POST'])
def detect_objects():
    # Load the base64 image data from the POST request
    image_data = request.json['image']
    image = base64_to_image(image_data)

    # Load the candidate labels from the POST request

    candidate_labels = request.json['labels']

    # Set up the object detection pipeline
    checkpoint = "google/owlvit-base-patch32"
    detector = pipeline(model=checkpoint, task="zero-shot-object-detection")

    # Run the object detection pipeline on the image
    predictions = detector(image, candidate_labels=candidate_labels)

    # Extract the bounding boxes from the predictions
    bounding_boxes = [prediction['box'] for prediction in predictions]

    # Return the bounding boxes as a JSON response
    return jsonify(bounding_boxes)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
