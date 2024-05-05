**ABOUT**

We are a small company that solves the issue of in-person buyers finding it difficult to locate what they want to buy from physical stores that have no online presence. We use AI from products data collection to helping buyers locate products they want to buy.

**HOW IT WORKS**

 **•Data collection**

Our hired professional data collectors go to sellers shops and capture their products images. Do they need to take the picture of each and every product? That's where image segmentation AI model comes to the rescue. A data collector can group more than one product and snap them at once to be segmented/cropped into the various individual products images saving our time and reducing the boredom of the task on the data collector. In addition to the products images, a data collector also collects the name, phone number and address of the seller among other information saved in a text file with the name of the seller. Both the text file and the products images are saved in a folder with the name of the seller as the folder name.

 **•Image Segmentation**

With products images of various sellers at hand, it is now the job of the market agent/operator. With a click of a button, he/she first loads into the app, a chosen seller folder whose products are to be added to the system. Next, he/she picks an image of choice from the loaded seller products images and click on the segment button. On clicking the segment button, the image is sent to an image segmentation machine learning model which responds with the bounding boxes information of all the individual products/items in the image These bounding boxes information are used to cut out the individual items images from the original image and are saved in a folder named “extracted” in the app root directory. If the image consist of just one product, then no need of the segmentation stage and instead, the operator directly cuts and paste the image into the folder titled “extracted” which is where all the segmented/cropped images go to. As no any  image segmentation model is perfect (not even any ai model), some items won't be identified by the model and hence, won't be cropped out. This is where human augmentation comes into place. The operator looks at the displayed selected original image on the left and compares with the segmentation result on the right. If there are items not present in the result, the operator manually crops those items and add them directly to the “extracted” folder. He/she also adds those manually cropped items to a folder for future custom training of the image segmentation models on them such that in the future, those items and their likes, when encountered again, would be identified by the model without the need for manual cropping again - continuous learning. 

 **•Image captioning**

 **•Adding seller details**

 **•Searching for products**

**WANT TO COLLABORATE?**
Interested in any kind of collaboration on the project? Email me at nawasnaziru@gmail.com.

