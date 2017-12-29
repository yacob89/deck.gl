/* global window, document */
import React, {Component} from 'react';
import {render} from 'react-dom';

// data
import sampleGraph from './data/sample-graph';

// utils
import Graph from './utils/graph';
import LayoutEngine from './utils/layout-engine';

// components
import GraphRender from './graph-render';

const DEFAULT_NODE_SIZE = 10;
const HOVERED_NODE_SIZE = 14;
const DEFAULT_COLOR = [236, 81, 72];
const HIGHLIGHT_COLOR = [17, 147, 154];

const Tooltip = ({x, y, node}) => {
  const style = {
    alignItems: 'center',
    border: '1px solid gray',
    borderRadius: '14px',
    display: 'flex',
    height: '27px',
    paddingLeft: '28px',
    position: 'absolute',
    left: x,
    top: y
  };
  const innerStyle = {
    alignItems: 'center',
    background: '#fff',
    borderRadius: '14px',
    display: 'flex',
    height: '26px',
    paddingLeft: '4px',
    paddingRight: '7px'
  };
  return (
    <div className="tooltip" style={style}>
      <div style={innerStyle}>{node.id}</div>
    </div>
  );
};

export default class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      graph: new Graph(),
      hoveredNode: undefined
    };
    this._engine = new LayoutEngine();

    // bindings
    this.handleResize = this.handleResize.bind(this);
    this.reRender = this.reRender.bind(this);
    this.getNodeColor = this.getNodeColor.bind(this);
    this.getNodeSize = this.getNodeSize.bind(this);
    this.onHoverNode = this.onHoverNode.bind(this);
    this.getEdgeColor = this.getEdgeColor.bind(this);
    this.getEdgeWidth = this.getEdgeWidth.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this._engine.registerCallbacks(this.reRender);
    this.processData();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this._engine.unregisterCallbacks();
  }

  handleResize() {
    this.setState({
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  processData() {
    const newGraph = new Graph();
    sampleGraph.nodes.forEach(node =>
      newGraph.addNode({
        id: node.id,
        isHighlighted: false
      })
    );
    sampleGraph.edges.forEach(edge =>
      newGraph.addEdge({
        ...edge,
        isHighlighted: false
      })
    );
    this.setState({graph: newGraph});
    // update engine
    this._engine.update(newGraph);
    this._engine.start();
  }

  reRender() {
    this.forceUpdate();
  }

  // node accessors
  getNodeColor(node) {
    return node.isHighlighted ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
  }

  getNodeSize(node) {
    return this.state.hoveredNode && this.state.hoveredNode.id === node.id
      ? HOVERED_NODE_SIZE
      : DEFAULT_NODE_SIZE;
  }

  onHoverNode(pickedObj) {
    // check if is hovering on a node
    const hoveredNode = pickedObj.object;
    if (
      hoveredNode &&
      hoveredNode.id &&
      this.state.hoveredNode &&
      hoveredNode.id === this.state.hoveredNode.id
    ) {
      return;
    }

    const graph = new Graph(this.state.graph);
    if (hoveredNode) {
      // highlight the selected node, connected edges, and neighbor nodes
      const hoveredNodeID = hoveredNode && hoveredNode.id;
      const connectedEdges = this.state.graph.findConnectedEdges(hoveredNodeID);
      const connectedEdgeIDs = connectedEdges.map(e => e.id);
      const hightlightNodes = connectedEdges.reduce((res, e) => {
        if (!res.includes(e.source)) {
          res.push(e.source);
        }
        if (!res.includes(e.target)) {
          res.push(e.target);
        }
        return res;
      }, []);
      graph.nodes.forEach(n => (n.isHighlighted = hightlightNodes.includes(n.id)));
      graph.edges.forEach(e => (e.isHighlighted = connectedEdgeIDs.includes(e.id)));
      this.setState({graph, hoveredNode});
    } else {
      // unset all nodes and edges
      graph.nodes.forEach(n => (n.isHighlighted = false));
      graph.edges.forEach(e => (e.isHighlighted = false));
      this.setState({graph});
    }
  }

  // edge accessors
  getEdgeColor(edge) {
    return edge.isHighlighted ? HIGHLIGHT_COLOR : DEFAULT_COLOR;
  }

  getEdgeWidth() {
    return 2;
  }

  getTooltipPosition() {
    const {hoveredNode, viewport} = this.state;
    if (!hoveredNode) {
      return [0, 0];
    }
    const hoveredNodePos = this._engine.getNodePosition(hoveredNode);
    return [
      hoveredNodePos[0] + viewport.width / 2 - HOVERED_NODE_SIZE,
      hoveredNodePos[1] + viewport.height / 2 - HOVERED_NODE_SIZE
    ];
  }

  render() {
    if (this.state.graph.isEmpty()) {
      return null;
    }

    const {graph, hoveredNode, viewport} = this.state;
    const hoveredNodePos = this.getTooltipPosition();
    const hoveredNodeID = hoveredNode && hoveredNode.id;
    return (
      <div>
        <GraphRender
          /* viewport related */
          width={viewport.width}
          height={viewport.height}
          /* update triggers */
          colorUpdateTrigger={hoveredNodeID}
          positionUpdateTrigger={this._engine.alpha()}
          nodeSizeUpdateTrigger={hoveredNodeID}
          /* nodes related */
          nodes={graph.nodes}
          getNodeColor={this.getNodeColor}
          getNodeSize={this.getNodeSize}
          getNodePosition={this._engine.getNodePosition}
          onHoverNode={this.onHoverNode}
          /* edges related */
          edges={graph.edges}
          getEdgeColor={this.getEdgeColor}
          getEdgeWidth={this.getEdgeWidth}
          getEdgePosition={this._engine.getEdgePosition}
        />
        {hoveredNode && <Tooltip x={hoveredNodePos[0]} y={hoveredNodePos[1]} node={hoveredNode} />}
      </div>
    );
  }
}

render(<Root />, document.getElementById('root'));
