import express from 'express';
import axios from 'axios';
import geolib from 'geolib';

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL =
  'https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel@parisdata/records';

function getDistance(lat1, lon1, lat2, lon2) {
  return geolib.getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 },
  );
}

app.get('/stations', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ message: 'Les coordonnées (lat, lon) sont requises.' });
  }
  const latNumber = parseFloat(lat);
  const lonNumber = parseFloat(lon);

  try {
    const response = await axios.get(API_URL, {
      params: {
        where: `within_distance(coordonnees_geo, GEOM'POINT(${lonNumber} ${latNumber})', 1km)`,
      },
    });

    const stations = response.data.results;

    // Trier les stations par distance
    const stationsSorted = stations
      .map((station) => {
        const distance = getDistance(
          lat,
          lon,
          station.coordonnees_geo.lat,
          station.coordonnees_geo.lon,
        );
        return { ...station, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    res.json(stationsSorted.slice(0, 10));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des données' });
  }
});

app.listen(PORT, () => {
  console.log(`Le serveur fonctionne sur http://localhost:${PORT}`);
});
