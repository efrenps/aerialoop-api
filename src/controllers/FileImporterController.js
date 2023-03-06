const getMongoDb = require('../helpers/mongoHelper');
const XLSX = require('xlsx');

class FileImporterController {
    constructor() {
        this.concurrency = 2;
    }

    getCurrentDate() {
        return new Date();
    }

    async handleData(files){
        let itinerary = {};
        let flights = [];
        files.forEach(file => {
            if (file.filename.includes('flight')) {
                flights.push({
                    path: file.path,
                    filename: file.filename,
                });
            } else if (file.filename.includes('itineraries')){
                itinerary = file.path;
            }
        });

        this.mongoDB = await getMongoDb();
        
        /*
            Just for Demo, we should find a better way to 
            manage the current data.
        */
        await Promise.all[
            this.mongoDB.collection('itineraries').deleteMany({}),
            this.mongoDB.collection('flights').deleteMany({})
        ];
        
        const iteneraries = await this.importItinerary(itinerary);
        return this.importFlights(flights, iteneraries);
    }

    getDocument(path) {
        const workBook = XLSX.readFile(path);
        const sheets = workBook.SheetNames;
        const workSheet = workBook.Sheets[sheets[0]];
        return XLSX.utils.sheet_to_json(workSheet);
    }

    async importItinerary(path){
        const document = this.getDocument(path);
        const records = [];

        for (const data of document) {
            records.push(this.formatItineraryData(data));
        }

        return this.mongoDB.collection('itineraries')
            .insertMany(records)
            .then(() => {
                return records;
            });
    }

    formatItineraryData(data){
        const record = {}
        const currentkeys = Object.keys(data)
        const newKeys = ['itineraryId', 'startTimeMS', 'fromLocation', 'toLocation', 'fileName'];

        let index = 0;
        for (const currentkey of currentkeys) {

            if (index <= currentkeys.length){
                record[newKeys[index]] = data[currentkey];
                index++;
            }
        }
        record['createdON'] = this.getCurrentDate();
        return record;
    }

    async importFlights(flights, itineraries){
        const records = [];
        for (const flight of flights) {
            const itineraryId = itineraries.find(ele => ele.fileName === flight.filename).itineraryId;
            const currentFlight = this.importFlight(flight, itineraryId);
            records.push(...currentFlight);
        }
        
        return this.mongoDB.collection('flights')
        .insertMany(records)
        .then(() => true);
    }

    importFlight(flight, itineraryId){
        const document = this.getDocument(flight.path);
        const records = [];

        for (const data of document) {
            records.push(this.formatFlightData(data, itineraryId));
        }

        return records;
    }

    formatFlightData(data, itineraryId){
        const record = {}
        const currentkeys = Object.keys(data)
        const newKeys = ['startTimeMS', 'currentVoltage', 'currentAmperage', 
                        'batteryDischarged', 'remainingPercent', 'remainingVoltagePercent', 'batteryWarning'];

        let index = 0;
        for (const currentkey of currentkeys) {

            if (index <= currentkeys.length){
                record[newKeys[index]] = data[currentkey];
                index++;
            }
        }
        record['currentPower'] = record['currentVoltage'] * record['currentAmperage'];
        record['itineraryId'] = itineraryId;
        record['createdON'] = this.getCurrentDate();
        return record;
    }
    
}
module.exports = FileImporterController