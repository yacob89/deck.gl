import assert from 'assert';

const TYPE_DEFINITIONS = {
  boolean: {
    // {type: 'boolean', value: boolean}
    // short hand: 'boolean' -> {value: false, type: 'boolean'}
    validate(value, propType) {
      return true;
    }
  },
  number: {
    // {type: 'number', value: number, min: number, max: number}
    // short hand: 'number' -> {value: 0 or NaN?, type: 'number'}
    validateType(value, propType) {
      return (
        'value' in propType &&
        (!('max' in propType) || Number.isFinite(propType.max)) &&
        (!('min' in propType) || Number.isFinite(propType.min))
      );
    },
    validate(value, propType) {
      return (
        Number.isFinite(value) &&
        (!('max' in propType) || value <= propType.max) &&
        (!('min' in propType) || value >= propType.min)
      );
    }
  },
  object: {
    // { type: 'object', properties: {...} }
    // short hand: 'object' -> { properties: {}, type: 'object' }
  },
  array: {
    // { type: 'array', element: 'number', length: number }
    // short hand: 'array' -> { value: [], type: 'array', element: 'unknown', length: 0 }
  },
  'fixed-array': {
    // {type: 'fixed-array', shape: ['number', 'number', ...], value: [number, number], min: [number, number], max: [number, number]}
  },
  position: {
    // {type: 'position', dimensions: number}
    /*
      validate:
      min: 0
    */
  },
  color: {
    // {type: 'color', model: 'rgb', value: [number, number, number] }
    // {type: 'color', model: 'rgba', value: [number, number, number, number] }
    // {type: 'color', model: 'hex', value: string }
    /*
      validate:
      min: 0
      max: 255
    */
  },
  function: {
    // {type: 'function', value: (number) => {}, args: ['number'], return: 'void'}
    // short hand map: 'function' -> { value: () => {}, type: 'function', args: [], return: 'void'}
  }
};

export const defaultDataArrayType = { value: [], type: 'array', element: defaultDataType };

export const defaultDataType = {
  type: 'object',
  properties: {
    position: { type: 'position', dimensions: 3 },
    radius: { type: 'number', min: 0 },
    color: { type: 'color', model: 'rgba' },
    strokeWidth: { type: 'number', min: 0 }
  }
};

const numberOfLights = 1;

export const defaultLightSettingsType = {
  type: 'object',
  properties: {
    numberOfLights: { type: 'number', value: numberOfLights, min: 0, max: 16 },
    lightsPosition: { type: 'array', element: 'number', length: numberOfLights * 3 },
    lightsStrength: { type: 'array', element: 'number', length: numberOfLights * 2 },
    coordinateSystem: { type: 'number', value: COORDINATE_SYSTEM.LNGLAT },
    coordinateOrigin: { type: 'position', dimensions: 3, value: [0, 0, 0] },
    modelMatrix: { type: 'number', value: null },
    ambientRatio: { type: 'number', value: 0.05, min: 0, max: 1 },
    diffuseRatio: { type: 'number', value: 0.6, min: 0, max: 1 },
    specularRatio: { type: 'number', value: 0.8, min: 0, max: 1 }
  }
};

export function parsePropTypes(propDefs) {
  const propTypes = {};
  const defaultProps = {};
  for (const [propName, propDef] of Object.entries(propDefs)) {
    const propType = parsePropType(propName, propDef);
    propTypes[propName] = propType;
    defaultProps[propName] = propType.value;
  }
  return {propTypes, defaultProps};
}

// Parses one property definition entry. Either contains:
// * a valid prop type object ({type, ...})
// * a valid prop type string ('number')
// * or just a default value, in which case type and name inference is used
function parsePropType(name, propDef) {
  switch (getTypeOf(propDef)) {
    case 'object':
      propDef = normalizePropDefinition(name, propDef);
      return parsePropDefinition(propDef);

    case 'array':
      return guessArrayType(name, propDef);

    case 'boolean':
      return {name, type: 'boolean', value: propDef};

    case 'number':
      return guessNumberType(name, propDef);

    case 'function':
      return {name, type: 'function', value: propDef};
    // return guessFunctionType(name, propDef);

    default:
      return {name, type: 'unknown', value: propDef};
  }
}

function guessArrayType(name, array) {
  if (/color/i.test(name) && (array.length === 3 || array.length === 4)) {
    return {name, type: 'color', value: array};
  }
  return {name, type: 'array', value: array};
}

function normalizePropDefinition(name, propDef) {
  if (!('type' in propDef)) {
    if (!('value' in propDef)) {
      // If no type and value this object is likely the value
      return {name, type: 'object', value: propDef};
    }
    return Object.assign({name, type: getTypeOf(propDef.value)}, propDef);
  }
  return Object.assign({name}, propDef);
}

function parsePropDefinition(propDef) {
  const {type} = propDef;
  const typeDefinition = TYPE_DEFINITIONS[type] || {};
  const {typeValidator} = typeDefinition;
  if (typeValidator) {
    assert(typeValidator(propDef), 'Illegal prop type');
  }

  return propDef;
}

function guessNumberType(name, value) {
  const isKnownProp =
    /radius|scale|width|height|pixel|size|miter/i.test(name) && /^((?!scale).)*$/.test(name);
  const max = isKnownProp ? 100 : 1;
  const min = 0;
  return {
    name,
    type: 'number',
    max: Math.max(value, max),
    min: Math.min(value, min),
    value
  };
}

// improved version of javascript typeof that can distinguish arrays and null values
function getTypeOf(value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}
