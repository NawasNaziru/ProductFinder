//  todays date and time (used as default event dates)
var dateNow = new Date(Date.now()).toISOString().split('T')[0]
var timeNow = new Date(Date.now()).toTimeString().split(' ')[0].substr(0, 5)

//  todays date & todays date + 1 month (as default ui)
var thisYear = new Date(Date.now()).getFullYear()
var thisMonth = new Date(Date.now()).getMonth()
var StartDate = new Date(thisYear, thisMonth, 2).toISOString().split('T')[0]
var EndDate = new Date(thisYear, thisMonth + 1, 2).toISOString().split('T')[0]


// UI object
var ui = {
    debugui: false,  // debug ui partial at the bottom of the screen
    debuginfo: true, // info messages in console.log
    supressUi: false,  // supress some of the ui elements
    flow: {
        activateDiv: null,
        activateButton: null,
        timestamp: null
    },
    dates: {
        todayDate: dateNow,
        todayTime: timeNow,
        listStartDate: StartDate,
        listEndDate: EndDate
    },
    data: {
	    images: [],
        prodImage: [],
        failed_captions: [],
        filename: null,
        image_labels: [],
        uploadstatus: " ",
        seller: [],
        notrecognized: " ",
        error: " "
    }
}

module.exports = ui