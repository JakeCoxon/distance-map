'use strict';

import { expect } from 'chai'
import { createDistanceMap, findShortestPath } from '../src/index.js'



describe('#createDistanceMap', function() {

    function graph1() {
        /*
             / ------ 2 ----- 3 ------ 4
            1 
             \`------ 5 ----- 6- ----- 7
        */

        var graph = {
            1: [ 2, 5 ],
            2: [ 1, 3 ],
            3: [ 2, 4 ],
            4: [ 3 ],
            5: [ 1, 6 ],
            6: [ 5, 7 ],
            7: [ 6 ]
        }

        return (node) => graph[node].map((neighbour) => 
            ({ node: neighbour, cost: 1 }))
    }

    it('should be valid', function() {

        var getNeighbours = graph1();

        var targets = [{ node: 1, cost: 0 }];

        const map = createDistanceMap(getNeighbours, targets);

        expect(map.get(1)).to.equal(0);
        expect(map.get(2)).to.equal(1);
        expect(map.get(3)).to.equal(2);
        expect(map.get(4)).to.equal(3);
        expect(map.get(5)).to.equal(1);
        expect(map.get(6)).to.equal(2);
        expect(map.get(7)).to.equal(3);
    });

    it('should be valid', function() {

        var getNeighbours = graph1();

        var targets = [{ node: 3, cost: 0 }];

        const map = createDistanceMap(getNeighbours, targets);

        expect(map.get(1)).to.equal(2);
        expect(map.get(2)).to.equal(1);
        expect(map.get(3)).to.equal(0);
        expect(map.get(4)).to.equal(1);
        expect(map.get(5)).to.equal(3);
        expect(map.get(6)).to.equal(4);
        expect(map.get(7)).to.equal(5);
    });

    function graph2() {
        /*
             / ------ 2 ----- 3 ------ 4
            1                 V
             \`------ 5 ----- 6- ----- 7

             V is a one-way path from 3 to 6
        */

        var graph = {
            1: [ 2, 5 ],
            2: [ 1, 3 ],
            3: [ 2, 4 ],
            4: [ 3 ],
            5: [ 1, 6 ],
            6: [ 5, 7, 3 ],
            7: [ 6 ]
        }

        return (node) => graph[node].map((neighbour) => 
            ({ node: neighbour, cost: 1 }))
    }

    it('should be valid', function() {

        var getNeighbours = graph2();

        var targets = [{ node: 6, cost: 0 }];

        const map = createDistanceMap(getNeighbours, targets);

        expect(map.get(1)).to.equal(2);
        expect(map.get(2)).to.equal(2);
        expect(map.get(3)).to.equal(1);
        expect(map.get(4)).to.equal(2);
        expect(map.get(5)).to.equal(1);
        expect(map.get(6)).to.equal(0);
        expect(map.get(7)).to.equal(1);
    });

    it('should be valid', function() {

        var getNeighbours = graph2();

        var targets = [{ node: 3, cost: 0 }];

        const map = createDistanceMap(getNeighbours, targets);

        expect(map.get(1)).to.equal(2);
        expect(map.get(2)).to.equal(1);
        expect(map.get(3)).to.equal(0);
        expect(map.get(4)).to.equal(1);
        expect(map.get(5)).to.equal(3);
        expect(map.get(6)).to.equal(4);
        expect(map.get(7)).to.equal(5);
    });

});