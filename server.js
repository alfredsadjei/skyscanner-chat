require("dotenv").config();
const openai = require("openai");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

const configuration = new openai.Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openAI = new openai.OpenAIApi(configuration);

app.use(cors());

// Query chat gpt api
app.post("/generate", async (req, res) => {
  try {
    completion = await openAI.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Assume that you are a travel booking service like Skyscanner.
                    Given the following text: "${req.body.query}" give me a string response in the form
                    {"trip":[[a,b],...], "stay":[[c,d],...], "date":[e,...]} without  where "a" is the start location and "b" 
                    is the arrival destination, "e" is the plain text string date corresponding to 
                    each trip in the form dd-mm where "dd" is the day specified and "mm" is the month 
                    specified for each location to destination trip. Extrapolate from the information 
                    in "date" to populate "stay" where "c" are the all the locations and "d" are the number of days 
                    spent at these "c".Stay should not include the number of days spend in the starting location. Extrapolate from date information in "date"  and their corresponding "trip" entries 
                    to repopulate "stay" information. Only provide ALL stay information for the second location onwards.
                    If current location is provided use it as the start location else use "X". You must not provide any other output besides 
                    that which has been specified above. If the text does not have anything to do with travel, return -1.`,
        },
      ],
      temperature: 0.1,
    });

    //EXTRACT RELEVANT DATA AND PASS IT TO CLIENT
    const re = /^{.*}/;
    const response = completion.data.choices[0].message.content.trim();
    res
      .status(200)
      .json({ result: response != "-1" ? response.match(re)[0] : response });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
});

// Get IP address
app.get("/IP", async (req, res) => {
  try {
    const ip = await axios.get("https://geolocation-db.com/json/");
    res.status(200).json({ result: ip.data });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with geolocation API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
});

//Get flight info
app.post("/flightInfo", async (req, res) => {
  try {
    const flightData = await axios.post(
      `https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create`,
      req.body,
      {
        headers: { "x-api-key": process.env.SKYSCANNER_API_KEY },
      }
    );
    res.status(200).json({ result: flightData.data });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(
        `Error with flight live search API request: ${error.message}`
      );
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
});

//Get user market data
app.post("/marketInfo", async (req, res) => {
  try {
    const marketData = await axios.get(
      `https://partners.api.skyscanner.net/apiservices/v3/culture/nearestculture?ipAddress=${req.body.ip}`,
      { headers: { "x-api-key": process.env.SKYSCANNER_API_KEY } }
    );

    res.status(200).json({ result: marketData.data });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with nearest culture API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
});

app.post("/entityID", async (req, res) => {
  try {
    const idData = await axios.post(
      "https://partners.api.skyscanner.net/apiservices/v3/autosuggest/flights",
      {
        query: {
          market: req.body.market,
          locale: req.body.locale,
          searchTerm: req.body.searchTerm,
          includedEntityTypes: ["PLACE_TYPE_CITY"],
        },
      },
      {
        headers: {
          "x-api-key": process.env.SKYSCANNER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    resData = idData.data.places.filter(
      (place) => place.countryId == idData.data.places[0].countryId
    );

    res.status(200).json({ result: resData });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(
        `Error with flight autosuggest API request: ${error.message}`
      );
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
});

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`));
