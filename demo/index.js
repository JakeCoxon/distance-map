import { createDistanceMap, findShortestPath } from '../src/index.js'

import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import { observable, computed, autorun } from 'mobx'
import { observer } from 'mobx-react'
import chroma from 'chroma-js'
import TileGridView from './tile-grid-view.js'



//////////////////////
/// Model ////////////
//////////////////////


class TileGrid {

    width = 8;
    height = 8;

    constructor(width, height) {
        this.width = width || 8;
        this.height = height || 8;
        this.tiles = _.range(this.width).map(x =>
            _.range(this.height).map(y => ({ 
                x, y, 
                @observable solid: false 
            })));
    }

    reset() {
        this.tiles.forEach(row => row.forEach(tile => { tile.solid = false }));
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;
        return this.tiles[x][y];
    }

    filterNeighbours(neighbour) {
        return neighbour.node !== undefined && !neighbour.node.solid;
    }

    get4Neighbours(node) {
        if (node.solid) return [];
        return _.filter([
            { node: this.getTile(node.x - 1, node.y), cost: 1 },
            { node: this.getTile(node.x + 1, node.y), cost: 1 },
            { node: this.getTile(node.x, node.y - 1), cost: 1 },
            { node: this.getTile(node.x, node.y + 1), cost: 1 }
        ], this.filterNeighbours);
    }

    get8Neighbours(node) {
        if (node.solid) return [];
        return _.filter([
            { node: this.getTile(node.x - 1, node.y), cost: 1 },
            { node: this.getTile(node.x, node.y - 1), cost: 1 },
            { node: this.getTile(node.x, node.y + 1), cost: 1 },
            { node: this.getTile(node.x + 1, node.y), cost: 1 },
            { node: this.getTile(node.x - 1, node.y - 1), cost: 1 },
            { node: this.getTile(node.x - 1, node.y + 1), cost: 1 },
            { node: this.getTile(node.x + 1, node.y - 1), cost: 1 },
            { node: this.getTile(node.x + 1, node.y + 1), cost: 1 },
        ], this.filterNeighbours);
    }
}

class Model {

    @observable levelGraph;

    constructor(width, height) {
        this.levelGraph = new TileGrid(width, height);
    }

    @observable availableTargets = [
        // { node: this.levelGraph.getTile(1, 1), cost: 0 },
        // { node: this.levelGraph.getTile(7, 5), cost: 0 },
        // { node: this.levelGraph.getTile(7, 5), cost: 4 }
    ];

    @observable targetsType = 2;
    @computed get targets() {
        return this.targetsType == 1 ? [this.availableTargets[0]]
            : this.targetsType == 2 ? [this.availableTargets[0], this.availableTargets[1]]
            : this.targetsType == 3 ? [this.availableTargets[0], this.availableTargets[2]]
            : undefined;
    }

    @computed get targetsByTile() {
        const targetsByTile = new Map();
        this.targets.forEach(target => {
            targetsByTile.set(target.node, target);
        })
        return targetsByTile;
    }
    
    isATarget(tile) { return this.targetsByTile.has(tile) }


    @observable neighbourType = '4';

    @computed get getNeighbours() {
        return (
            this.neighbourType == '4' ? this.levelGraph.get4Neighbours.bind(this.levelGraph)
            : this.neighbourType == '8' ? this.levelGraph.get8Neighbours.bind(this.levelGraph)
            : undefined
        );
    }


    @observable fleeTiles = "2";
    @computed get validatedFleeCoefficient() {
        const c = Number(this.fleeTiles);
        return c ? 1 / c + 1 : 1.8
    }

    @computed get baseDistanceMap() {
        return createDistanceMap(this.getNeighbours, this.targets);
    }

    @computed get fleeDistanceMap() {
        const map = this.baseDistanceMap
        const targets = Array.from(map.entries()).map(([tile, cost]) => ({ node: tile, cost: -cost }));
        return createDistanceMap(this.getNeighbours, targets);
    }

    @computed get fleeCoefficientTargetsMap() {
        const map = this.baseDistanceMap
        return new Map(Array.from(map.entries()).map(([tile, cost]) => [tile, -Math.floor(cost * this.validatedFleeCoefficient)]));
    }

