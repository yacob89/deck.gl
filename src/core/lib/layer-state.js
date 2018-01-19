import Stats from './stats';
import assert from 'assert';

export default class LayerState {
  constructor({attributeManager}) {
    assert(attributeManager);
    this.attributeManager = attributeManager;
    this.model = null;
    this.needsRedraw = true;
    this.subLayers = null; // reference to sublayers rendered in a previous cycle
    this.stats = new Stats({id: 'draw'});
    this.layer = null;
    this.propOverrides = {}; // Prop values that the layer sees
    // this.animatedProps = null, // Computing animated props requires layer manager state
  }

  //
  // ASYNC PROP HANDLING
  //

  // Returns value of an overriden prop
  getAsyncProp(propName, props) {
    return propName in this.propOverrides
      ? this.propOverrides[propName].value
      : props._rewritableProps[propName];
  }

  // Updates all async/overridden props (when new props come in)
  // Checks if urls have changed, starts loading, or removes override
  updateAsyncProps(props) {
    for (const prop in props._rewritableProps) {
      this._updateAsyncProp(prop, props._rewritableProps[prop], props);
    }
  }

  // Intercept strings (URLs) and activates loading and prop rewriting
  _updateAsyncProp(propName, value, props) {
    const type = value instanceof Promise ? 'Promise' : typeof value;

    switch (type) {
      case 'string':
        const {fetch, dataTransform} = props;

        const propOverride = this._createPropOverride(propName, props);
        if (value === propOverride.lastValue) {
          return false;
        }
        propOverride.lastValue = value;

        // interpret value string as url and start a new load
        const url = value;
        this._loadAsyncProp({url, propOverride, fetch, dataTransform});
        break;

      default:
        this._removePropOverride(propName);
    }
    return false;
  }

  // Starts loading for an async prop override
  _loadAsyncProp({url, propOverride, fetch, dataTransform}) {
    // Set data to ensure props.data does not return a string
    // Note: Code in LayerProps class depends on this
    propOverride.data = propOverride.data || [];

    // Closure will track counter to make sure we only update on last load
    const count = ++propOverride.loadCount;

    // Load the data
    propOverride.loadPromise = fetch(url)
      // Give the app a chance to post process the data
      .then(data => dataTransform(data))
      .then(data => {
        // If multiple loads are pending, only update when last issued load completes
        if (count === propOverride.loadCount) {
          propOverride.loadValue = data;
          propOverride.loadPromise = null;
          propOverride.value = data;
          this.layer.setChangeFlags({dataChanged: true});
        }
      });
  }

  // Create a new override if not already in place
  _createPropOverride(propName, props) {
    this.propOverrides[propName] = this.propOverrides[propName] || {
      lastValue: null, // Original value is stored here
      loadValue: null, // Auto loaded data is stored here
      loadPromise: null, // Auto load promise
      loadCount: 0,
      value: props._rewritablePropDefaults[propName]
    };

    return this.propOverrides[propName];
  }

  // Remove entry from map, disabled shadowing
  _removePropOverride(propName) {
    delete this.propOverrides[propName];
  }
}
