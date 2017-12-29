import React, {PureComponent} from 'react';

import DeckGL, {
  LineLayer,
  ScatterplotLayer,
  OrthographicViewport,
  COORDINATE_SYSTEM
} from 'deck.gl';

export default class GraphRender extends PureComponent {
  createViewport() {
    const width = this.props.width;
    const height = this.props.height;
    return new OrthographicViewport({
      width,
      height,
      left: -width / 2,
      top: -height / 2,
      right: width / 2,
      bottom: height / 2
    });
  }

  createNodeLayer() {
    return new ScatterplotLayer({
      id: 'node-layer',
      data: this.props.nodes,
      getPosition: this.props.getNodePosition,
      getRadius: this.props.getNodeSize,
      getColor: this.props.getNodeColor,
      onHover: this.props.onHoverNode,
      pickable: true,
      coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
      updateTriggers: {
        getColor: this.props.colorUpdateTrigger,
        getPosition: this.props.positionUpdateTrigger,
        getRadius: this.props.nodeSizeUpdateTrigger
      }
    });
  }

  createEdgeLayer() {
    return new LineLayer({
      id: 'edge-layer',
      data: this.props.edges,
      getSourcePosition: e => this.props.getEdgePosition(e).sourcePosition,
      getTargetPosition: e => this.props.getEdgePosition(e).targetPosition,
      getColor: this.props.getEdgeColor,
      strokeWidth: this.props.getEdgeWidth(),
      coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
      updateTriggers: {
        getColor: this.props.colorUpdateTrigger,
        getSourcePosition: this.props.positionUpdateTrigger,
        getTargetPosition: this.props.positionUpdateTrigger
      }
    });
  }

  render() {
    return (
      <div id="graph-render">
        <DeckGL
          width={this.props.width}
          height={this.props.height}
          viewport={this.createViewport()}
          layers={[this.createEdgeLayer(), this.createNodeLayer()]}
        />
      </div>
    );
  }
}