    @computed get fleeCoefficientDistanceMap() {
        const map = this.baseDistanceMap
        const targets = Array.from(map.entries()).map(([tile, cost]) => ({ node: tile, cost: -Math.floor(cost * this.validatedFleeCoefficient) }));
        return createDistanceMap(this.getNeighbours, targets);
    }

    @computed get distanceMap() {
        return this.pathfinderType == 2 ? this.fleeDistanceMap 
            : this.pathfinderType == 3 ? this.fleeCoefficientTargetsMap
            : this.pathfinderType == 4 ? this.fleeCoefficientDistanceMap
            : this.baseDistanceMap;
    }

    @computed get minDistance() {
        return _.min(Array.from(this.distanceMap.values()));
    }
    @computed get maxDistance() {
        return _.max(Array.from(this.distanceMap.values()));
    }

    @observable pathfinders = []; //[this.levelGraph.getTile(4, 4)];
    @observable pathfinderType = 1;

    @computed get paths() {
        return this.pathfinders.map(pathfinder => 
            this.pathfinderType > 0 ? findShortestPath(this.distanceMap, pathfinder, this.getNeighbours) : []
        );
    }
}



const playgroundState = new Model(10, 16);
playgroundState.name = "playgroundState"
playgroundState.reset = function() {
    this.availableTargets = [
        { node: this.levelGraph.tiles[1][1], cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 4 }
    ]
    this.neighbourType = '4';
    this.pathfinders = [this.levelGraph.tiles[4][3]]
    this.pathfinderType = 1;
    this.targetsType = 2;
    this.levelGraph.reset();
}
playgroundState.reset();
window.playgroundState = playgroundState;

const basicState = new Model();
basicState.name = "basicState"
basicState.reset = function() {
    this.neighbourType = '4';
    this.pathfinderType = 0;
    this.targetsType = 1;
    this.availableTargets = [
        { node: this.levelGraph.tiles[3][3], cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 4 }
    ]
    this.levelGraph.reset();
    this.levelGraph.tiles[1][1].solid = true;
    this.levelGraph.tiles[1][2].solid = true;
    this.levelGraph.tiles[1][3].solid = true;
    this.levelGraph.tiles[1][4].solid = true;
    this.levelGraph.tiles[1][5].solid = true;
    this.levelGraph.tiles[1][6].solid = true;
    this.levelGraph.tiles[2][6].solid = true;
    this.levelGraph.tiles[3][6].solid = true;
    this.levelGraph.tiles[4][5].solid = true;
    this.levelGraph.tiles[5][2].solid = true;
    this.levelGraph.tiles[5][4].solid = true;
    this.levelGraph.tiles[6][2].solid = true;
    this.levelGraph.tiles[6][3].solid = true;
}
basicState.reset();


const pathfindState = new Model();
pathfindState.name = "pathfindState"
pathfindState.reset = function() {
    this.targetsType = 1;
    this.availableTargets = [
        { node: this.levelGraph.tiles[5][5], cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 4 }
    ]
    this.levelGraph.reset();
    this.levelGraph.tiles[1][4].solid = true;
    this.levelGraph.tiles[1][5].solid = true;
    this.levelGraph.tiles[1][6].solid = true;
    this.levelGraph.tiles[2][4].solid = true;
    this.levelGraph.tiles[2][6].solid = true;
    this.levelGraph.tiles[3][4].solid = true;
    this.levelGraph.tiles[4][4].solid = true;
    this.levelGraph.tiles[4][6].solid = true;
    this.levelGraph.tiles[5][4].solid = true;
    this.levelGraph.tiles[5][6].solid = true;
    this.levelGraph.tiles[6][4].solid = true;
    this.levelGraph.tiles[6][5].solid = true;
    this.levelGraph.tiles[6][6].solid = true;
    this.pathfinders = [this.levelGraph.tiles[1][1], this.levelGraph.tiles[5][0]];
}
pathfindState.reset();

