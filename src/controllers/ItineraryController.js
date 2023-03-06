const { response } = require('express');
const moment = require('moment');
const getMongoDb = require('../helpers/mongoHelper');

class ItineraryController {
    constructor() {
    }

    async getData(){
        this.mongoDB = await getMongoDb();
        const itineraries = await this.retrieveItineraries();
        return this.buildScatterData(itineraries);
    }

    async retrieveItineraries(){
        const promises = [];
        promises.push(
            this.mongoDB.collection('itineraries')
            .find()
            .toArray()
        );
        promises.push(
            this.mongoDB.collection('flights')
            .find()
            .toArray()
        );
        
        return Promise.all(promises)
        .then((response) => {
            if (response && response.length > 1) {
                const itineraries = response[0];
                const flights = response[1];

                itineraries.forEach(itinerary => {
                    itinerary.flights = flights.filter(flight => flight.itineraryId === itinerary.itineraryId);
                });
                return itineraries;
            }
        });

        return [];
    }

    roundNumber(num){
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    generateRandomColor = () => {
        let R = Math.floor((Math.random() * 127) + 127);
        let G = Math.floor((Math.random() * 127) + 127);
        let B = Math.floor((Math.random() * 127) + 127);
        
        let rgb = (R << 16) + (G << 8) + B;
        return `#${rgb.toString(16)}`;      
    }

    buildScatterData(itineraries){
        const scatters = [];
        itineraries.forEach(itinerary => {
            const fileName = itinerary.fileName.replace('-', '').replace('.csv', '');
            const scatterName = `${fileName} (${itinerary.fromLocation}-${itinerary.toLocation})`;
            const items = [];
            const extraData = [];

            itinerary.flights.forEach(flight => {
                items.push([
                    this.roundNumber(flight.startTimeMS/60000000), 
                    this.roundNumber(flight.currentAmperage * flight.currentVoltage)
                ]);
                extraData.push({
                    remainingBattery: flight.remainingPercent
                })
            });

            const record = {
                name: scatterName,
                data: items,
                extraData,
            };

            scatters.push({
                scatterId: itinerary.itineraryId,
                scatterName,
                scatterColor: this.generateRandomColor(),
                series: [record]
            });
        });

        return {
            scatters, 
        };
    }
}
module.exports = ItineraryController