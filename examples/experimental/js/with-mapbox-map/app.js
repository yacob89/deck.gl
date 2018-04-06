/* global window, fetch */
import {Deck, GeoJsonLayer, MapController} from 'deck.gl';
import MapBox from './mapbox';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const GEOJSON =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson'; //eslint-disable-line

const INITIAL_VIEW_STATE = {
  latitude: 40,
  longitude: -100,
  zoom: 3,
  bearing: 0,
  pitch: 60
};

class App {
  constructor(props) {
    this.state = {
      viewState: INITIAL_VIEW_STATE,
      data: null
    };

    const {viewState} = this.state;

    this.map = new MapBox({
      container: 'map',
      ...viewState,
      debug: true
    });

    this.deck = new Deck({
      canvas: 'deck',
      viewState,
      controller: MapController,
      onViewStateChange: this.onViewStateChange.bind(this),
      onResize: this.onResize.bind(this),
      debug: true
    });

    fetch(GEOJSON)
      .then(resp => resp.json())
      .then(data => this.setState({data}));
  }

  setState(state) {
    Object.assign(this.state, state);
    this.updateLayers();
  }

  updateLayers() {
    this.deck.setProps({
      layers: [
        new GeoJsonLayer({
          data: this.state.data,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          opacity: 0.4,
          getLineColor: () => [255, 100, 100],
          getFillColor: () => [100, 100, 200]
        })
      ]
    });
  }

  onResize({width, height}) {
    this.map.setProps({width, height});
  }

  onViewStateChange({viewState}) {
    this.map.setProps(viewState);
    this.deck.setProps({viewState});
  }
}

window.addEventListener('load', () => new App());