const fleeState = new Model();
fleeState.name = "fleeState"
fleeState.reset = function() {
    this.targetsType = 1;
    this.fleeTiles = "3";
    this.availableTargets = [
        { node: this.levelGraph.tiles[1][1], cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 0 },
        { node: this.levelGraph.getTile(7, 5), cost: 4 }
    ]
    this.pathfinderType = 2;
    this.pathfinders = [this.levelGraph.tiles[4][3]];
    this.levelGraph.reset();
    this.levelGraph.tiles[2][0].solid = true
    this.levelGraph.tiles[2][1].solid = true
    this.levelGraph.tiles[2][2].solid = true
    this.levelGraph.tiles[3][2].solid = true
    this.levelGraph.tiles[4][2].solid = true
    this.levelGraph.tiles[4][4].solid = true
    this.levelGraph.tiles[4][5].solid = true
    this.levelGraph.tiles[4][6].solid = true
    this.levelGraph.tiles[5][2].solid = true
    this.levelGraph.tiles[5][4].solid = true
    this.levelGraph.tiles[6][2].solid = true
    this.levelGraph.tiles[6][4].solid = true
    this.levelGraph.tiles[7][2].solid = true
    this.levelGraph.tiles[7][4].solid = true
}
fleeState.reset();



//////////////////////
/// UI ///////////////
//////////////////////



const scale = chroma.scale(['white', 'red']);

const tileSelect = state => (x, y) => {
    const startTile = state.levelGraph.getTile(x, y);
    const isInitiallySolid = startTile.solid;
    const pathfinderId = state.pathfinders.indexOf(startTile);
    return { 
        startTile, 
        isInitiallySolid,
        pathfinderId: pathfinderId > -1 ? pathfinderId : undefined,
        target: state.targetsByTile.get(startTile)
    };
};

const tileApply = state => (x, y, data) => {
    const tile = state.levelGraph.getTile(x, y);

    // console.log(findShortestPath(distanceMap, tile, neighbourFunc));
    if (data.pathfinderId !== undefined) {
        state.pathfinders[data.pathfinderId] = tile;
    } else if (data.target) {
        data.target.node = tile;
    } else {
        tile.solid = !data.isInitiallySolid;
    }
}

const tileProps = state => (x, y) => {

    const tile = state.levelGraph.getTile(x, y);

    const distance = state.distanceMap.get(tile);

    return {
        value: distance,
        backgroundColor: tile.solid ? '#333333'
            : distance === undefined ? '#CCCCCC' 
            : scale((distance - state.minDistance) / (state.maxDistance - state.minDistance)).hex(),
        iconColor: 
            state.pathfinderType !== 0 && state.pathfinders.indexOf(tile) > -1 ? 'rgba(0,200,0,0.5)'
            : state.isATarget(tile) ? 'rgba(255,150,0,1)'
            : undefined
    }
}

@observer
class InteractiveTileGridView extends React.Component {

    componentDidMount() {

        autorun(() => {

            const state = this.props.state;
            const canvas = this.refs.overlay;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ctx.fillRect(0,0,500,500);

            _.zip(state.pathfinders, state.paths).forEach(([pathfinder, path]) => {
                path = [{ node: pathfinder }, ...path];
                for (var i = 0; i < path.length - 1; i++) {

                    const tile1 = path[i].node;
                    const tile2 = path[i + 1].node;
                    ctx.strokeStyle = "rgba(0,255,0,0.5)"
                    ctx.lineWidth = 4;

                    ctx.beginPath();
                    ctx.moveTo((tile1.x + 0.5) * 32, (tile1.y + 0.5) * 32);
                    ctx.lineTo((tile2.x + 0.5) * 32, (tile2.y + 0.5) * 32);

                    ctx.stroke();
                }
            });

        });
    }

    render() {
        const { levelGraph } = this.props.state;

        return (
            <div style={{ position: 'relative' }}>

                <TileGridView 
                    width={levelGraph.width}
                    height={levelGraph.height}
                    tileProps={tileProps(this.props.state)}
                    tileSelect={tileSelect(this.props.state)}
                    tileApply={tileApply(this.props.state)} 
                    cellSize={32} />

                <canvas ref="overlay" width={levelGraph.width * 32} height={levelGraph.height * 32} style={{
                    width: levelGraph.width * 32,
                    height: levelGraph.height * 32,
                    position: 'absolute',
                    top: 0, left: 0,
                    pointerEvents: 'none'
                }}/>

                <button className="button" style={{ width: '100%' }} onClick={() => this.props.state.reset()}>Reset</button>
            </div>
        )
    }

}

const rowStyle = {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid black', paddingBottom: 20, marginBottom: 20
}

