var express = require('express');
var router = express.Router();
const multer = require('multer');
const FileImporterController = require('../controllers/FileImporterController');
const ItineraryController = require('../controllers/ItineraryController');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, 'uploads/')
    },
    filename: function (req, file, callback) {
      callback(null, file.originalname)
    }
  });
var upload = multer({ storage: storage });

router.get('/getData', async (req, res) => {
    const controller = new ItineraryController();
    return controller.getData()
    .then((data) => res.send(data));
});

//Uploading multiple files 
router.post('/upload', upload.array('files', 10), async (req, res, next) => {
    const files = req.files
    if (!files || files.length <= 0) {
      const error = new Error('Please choose files')
      error.httpStatusCode = 400
      return next(error)
    }
    const controller = new FileImporterController();
    return controller.handleData(files)
    .then(() => res.send(files))
    .catch((error) => next(error));

});



router.get('/', async (req, res) => {
	//const currentUser = JSON.parse(localStorage.getItem('currentUser'));
	//if(!currentUser || !req.session)
	//	return res.redirect('/login');

	//const dashboard = new Dashboard();
	//const inventoryCount = await dashboard.getInventoryCount();
	
	res.send('Home')
});

module.exports = router;
