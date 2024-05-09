
![Logo](https://github.com/NawasNaziru/ProductFinder/assets/28715515/3692b054-4d45-422c-8d1b-1c2f2990b856)

**ABOUT**

We are a small company that solves the issue of in-person buyers finding it difficult to locate what they want to buy from physical stores that have no online presence. We use AI from products data collection to helping buyers locate products they want to buy.

**HOW IT WORKS**

 **• Data collection**

Our hired professional data collectors go to sellers shops and capture their products images. Do they need to take the picture of each and every product? That's where image segmentation AI model comes to the rescue. A data collector can group more than one product and snap them at once to be segmented/cropped into the various individual products images saving our time and reducing the boredom of the task on the data collector. In addition to the products images, a data collector also collects the name, phone number and address of the seller among other information saved in a text file with the name of the seller. Both the text file and the products images are saved in a folder with the name of the seller as the folder name.

 **• Image Segmentation**

With products images of various sellers at hand, it is now the job of the market agent/operator. With a click of a button, he/she first loads into the app, a chosen seller folder whose products are to be added to the system. Next, he/she picks an image of choice from the loaded seller products images and before clicking on the segment button, he/she enter labels/names/short description of each object in the image (zero shot segmentation). But why having to enter the labels? The benefit can be seen later in the image captioning stage. On clicking the segment button, the image is sent to an image segmentation machine learning model which responds with the bounding boxes information of all the individual products/items in the image These bounding boxes information are used to cut out the individual items images from the original image and are saved in a folder named “extracted” in the app root directory. If the image consist of just one product, then no need of the segmentation stage and instead, the operator directly cuts and paste the image into the folder titled “extracted” which is where all the segmented/cropped images go to. As no any  image segmentation model is perfect (not even any ai model), some items won't be identified by the model and hence, won't be cropped out. This is where human augmentation comes into place. The operator looks at the displayed selected original image on the left and compares with the segmentation result on the right. If there are items not present in the result, the operator manually crops those items and add them directly to the “extracted” folder. He/she also adds those manually cropped items to a folder for future custom training of the image segmentation models on them such that in the future, those items and their likes, when encountered again, would be identified by the model without the need for manual cropping again - continuous learning. 


![beforeseg](https://github.com/NawasNaziru/ProductFinder/assets/28715515/39d35ae2-a530-4e3f-b8b6-6a82d3f13193)

The extracted images are only saved temporarily in the ‘extracted’ folder for the purpose of the stages that follow (captioning each of the extracted images etc) after which they are moved to the ‘productsImages’ folder where they are saved permanently. This is to give room for the next image to be segmented and its extracted items to be passed through same process.


![seg](https://github.com/NawasNaziru/ProductFinder/assets/28715515/3b3a8cb7-e685-4862-9824-2790363b08e5)


![seg2](https://github.com/NawasNaziru/ProductFinder/assets/28715515/6e8f506c-8568-4a6b-a438-d88072594838)

 **• Image captioning**

Immediately after segmentation, without any operator action, each individual product  image  in the “extracted” folder is automatically passed to an image captioning model which returns the textual description of the item in the image. Some descriptions would be completely wrong since the model can't be perfect. To solve for such instances, the user entered  labels  during the image segmentation stage are each added to the respective caption. How do you identify which label belongs to which extracted item since no any particular order? This is where semantic search model comes into play. Each label is compared to the image generated caption and any label which is the closest in meaning(semantically) to the generated caption is the correct label to add to the generated caption. 

**• Optical character recognition**

Just as in the image captioning stage above, each image in the extracted folder is also passed through a model for optical character recognition to identify all the text written on the image. This is to take into account a product’s brand name and other specific details for more accuarate retrieval during search times.

 **• Adding seller details**

Next, the generated caption along with the user entered label and the optically recognized text on the image is mixed with the data from the seller info text file and the image name and the result saved in a file named ‘metadata.json’.

 **• Semantic search**
When a buyer comes to us looking for where to buy a certain product, the operator enters the textual description of the product along with the preferred location(town name or city name or state name with even street name) into the query fields on the UI. On submission, the search data along with the whole descriptions(captions and others) of all the products in the metadata.json file are sent as input to a semantic search model. What the semantic search model does is look at the search data and returns probabilities representing how close each description is to the user search data. The images whose descriptions have the highest probabilities are retrieved from productsImages folder and displayed to the user along with the seller address and other details required for locating the product from the metadata.json.


![b4search](https://github.com/NawasNaziru/ProductFinder/assets/28715515/5d9f209c-19aa-4bd6-b0f3-9aff5783832f)

![searchresult1](https://github.com/NawasNaziru/ProductFinder/assets/28715515/121911cb-bc5b-4dbd-80bc-9aad6d8353b9)

![search results 2](https://github.com/NawasNaziru/ProductFinder/assets/28715515/56a746a6-a4fb-46ac-a229-3f10e7e5d09d)

**WANT TO COLLABORATE?**

Interested in any kind of collaboration on the project? Email me at nawasnaziru@gmail.com.