const leftColumnStyle = {
    display: 'flex'
}

const rightColumnStyle = {
    marginLeft: 20,
    flex: 1
}

const labelStyle = {
    display: 'block'
}

class MultiChoice extends React.Component {

    getChoice = (choiceId) => {
        const _this = this;
        if (choiceId === undefined) return {
            get get() { return _this.state.choiceId },
            set(choiceId) { _this.setState({ choiceId })}
        };

        return (choiceFunc) => {
            return choiceFunc({ 
                id: choiceId,
                get isSelected() { return _this.state.choiceId === choiceId },
                select() { _this.setState({ choiceId }) },
                toggle() { _this.setState({ choiceId: _this.state.choiceId === choiceId ? undefined : choiceId }) }
            });
        };
        
    };

    constructor(props) {
        super(props);
        this.state = { choiceId: this.props.default };
        this.getChoice = this.getChoice.bind(this);
    }

    render() {
        return this.props.children(this.getChoice);
    }

}


const update = () => {


    const app = (
        

        <div style={{maxWidth: 800, margin: 'auto'}}>

            <div style={rowStyle}>
                <div>
                    <h1>Motivation</h1>
                    <p><strong>Scroll down for interactive demos</strong></p>

                    <div style={{ float: 'left', padding: '0px 20px 0 0' }}>
                        <InteractiveTileGridView state={basicState} />
                    </div>

                    <p>A Dijkstra Map is data structure to use for path finding in video games. 
                    These are usually performant if you have many agents who are finding their way to a shared goal 
                    or goals. Other path finding algorithms might find a path from one agent to one goal whereas a Dijkstra map 
                    can be generated once for an environment and reused for all agents even after they have moved. </p>

                    <p>A Dijkstra Map is simple a mapping from a cell to the shortest distance to the nearest goal cell. 
                    The map will need to be regenerated if the environment changes or the goals are moved, 
                    so this makes it perfect for games where the environment changes less often than agents move 
                    such as turn-based games.</p>

                    <p>This is different to Dijkstra's algorithm, which finds a single shortest path between two nodes</p>

                    <p>For example in a typical roguelike game, a Dijkstra Map can be generated after the player
                    takes his turn, with the players position as the goal. Each enemy can use this map to cheaply 
                    calculate where to move on his turn in order to reach the player in the least number of moves.
                    To find the shortest path using the Dijkstra map we just find continously search for the neighbour 
                    with the lowest cost.</p>

                    <p>This same map can be used to find the shortest path that the player can reach any position in
                    the envionment by way of a cursor moving around the envionment.</p>

                    <p>A Dijkstra Map can also be inverted to produce a 'fleeing' if an agent has to find a path
                    to the furthest position from a goal.</p>

                    <p>My implementation is using a priority queue to reduce the amount of cells to check. It is 
                    also agnostic to both the data structure of cells, or how an agent can move, so the library 
                    can be used with graph networks, grids in 2-dimensions, 3-dimensions, movement in four or 
                    eight directions, with portals across the envionment, and differing costs</p>

                    <h1>Further Reading</h1>

                    <ul><li><a href="http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps">The Incredible Power of Dijkstra Maps - RogueBasin</a></li>
                    <li><a href="http://www.roguebasin.com/index.php?title=Dijkstra_Maps_Visualized">Dijkstra Maps Visualized</a></li></ul>

                    <h1>Install</h1>

                    <pre><code>npm install distance-map</code></pre>

                    <p><a href="https://github.com/jakecoxon/distance-map">View source on Github</a></p>

                    <h1>API Documentation</h1>

                    <p>In the implementation, <code>NodeType</code> can be whatever type you are using for nodes but it
                    will be used as a hashmap key so it must keep its identity. You may use your node instance, a string 
                    specifying coordinate, or a unique id.</p>

                    <h2>createDistanceMap</h2>

                    <p><code>createDistanceMap(getNeighbours, targets)</code></p>
                    
                    <p><code>createDistanceMap</code> is a function that takes a function <code>getNeighbours</code> and an array 
                    of target descriptions and returns a map from <code>NodeType</code> to total cost to nearest goal</p>

                    <p><code>getNeighbours</code> is a function that takes a node and returns all the available nodes that 
                    an agent can reach node from, and what the cost will be. The argument <code>node</code> is <code>NodeType</code> and returns an array of transition 
                    descriptions in the shape <code>{`{ node, cost }`}</code>. If you have one way paths then it is important that 
                    this <code>getNeighbours(A)</code> returns node B only if the agents can travel from B to A and not vice versa.</p>

                    <div style={{ display: 'flex' }}>
                        <div style={{ padding: '0 20px 0 0' }}>
                            <InteractiveTileGridView state={basicState} />
                        </div>
                        <div>
                            <div>
                                <label style={labelStyle}>
                                    <input type="radio" checked={basicState.neighbourType == '4'} onChange={() => { basicState.neighbourType = '4'; }} />
                                    Four-way directions
                                </label>
                                <label style={labelStyle}>
                                    <input type="radio" checked={basicState.neighbourType == '8'} onChange={() => { basicState.neighbourType = '8'; }} />
                                    Eight-way directions
                                </label>
                            </div>

                            <pre><code>

{ basicState.neighbourType == '4' ? 
`const getNeighbours = (tile) {
    return [
        { node: getTile(tile.x - 1, tile.y), cost: 1 },
        { node: getTile(tile.x + 1, tile.y), cost: 1 },
        { node: getTile(tile.x, tile.y - 1), cost: 1 },
        { node: getTile(tile.x, tile.y + 1), cost: 1 }
    ]);
}`
: `const getNeighbours = (tile) {
    return [
        { node: getTile(tile.x - 1, tile.y), cost: 1 },
        { node: getTile(tile.x, tile.y - 1), cost: 1 },
        { node: getTile(tile.x, tile.y + 1), cost: 1 },
        { node: getTile(tile.x + 1, tile.y), cost: 1 },
        { node: getTile(tile.x - 1, tile.y - 1), cost: 1 },
        { node: getTile(tile.x - 1, tile.y + 1), cost: 1 },
        { node: getTile(tile.x + 1, tile.y - 1), cost: 1 },
        { node: getTile(tile.x + 1, tile.y + 1), cost: 1 },
    ]);
}`}
{`
const targets = { node: getTile(${basicState.targets[0].node.x}, ${basicState.targets[0].node.y}), cost: 0 };
createDistanceMap(getNeighbours, targets)
`}
                            </code></pre>
                        </div>
                    </div>

                    <MultiChoice default={undefined}>{ choice => 
                        <div>

                            {choice(1)(choice => <div>
                                <label>
                                    <input type="checkbox" checked={choice.isSelected} onChange={choice.toggle} />
                                    Example with number identifiers
                                </label>

                                <div style={{ display: choice.isSelected ? 'block' : 'none' }}>
<pre><code>
{`import { createDistanceMap } from 'distance-map'

function getNeighbours(node) {
    if (node == 1) {
        return [ { node: 2, cost: 1 } ]
    } else if (node == 2) {
        return [ { node: 3, cost: 1 } ];
    }
}
var targets = [ { node: 1, cost: 0 } ];
createDistanceMap(getNeighbours, targets);`}
</code></pre>
                                </div>
                            </div>)}

                            {choice(2)(choice => <div>
                                <label>
                                    <input type="checkbox" checked={choice.isSelected} onChange={choice.toggle} />
                                    Example with graph nodes
                                </label>

                                <div style={{ display: choice.isSelected ? 'block' : 'none' }}>
<pre><code>
{`import { createDistanceMap } from 'distance-map'

var node1 = new Node(), node2 = new Node(), node3 = new Node();

var transitions = Map();
transitions.set(node1, node2);
transitions.set(node2, node3);

function getNeighbours(node) {
    if (transitions.has(node)) {
        return [ { node: transitions.get(node), cost: 1 } ]
    }
}
var targets = [ { node: node1, cost: 0 } ];
createDistanceMap(getNeighbours, targets);`}
</code></pre>
                                </div>
                            </div>)}

                            {choice(3)(choice => <div>
                                <label>
                                    <input type="checkbox" checked={choice.isSelected} onChange={choice.toggle} />
                                    Example with tiles
                                </label>

                                <div style={{ display: choice.isSelected ? 'block' : 'none' }}>
<pre><code>
{`import { createDistanceMap } from 'distance-map'
import _ from 'lodash'

const tiles = _.range(10).map(x => _.range(10).map(y => 
    ({ 
        x: x, 
        y: y, 
        solid: Math.random() > 0.5 
   })
));

const checkTile = (x, y) => {
    if (x < 0 || x >= 10 || y < 0 || y >= 10) return undefined;
    const tile = tiles[x][y];
    return (!tile.solid) ? tile : undefined;
}

function getNeighbours(node) {
    return _.compact([
        checkTile(tile.x - 1, tile.y),
        checkTile(tile.x + 1, tile.y),
        checkTile(tile.x, tile.y - 1),
        checkTile(tile.x, tile.y + 1)
    ]);
}
var targets = [ { node: tiles[1][1], cost: 0 } ];
createDistanceMap(getNeighbours, targets);`}
</code></pre>
                                </div>
                            </div>)}

                        </div>
                    }</MultiChoice>




                    

                    <h2>findShortestPath</h2>

                    <p><code>findShortestPath(distanceMap, startNode, getToNeighbours)</code></p>

                    <p>Once you have a distance map you can pass it to <code>findShortestPath</code> to find 
                       the shortest path from a <code>target</code>. It returns an array of <code>{`{ node, cost, totalCost }`}</code>
                       which corresponds to each cell of the path, its relative cost and its total cost to the goal. 
                       The array does not include the startNode itself. The getToNeighbours function here is a function that
                       returns all the nodes an agent can go <strong>to</strong>. It is the inverse of getNeighbours used in the
                       <code>createDistanceMap</code> function. If your graph has no one-way routes then you can reuse the same function.
                    </p>
<pre><code>{`const distanceMap = createDistanceMap(getNeighbours, targets);
const startNode = getTile(0, 0);
findShortestPath(distanceMap, startNode, getNeighbours);
`}</code></pre>

                    <div style={{ float: 'left', padding: '0 20px 0 0'}}>
                        <InteractiveTileGridView state={pathfindState} />
                    </div>

                    {
                        (() => {
                            const printPath = p => {
                                const a = _.take(p.map(t => 
                                    `{ node: getTile(${t.node.x}, ${t.node.y}), cost: ${t.cost}, totalCost: ${t.totalCost} }`
                                ), 5)
                                if (p.length > 5) a.push(`...`);
                                return a.join('\n');
                            }
                            return <div>
                                <pre><code>{`const startTile = getTile(${pathfindState.pathfinders[0].x}, ${pathfindState.pathfinders[0].y})
findShortestPath(distanceMap, startTile, getNeighbours)`}</code></pre>
                                <pre><code>{printPath(pathfindState.paths[0])}</code></pre>
                            </div>
                        })()
                    }
                </div>

            </div>


            

            <div style={rowStyle}>
                
                <div style={leftColumnStyle}>
                    <InteractiveTileGridView state={fleeState} />
                </div>
                
                <div style={rightColumnStyle}>
                    <h1>Fleeing</h1>

                    <div>
                        <p><label style={{ display: 'inline-block', marginBottom: 0 }}>
                                <input style={{ marginBottom: 0 }} type="radio" checked={fleeState.pathfinderType == 1} onChange={() => { fleeState.pathfinderType = 1; }} />
                                Starting from a regular distance map
                            </label>

                        , to create a fleeing map we can simply&nbsp;

                            <label style={{ display: 'inline-block', marginBottom: 0 }}>
                                <input style={{ marginBottom: 0 }} type="radio" checked={fleeState.pathfinderType == 2} onChange={() => { fleeState.pathfinderType = 2; }} />
                                invert the distance map.&nbsp;
                            </label>

                        But in order to make the distance map a bit more clever we can &nbsp;

                            <label style={{ display: 'inline-block', marginBottom: 0 }}>
                                <input style={{ marginBottom: 0 }} type="radio" checked={fleeState.pathfinderType == 3} onChange={() => { fleeState.pathfinderType = 3; }} />
                                multiply this cost with a coefficient ({Math.round(fleeState.validatedFleeCoefficient * 1000) / 1000})&nbsp;
                            </label>

                        and round the number down. This data can then be used&nbsp;

                            <label style={{ display: 'inline-block', marginBottom: 0 }}>
                                <input style={{ marginBottom: 0 }} type="radio" checked={fleeState.pathfinderType == 4} onChange={() => { fleeState.pathfinderType = 4; }} />
                                as the initial targets to createDistanceMap
                            </label>
                        </p>

                        <p>This has the effect of attracting cells which leads spaces further away from the goal cell. 
                            The number rounding creates 'jumps' in the path costs every few cells, which is 'pulled-up' 
                            by the distance map. This coefficient may need to be tweaked based on your environment, a higher coefficient has
                            a stronger pull. If the cost should increase by 1 every <code>n</code> tiles then the coefficient
                            is calculated by <code>1/n + 1</code></p>

                        <p>
                            <label style={{ display: 'inline-block', marginBottom: 0 }}>
                                Change the number of tiles&nbsp;
                                <input style={{ width: 40 }} type="text" value={fleeState.fleeTiles} 
                                    onChange={(ev) => fleeState.fleeTiles = ev.target.value} />
                                &nbsp;and the coefficient becomes <strong>{Math.round(fleeState.validatedFleeCoefficient * 1000) / 1000}</strong>
                            </label>
                        </p>

                        { fleeState.pathfinderType === 1 ? 
<pre><code>{`const finalDistanceMap = createDistanceMap(getNeighbours, targets);`}</code></pre>
                        : fleeState.pathfinderType === 2 ?
<pre><code>{`const distanceMap = createDistanceMap(getNeighbours, targets);
const finalDistanceMap = 
    mapCosts(distanceMap, (cost) => -cost);`}</code></pre>
                        : fleeState.pathfinderType === 3 ?
<pre><code>{`const distanceMap = createDistanceMap(getNeighbours, targets);
const finalDistanceMap = 
    mapCosts(distanceMap, (cost) => -Math.floor(cost * ${Math.round(fleeState.validatedFleeCoefficient * 1000) / 1000}));`}</code></pre>
                        : fleeState.pathfinderType === 4 ?
<pre><code>{`const distanceMap = createDistanceMap(getNeighbours, targets);
const newTargets = 
    mapCosts(distanceMap, (cost) => -Math.floor(cost * ${Math.round(fleeState.validatedFleeCoefficient * 1000) / 1000}));
const finalDistanceMap = 
    createDistanceMap(getNeighbours, newTargets);`}</code></pre>
                        : undefined }

                    </div>

                </div>

            </div>

            <div style={rowStyle}>
                
                <div style={leftColumnStyle}>

                    <InteractiveTileGridView state={playgroundState} />

                </div>

                <div style={rightColumnStyle}>
                    <div style={{ borderBottom: '1px solid black'}}>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.neighbourType == '4'} onChange={() => { playgroundState.neighbourType = '4'; }} />
                            Four-way directions
                        </label>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.neighbourType == '8'} onChange={() => { playgroundState.neighbourType = '8'; }} />
                            Eight-way directions
                        </label>
                    </div>
                    <div style={{ borderBottom: '1px solid black'}}>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.targetsType == 1} onChange={() => { playgroundState.targetsType = 1; }} />
                            One end point
                        </label>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.targetsType == 2} onChange={() => { playgroundState.targetsType = 2; }} />
                            Two end points
                        </label>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.targetsType == 3} onChange={() => { playgroundState.targetsType = 3; }} />
                            Two end points with different cost
                        </label>
                    </div>
                    <div style={{ borderBottom: '1px solid black'}}>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.pathfinderType == 0} onChange={() => { playgroundState.pathfinderType = 0; }} />
                            No pathfinding
                        </label>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.pathfinderType == 1} onChange={() => { playgroundState.pathfinderType = 1; }} />
                            Pathfinding nearest 
                        </label>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.pathfinderType == 2} onChange={() => { playgroundState.pathfinderType = 2; }} />
                            Pathfinding fleeing
                        </label>
                        <label style={labelStyle}>
                            <input type="radio" checked={playgroundState.pathfinderType == 3} onChange={() => { playgroundState.pathfinderType = 3; }} />
                            Pathfinding fleeing with coefficient
                        </label>
                    </div>
                </div>
            </div>

            <p>Built by Jake Coxon - <a href="http://jake.cx">What else am I up to?</a></p>

        </div>
    );

    ReactDOM.render(app, 
    document.querySelector('#container'));
}

autorun(() => {
    update();
});
