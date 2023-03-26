import react, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineCancel } from "react-icons/md";
import QueryForm from "./QueryForm";
import "../Stylesheets/Home.css";

export default function Home() {
  const [travelInfo, setTravelInfo] = useState();
  const [IP, setIP] = useState("");
  const [coords, setCoords] = useState();
  const [marketData, setMarketData] = useState();
  const [validationError, setValidationError] = useState("");
  const [currLocation, setCurrLocation] = useState();

  async function returnTravelInfo(data) {
    if (data !== "-1") {
      const info = JSON.parse(data);
      const { trip } = info;
      //Validate locations for orgn and dest
      const validLocations = Promise.all(
        trip.map(async ([orgn, dest]) => {
          const originIsValid =
            orgn === "X" ? currLocation : await isValidLocation(orgn);
          const destinationIsValid =
            dest === "X" ? currLocation : await isValidLocation(dest);

          return Promise.all([originIsValid, destinationIsValid]).then(
            (data) => {
              [orgn, dest] = data;
              console.log(orgn, dest);
              if (orgn && dest) return [orgn, dest];
              else {
                setValidationError("Please enter valid location information");
                return [];
              }
            }
          );
        })
      );
      validLocations
        .then((data) => {
          if (data[0].length > 0) {
            console.log(data);
            info.trip = data;
            //use travel info to get flights
            setTravelInfo(info);
          }
        })
        .catch((error) => {
          console.error(error);
          setValidationError("Please enter valid location information");
        });
    } else {
      setValidationError("Please enter valid travel information");
    }
  }

  async function getMarketInfo(ipAddress) {
    //use culture api to return locale, market and currency data
    const response = await fetch("http://localhost:3000/marketInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip: ipAddress }),
    });

    response.json().then((data) => {
      setMarketData(data.result);
    });
  }

  useEffect(() => {
    // Get the user's current position
    async function getCurrentLocation() {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Use the Google Maps Geocoding API to get the city name
        const apiKey = "AIzaSyDXbiwpfSkO1XGzhs0MK3iDz2ccIfF78f4";
        fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
        )
          .then((response) => response.json())
          .then((data) => {
            const city = data.results[0].address_components.find((component) =>
              component.types.includes("postal_town")
            ).long_name;
            setCurrLocation(city);
          })
          .catch((error) => {
            console.error(error);
          });
      });
    }

    async function getMarketData() {
      const response = await fetch("http://localhost:3000/IP");
      response.json().then((data) => {
        setIP(data.result.IPv4);
        setCoords({ lat: data.result.latitude, long: data.result.longitude });
        getMarketInfo(data.result.IPv4);
      });
    }

    async function getFlightData(travel_data, market_data) {
      const queryLegs = processQueryLegs(travel_data, market_data, IP, coords);

      queryLegs.then(async (data) => {
        try {
          const response = await fetch("http://localhost:3000/flightInfo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: {
                market: market_data.market.code,
                locale: market_data.locale.code,
                currency: market_data.currency.code,
                queryLegs: data.map(([orgn, dest]) => {
                  return {
                    originPlaceId: {
                      entityId: orgn,
                    },
                    destinationPlaceId: {
                      entityId: dest,
                    },
                    date: {
                      //Get actual dates from travel data
                      year: 2023,
                      month: 5,
                      day: 1,
                    },
                  };
                }),
                cabinClass: "CABIN_CLASS_ECONOMY",
                adults: 1,
              },
            }),
          });

          response.json().then((data) => console.log(data.result));
          return response;
        } catch (error) {
          if (error.response) {
            console.error(error.response.status, error.response.data);
          } else {
            console.error(
              `Error with Skyscanner API request: ${error.message}`
            );
          }
        }
      });
    }

    if (!currLocation) getCurrentLocation();

    if (!marketData) getMarketData();

    if (IP && travelInfo && marketData && coords) {
      getFlightData(travelInfo, marketData);
    }
  }, [IP, marketData, travelInfo, coords, currLocation]);

  return (
    <div className="main-content-container">
      <AnimatePresence>
        <motion.div key="queryformContainer" id="queryformContainer">
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -13 }}
              key="errorMessage"
              id="errorMessage"
            >
              <motion.span>{validationError}</motion.span>
              <MdOutlineCancel
                id="cancelButton"
                onClick={() => {
                  setValidationError("");
                }}
              />
            </motion.div>
          )}
          <QueryForm returnTravelInfo={returnTravelInfo} />
        </motion.div>
        {/*<div key="travelInfo">{travelInfo}</div>*/}
      </AnimatePresence>
    </div>
  );
}

async function getEntityId(location, marketData) {
  const response = await fetch("http://localhost:3000/entityID", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      market: marketData.market.code,
      locale: marketData.locale.code,
      searchTerm: location,
    }),
  });

  return response.json();
}

async function processQueryLegs(travelData, marketData) {
  //use flight live prices api /flights endpoint to get entityIDs for each orgn,dest pair
  try {
    const entityIDs = Promise.all(
      travelData.trip.map(async ([orgn, dest]) => {
        try {
          const originID = await getEntityId(orgn, marketData);
          const destinationID = await getEntityId(dest, marketData);
          //console.log(originID.result[0], destinationID.result[0]);
          return [
            originID.result[0].entityId,
            destinationID.result[0].entityId,
          ];
        } catch (error) {
          if (error.response) {
            console.error(error.response.status, error.response.data);
          } else {
            console.error(
              `Error with Skyscanner API request: ${error.message}`
            );
          }
        }
      })
    );

    return entityIDs;
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with Skyscanner API request: ${error.message}`);
    }
  }
}

async function isValidLocation(location) {
  const apiKey = "AIzaSyDXbiwpfSkO1XGzhs0MK3iDz2ccIfF78f4";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const city = data.results[0].address_components.find((component) =>
      component.types.includes("locality")
    );
    if (city && city.long_name === location) {
      return city.long_name;
    } else return "";
  } catch (e) {
    console.error(e);
    return "";
  }
}
