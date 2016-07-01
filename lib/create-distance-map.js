"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _jsPriorityQueue = require("js-priority-queue");

var _jsPriorityQueue2 = _interopRequireDefault(_jsPriorityQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var comparator = function comparator(a, b) {
    return a.cost - b.cost;
};

var createDistanceMap = function createDistanceMap(getNeighbours, targets) {

    if (!getNeighbours) throw new Error("Invalid getNeighbours to createDistanceMap");

    var distanceMap = new Map();

    targets.forEach(function (target) {
        if (!target) throw new Error("targets must be an array of objects with the shape { node, cost }");
        var node = target.node;
        var cost = target.cost;

        if (!node || typeof cost == 'undefined') throw new Error("targets must be an array of objects with the shape { node, cost }");
        distanceMap.set(node, cost || 0);
    });

    var queue = new _jsPriorityQueue2.default({ comparator: comparator, initialValues: targets });

    var _loop = function _loop() {
        var _queue$dequeue = queue.dequeue();

        var node = _queue$dequeue.node;

        var oldCost = distanceMap.get(node);

        var neighbours = getNeighbours(node);

        if (!Array.isArray(neighbours)) throw new Error("getNeighbours must return an array of objects with the shape { node, cost }");

        neighbours.forEach(function (neighbour) {

            if (!neighbour.node || typeof neighbour.cost == 'undefined') throw new Error("getNeighbours must return an array of objects with the shape { node, cost }");
            if (neighbour.cost <= 0) throw new Error("Neighbour cost cannot be zero or less");

            var newCost = oldCost + neighbour.cost;

            if (distanceMap.get(neighbour.node) === undefined || distanceMap.get(neighbour.node) > newCost) {

                distanceMap.set(neighbour.node, newCost);
                queue.queue({ node: neighbour.node, cost: newCost });
            }
        });
    };

    while (queue.length) {
        _loop();
    }

    return distanceMap;
};

exports.default = createDistanceMap;