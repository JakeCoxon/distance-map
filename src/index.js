import createDistanceMap from '../lib/distance-map.js'
import getPath from '../lib/get-path.js'

import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import chroma from 'chroma-js'
import TileGridView from './tile-grid-view.js'

class TileGrid {

    width = 16;
    height = 16;

    tiles = _.range(this.width).map(x =>
        _.range(this.height).map(y => ({ 
            x, y, 
            @observable solid: false 
        })));

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;
        return this.tiles[x][y];
    }

    filterNeighbours(neighbour) {
        return neighbour.node !== undefined && !neighbour.node.solid;
    }

    get4Neighbours(node) {
        return _.filter([
            { node: this.getTile(node.x - 1, node.y), cost: 1 },
            { node: this.getTile(node.x + 1, node.y), cost: 1 },
            { node: this.getTile(node.x, node.y - 1), cost: 1 },
            { node: this.getTile(node.x, node.y + 1), cost: 1 }
        ], this.filterNeighbours);
    }

    get8Neighbours(node) {
        return _.filter([
            { node: this.getTile(node.x - 1, node.y - 1), cost: 1 },
            { node: this.getTile(node.x - 1, node.y), cost: 1 },
            { node: this.getTile(node.x - 1, node.y + 1), cost: 1 },
            { node: this.getTile(node.x, node.y - 1), cost: 1 },
            { node: this.getTile(node.x, node.y + 1), cost: 1 },
            { node: this.getTile(node.x + 1, node.y - 1), cost: 1 },
            { node: this.getTile(node.x + 1, node.y), cost: 1 },
            { node: this.getTile(node.x + 1, node.y + 1), cost: 1 },
        ], this.filterNeighbours);
    }
}



const scale = chroma.scale(['white', 'red']);



import { observable, computed, autorun } from 'mobx'

const state = new (class Model {

    @observable levelGraph = new TileGrid();
    @observable neighbourType = '4';
    
    @observable pathfinder = this.levelGraph.getTile(8, 8);
    @observable pathfinderType = 1;



    @observable availableTargets = [
        { node: this.levelGraph.getTile(1, 1), cost: 0 },
        { node: this.levelGraph.getTile(10, 5), cost: 0 },
        { node: this.levelGraph.getTile(10, 5), cost: 4 }
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

    @computed get distanceMap() {
        const neighbourFunc = 
            this.neighbourType == '4' ? this.levelGraph.get4Neighbours.bind(this.levelGraph)
            : this.neighbourType == '8' ? this.levelGraph.get8Neighbours.bind(this.levelGraph)
            : undefined;

        return createDistanceMap(neighbourFunc, this.targets);
    }

    @computed get maxDistance() {
        return _.max(Array.from(this.distanceMap.values()));
    }

})();





const compose = (a, b) => (...args) => b(a(...args))

const update = () => {

    const { levelGraph, targets, neighbourType, distanceMap, maxDistance, targetsByTile } = state;

    const tileSelect = (x, y) => {
        const startTile = levelGraph.getTile(x, y);
        const isInitiallySolid = startTile.solid
        return { 
            startTile, 
            isInitiallySolid,
            pathfinder: state.pathfinder == startTile,
            target: targetsByTile.get(startTile)
        };
    };

    const tileApply = (x, y, data) => {
        const tile = levelGraph.getTile(x, y);

        // console.log(getPath(distanceMap, tile, neighbourFunc));
        if (data.pathfinder) {
            state.pathfinder = tile;
        } else if (data.target) {
            data.target.node = tile;
        } else {
            tile.solid = !data.isInitiallySolid;
        }
    }

    const tileProps = (x, y) => {

        const tile = levelGraph.getTile(x, y);

        const distance = distanceMap.get(tile);
        const solid = tile.solid;

        return {
            value: distance,
            backgroundColor: solid ? '#333333'
                : distance === undefined ? '#CCCCCC' 
                : scale(distance / maxDistance).hex(),
            iconColor: 
                state.pathfinderType !== 0 && state.pathfinder == tile ? 'rgba(0,200,0,0.5)'
                : state.isATarget(tile) ? 'rgba(255,150,0,0.5)'
                : undefined
        }
    }

    const app = (
        <div>
            <TileGridView 
                width={levelGraph.width}
                height={levelGraph.height}
                tileProps={tileProps}
                tileSelect={tileSelect}
                tileApply={tileApply} />

            <div style={{ borderBottom: '1px solid black'}}>
                <label>
                    <input type="radio" checked={state.neighbourType == '4'} onChange={() => { state.neighbourType = '4'; }} />
                    Four-way directions
                </label><br />
                <label>
                    <input type="radio" checked={state.neighbourType == '8'} onChange={() => { state.neighbourType = '8'; }} />
                    Eight-way directions
                </label>
            </div>
            <div style={{ borderBottom: '1px solid black'}}>
                <label>
                    <input type="radio" checked={state.targetsType == 1} onChange={() => { state.targetsType = 1; }} />
                    One end point
                </label><br />
                <label>
                    <input type="radio" checked={state.targetsType == 2} onChange={() => { state.targetsType = 2; }} />
                    Two end points
                </label><br />
                <label>
                    <input type="radio" checked={state.targetsType == 3} onChange={() => { state.targetsType = 3; }} />
                    Two end points with different cost
                </label>
            </div>
            <div style={{ borderBottom: '1px solid black'}}>
                <label>
                    <input type="radio" checked={state.pathfinderType == 0} onChange={() => { state.pathfinderType = 0; }} />
                    No pathfinding
                </label><br />
                <label>
                    <input type="radio" checked={state.pathfinderType == 1} onChange={() => { state.pathfinderType = 1; }} />
                    Pathfinding nearest 
                </label><br />
                <label>
                    <input type="radio" checked={state.pathfinderType == 2} onChange={() => { state.pathfinderType = 2; }} />
                    Pathfinding fleeing
                </label>
            </div>
        </div>
    );

    ReactDOM.render(app, 
    document.querySelector('#container'));
}

autorun(() => {
    update();
});