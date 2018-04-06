/* global window, fetch */
import {Deck, GeoJsonLayer, MapController} from 'deck.gl';

// source: Natural Earth http://www.naturalearthdata.com/
// via geojson.xyz
const GEOJSON =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson'; //eslint-disable-line

const INITIAL_VIEWPORT = {
  latitude: 40,
  longitude: -100,
  zoom: 3,
  bearing: 0,
  pitch: 60
};

class App {
  constructor(props) {
    this.deckgl = new Deck({
      width: '100%',
      height: '100%',
      initialViewState: INITIAL_VIEWPORT,
      controller: MapController,
      layers: []
    });

    fetch(GEOJSON)
      .then(resp => resp.json())
      .then(data => this.updateLayers({data}));
  }

  updateLayers({data}) {
    this.deckgl.setProps({
      layers: [
        new GeoJsonLayer({
          data,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          getLineColor: () => [255, 255, 255],
          getFillColor: () => [200, 200, 200]
        })
      ]
    });
  }
}

window.addEventListener('load', () => new App());
