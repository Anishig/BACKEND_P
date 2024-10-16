const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
dotenv.config({
    path: './config.env',
})


const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

const uri = process.env.MONGO_URI;
MongoClient.connect(uri)
    .then(client => {
        console.log("Connected to MongoDB");
        const db = client.db('events');
        const events = db.collection('events');

        app.use(express.json());
        app.listen(PORT, () => { console.log('server started at port: ' + PORT); })




        app.get('/api/v3/app/events/:event_id', async(req, res) => {
            const eventId = req.params.event_id;
            const event = await events.findOne({ _id: new ObjectId(eventId) });
            res.status(200).json(event);
        });




        app.get('/api/v3/app/events/latest', (req, res) => {
            const { limit, page } = req.query;
            const eventsPerPage = parseInt(limit) || 5;
            const pageNumber = parseInt(page) || 1;

            const skip = (pageNumber - 1) * eventsPerPage;
            const e = events
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(eventsPerPage)
                .toArray();
            const totalEvents = events.countDocuments();
            res.status(200).json({
                e,
                totalPages: Math.ceil(totalEvents / eventsPerPage),
                currentPage: pageNumber,
            });


        });




        app.post('/api/v3/app/events', async(req, res) => {
            const {

                type,
                uid,
                name,
                tagline,
                description,
                moderator,
                category,
                sub_category,
                rigor_rank,
                attendees
            } = req.body;

            const parsedAttendees = JSON.parse(attendees);
            const currentTimestamp = new Date().toISOString();
            const eventData = {

                type,
                uid: parseInt(uid),
                name,
                tagline,
                schedule: currentTimestamp,
                description,
                moderator,
                category,
                sub_category,
                rigor_rank: parseInt(rigor_rank),
                attendees: attendees.map(id => (id)),
            };


            const result = await events.insertOne(eventData);
            res.status(201).json({ eventId: result.insertedId });


        });





        app.put('/api/v3/app/events/:id', (req, res) => {
            const userId = req.params.id;
            const updatedData = req.body;
            const result = events.updateOne({ _id: new ObjectId(userId) }, { $set: updatedData });

            if (result.matchedCount === 1) {
                res.status(200).json({ message: 'User successfully updated' });
            } else {
                res.status(404).json({ error: 'User not found' });
            }

        });

        app.delete('/api/v3/app/events/:id', async(req, res) => {
            const eventId = req.params.id;
            const result = await events.deleteOne({ _id: new ObjectId(eventId) });

            if (result.deletedCount === 1) {
                res.status(200).json({ message: 'Event successfully deleted' });
            } else {
                res.status(404).json({ error: 'Event not found' });
            }
        });





















    }).
catch(error => {
    console.log(error.message);
})