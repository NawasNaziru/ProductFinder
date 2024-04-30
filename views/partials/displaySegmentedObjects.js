var displaySegmentedObjects = function(imageBuffer, boundingBoxes) {
    // Create a new HTML div element for each bounding box.
    const divs = boundingBoxes.map((boundingBox) => {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = boundingBox.BoundingBox.Left + 'px';
      div.style.top = boundingBox.BoundingBox.Top + 'px';
      div.style.width = boundingBox.BoundingBox.Width + 'px';
      div.style.height = boundingBox.BoundingBox.Height + 'px';
      div.style.border = '1px solid black';
      return div;
    });
  
    // Create a new HTML canvas element for each bounding box.
    const canvases = boundingBoxes.map((boundingBox) => {
      const canvas = document.createElement('canvas');
      canvas.width = boundingBox.BoundingBox.Width;
      canvas.height = boundingBox.BoundingBox.Height;
      return canvas;
    });
  
    // Draw the object from the image buffer onto each canvas.
    canvases.forEach((canvas, i) => {
      const context = canvas.getContext('2d');
      context.putImageData(imageBuffer, boundingBoxes[i].BoundingBox.Left, boundingBoxes[i].BoundingBox.Top);
    });
  
    // Store the object images divs in a variable.
    const objectImagesDivs = divs.map((div, i) => {
      div.appendChild(canvases[i]);
      return div;
    });
  
    // Return the object images divs.
    return objectImagesDivs;
  }